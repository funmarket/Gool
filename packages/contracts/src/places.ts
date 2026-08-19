import { z } from 'zod';
import { latitudeSchema, longitudeSchema } from './common.js';

const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().url().max(500).optional(),
);

export const placeCategories = [
  'Cafe',
  'Restaurant',
  'Hookah Lounge',
  'Youth Center',
  'Supporters Club',
  'Sports Club',
  'Stadium Venue',
  'Community Venue',
  'Sports cafe & lounge',
  'Other',
] as const;

const requiredUrl = z.string().trim().url().max(500);

export const placeMenuItemInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  priceLabel: z.string().trim().max(40).optional(),
});

export const placeCreateSchema = z
  .object({
    communityId: z.string().optional(),
    name: z.string().trim().min(2).max(120),
    category: z.enum(placeCategories).default('Sports cafe & lounge'),
    description: z.string().trim().max(800).optional(),
    address: z.string().trim().min(2).max(240),
    city: z.string().trim().max(100).optional(),
    houma: z.string().trim().max(100).optional(),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email().max(160).optional(),
    websiteUrl: optionalUrl,
    photoUrl: requiredUrl,
    makeFanHub: z.boolean().default(true),
    clubIds: z.array(z.string()).max(20).default([]),
    menuItems: z.array(placeMenuItemInputSchema).max(20).default([]),
    ownerClaim: z
      .object({
        businessName: z.string().trim().max(120).optional(),
        contactName: z.string().trim().max(120).optional(),
        contactPhone: z.string().trim().max(40).optional(),
        contactEmail: z.string().trim().email().max(160).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .optional(),
  })
  .superRefine((input, ctx) => {
    if (!input.phone && !input.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one public contact method.',
        path: ['phone'],
      });
    }
  });

export type PlaceCreateInput = z.infer<typeof placeCreateSchema>;
