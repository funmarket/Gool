import { z } from 'zod';
export const chatMessageSchema = z.object({ body: z.string().trim().min(1).max(1200) });
