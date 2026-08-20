import type { ProfileUpdateInput } from '@hooma/contracts';
import type { IdentityUser, TelegramIdentityInput } from '../domain/types.js';

export type TelegramIdentityLinkResult =
  | { status: 'linked' | 'already-linked'; user: IdentityUser }
  | { status: 'user-not-found' }
  | { status: 'user-already-linked' }
  | { status: 'telegram-already-linked' };

export interface IdentityRepository {
  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser>;
  linkTelegramIdentity(userId: string, input: TelegramIdentityInput): Promise<TelegramIdentityLinkResult>;
  getIdentityUser(userId: string): Promise<IdentityUser | null>;
  getMe(userId: string): Promise<unknown>;
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<unknown>;
}
