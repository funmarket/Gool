import { z } from 'zod';

export const cashConfirmSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const cashVoidSchema = z.object({
  reason: z.string().trim().min(2).max(500),
});

export const starsPurchaseSchema = z.object({
  communityId: z.string().min(1),
  sku: z.literal('SUPPORTER_BADGE'),
});

export const starsProductConfigureSchema = z.object({
  communityId: z.string().min(1),
  starsAmount: z.number().int().min(1).max(1_000_000),
  active: z.boolean(),
});

export const starsRefundSchema = z.object({
  reason: z.string().trim().min(2).max(500),
});
