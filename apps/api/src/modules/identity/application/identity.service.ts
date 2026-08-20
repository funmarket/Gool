import type { ProfileUpdateInput } from '@hooma/contracts';
import type { PlatformAdminService } from '../../platform-admin/application/platform-admin.service.js';
import type { TelegramIdentityInput } from '../domain/types.js';
import type { IdentityRepository } from './identity-repository.js';

export class IdentityService {
  constructor(
    private readonly repo: IdentityRepository,
    private readonly platformAdmin: Pick<PlatformAdminService, 'getActiveRoles'>,
  ) {}

  upsertTelegramUser(input: TelegramIdentityInput) {
    return this.repo.upsertTelegramUser(input);
  }

  async getMe(userId: string) {
    const [me, platformRoles] = await Promise.all([
      this.repo.getMe(userId),
      this.platformAdmin.getActiveRoles(userId),
    ]);
    const canAccessPlatformAdmin = platformRoles.includes('PLATFORM_ADMIN');

    return {
      ...me,
      platformRoles,
      capabilities: {
        canAccessPlatformAdmin,
        canReviewWatchPlaces: canAccessPlatformAdmin,
        canReviewPitchListings: canAccessPlatformAdmin,
      },
    };
  }

  updateProfile(userId: string, input: ProfileUpdateInput) {
    return this.repo.updateProfile(userId, input);
  }
}
