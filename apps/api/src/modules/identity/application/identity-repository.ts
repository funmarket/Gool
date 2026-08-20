import type { ProfileUpdateInput } from '@hooma/contracts';
import type { IdentityUser, TelegramIdentityInput } from '../domain/types.js';
export interface IdentityRepository {
  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser>;
  getIdentityUser(userId: string): Promise<IdentityUser | null>;
  getMe(userId: string): Promise<unknown>;
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<unknown>;
}
