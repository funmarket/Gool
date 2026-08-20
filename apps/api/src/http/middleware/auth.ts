import { deepSnakeToCamelObjKeys, parse, validate } from '@tma.js/init-data-node';
import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';
import type { HoomaAuth } from '../../auth/better-auth.js';
import type { IdentityService } from '../../modules/identity/application/identity.service.js';
import type { IdentityUser, TelegramIdentityInput } from '../../modules/identity/domain/types.js';

export interface AuthContext {
  user: IdentityUser;
  provider: 'telegram' | 'session' | 'dev';
  rawInitData?: string;
  telegramUser?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

export interface HybridAuthOptions {
  optional?: boolean;
}

export function getAuth(req: Request): AuthContext {
  const auth = (req as Request & { auth?: AuthContext }).auth;
  if (!auth) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Authentication required');
  }
  return auth;
}

interface TelegramIdentityFields {
  username?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  photoUrl?: string | undefined;
  languageCode?: string | undefined;
  isPremium?: boolean | undefined;
}

function telegramIdentityInput(
  telegramUserId: string,
  user: TelegramIdentityFields,
): TelegramIdentityInput {
  return {
    telegramUserId,
    ...(user.username !== undefined ? { username: user.username } : {}),
    ...(user.firstName !== undefined ? { firstName: user.firstName } : {}),
    ...(user.lastName !== undefined ? { lastName: user.lastName } : {}),
    ...(user.photoUrl !== undefined ? { photoUrl: user.photoUrl } : {}),
    ...(user.languageCode !== undefined ? { languageCode: user.languageCode } : {}),
    ...(user.isPremium !== undefined ? { isPremium: user.isPremium } : {}),
  };
}

function telegramUserContext(
  telegramUserId: string,
  user: Pick<TelegramIdentityFields, 'username' | 'firstName' | 'lastName'>,
): NonNullable<AuthContext['telegramUser']> {
  return {
    id: telegramUserId,
    ...(user.username !== undefined ? { username: user.username } : {}),
    ...(user.firstName !== undefined ? { firstName: user.firstName } : {}),
    ...(user.lastName !== undefined ? { lastName: user.lastName } : {}),
  };
}

function authError(res: Response, code: 'AUTH_REQUIRED' | 'AUTH_INVALID', message: string) {
  return res.status(401).json({
    error: {
      code,
      message,
      requestId: String(res.locals.requestId || 'unknown'),
    },
  });
}

async function authenticateTelegram(req: Request, identity: IdentityService) {
  const authorization = req.header('authorization') || '';
  const [scheme = '', rawInitData = ''] = authorization.split(' ', 2);
  if (scheme.toLowerCase() !== 'tma' || !rawInitData) {
    throw new Error('Invalid Telegram authentication credentials');
  }

  validate(rawInitData, env.TELEGRAM_BOT_TOKEN, {
    expiresIn: env.INIT_DATA_MAX_AGE_SECONDS,
  });
  const initData = deepSnakeToCamelObjKeys(parse(rawInitData));
  const tgUser = initData.user;
  if (!tgUser) throw new Error('Telegram user missing from initData');

  const telegramUserId = String(tgUser.id);
  const user = await identity.upsertTelegramUser(telegramIdentityInput(telegramUserId, tgUser));
  return {
    user,
    provider: 'telegram' as const,
    rawInitData,
    telegramUser: telegramUserContext(telegramUserId, tgUser),
  };
}

export function telegramAuth(identity: IdentityService, options: HybridAuthOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const existing = (req as Request & { auth?: AuthContext }).auth;
    if (existing) return next();

    try {
      if (env.NODE_ENV !== 'production' && env.DEV_AUTH_BYPASS) {
        const telegramUserId = String(
          req.header('x-dev-telegram-user-id') || env.DEV_TELEGRAM_USER_ID,
        );
        const user = await identity.upsertTelegramUser({
          telegramUserId,
          username: 'dev_' + telegramUserId,
          firstName: 'Dev',
          lastName: 'HOOMA',
        });
        (req as AuthenticatedRequest).auth = {
          user,
          provider: 'dev',
          telegramUser: { id: telegramUserId, firstName: 'Dev', lastName: 'HOOMA' },
        };
        return next();
      }

      if (!req.header('authorization')) {
        if (options.optional) return next();
        return authError(res, 'AUTH_REQUIRED', 'Authentication required');
      }

      (req as AuthenticatedRequest).auth = await authenticateTelegram(req, identity);
      return next();
    } catch {
      return authError(res, 'AUTH_INVALID', 'Invalid or expired authentication credentials');
    }
  };
}

export function hybridAuth(
  identity: IdentityService,
  auth: HoomaAuth,
  options: HybridAuthOptions = {},
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (env.NODE_ENV !== 'production' && env.DEV_AUTH_BYPASS) {
        const telegramUserId = String(
          req.header('x-dev-telegram-user-id') || env.DEV_TELEGRAM_USER_ID,
        );
        const user = await identity.upsertTelegramUser({
          telegramUserId,
          username: 'dev_' + telegramUserId,
          firstName: 'Dev',
          lastName: 'HOOMA',
        });
        (req as AuthenticatedRequest).auth = {
          user,
          provider: 'dev',
          telegramUser: { id: telegramUserId, firstName: 'Dev', lastName: 'HOOMA' },
        };
        return next();
      }

      // Preserve Phase B behavior: if an Authorization header is supplied it must
      // be valid Telegram initData. Never silently fall back to a web cookie.
      if (req.header('authorization')) {
        (req as AuthenticatedRequest).auth = await authenticateTelegram(req, identity);
        return next();
      }

      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (session?.user?.id) {
        const user = await identity.getIdentityUser(session.user.id);
        if (!user) return authError(res, 'AUTH_INVALID', 'Invalid authentication session');
        (req as AuthenticatedRequest).auth = { user, provider: 'session' };
        return next();
      }

      if (options.optional) return next();
      return authError(res, 'AUTH_REQUIRED', 'Authentication required');
    } catch {
      return authError(res, 'AUTH_INVALID', 'Invalid or expired authentication credentials');
    }
  };
}
