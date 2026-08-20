import type { TransactionHandle } from '../../../application/unit-of-work.js';

export type RealWorldPaymentPurpose = 'EVENT_FEE' | 'RIDE_SHARE' | 'FUND_CONTRIBUTION';

export type PaymentSettlementTarget =
  | { kind: 'EVENT_RSVP'; id: string }
  | { kind: 'RIDE_MATCH'; id: string }
  | { kind: 'FUND_CONTRIBUTION'; id: string }
  | { kind: 'NONE' };

export interface CashConfirmationContext {
  paymentIntentId: string;
  payerUserId: string;
  communityId: string | null;
  purpose: RealWorldPaymentPurpose;
  status:
    | 'CREATED'
    | 'AWAITING_PAYMENT'
    | 'AWAITING_CASH'
    | 'PROCESSING'
    | 'PAID'
    | 'FAILED'
    | 'CANCELLED'
    | 'REFUNDED';
  amountMinor: bigint;
  currency: string;
  organizerUserId: string | null;
}

export interface CashSettlementResult {
  paymentIntentId: string;
  target: PaymentSettlementTarget;
  status: 'PAID' | 'REFUNDED';
  settledAt: Date;
}

export interface DigitalProductView {
  id: string;
  communityId: string;
  sku: 'SUPPORTER_BADGE';
  title: string;
  description: string | null;
  starsAmount: number;
  active: boolean;
  owned: boolean;
}

export interface StarsCheckout {
  paymentIntentId: string;
  payload: string;
  title: string;
  description: string;
  stars: number;
}

export interface StarsPreCheckout {
  valid: boolean;
  paymentIntentId?: string;
}

export interface SuccessfulStarsPayment {
  invoicePayload: string;
  totalAmount: number;
  telegramPaymentChargeId: string;
  providerPaymentChargeId?: string;
  telegramUserId: string;
  updateId: string;
  payloadHash: string;
  requestId: string;
}

export interface StarsRefundContext {
  paymentIntentId: string;
  communityId: string;
  userId: string;
  telegramUserId: string | null;
  telegramPaymentChargeId: string;
  status: 'PAID' | 'REFUNDED';
  alreadyRefunded: boolean;
}

export interface PaymentRepository {
  createCashIntent(
    input: {
      userId: string;
      communityId: string;
      purpose: RealWorldPaymentPurpose;
      amountMinor: bigint;
      currency: string;
    },
    tx?: TransactionHandle,
  ): Promise<{ id: string }>;
  cancelPendingIntent(paymentIntentId: string, tx: TransactionHandle): Promise<void>;
  getCashConfirmationContext(paymentIntentId: string): Promise<CashConfirmationContext | null>;
  recordCashSettlement(
    input: { paymentIntentId: string; actorUserId: string; note?: string; requestId: string },
    tx: TransactionHandle,
  ): Promise<CashSettlementResult>;
  voidCashSettlement(
    input: { paymentIntentId: string; actorUserId: string; reason: string; requestId: string },
    tx: TransactionHandle,
  ): Promise<CashSettlementResult>;
  getPaymentWithCashSettlement(paymentIntentId: string): Promise<unknown>;

  listDigitalProducts(userId: string, communityId: string): Promise<DigitalProductView[]>;
  upsertSupporterBadge(input: {
    communityId: string;
    starsAmount: number;
    active: boolean;
  }): Promise<DigitalProductView>;
  createStarsCheckout(input: {
    userId: string;
    communityId: string;
    sku: 'SUPPORTER_BADGE';
    idempotencyKey: string;
  }): Promise<StarsCheckout>;
  validateStarsPreCheckout(input: {
    payload: string;
    totalAmount: number;
    telegramUserId: string;
  }): Promise<StarsPreCheckout>;
  settleStars(input: SuccessfulStarsPayment): Promise<unknown>;
  getStarsRefundContext(paymentIntentId: string): Promise<StarsRefundContext | null>;
  recordStarsRefund(
    input: { paymentIntentId: string; actorUserId: string; reason: string; requestId: string },
    tx: TransactionHandle,
  ): Promise<unknown>;

  cancelForUser(
    paymentIntentId: string,
    userId: string,
    requestId: string,
    tx: TransactionHandle,
  ): Promise<{ paymentIntentId: string; status: 'CANCELLED'; target: PaymentSettlementTarget }>;
  getForUser(paymentIntentId: string, userId: string): Promise<unknown | null>;
}
