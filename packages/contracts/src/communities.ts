import { z } from 'zod';

export const communityCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(48),
  description: z.string().trim().max(280).optional(),
  city: z.string().trim().max(100).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
});
export const communityJoinSchema = z.object({
  slug: z.string().trim().toLowerCase().min(1).max(48),
});
export const communityPaymentDefaultsSchema = z.object({ cashEnabled: z.boolean() });
export const membershipRoleSchema = z.object({ role: z.enum(['ADMIN', 'MEMBER']) });
export const ownershipTransferSchema = z.object({ membershipId: z.string().min(1) });
export type CommunityCreateInput = z.infer<typeof communityCreateSchema>;

export const communityInviteCreateSchema = z.object({
  role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
  maxUses: z.number().int().min(1).max(500).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});
export const communityInviteJoinSchema = z.object({
  code: z.string().trim().min(16).max(200),
});
