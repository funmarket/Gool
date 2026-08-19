import { z } from 'zod';
import {
  currencySchema,
  cursorSchema,
  latitudeSchema,
  longitudeSchema,
  minorAmountSchema,
} from './common.js';

export const pitchVenueTypes = [
  'FOOTBALL_PITCH',
  'MINI_PITCH',
  'FUTSAL',
  'PRIVATE_STADIUM',
  'INDOOR_FOOTBALL',
  'OUTDOOR_FOOTBALL',
  'OTHER_FOOTBALL',
] as const;

export const pitchListingStatuses = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'INACTIVE',
] as const;

export const pitchVenueTypeSchema = z.enum(pitchVenueTypes);
export const pitchListingStatusSchema = z.enum(pitchListingStatuses);

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const nullableTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().url().max(1000).optional(),
);

const nullableUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().url().max(1000).nullable().optional(),
);

const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().email().max(160).optional(),
);

const nullableEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().email().max(160).nullable().optional(),
);

function validateCoordinatePair(
  value: {
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
  },
  ctx: z.RefinementCtx,
) {
  const hasLatitude = value.latitude !== undefined && value.latitude !== null;
  const hasLongitude = value.longitude !== undefined && value.longitude !== null;
  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [hasLatitude ? 'longitude' : 'latitude'],
      message: 'Latitude and longitude must be provided together.',
    });
  }
}

const pitchDraftFieldsSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: optionalTrimmedString(1200),
  photoUrl: optionalUrlSchema,
  venueType: pitchVenueTypeSchema.optional(),
  city: optionalTrimmedString(100),
  houma: optionalTrimmedString(100),
  fullAddress: optionalTrimmedString(240),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  hourlyRateMinor: minorAmountSchema.optional(),
  currency: currencySchema.optional(),
  publicPhone: optionalTrimmedString(40),
  publicEmail: optionalEmailSchema,
});

export const pitchCreateSchema = pitchDraftFieldsSchema
  .extend({
    name: z.string().trim().min(2).max(120),
  })
  .superRefine(validateCoordinatePair);

export const pitchUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: nullableTrimmedString(1200),
    photoUrl: nullableUrlSchema,
    venueType: pitchVenueTypeSchema.nullable().optional(),
    city: nullableTrimmedString(100),
    houma: nullableTrimmedString(100),
    fullAddress: nullableTrimmedString(240),
    latitude: latitudeSchema.nullable().optional(),
    longitude: longitudeSchema.nullable().optional(),
    hourlyRateMinor: minorAmountSchema.nullable().optional(),
    currency: currencySchema.nullable().optional(),
    publicPhone: nullableTrimmedString(40),
    publicEmail: nullableEmailSchema,
  })
  .superRefine(validateCoordinatePair)
  .refine((value) => Object.keys(value).length > 0, 'At least one Pitch field is required.');

export const pitchPublicationSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: optionalTrimmedString(1200),
    photoUrl: z.string().trim().url().max(1000),
    venueType: pitchVenueTypeSchema,
    city: z.string().trim().min(1).max(100),
    houma: z.string().trim().min(1).max(100),
    fullAddress: z.string().trim().min(2).max(240),
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
    hourlyRateMinor: minorAmountSchema,
    currency: currencySchema,
    publicPhone: optionalTrimmedString(40),
    publicEmail: optionalEmailSchema,
  })
  .superRefine((value, ctx) => {
    validateCoordinatePair(value, ctx);
    if (!value.publicPhone && !value.publicEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publicPhone'],
        message: 'Provide at least one public contact method.',
      });
    }
  });

export const pitchListQuerySchema = cursorSchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  houma: z.string().trim().min(1).max(100).optional(),
  venueType: pitchVenueTypeSchema.optional(),
});

export const pitchOwnerListQuerySchema = cursorSchema.extend({
  status: pitchListingStatusSchema.optional(),
});

export const pitchRejectSchema = z.object({
  reason: z.string().trim().min(2).max(500),
});

export type PitchVenueType = z.infer<typeof pitchVenueTypeSchema>;
export type PitchListingStatus = z.infer<typeof pitchListingStatusSchema>;
export type PitchCreateInput = z.infer<typeof pitchCreateSchema>;
export type PitchCreateRequest = z.input<typeof pitchCreateSchema>;
export type PitchUpdateInput = z.infer<typeof pitchUpdateSchema>;
export type PitchUpdateRequest = z.input<typeof pitchUpdateSchema>;
export type PitchPublicationInput = z.infer<typeof pitchPublicationSchema>;
export type PitchListQuery = z.infer<typeof pitchListQuerySchema>;
export type PitchOwnerListQuery = z.infer<typeof pitchOwnerListQuerySchema>;
export type PitchRejectInput = z.infer<typeof pitchRejectSchema>;
