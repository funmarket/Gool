import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import type { ProfileUpdateInput } from '@hooma/contracts';
import type { IdentityRepository } from '../application/identity-repository.js';
import type { TelegramIdentityInput } from '../domain/types.js';

export class PrismaIdentityRepository implements IdentityRepository {
  constructor(private readonly db: DatabaseClient) {}

  async upsertTelegramUser(input: TelegramIdentityInput) {
    const optionalIdentity = {
      ...(input.username !== undefined ? { username: input.username } : {}),
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
      ...(input.languageCode !== undefined ? { languageCode: input.languageCode } : {}),
    };

    return this.db.user.upsert({
      where: { telegramUserId: input.telegramUserId },
      create: {
        telegramUserId: input.telegramUserId,
        ...optionalIdentity,
        isPremium: input.isPremium ?? false,
        profile: { create: {} },
        preference: { create: {} },
      },
      update: {
        ...optionalIdentity,
        isPremium: input.isPremium ?? false,
      },
      select: {
        id: true,
        telegramUserId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        languageCode: true,
        isPremium: true,
      },
    });
  }

  getMe(userId: string) {
    return this.db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        telegramUserId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        languageCode: true,
        isPremium: true,
        profile: { include: { favoriteClub: true } },
        preference: true,
      },
    });
  }

  async updateProfile(userId: string, input: ProfileUpdateInput) {
    const { themeOverride, photoUrl, favoriteClubId, ...profile } = input;
    const profileUpdate = {
      ...(profile.skillLevel !== undefined ? { skillLevel: profile.skillLevel } : {}),
      ...(profile.skillRating !== undefined ? { skillRating: profile.skillRating } : {}),
      ...(profile.preferredPositions !== undefined
        ? { preferredPositions: profile.preferredPositions }
        : {}),
      ...(profile.profileAudience !== undefined
        ? { profileAudience: profile.profileAudience }
        : {}),
      ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
      ...(favoriteClubId !== undefined
        ? {
            favoriteClub: favoriteClubId
              ? { connect: { id: favoriteClubId } }
              : { disconnect: true },
          }
        : {}),
    };
    return this.db.$transaction(async (tx) => {
      if (photoUrl !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { photoUrl },
        });
      }
      if (Object.keys(profileUpdate).length) {
        await tx.playerProfile.update({ where: { userId }, data: profileUpdate });
      }
      if (themeOverride) {
        await tx.userPreference.update({
          where: { userId },
          data: { themeOverride: themeOverride as 'TELEGRAM' | 'LIGHT' | 'DARK' },
        });
      }
      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: { include: { favoriteClub: true } }, preference: true },
      });
    });
  }
}
