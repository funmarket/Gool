import { createHash } from 'node:crypto';
import { Prisma } from '@gool/database';
import type { TransactionHandle } from '../../../application/unit-of-work.js';
import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { transactionClient } from '../../../infrastructure/database/unit-of-work.js';
import { AppError } from '../../../http/errors/app-error.js';
import type {
  CashConfirmationContext,
  DigitalProductView,
  PaymentRepository,
  StarsCheckout,
  StarsPreCheckout,
  StarsRefundContext,
  SuccessfulStarsPayment,
} from '../application/payment-repository.js';

function settlementTarget(payment: {
  eventRsvp?: { id: string } | null;
  rideMatch?: { id: string } | null;
  fundContribution?: { id: string } | null;
}) {
  if (payment.eventRsvp) return { kind: 'EVENT_RSVP' as const, id: payment.eventRsvp.id };
  if (payment.rideMatch) return { kind: 'RIDE_MATCH' as const, id: payment.rideMatch.id };
  if (payment.fundContribution) {
    return { kind: 'FUND_CONTRIBUTION' as const, id: payment.fundContribution.id };
  }
  return { kind: 'NONE' as const };
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: DatabaseClient) {}

  async createCashIntent(
    input: {
      userId: string;
      communityId: string;
      purpose: 'EVENT_FEE' | 'RIDE_SHARE' | 'FUND_CONTRIBUTION';
      amountMinor: bigint;
      currency: string;
    },
    tx?: TransactionHandle,
  ) {
    const client = tx ? transactionClient(tx) : this.db;
    return client.paymentIntent.create({
      data: {
        userId: input.userId,
        communityId: input.communityId,
        purpose: input.purpose,
        amountMinor: input.amountMinor,
        currency: input.currency,
        selectedMethod: 'CASH',
        status: 'AWAITING_CASH',
      },
      select: { id: true },
    });
  }

  async cancelPendingIntent(paymentIntentId: string, handle: TransactionHandle): Promise<void> {
    const tx = transactionClient(handle);
    await tx.paymentIntent.updateMany({
      where: {
        id: paymentIntentId,
        status: { in: ['CREATED', 'AWAITING_PAYMENT', 'AWAITING_CASH'] },
      },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await tx.paymentAttempt.updateMany({
      where: {
        paymentIntentId,
        status: { in: ['CREATED', 'PENDING'] },
      },
      data: { status: 'CANCELLED' },
    });
  }

  async getCashConfirmationContext(
    paymentIntentId: string,
  ): Promise<CashConfirmationContext | null> {
    const payment = await this.db.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: {
        eventRsvp: { include: { event: { select: { createdByUserId: true } } } },
        rideMatch: { include: { offer: { select: { driverUserId: true } } } },
        fundContribution: {
          include: { fundraiser: { select: { organizerUserId: true } } },
        },
      },
    });
    if (!payment) return null;
    if (!['EVENT_FEE', 'RIDE_SHARE', 'FUND_CONTRIBUTION'].includes(payment.purpose)) {
      return null;
    }

    const organizerUserId =
      payment.eventRsvp?.event.createdByUserId ??
      payment.rideMatch?.offer.driverUserId ??
      payment.fundContribution?.fundraiser.organizerUserId ??
      null;

    return {
      paymentIntentId: payment.id,
      payerUserId: payment.userId,
      communityId: payment.communityId,
      purpose: payment.purpose as 'EVENT_FEE' | 'RIDE_SHARE' | 'FUND_CONTRIBUTION',
      status: payment.status,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      organizerUserId,
    };
  }

  async recordCashSettlement(
    input: {
      paymentIntentId: string;
      actorUserId: string;
      note?: string;
      requestId: string;
    },
    handle: TransactionHandle,
  ) {
    const tx = transactionClient(handle);
    await tx.$queryRaw`SELECT id FROM "PaymentIntent" WHERE id = ${input.paymentIntentId} FOR UPDATE`;
    const payment = await tx.paymentIntent.findUnique({
      where: { id: input.paymentIntentId },
      include: {
        eventRsvp: { select: { id: true } },
        rideMatch: { select: { id: true } },
        fundContribution: { select: { id: true } },
        cashSettlement: true,
      },
    });
    if (!payment) throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
    if (payment.selectedMethod !== 'CASH') {
      throw new AppError(409, 'PAYMENT_METHOD_MISMATCH', 'This payment is not a cash payment.');
    }
    if (payment.cashSettlement && !payment.cashSettlement.voidedAt && payment.status === 'PAID') {
      return {
        paymentIntentId: payment.id,
        target: settlementTarget(payment),
        status: 'PAID' as const,
        settledAt: payment.paidAt ?? payment.cashSettlement.receivedAt,
      };
    }
    if (payment.status !== 'AWAITING_CASH') {
      throw new AppError(409, 'PAYMENT_NOT_AWAITING_CASH', 'This payment is not awaiting cash.');
    }

    const now = new Date();
    await tx.cashSettlement.create({
      data: {
        paymentIntentId: payment.id,
        receivedByUserId: input.actorUserId,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        receivedAt: now,
        note: input.note || null,
      },
    });
    await tx.paymentIntent.update({
      where: { id: payment.id },
      data: { status: 'PAID', paidAt: now },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        communityId: payment.communityId,
        action: 'CASH_PAYMENT_CONFIRMED',
        entityType: 'PaymentIntent',
        entityId: payment.id,
        afterJson: {
          status: 'PAID',
          amountMinor: payment.amountMinor.toString(),
          currency: payment.currency,
        },
        requestId: input.requestId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: 'PAYMENT_SETTLED',
        aggregateType: 'PaymentIntent',
        aggregateId: payment.id,
        payload: { paymentIntentId: payment.id, method: 'CASH' },
      },
    });

    return {
      paymentIntentId: payment.id,
      target: settlementTarget(payment),
      status: 'PAID' as const,
      settledAt: now,
    };
  }

  async voidCashSettlement(
    input: {
      paymentIntentId: string;
      actorUserId: string;
      reason: string;
      requestId: string;
    },
    handle: TransactionHandle,
  ) {
    const tx = transactionClient(handle);
    await tx.$queryRaw`SELECT id FROM "PaymentIntent" WHERE id = ${input.paymentIntentId} FOR UPDATE`;
    const payment = await tx.paymentIntent.findUnique({
      where: { id: input.paymentIntentId },
      include: {
        cashSettlement: true,
        eventRsvp: { select: { id: true } },
        rideMatch: { select: { id: true } },
        fundContribution: { select: { id: true } },
      },
    });
    if (!payment?.cashSettlement || payment.cashSettlement.voidedAt) {
      throw new AppError(409, 'CASH_SETTLEMENT_NOT_ACTIVE', 'No active cash settlement exists.');
    }
    if (payment.status !== 'PAID') {
      throw new AppError(409, 'PAYMENT_NOT_PAID', 'Only a paid cash settlement can be voided.');
    }

    const now = new Date();
    await tx.cashSettlement.update({
      where: { paymentIntentId: payment.id },
      data: { voidedAt: now, voidedByUserId: input.actorUserId },
    });
    await tx.paymentIntent.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED', refundedAt: now },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        communityId: payment.communityId,
        action: 'CASH_SETTLEMENT_VOIDED',
        entityType: 'PaymentIntent',
        entityId: payment.id,
        afterJson: { reason: input.reason },
        requestId: input.requestId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: 'PAYMENT_REFUNDED',
        aggregateType: 'PaymentIntent',
        aggregateId: payment.id,
        payload: { paymentIntentId: payment.id, method: 'CASH' },
      },
    });

    return {
      paymentIntentId: payment.id,
      target: settlementTarget(payment),
      status: 'REFUNDED' as const,
      settledAt: now,
    };
  }

  getPaymentWithCashSettlement(paymentIntentId: string) {
    return this.db.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: { cashSettlement: true },
    });
  }

  async listDigitalProducts(userId: string, communityId: string): Promise<DigitalProductView[]> {
    const products = await this.db.digitalProduct.findMany({
      where: { communityId },
      include: {
        entitlements: {
          where: { userId, revokedAt: null },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: [{ active: 'desc' }, { createdAt: 'asc' }],
    });

    return products.map((product) => ({
      id: product.id,
      communityId: product.communityId,
      sku: product.sku,
      title: product.title,
      description: product.description,
      starsAmount: product.starsAmount,
      active: product.active,
      owned: product.entitlements.length > 0,
    }));
  }

  async upsertSupporterBadge(input: {
    communityId: string;
    starsAmount: number;
    active: boolean;
  }): Promise<DigitalProductView> {
    const product = await this.db.digitalProduct.upsert({
      where: {
        communityId_sku: {
          communityId: input.communityId,
          sku: 'SUPPORTER_BADGE',
        },
      },
      create: {
        communityId: input.communityId,
        sku: 'SUPPORTER_BADGE',
        title: 'GOOL Supporter Badge',
        description: 'Digital supporter badge for this GOOL community.',
        starsAmount: input.starsAmount,
        active: input.active,
      },
      update: {
        starsAmount: input.starsAmount,
        active: input.active,
      },
    });

    return { ...product, owned: false };
  }

  async createStarsCheckout(input: {
    userId: string;
    communityId: string;
    sku: 'SUPPORTER_BADGE';
    idempotencyKey: string;
  }): Promise<StarsCheckout> {
    return this.db.$transaction(
      async (tx) => {
        const product = await tx.digitalProduct.findFirst({
          where: {
            communityId: input.communityId,
            sku: input.sku,
            active: true,
          },
        });
        if (!product) {
          throw new AppError(404, 'DIGITAL_PRODUCT_NOT_FOUND', 'Digital product is not available.');
        }

        const entitlement = await tx.digitalEntitlement.findUnique({
          where: {
            communityId_userId_sku: {
              communityId: input.communityId,
              userId: input.userId,
              sku: input.sku,
            },
          },
        });
        if (entitlement && !entitlement.revokedAt) {
          throw new AppError(
            409,
            'DIGITAL_PRODUCT_ALREADY_OWNED',
            'You already own this digital product.',
          );
        }

        const existingAttempt = await tx.paymentAttempt.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { paymentIntent: true },
        });
        if (existingAttempt) {
          const payment = existingAttempt.paymentIntent;
          const sameOperation =
            payment.userId === input.userId &&
            payment.communityId === input.communityId &&
            payment.purpose === 'DIGITAL_PRODUCT' &&
            payment.selectedMethod === 'TELEGRAM_STARS';
          if (!sameOperation) {
            throw new AppError(
              409,
              'IDEMPOTENCY_KEY_REUSED',
              'This idempotency key was already used for another payment.',
            );
          }
          if (payment.status === 'PAID' || payment.status === 'REFUNDED') {
            throw new AppError(
              409,
              'PAYMENT_ALREADY_PROCESSED',
              'This Stars payment has already been processed.',
            );
          }
          const payload = existingAttempt.providerCheckoutId;
          if (!payload) {
            throw new AppError(
              409,
              'PAYMENT_ATTEMPT_INVALID',
              'Existing payment attempt is missing its invoice payload.',
            );
          }
          return {
            paymentIntentId: existingAttempt.paymentIntentId,
            payload,
            title: product.title,
            description: product.description ?? product.title,
            stars: Number(payment.amountMinor),
          };
        }

        const intent = await tx.paymentIntent.create({
          data: {
            userId: input.userId,
            communityId: input.communityId,
            purpose: 'DIGITAL_PRODUCT',
            amountMinor: BigInt(product.starsAmount),
            currency: 'XTR',
            selectedMethod: 'TELEGRAM_STARS',
            status: 'AWAITING_PAYMENT',
          },
        });
        const payload = `gool:stars:${intent.id}`;
        await tx.paymentAttempt.create({
          data: {
            paymentIntentId: intent.id,
            method: 'TELEGRAM_STARS',
            provider: 'TELEGRAM',
            status: 'PENDING',
            idempotencyKey: input.idempotencyKey,
            providerCheckoutId: payload,
            providerAmountAtomic: String(product.starsAmount),
            providerCurrency: 'XTR',
          },
        });

        return {
          paymentIntentId: intent.id,
          payload,
          title: product.title,
          description: product.description ?? product.title,
          stars: product.starsAmount,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async validateStarsPreCheckout(input: {
    payload: string;
    totalAmount: number;
    telegramUserId: string;
  }): Promise<StarsPreCheckout> {
    const attempt = await this.db.paymentAttempt.findFirst({
      where: {
        provider: 'TELEGRAM',
        method: 'TELEGRAM_STARS',
        providerCheckoutId: input.payload,
        status: 'PENDING',
      },
      include: { paymentIntent: { include: { user: true } } },
    });

    const valid =
      !!attempt &&
      attempt.paymentIntent.status === 'AWAITING_PAYMENT' &&
      attempt.paymentIntent.currency === 'XTR' &&
      Number(attempt.paymentIntent.amountMinor) === input.totalAmount &&
      attempt.paymentIntent.user.telegramUserId === input.telegramUserId;

    return valid ? { valid: true, paymentIntentId: attempt.paymentIntentId } : { valid: false };
  }

  async settleStars(input: SuccessfulStarsPayment) {
    return this.db.$transaction(
      async (tx) => {
        const webhookKey = {
          provider_providerEventId: {
            provider: 'TELEGRAM' as const,
            providerEventId: input.updateId,
          },
        };
        const duplicate = await tx.providerWebhookEvent.findUnique({ where: webhookKey });
        if (duplicate?.status === 'PROCESSED') return { duplicate: true };

        await tx.providerWebhookEvent.upsert({
          where: webhookKey,
          create: {
            provider: 'TELEGRAM',
            providerEventId: input.updateId,
            payloadHash: input.payloadHash,
          },
          update: { payloadHash: input.payloadHash },
        });

        const attempt = await tx.paymentAttempt.findFirst({
          where: {
            providerCheckoutId: input.invoicePayload,
            provider: 'TELEGRAM',
            method: 'TELEGRAM_STARS',
          },
        });
        if (!attempt) {
          throw new AppError(
            404,
            'STARS_PAYMENT_NOT_FOUND',
            'Telegram Stars payment attempt not found.',
          );
        }

        await tx.$queryRaw`SELECT id FROM "PaymentIntent" WHERE id = ${attempt.paymentIntentId} FOR UPDATE`;
        const payment = await tx.paymentIntent.findUniqueOrThrow({
          where: { id: attempt.paymentIntentId },
          include: { user: true, telegramStarPayment: true },
        });

        if (payment.telegramStarPayment) {
          await tx.providerWebhookEvent.update({
            where: webhookKey,
            data: { status: 'PROCESSED', processedAt: new Date() },
          });
          return payment;
        }

        if (
          payment.user.telegramUserId !== input.telegramUserId ||
          payment.currency !== 'XTR' ||
          Number(payment.amountMinor) !== input.totalAmount ||
          payment.status !== 'AWAITING_PAYMENT'
        ) {
          throw new AppError(
            409,
            'STARS_SETTLEMENT_MISMATCH',
            'Telegram Stars settlement does not match the payment intent.',
          );
        }

        if (!payment.communityId) {
          throw new AppError(
            409,
            'STARS_PAYMENT_INVALID',
            'Stars payment is missing its community context.',
          );
        }

        const product = await tx.digitalProduct.findFirstOrThrow({
          where: {
            communityId: payment.communityId,
            sku: 'SUPPORTER_BADGE',
          },
        });
        const now = new Date();

        await tx.telegramStarPayment.create({
          data: {
            paymentIntentId: payment.id,
            telegramPaymentChargeId: input.telegramPaymentChargeId,
            providerPaymentChargeId: input.providerPaymentChargeId ?? null,
            invoicePayload: input.invoicePayload,
            starsAmount: input.totalAmount,
          },
        });
        await tx.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'SUCCEEDED',
            providerPaymentId: input.telegramPaymentChargeId,
            completedAt: now,
          },
        });
        await tx.paymentIntent.update({
          where: { id: payment.id },
          data: { status: 'PAID', paidAt: now },
        });
        await tx.digitalEntitlement.upsert({
          where: {
            communityId_userId_sku: {
              communityId: payment.communityId,
              userId: payment.userId,
              sku: product.sku,
            },
          },
          create: {
            communityId: payment.communityId,
            userId: payment.userId,
            productId: product.id,
            paymentIntentId: payment.id,
            sku: product.sku,
          },
          update: {
            paymentIntentId: payment.id,
            productId: product.id,
            revokedAt: null,
            grantedAt: now,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: payment.userId,
            communityId: payment.communityId,
            action: 'TELEGRAM_STARS_PAYMENT_SETTLED',
            entityType: 'PaymentIntent',
            entityId: payment.id,
            afterJson: { amount: input.totalAmount, currency: 'XTR' },
            requestId: input.requestId,
          },
        });
        await tx.outboxEvent.create({
          data: {
            eventType: 'PAYMENT_SETTLED',
            aggregateType: 'PaymentIntent',
            aggregateId: payment.id,
            payload: { paymentIntentId: payment.id, method: 'TELEGRAM_STARS' },
          },
        });
        await tx.providerWebhookEvent.update({
          where: webhookKey,
          data: { status: 'PROCESSED', processedAt: now },
        });

        return tx.paymentIntent.findUniqueOrThrow({
          where: { id: payment.id },
          include: { telegramStarPayment: true, digitalEntitlement: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async getStarsRefundContext(paymentIntentId: string): Promise<StarsRefundContext | null> {
    const payment = await this.db.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: { user: true, telegramStarPayment: true },
    });
    if (
      !payment ||
      !payment.communityId ||
      !payment.telegramStarPayment ||
      !['PAID', 'REFUNDED'].includes(payment.status)
    ) {
      return null;
    }

    return {
      paymentIntentId: payment.id,
      communityId: payment.communityId,
      userId: payment.userId,
      telegramUserId: payment.user.telegramUserId,
      telegramPaymentChargeId: payment.telegramStarPayment.telegramPaymentChargeId,
      status: payment.status as 'PAID' | 'REFUNDED',
      alreadyRefunded:
        payment.status === 'REFUNDED' || Boolean(payment.telegramStarPayment.refundedAt),
    };
  }

  async recordStarsRefund(
    input: {
      paymentIntentId: string;
      actorUserId: string;
      reason: string;
      requestId: string;
    },
    handle: TransactionHandle,
  ) {
    const tx = transactionClient(handle);
    await tx.$queryRaw`SELECT id FROM "PaymentIntent" WHERE id = ${input.paymentIntentId} FOR UPDATE`;
    const payment = await tx.paymentIntent.findUnique({
      where: { id: input.paymentIntentId },
      include: { telegramStarPayment: true },
    });
    if (!payment?.telegramStarPayment || !payment.communityId) {
      throw new AppError(404, 'STARS_PAYMENT_NOT_FOUND', 'Telegram Stars payment not found.');
    }
    if (payment.status === 'REFUNDED' && payment.telegramStarPayment.refundedAt) {
      return payment;
    }
    if (payment.status !== 'PAID') {
      throw new AppError(
        409,
        'STARS_PAYMENT_NOT_REFUNDABLE',
        'Only a settled Stars payment can be refunded.',
      );
    }

    const now = new Date();
    await tx.telegramStarPayment.update({
      where: { paymentIntentId: payment.id },
      data: { refundedAt: now },
    });
    await tx.paymentIntent.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED', refundedAt: now },
    });
    await tx.digitalEntitlement.updateMany({
      where: { paymentIntentId: payment.id, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        communityId: payment.communityId,
        action: 'TELEGRAM_STARS_PAYMENT_REFUNDED',
        entityType: 'PaymentIntent',
        entityId: payment.id,
        afterJson: { reason: input.reason },
        requestId: input.requestId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: 'PAYMENT_REFUNDED',
        aggregateType: 'PaymentIntent',
        aggregateId: payment.id,
        payload: { paymentIntentId: payment.id, method: 'TELEGRAM_STARS' },
      },
    });

    return tx.paymentIntent.findUniqueOrThrow({
      where: { id: payment.id },
      include: { telegramStarPayment: true, digitalEntitlement: true },
    });
  }

  async cancelForUser(
    paymentIntentId: string,
    userId: string,
    requestId: string,
    handle: TransactionHandle,
  ) {
    const tx = transactionClient(handle);
    await tx.$queryRaw`SELECT id FROM "PaymentIntent" WHERE id = ${paymentIntentId} FOR UPDATE`;
    const payment = await tx.paymentIntent.findFirst({
      where: { id: paymentIntentId, userId },
      include: { eventRsvp: true, rideMatch: true, fundContribution: true },
    });
    if (!payment) throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
    if (!['CREATED', 'AWAITING_PAYMENT', 'AWAITING_CASH'].includes(payment.status)) {
      throw new AppError(
        409,
        'PAYMENT_NOT_CANCELLABLE',
        'This payment can no longer be cancelled.',
      );
    }
    const target = settlementTarget(payment);
    if (target.kind !== 'NONE') {
      throw new AppError(
        409,
        'PAYMENT_CANCEL_THROUGH_DOMAIN',
        'Cancel this payment through its RSVP, ride, or fundraiser flow so capacity and accounting stay consistent.',
      );
    }

    const now = new Date();
    await tx.paymentIntent.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED', cancelledAt: now },
    });
    await tx.paymentAttempt.updateMany({
      where: {
        paymentIntentId: payment.id,
        status: { in: ['CREATED', 'PENDING'] },
      },
      data: { status: 'CANCELLED' },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        communityId: payment.communityId,
        action: 'PAYMENT_CANCELLED',
        entityType: 'PaymentIntent',
        entityId: payment.id,
        requestId,
      },
    });

    return {
      paymentIntentId: payment.id,
      status: 'CANCELLED' as const,
      target,
    };
  }

  getForUser(paymentIntentId: string, userId: string) {
    return this.db.paymentIntent.findFirst({
      where: { id: paymentIntentId, userId },
      include: {
        cashSettlement: true,
        telegramStarPayment: true,
        digitalEntitlement: true,
      },
    });
  }
}

export function hashWebhookPayload(payload: unknown) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
