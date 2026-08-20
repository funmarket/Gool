import { z } from 'zod';
export const profileUpdateSchema = z.object({
  photoUrl: z.string().trim().url().max(1000).nullable().optional(),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MIXED']).optional(),
  skillRating: z.number().int().min(1).max(100).optional(),
  preferredPositions: z
    .array(z.enum(['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY']))
    .max(5)
    .optional(),
  favoriteClubId: z.string().nullable().optional(),
  profileAudience: z.enum(['SPECTATOR', 'FAN']).optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  themeOverride: z.enum(['TELEGRAM', 'LIGHT', 'DARK']).optional(),
});

export const telegramLinkSchema = z.object({
  initData: z.string().trim().min(1).max(8192),
});

export const webCredentialsLinkSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[A-Za-z0-9_.]+$/, 'Username may only contain letters, numbers, underscores, and dots.'),
  password: z.string().min(8).max(128),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type TelegramLinkInput = z.infer<typeof telegramLinkSchema>;
export type WebCredentialsLinkInput = z.infer<typeof webCredentialsLinkSchema>;
