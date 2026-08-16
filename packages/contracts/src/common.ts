import { z } from 'zod';

export const idSchema = z.string().min(1).max(160);
export const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());
export const minorAmountSchema = z
  .union([z.bigint(), z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
  .transform(BigInt)
  .refine(
    (value) => value <= 9_007_199_254_740_991n,
    'Amount exceeds the supported accounting range',
  );
export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);
export const cursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
