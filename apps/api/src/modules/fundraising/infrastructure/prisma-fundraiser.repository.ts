import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { transactionClient } from '../../../infrastructure/database/unit-of-work.js';
import { decodeTimeIdCursor, encodeTimeIdCursor } from '../../../infrastructure/database/cursor.js';
import type { TransactionHandle } from '../../../application/unit-of-work.js';
import { AppError } from '../../../http/errors/app-error.js';
import type {
  FundraiserCreateInput,
  FundraiserRepository,
} from '../application/fundraiser-repository.js';

export class PrismaFundraiserRepository implements FundraiserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(userId: string, input: { communityId?: string; cursor?: string; limit: number }) {
    const cursor = input.cursor ? decodeTimeIdCursor(input.cursor, 'Fundraiser') : null;
    const rows = await this.db.fundraiser.findMany({
      where: {
        deletedAt: null,
        ...(input.communityId
          ? { communityId: input.communityId }
          : { community: { memberships: { some: { userId, status: 'ACTIVE' } } } }),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.at } },
                { createdAt: cursor.at, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      include: {
        organizer: {
          select: { id: true, username: true, firstName: true, lastName: true, photoUrl: true },
        },
        event: { select: { id: true, title: true } },
        paymentMethods: { where: { enabled: true }, orderBy: { sortOrder: 'asc' } },
        contributions: { where: { status: 'PAID' }, select: { amountMinor: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });

    const hasMore = rows.length > input.limit;
    const pageRows = hasMore ? rows.slice(0, input.limit) : rows;
    const items = pageRows.map((row) => ({
      ...row,
      collectedMinor: row.contributions.reduce((sum, item) => sum + item.amountMinor, 0n),
      contributions: undefined,
    }));
    return {
      items,
      nextCursor:
        hasMore && pageRows.at(-1)
          ? encodeTimeIdCursor(pageRows.at(-1)!.createdAt, pageRows.at(-1)!.id)
          : null,
    };
  }

  async create(userId: string, input: FundraiserCreateInput) {
    return this.db.$transaction(async (tx) => {
      if (input.eventId) {
        const event = await tx.event.findFirst({
          where: { id: input.eventId, communityId: input.communityId, deletedAt: null },
          select: { id: true },
        });
        if (!event) {
          throw new AppError(
            400,
            'FUNDRAISER_EVENT_COMMUNITY_MISMATCH',
            'The attached event must belong to the same community.',
          );
        }
      }
      const fundraiser = await tx.fundraiser.create({
        data: {
          communityId: input.communityId,
          eventId: input.eventId || null,
          organizerUserId: userId,
          purpose: input.purpose,
          title: input.title,
          description: input.description || null,
          goalMinor: input.goalMinor,
          currency: input.currency,
          deadline: input.deadline || null,
          allowAnonymous: input.allowAnonymous,
        },
      });
      for (const [sortOrder, method] of input.acceptedPaymentMethods.entries()) {
        await tx.fundraiserPaymentMethod.create({
          data: { fundraiserId: fundraiser.id, method, enabled: true, sortOrder },
        });
      }
      return tx.fundraiser.findUniqueOrThrow({
        where: { id: fundraiser.id },
        include: { paymentMethods: true },
      });
    });
  }

  async getForContribution(fundraiserId: string, handle: TransactionHandle) {
    const fundraiser = await transactionClient(handle).fundraiser.findUnique({
      where: { id: fundraiserId },
      select: {
        id: true,
        communityId: true,
        currency: true,
        status: true,
        deletedAt: true,
        deadline: true,
        paymentMethods: { where: { enabled: true }, select: { method: true } },
      },
    });
    if (!fundraiser) return null;
    return {
      id: fundraiser.id,
      communityId: fundraiser.communityId,
      currency: fundraiser.currency,
      status: fundraiser.status,
      deletedAt: fundraiser.deletedAt,
      deadline: fundraiser.deadline,
      cashAccepted: fundraiser.paymentMethods.some((method) => method.method === 'CASH'),
    };
  }

  async createContribution(
    input: {
      fundraiserId: string;
      userId: string;
      idempotencyKey: string;
      amountMinor: bigint;
      anonymous: boolean;
      message?: string;
    },
    handle: TransactionHandle,
  ) {
    return transactionClient(handle).fundContribution.upsert({
      where: {
        fundraiserId_contributorUserId_idempotencyKey: {
          fundraiserId: input.fundraiserId,
          contributorUserId: input.userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
      create: {
        fundraiserId: input.fundraiserId,
        contributorUserId: input.userId,
        idempotencyKey: input.idempotencyKey,
        amountMinor: input.amountMinor,
        anonymous: input.anonymous,
        message: input.message || null,
        status: 'AWAITING_PAYMENT',
      },
      update: {},
      select: { id: true, paymentIntentId: true },
    });
  }

  attachPayment(contributionId: string, paymentIntentId: string, handle: TransactionHandle) {
    return transactionClient(handle).fundContribution.update({
      where: { id: contributionId },
      data: { paymentIntentId },
      include: { paymentIntent: true },
    });
  }

  getContribution(contributionId: string, handle: TransactionHandle) {
    return transactionClient(handle).fundContribution.findUniqueOrThrow({
      where: { id: contributionId },
      include: { paymentIntent: true },
    });
  }

  async markContributionPaid(contributionId: string, handle: TransactionHandle): Promise<void> {
    const tx = transactionClient(handle);
    const contribution = await tx.fundContribution.findUnique({
      where: { id: contributionId },
      select: { fundraiserId: true },
    });
    if (!contribution) return;
    await tx.fundContribution.updateMany({
      where: { id: contributionId, status: 'AWAITING_PAYMENT' },
      data: { status: 'PAID', paidAt: new Date() },
    });
    const fundraiser = await tx.fundraiser.findUnique({
      where: { id: contribution.fundraiserId },
      select: { id: true, goalMinor: true, status: true },
    });
    if (!fundraiser || fundraiser.status !== 'OPEN') return;
    const paid = await tx.fundContribution.aggregate({
      where: { fundraiserId: fundraiser.id, status: 'PAID' },
      _sum: { amountMinor: true },
    });
    if ((paid._sum.amountMinor ?? 0n) >= fundraiser.goalMinor) {
      await tx.fundraiser.update({ where: { id: fundraiser.id }, data: { status: 'FUNDED' } });
    }
  }

  async markContributionRefunded(contributionId: string, handle: TransactionHandle): Promise<void> {
    const tx = transactionClient(handle);
    const contribution = await tx.fundContribution.findUnique({
      where: { id: contributionId },
      select: { fundraiserId: true },
    });
    if (!contribution) return;
    await tx.fundContribution.updateMany({
      where: { id: contributionId, status: 'PAID' },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
    const fundraiser = await tx.fundraiser.findUnique({
      where: { id: contribution.fundraiserId },
      select: { id: true, goalMinor: true, status: true, deadline: true },
    });
    if (!fundraiser || fundraiser.status !== 'FUNDED') return;
    const paid = await tx.fundContribution.aggregate({
      where: { fundraiserId: fundraiser.id, status: 'PAID' },
      _sum: { amountMinor: true },
    });
    const deadlineOpen = !fundraiser.deadline || fundraiser.deadline > new Date();
    if ((paid._sum.amountMinor ?? 0n) < fundraiser.goalMinor && deadlineOpen) {
      await tx.fundraiser.update({ where: { id: fundraiser.id }, data: { status: 'OPEN' } });
    }
  }

  async markContributionCancelled(
    contributionId: string,
    handle: TransactionHandle,
  ): Promise<void> {
    await transactionClient(handle).fundContribution.updateMany({
      where: { id: contributionId, status: { in: ['PLEDGED', 'AWAITING_PAYMENT'] } },
      data: { status: 'CANCELLED' },
    });
  }
}
