import type { IdentityUser, TelegramIdentityInput } from '../domain/types.js';
export interface IdentityRepository {
  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser>;
  getMe(userId: string): Promise<unknown>;
  updateProfile(userId: string, input: Record<string, unknown>): Promise<unknown>;
}
