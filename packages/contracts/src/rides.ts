import { z } from 'zod';
import { currencySchema, latitudeSchema, longitudeSchema, minorAmountSchema } from './common.js';
export const rideOfferCreateSchema = z
  .object({
    communityId: z.string().min(1),
    eventId: z.string().optional(),
    title: z.string().trim().min(2).max(120),
    originLabel: z.string().min(2).max(180),
    originLatitude: latitudeSchema,
    originLongitude: longitudeSchema,
    destinationLabel: z.string().min(2).max(180),
    destinationLatitude: latitudeSchema,
    destinationLongitude: longitudeSchema,
    departureAt: z.coerce.date(),
    seatsTotal: z.number().int().min(1).max(20),
    costSplitMode: z.enum(['FREE', 'FIXED']).default('FREE'),
    seatPriceMinor: minorAmountSchema.default(0n),
    currency: currencySchema.default('TND'),
    liveTrackingEnabled: z.boolean().default(false),
    note: z.string().max(500).optional(),
    acceptedPaymentMethods: z.array(z.literal('CASH')).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.costSplitMode === 'FIXED' && value.seatPriceMinor <= 0n)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seatPriceMinor'],
        message: 'Fixed cost rides require a positive seat price',
      });
    if (value.costSplitMode === 'FIXED' && value.acceptedPaymentMethods.length === 0)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['acceptedPaymentMethods'],
        message: 'Paid rides require an accepted payment method',
      });
  });
export const rideRequestCreateSchema = z.object({
  communityId: z.string().min(1),
  eventId: z.string().optional(),
  title: z.string().trim().min(2).max(120),
  pickupLabel: z.string().min(2).max(180),
  pickupLatitude: latitudeSchema,
  pickupLongitude: longitudeSchema,
  seatsNeeded: z.number().int().min(1).max(8),
  desiredDepartureAt: z.coerce.date(),
  note: z.string().max(500).optional(),
});
export const rideMatchSchema = z.object({
  rideRequestId: z.string().optional(),
  seats: z.number().int().min(1).max(8).default(1),
});
export const rideLocationSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  accuracyMeters: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  speedMetersPerSecond: z.number().nonnegative().optional(),
});
export const rideRatingSchema = z.object({
  rateeUserId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(300).optional(),
});
export const rideOfferStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});
