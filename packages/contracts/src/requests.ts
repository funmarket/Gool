import { z } from 'zod';
export const requestCreateSchema = z.object({
  communityId: z.string().min(1),
  eventId: z.string().optional(),
  kind: z.enum(['PLAYER', 'POSITION', 'EQUIPMENT', 'HELP', 'OTHER']),
  title: z.string().trim().min(2).max(120),
  details: z.string().trim().max(800).optional(),
  position: z.enum(['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY']).optional(),
  quantity: z.number().int().min(1).max(50).default(1),
  expiresAt: z.coerce.date(),
});
export const requestClaimSchema = z.object({
  quantity: z.number().int().min(1).max(50).default(1),
});
