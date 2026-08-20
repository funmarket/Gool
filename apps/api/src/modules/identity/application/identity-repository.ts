import type { ProfileUpdateInput } from '@hooma/contracts';
import type { IdentityMeData, IdentityUser, TelegramIdentityInput } from '../domain/types.js';

export interface IdentityRepository {
  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser>;
  getMe(userId: string): Promise<IdentityMeData>;
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<unknown>;
}
