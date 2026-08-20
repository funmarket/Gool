import { Router } from 'express';
import { profileUpdateSchema, telegramLinkSchema } from '@hooma/contracts';
import type { IdentityService } from '../application/identity.service.js';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { getAuth, parseTelegramIdentity } from '../../../http/middleware/auth.js';
import { parseBody } from '../../../http/middleware/parse.js';
import { AppError } from '../../../http/errors/app-error.js';

export function identityRouter(service: IdentityService) {
  const router = Router();
  router.get(
    '/me',
    asyncHandler(async (req, res) => res.json(await service.getMe(getAuth(req).user.id))),
  );
  router.post(
    '/me/link/telegram',
    asyncHandler(async (req, res) => {
      const auth = getAuth(req);
      if (auth.provider !== 'session') {
        throw new AppError(
          403,
          'TELEGRAM_LINK_REQUIRES_SESSION',
          'Sign in with an email/password session before linking Telegram.',
        );
      }

      const body = parseBody(telegramLinkSchema, req);
      let telegramIdentity: ReturnType<typeof parseTelegramIdentity>;
      try {
        telegramIdentity = parseTelegramIdentity(body.initData);
      } catch {
        throw new AppError(
          401,
          'TELEGRAM_LINK_INVALID',
          'Invalid or expired Telegram credentials.',
        );
      }

      const user = await service.linkTelegramIdentity(auth.user.id, telegramIdentity.input);
      return res.json({ user, telegramUser: telegramIdentity.telegramUser });
    }),
  );
  router.patch(
    '/me/profile',
    asyncHandler(async (req, res) =>
      res.json(
        await service.updateProfile(getAuth(req).user.id, parseBody(profileUpdateSchema, req)),
      ),
    ),
  );
  return router;
}
