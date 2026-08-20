import type { IdentityRepository } from './identity-repository.js';
import type { ProfileUpdateInput, WebCredentialsLinkInput } from '@hooma/contracts';
import { AppError } from '../../../http/errors/app-error.js';
import type { TelegramIdentityInput } from '../domain/types.js';

export class IdentityService {
  constructor(private readonly repo: IdentityRepository) {}
  upsertTelegramUser(input: TelegramIdentityInput) {
    return this.repo.upsertTelegramUser(input);
  }
  async linkTelegramIdentity(userId: string, input: TelegramIdentityInput) {
    const result = await this.repo.linkTelegramIdentity(userId, input);
    switch (result.status) {
      case 'linked':
      case 'already-linked':
        return result.user;
      case 'user-not-found':
        throw new AppError(401, 'AUTH_INVALID', 'Invalid authentication session');
      case 'user-already-linked':
        throw new AppError(
          409,
          'USER_ALREADY_HAS_TELEGRAM_IDENTITY',
          'This HOOMA account is already linked to a different Telegram identity.',
        );
      case 'telegram-already-linked':
        throw new AppError(
          409,
          'TELEGRAM_IDENTITY_ALREADY_LINKED',
          'This Telegram identity is already linked to another HOOMA account.',
        );
      default: {
        const exhaustive: never = result;
        return exhaustive;
      }
    }
  }
  async linkWebCredentials(userId: string, input: WebCredentialsLinkInput, hashedPassword: string) {
    const result = await this.repo.linkWebCredentials(userId, input, hashedPassword);
    switch (result.status) {
      case 'linked':
        return result.user;
      case 'user-not-found':
        throw new AppError(401, 'AUTH_INVALID', 'Invalid authentication identity');
      case 'web-credentials-already-linked':
        throw new AppError(
          409,
          'WEB_CREDENTIALS_ALREADY_LINKED',
          'This HOOMA account already has email/password login credentials.',
        );
      case 'email-already-linked':
        throw new AppError(
          409,
          'EMAIL_ALREADY_LINKED',
          'This email address belongs to another HOOMA account.',
        );
      case 'username-already-linked':
        throw new AppError(
          409,
          'AUTH_USERNAME_ALREADY_LINKED',
          'This login username belongs to another HOOMA account.',
        );
      case 'current-email-conflict':
        throw new AppError(
          409,
          'CURRENT_EMAIL_CONFLICT',
          'This HOOMA account already has a different email identity.',
        );
      case 'current-username-conflict':
        throw new AppError(
          409,
          'CURRENT_AUTH_USERNAME_CONFLICT',
          'This HOOMA account already has a different login username.',
        );
      default: {
        const exhaustive: never = result;
        return exhaustive;
      }
    }
  }
  getIdentityUser(userId: string) {
    return this.repo.getIdentityUser(userId);
  }
  getMe(userId: string) {
    return this.repo.getMe(userId);
  }
  updateProfile(userId: string, input: ProfileUpdateInput) {
    return this.repo.updateProfile(userId, input);
  }
}
