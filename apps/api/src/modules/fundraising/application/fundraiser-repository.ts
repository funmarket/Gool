import type { z } from 'zod';
import type { fundraiserCreateSchema } from '@hooma/contracts';
import type { TransactionHandle } from '../../../application/unit-of-work.js';

export type FundraiserCreateInput = z.infer<typeof fundraiserCreateSchema>;

export interface FundraiserForContribution {
  id: string;
  communityId: string;
  currency: string;
  status: 'OPEN' | 'FUNDED' | 'CLOSED' | 'CANCELLED';
  deletedAt: Date | null;
  deadline: Date | null;
  cashAccepted: boolean;
}

export interface FundraiserRepository {
  list(
    userId: string,
    input: { communityId?: string; cursor?: string; limit: number },
  ): Promise<unknown>;
  create(userId: string, input: FundraiserCreateInput): Promise<unknown>;
  getForContribution(
    fundraiserId: string,
    tx: TransactionHandle,
  ): Promise<FundraiserForContribution | null>;
  createContribution(
    input: {
      fundraiserId: string;
      userId: string;
      idempotencyKey: string;
      amountMinor: bigint;
      anonymous: boolean;
      message?: string;
    },
    tx: TransactionHandle,
  ): Promise<{ id: string; paymentIntentId: string | null }>;
  attachPayment(
    contributionId: string,
    paymentIntentId: string,
    tx: TransactionHandle,
  ): Promise<unknown>;
  getContribution(contributionId: string, tx: TransactionHandle): Promise<unknown>;
  markContributionPaid(contributionId: string, tx: TransactionHandle): Promise<void>;
  markContributionRefunded(contributionId: string, tx: TransactionHandle): Promise<void>;
  markContributionCancelled(contributionId: string, tx: TransactionHandle): Promise<void>;
}
