import type { IdentityRepository } from './identity-repository.js';
import type { ProfileUpdateInput } from '@hooma/contracts';
import type { TelegramIdentityInput } from '../domain/types.js';
export class IdentityService {
  constructor(private readonly repo: IdentityRepository) {}
  upsertTelegramUser(input: TelegramIdentityInput) {
    return this.repo.upsertTelegramUser(input);
  }
  getMe(userId: string) {
    return this.repo.getMe(userId);
  }
  updateProfile(userId: string, input: ProfileUpdateInput) {
    return this.repo.updateProfile(userId, input);
  }
}
