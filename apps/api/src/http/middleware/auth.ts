import { deepSnakeToCamelObjKeys, parse, validate } from '@tma.js/init-data-node';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import type { IdentityService } from '../../modules/identity/application/identity.service.js';
import type { IdentityUser, TelegramIdentityInput } from '../../modules/identity/domain/types.js';

export interface AuthContext {
  user: IdentityUser;
  rawInitData?: string;
  telegramUser: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

export const getAuth = (req: Request) => (req as AuthenticatedRequest).auth;

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
): AuthContext['telegramUser'] {
  return {
    id: telegramUserId,
    ...(user.username !== undefined ? { username: user.username } : {}),
    ...(user.firstName !== undefined ? { firstName: user.firstName } : {}),
    ...(user.lastName !== undefined ? { lastName: user.lastName } : {}),
  };
}

export function telegramAuth(identity: IdentityService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (env.NODE_ENV !== 'production' && env.DEV_AUTH_BYPASS) {
        const telegramUserId = String(
          req.header('x-dev-telegram-user-id') || env.DEV_TELEGRAM_USER_ID,
        );
        const user = await identity.upsertTelegramUser({
          telegramUserId,
          username: `dev_${telegramUserId}`,
          firstName: 'Dev',
          lastName: 'HOOMA',
        });
        (req as AuthenticatedRequest).auth = {
          user,
          telegramUser: { id: telegramUserId, firstName: 'Dev', lastName: 'HOOMA' },
        };
        return next();
      }

      const authorization = req.header('authorization') || '';
      const [scheme = '', rawInitData = ''] = authorization.split(' ', 2);
      if (scheme.toLowerCase() !== 'tma' || !rawInitData) {
        return res.status(401).json({
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Missing Telegram initData',
            requestId: String(res.locals.requestId || 'unknown'),
          },
        });
      }

      validate(rawInitData, env.TELEGRAM_BOT_TOKEN, {
        expiresIn: env.INIT_DATA_MAX_AGE_SECONDS,
      });
      const initData = deepSnakeToCamelObjKeys(parse(rawInitData));
      const tgUser = initData.user;
      if (!tgUser) {
        return res.status(401).json({
          error: {
            code: 'AUTH_INVALID',
            message: 'Telegram user missing from initData',
            requestId: String(res.locals.requestId || 'unknown'),
          },
        });
      }

      const telegramUserId = String(tgUser.id);
      const user = await identity.upsertTelegramUser(telegramIdentityInput(telegramUserId, tgUser));
      (req as AuthenticatedRequest).auth = {
        user,
        rawInitData,
        telegramUser: telegramUserContext(telegramUserId, tgUser),
      };
      return next();
    } catch {
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid or expired Telegram initData',
          requestId: String(res.locals.requestId || 'unknown'),
        },
      });
    }
  };
}
