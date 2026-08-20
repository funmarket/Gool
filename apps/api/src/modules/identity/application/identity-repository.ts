import type { ProfileUpdateInput, WebCredentialsLinkInput } from '@hooma/contracts';
import type { IdentityUser, TelegramIdentityInput } from '../domain/types.js';

export type TelegramIdentityLinkResult =
  | { status: 'linked' | 'already-linked'; user: IdentityUser }
  | { status: 'user-not-found' }
  | { status: 'user-already-linked' }
  | { status: 'telegram-already-linked' };

export type WebCredentialsLinkResult =
  | { status: 'linked'; user: IdentityUser }
  | { status: 'user-not-found' }
  | { status: 'web-credentials-already-linked' }
  | { status: 'email-already-linked' }
  | { status: 'username-already-linked' }
  | { status: 'current-email-conflict' }
  | { status: 'current-username-conflict' };

export interface IdentityRepository {
  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser>;
  linkTelegramIdentity(
    userId: string,
    input: TelegramIdentityInput,
  ): Promise<TelegramIdentityLinkResult>;
  linkWebCredentials(
    userId: string,
    input: WebCredentialsLinkInput,
    hashedPassword: string,
  ): Promise<WebCredentialsLinkResult>;
  getIdentityUser(userId: string): Promise<IdentityUser | null>;
  getMe(userId: string): Promise<unknown>;
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<unknown>;
}
