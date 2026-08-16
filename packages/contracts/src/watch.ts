import { z } from 'zod';
import { latitudeSchema, longitudeSchema } from './common.js';

export const fanHubCreateSchema = z.object({
  communityId: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  venueName: z.string().trim().min(2).max(120),
  address: z.string().trim().max(240).optional(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  clubIds: z.array(z.string()).max(20).default([]),
});

export const checkInSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  fanHubId: z.string().optional(),
});

export const venueDealCreateSchema = z
  .object({
    fanHubId: z.string().min(1),
    communityId: z.string().min(1),
    eventId: z.string().optional(),
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(500).optional(),
    redemptionCode: z.string().trim().max(80).optional(),
    requiresCheckIn: z.boolean().default(true),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && value.startsAt >= value.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'Deal end time must be after its start time.',
      });
    }
  });
