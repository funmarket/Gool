import { z } from 'zod';
import { currencySchema, latitudeSchema, longitudeSchema, minorAmountSchema } from './common.js';

const base = z.object({
  communityId: z.string().min(1),
  type: z.enum(['PLAY', 'WATCH']),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1200).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  timezone: z.string().trim().min(1).max(80).default('UTC'),
  venueName: z.string().trim().max(120).optional(),
  address: z.string().trim().max(240).optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  capacity: z.number().int().min(2).max(1000).optional(),
  waitlistEnabled: z.boolean().default(true),
  cashRsvpPolicy: z
    .enum(['CONFIRM_IMMEDIATELY', 'REQUIRE_CASH_CONFIRMATION'])
    .default('CONFIRM_IMMEDIATELY'),
});
const play = z.object({
  pitchType: z.enum(['FIVE_A_SIDE', 'SEVEN_A_SIDE', 'ELEVEN_A_SIDE', 'FUTSAL', 'STREET', 'OTHER']),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MIXED']).default('MIXED'),
  format: z.enum(['FIVE_V_FIVE', 'SEVEN_V_SEVEN', 'ELEVEN_V_ELEVEN']),
  entryFeeMinor: minorAmountSchema.default(0n),
  currency: currencySchema.default('TND'),
  paymentRequired: z.boolean().default(false),
  acceptedPaymentMethods: z.array(z.literal('CASH')).default([]),
});
const watch = z.object({
  homeClubId: z.string().optional(),
  awayClubId: z.string().optional(),
  fanHubId: z.string().min(1),
});
export const eventCreateSchema = z
  .discriminatedUnion('type', [
    base.extend({ type: z.literal('PLAY') }).merge(play),
    base.extend({ type: z.literal('WATCH') }).merge(watch),
  ])
  .superRefine((value, ctx) => {
    if (value.endsAt && value.endsAt <= value.startsAt)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'endsAt must be after startsAt',
      });
    if (value.type === 'PLAY' && value.paymentRequired && value.entryFeeMinor <= 0n)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entryFeeMinor'],
        message: 'Paid events require a positive fee',
      });
    if (value.type === 'PLAY' && value.paymentRequired && value.acceptedPaymentMethods.length === 0)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['acceptedPaymentMethods'],
        message: 'Paid events require at least one accepted payment method',
      });
  });
export const rsvpCreateSchema = z.object({ paymentMethod: z.literal('CASH').optional() });
export const eventUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1200).nullable().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  venueName: z.string().trim().max(120).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  latitude: latitudeSchema.nullable().optional(),
  longitude: longitudeSchema.nullable().optional(),
  capacity: z.number().int().min(2).max(1000).nullable().optional(),
  waitlistEnabled: z.boolean().optional(),
  cashRsvpPolicy: z.enum(['CONFIRM_IMMEDIATELY', 'REQUIRE_CASH_CONFIRMATION']).optional(),
});
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
