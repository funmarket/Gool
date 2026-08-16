import { checkInSchema, fanHubCreateSchema, venueDealCreateSchema } from '@gool/contracts';
import { Router } from 'express';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { getAuth } from '../../../http/middleware/auth.js';
import { parseBody } from '../../../http/middleware/parse.js';
import type { WatchService } from '../application/watch.service.js';

export function watchRouter(service: WatchService) {
  const router = Router();

  router.get(
    '/clubs',
    asyncHandler(async (req, res) => {
      const countryCode =
        typeof req.query.countryCode === 'string' ? req.query.countryCode : undefined;
      const query = typeof req.query.q === 'string' ? req.query.q : undefined;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      res.json(
        await service.listClubs({
          ...(countryCode !== undefined ? { countryCode } : {}),
          ...(query !== undefined ? { query } : {}),
          ...(limit !== undefined ? { limit } : {}),
        }),
      );
    }),
  );

  router.get(
    '/hubs',
    asyncHandler(async (req, res) => {
      const communityId =
        typeof req.query.communityId === 'string' ? req.query.communityId : undefined;
      const clubId = typeof req.query.clubId === 'string' ? req.query.clubId : undefined;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      res.json(
        await service.listHubs(getAuth(req).user.id, {
          ...(communityId !== undefined ? { communityId } : {}),
          ...(clubId !== undefined ? { clubId } : {}),
          ...(limit !== undefined ? { limit } : {}),
        }),
      );
    }),
  );

  router.post(
    '/hubs',
    asyncHandler(async (req, res) =>
      res
        .status(201)
        .json(await service.createHub(getAuth(req).user.id, parseBody(fanHubCreateSchema, req))),
    ),
  );

  router.post(
    '/events/:eventId/check-in',
    asyncHandler(async (req, res) =>
      res.json(
        await service.checkIn(
          getAuth(req).user.id,
          String(req.params.eventId),
          parseBody(checkInSchema, req),
        ),
      ),
    ),
  );

  router.get(
    '/events/:eventId/deals',
    asyncHandler(async (req, res) =>
      res.json(await service.listDeals(getAuth(req).user.id, String(req.params.eventId))),
    ),
  );

  router.post(
    '/deals',
    asyncHandler(async (req, res) =>
      res
        .status(201)
        .json(
          await service.createDeal(getAuth(req).user.id, parseBody(venueDealCreateSchema, req)),
        ),
    ),
  );

  return router;
}
