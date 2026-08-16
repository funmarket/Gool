import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { decodeTimeIdCursor, encodeTimeIdCursor } from '../../../infrastructure/database/cursor.js';
import type {
  AdminPaymentStatus,
  AdminReadRepository,
} from '../application/admin-read.repository.js';

export class PrismaAdminReadRepository implements AdminReadRepository {
  constructor(private readonly db: DatabaseClient) {}

  listManagedCommunities(userId: string) {
    return this.db.membership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN'] },
        community: { deletedAt: null },
      },
      include: {
        community: {
          include: {
            _count: {
              select: {
                memberships: { where: { status: 'ACTIVE' } },
                events: { where: { deletedAt: null } },
                requests: { where: { deletedAt: null } },
                rideOffers: { where: { deletedAt: null } },
                fundraisers: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async dashboard(communityId: string) {
    const [
      members,
      upcomingEvents,
      openRequests,
      rideOffers,
      openFunds,
      awaitingCash,
      paidVolumes,
    ] = await Promise.all([
      this.db.membership.count({ where: { communityId, status: 'ACTIVE' } }),
      this.db.event.count({
        where: {
          communityId,
          deletedAt: null,
          status: 'PUBLISHED',
          startsAt: { gte: new Date() },
        },
      }),
      this.db.request.count({
        where: {
          communityId,
          deletedAt: null,
          status: { in: ['OPEN', 'PARTIAL'] },
        },
      }),
      this.db.rideOffer.count({
        where: {
          communityId,
          deletedAt: null,
          status: { in: ['OPEN', 'FULL'] },
        },
      }),
      this.db.fundraiser.count({
        where: { communityId, deletedAt: null, status: 'OPEN' },
      }),
      this.db.paymentIntent.count({
        where: { communityId, selectedMethod: 'CASH', status: 'AWAITING_CASH' },
      }),
      this.db.paymentIntent.groupBy({
        by: ['currency'],
        where: { communityId, status: 'PAID' },
        _sum: { amountMinor: true },
        _count: { _all: true },
      }),
    ]);

    return {
      members,
      upcomingEvents,
      openRequests,
      rideOffers,
      openFunds,
      awaitingCash,
      paidVolumes,
    };
  }

  async payments(
    communityId: string,
    input: {
      method?: 'CASH' | 'TELEGRAM_STARS';
      status?: AdminPaymentStatus;
      cursor?: string;
      limit: number;
    },
  ) {
    const cursor = input.cursor ? decodeTimeIdCursor(input.cursor, 'Payment') : null;
    const rows = await this.db.paymentIntent.findMany({
      where: {
        communityId,
        ...(input.method ? { selectedMethod: input.method } : {}),
        ...(input.status ? { status: input.status } : {}),
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
        user: {
          select: { id: true, username: true, firstName: true, lastName: true, photoUrl: true },
        },
        cashSettlement: true,
        telegramStarPayment: true,
        eventRsvp: { include: { event: { select: { id: true, title: true } } } },
        rideMatch: { include: { offer: { select: { id: true, title: true } } } },
        fundContribution: {
          include: { fundraiser: { select: { id: true, title: true } } },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });

    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;
    const last = items.at(-1);
    return {
      items,
      nextCursor: hasMore && last ? encodeTimeIdCursor(last.createdAt, last.id) : null,
    };
  }

  async audit(communityId: string, input: { cursor?: string; limit: number }) {
    const cursor = input.cursor ? decodeTimeIdCursor(input.cursor, 'Audit') : null;
    const rows = await this.db.auditLog.findMany({
      where: {
        communityId,
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
        actor: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });

    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;
    const last = items.at(-1);
    return {
      items,
      nextCursor: hasMore && last ? encodeTimeIdCursor(last.createdAt, last.id) : null,
    };
  }
}
