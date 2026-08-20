import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import type { DatabaseClient } from '../infrastructure/database/prisma.js';
import { env } from '../config/env.js';

function resolveSecret() {
  if (env.BETTER_AUTH_SECRET) return env.BETTER_AUTH_SECRET;
  if (env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET is required in production');
  }
  return 'hooma-local-only-better-auth-secret-change-before-production';
}

function resolveBaseUrl() {
  return env.AUTH_BASE_URL || env.APP_BASE_URL || 'http://localhost:' + env.PORT;
}

export type HoomaAuth = ReturnType<typeof betterAuth>;

export function buildAuth(db: DatabaseClient): HoomaAuth {
  return betterAuth({
    appName: 'HOOMA',
    baseURL: resolveBaseUrl(),
    secret: resolveSecret(),
    database: prismaAdapter(db, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    user: {
      modelName: 'User',
      fields: {
        name: 'authName',
        email: 'email',
        emailVerified: 'emailVerified',
        image: 'photoUrl',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
    session: { modelName: 'AuthSession' },
    account: { modelName: 'AuthAccount' },
    verification: { modelName: 'AuthVerification' },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await db.$transaction([
              db.playerProfile.upsert({
                where: { userId: user.id },
                create: { userId: user.id },
                update: {},
              }),
              db.userPreference.upsert({
                where: { userId: user.id },
                create: { userId: user.id },
                update: {},
              }),
            ]);
          },
        },
      },
    },
    trustedOrigins: env.APP_BASE_URL ? [env.APP_BASE_URL] : [],
    advanced:
      env.NODE_ENV === 'production'
        ? {
            defaultCookieAttributes: {
              httpOnly: true,
              secure: true,
              sameSite: 'none',
            },
          }
        : undefined,
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        schema: {
          user: {
            fields: {
              username: 'authUsername',
              displayUsername: 'displayAuthUsername',
            },
          },
        },
      }),
    ],
  } as BetterAuthOptions);
}
