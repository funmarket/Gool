import { z } from 'zod';
const slot = z.object({
  userId: z.string().nullable().optional(),
  team: z.enum(['A', 'B']),
  position: z.enum(['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY']),
  label: z.string().trim().min(1).max(32),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
export const formationSaveSchema = z.object({
  name: z.string().trim().min(1).max(80),
  format: z.enum(['FIVE_V_FIVE', 'SEVEN_V_SEVEN', 'ELEVEN_V_ELEVEN']),
  slots: z.array(slot).max(30),
  published: z.boolean().default(false),
});
