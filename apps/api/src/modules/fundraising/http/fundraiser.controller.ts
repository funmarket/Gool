import { Router } from 'express';
import { contributionCreateSchema, fundraiserCreateSchema } from '@gool/contracts';
import type { FundraiserService } from '../application/fundraiser.service.js';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { getAuth } from '../../../http/middleware/auth.js';
import { parseBody } from '../../../http/middleware/parse.js';
import { AppError } from '../../../http/errors/app-error.js';

export function fundraiserRouter(service: FundraiserService) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const communityId =
        typeof req.query.communityId === 'string' ? req.query.communityId : undefined;
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      res.json(
        await service.list(getAuth(req).user.id, {
          ...(communityId !== undefined ? { communityId } : {}),
          ...(cursor !== undefined ? { cursor } : {}),
          ...(limit !== undefined ? { limit } : {}),
        }),
      );
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) =>
      res
        .status(201)
        .json(await service.create(getAuth(req).user.id, parseBody(fundraiserCreateSchema, req))),
    ),
  );

  router.post(
    '/:fundraiserId/contributions',
    asyncHandler(async (req, res) => {
      const input = parseBody(contributionCreateSchema, req);
      const idempotencyKey = req.header('idempotency-key');
      if (!idempotencyKey) {
        throw new AppError(
          400,
          'IDEMPOTENCY_KEY_REQUIRED',
          'Idempotency-Key is required for contributions.',
        );
      }
      res.status(201).json(
        await service.contributeCash(getAuth(req).user.id, String(req.params.fundraiserId), {
          amountMinor: input.amountMinor,
          anonymous: input.anonymous,
          ...(input.message !== undefined ? { message: input.message } : {}),
          idempotencyKey,
        }),
      );
    }),
  );

  return router;
}
