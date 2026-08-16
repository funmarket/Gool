import type { UnitOfWork } from '../../../application/unit-of-work.js';
import { AppError } from '../../../http/errors/app-error.js';
import type { CommunityService } from '../../communities/application/community.service.js';
import type { PaymentRepository } from '../../payments/application/payment-repository.js';
import type { FundraiserCreateInput, FundraiserRepository } from './fundraiser-repository.js';

export class FundraiserService {
  constructor(
    private readonly repo: FundraiserRepository,
    private readonly communities: CommunityService,
    private readonly payments: PaymentRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async list(userId: string, input: { communityId?: string; cursor?: string; limit?: number }) {
    if (input.communityId) await this.communities.requireMembership(userId, input.communityId);
    return this.repo.list(userId, {
      ...(input.communityId !== undefined ? { communityId: input.communityId } : {}),
      ...(input.cursor !== undefined ? { cursor: input.cursor } : {}),
      limit: Math.min(input.limit ?? 30, 100),
    });
  }

  async create(userId: string, input: FundraiserCreateInput) {
    await this.communities.requireMembership(userId, input.communityId);
    return this.repo.create(userId, input);
  }

  contributeCash(
    userId: string,
    fundraiserId: string,
    input: {
      amountMinor: bigint;
      anonymous: boolean;
      message?: string;
      idempotencyKey: string;
    },
  ) {
    return this.uow.run(async (tx) => {
      const fundraiser = await this.repo.getForContribution(fundraiserId, tx);
      if (!fundraiser || fundraiser.deletedAt || fundraiser.status !== 'OPEN') {
        throw new AppError(409, 'FUNDRAISER_NOT_OPEN', 'Fundraiser is not open.');
      }
      if (fundraiser.deadline && fundraiser.deadline <= new Date()) {
        throw new AppError(409, 'FUNDRAISER_DEADLINE_PASSED', 'Fundraiser deadline has passed.');
      }
      if (!fundraiser.cashAccepted) {
        throw new AppError(
          409,
          'PAYMENT_METHOD_NOT_ACCEPTED',
          'This fundraiser does not accept cash.',
        );
      }

      await this.communities.requireMembership(userId, fundraiser.communityId, tx);
      const contribution = await this.repo.createContribution(
        { fundraiserId, userId, ...input },
        tx,
      );
      if (contribution.paymentIntentId) {
        return this.repo.getContribution(contribution.id, tx);
      }

      const payment = await this.payments.createCashIntent(
        {
          userId,
          communityId: fundraiser.communityId,
          purpose: 'FUND_CONTRIBUTION',
          amountMinor: input.amountMinor,
          currency: fundraiser.currency,
        },
        tx,
      );
      return this.repo.attachPayment(contribution.id, payment.id, tx);
    });
  }
}
