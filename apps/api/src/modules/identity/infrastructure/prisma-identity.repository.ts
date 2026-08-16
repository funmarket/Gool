import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
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

  async updateProfile(userId: string, input: Record<string, unknown>) {
    const { themeOverride, ...profile } = input;
    return this.db.$transaction(async (tx) => {
      if (Object.keys(profile).length) {
        await tx.playerProfile.update({ where: { userId }, data: profile });
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
