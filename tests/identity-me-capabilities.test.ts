import assert from 'node:assert/strict';
import test from 'node:test';
import type { ProfileUpdateInput } from '@hooma/contracts';
import type { IdentityRepository } from '../apps/api/src/modules/identity/application/identity-repository.js';
import { IdentityService } from '../apps/api/src/modules/identity/application/identity.service.js';
import type {
  IdentityMeData,
  IdentityUser,
  TelegramIdentityInput,
} from '../apps/api/src/modules/identity/domain/types.js';
import type { PlatformRole } from '../apps/api/src/modules/platform-admin/application/platform-admin.repository.js';

const baseMe: IdentityMeData = {
  id: 'user-1',
  telegramUserId: '123456',
  username: 'hooma-user',
  firstName: 'Hooma',
  lastName: 'Fan',
  photoUrl: null,
  languageCode: 'en',
  isPremium: false,
  profile: {
    userId: 'user-1',
    skillLevel: 'MIXED',
    skillRating: 50,
    preferredPositions: [],
    favoriteClubId: null,
    profileAudience: 'SPECTATOR',
    bio: null,
    favoriteClub: null,
  },
  preference: {
    userId: 'user-1',
    activeCommunityId: null,
    themeOverride: 'TELEGRAM',
  },
};

class FakeIdentityRepository implements IdentityRepository {
  constructor(private readonly me: IdentityMeData) {}

  upsertTelegramUser(input: TelegramIdentityInput): Promise<IdentityUser> {
    return Promise.resolve({
      id: this.me.id,
      telegramUserId: input.telegramUserId,
      username: input.username ?? null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      photoUrl: input.photoUrl ?? null,
      languageCode: input.languageCode ?? null,
      isPremium: input.isPremium ?? false,
    });
  }

  getMe(): Promise<IdentityMeData> {
    return Promise.resolve(this.me);
  }

  updateProfile(_userId: string, _input: ProfileUpdateInput): Promise<unknown> {
    return Promise.resolve(this.me);
  }
}

function serviceWithRoles(roles: PlatformRole[]) {
  return new IdentityService(new FakeIdentityRepository(baseMe), {
    getActiveRoles: () => Promise.resolve([...roles]),
  });
}

test('/me exposes active platform roles and admin capabilities for Platform Admin', async () => {
  const me = await serviceWithRoles(['PLATFORM_ADMIN']).getMe('user-1');

  assert.deepEqual(me.platformRoles, ['PLATFORM_ADMIN']);
  assert.deepEqual(me.capabilities, {
    canAccessPlatformAdmin: true,
    canReviewWatchPlaces: true,
    canReviewPitchListings: true,
  });
});

test('/me returns no platform capabilities for a normal user', async () => {
  const me = await serviceWithRoles([]).getMe('user-1');

  assert.deepEqual(me.platformRoles, []);
  assert.deepEqual(me.capabilities, {
    canAccessPlatformAdmin: false,
    canReviewWatchPlaces: false,
    canReviewPitchListings: false,
  });
});

test('/me preserves existing identity, profile, and preference data while adding capabilities', async () => {
  const me = await serviceWithRoles(['PLATFORM_ADMIN']).getMe('user-1');

  assert.equal(me.id, baseMe.id);
  assert.equal(me.telegramUserId, baseMe.telegramUserId);
  assert.deepEqual(me.profile, baseMe.profile);
  assert.deepEqual(me.preference, baseMe.preference);
});
