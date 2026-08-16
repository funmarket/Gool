import type { UnitOfWork } from '../../../application/unit-of-work.js';
import type { PaymentRepository } from '../../payments/application/payment-repository.js';
import type { RsvpRepository } from './event-repository.js';

export class RsvpService {
  constructor(
    private readonly repo: RsvpRepository,
    private readonly payments: PaymentRepository,
    private readonly uow: UnitOfWork,
  ) {}

  join(eventId: string, userId: string, paymentMethod?: 'CASH') {
    return this.uow.run(async (tx) => {
      const prepared = await this.repo.prepareJoin(eventId, userId, paymentMethod, tx);
      if (prepared.kind === 'COMPLETE') return prepared.result;

      const payment = await this.payments.createCashIntent(
        {
          userId: prepared.userId,
          communityId: prepared.communityId,
          purpose: 'EVENT_FEE',
          amountMinor: prepared.amountMinor,
          currency: prepared.currency,
        },
        tx,
      );
      return this.repo.attachPayment(prepared.rsvpId, payment.id, tx);
    });
  }

  cancel(eventId: string, userId: string) {
    return this.uow.run(async (tx) => {
      const prepared = await this.repo.cancelAndPreparePromotion(eventId, userId, tx);
      if (prepared.cancelledPaymentIntentId) {
        await this.payments.cancelPendingIntent(prepared.cancelledPaymentIntentId, tx);
      }

      if (prepared.promotedPayment) {
        const payment = await this.payments.createCashIntent(
          {
            userId: prepared.promotedPayment.userId,
            communityId: prepared.promotedPayment.communityId,
            purpose: 'EVENT_FEE',
            amountMinor: prepared.promotedPayment.amountMinor,
            currency: prepared.promotedPayment.currency,
          },
          tx,
        );
        await this.repo.attachPayment(prepared.promotedPayment.rsvpId, payment.id, tx);
      }

      return {
        cancelled: true,
        promotedRsvpId: prepared.promotedRsvpId,
      };
    });
  }
}
