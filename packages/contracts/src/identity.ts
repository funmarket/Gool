import { z } from 'zod';
export const profileUpdateSchema = z.object({
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MIXED']).optional(),
  skillRating: z.number().int().min(1).max(100).optional(),
  preferredPositions: z
    .array(z.enum(['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY']))
    .max(5)
    .optional(),
  favoriteClubId: z.string().nullable().optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  themeOverride: z.enum(['TELEGRAM', 'LIGHT', 'DARK']).optional(),
});
