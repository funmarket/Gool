import { z } from 'zod';
import { currencySchema, minorAmountSchema } from './common.js';
export const fundraiserCreateSchema = z.object({
  communityId: z.string().min(1),
  eventId: z.string().optional(),
  purpose: z.enum(['PITCH_FEES', 'EQUIPMENT', 'TRAVEL', 'TIFO', 'COMMUNITY', 'OTHER']),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  goalMinor: minorAmountSchema.refine((v) => v > 0n, 'Goal must be positive'),
  currency: currencySchema.default('TND'),
  deadline: z.coerce.date().optional(),
  allowAnonymous: z.boolean().default(true),
  acceptedPaymentMethods: z.array(z.literal('CASH')).default(['CASH']),
});
export const contributionCreateSchema = z.object({
  amountMinor: minorAmountSchema.refine((v) => v > 0n, 'Amount must be positive'),
  anonymous: z.boolean().default(false),
  message: z.string().trim().max(280).optional(),
  paymentMethod: z.literal('CASH'),
});
