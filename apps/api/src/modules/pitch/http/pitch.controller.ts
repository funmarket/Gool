import {
  pitchCreateSchema,
  pitchListQuerySchema,
  pitchOwnerListQuerySchema,
  pitchUpdateSchema,
} from '@hooma/contracts';
import { Router } from 'express';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { AppError } from '../../../http/errors/app-error.js';
import { getAuth } from '../../../http/middleware/auth.js';
import { parseBody } from '../../../http/middleware/parse.js';
import type { PitchService } from '../application/pitch.service.js';

function idempotencyKey(req: Parameters<ReturnType<typeof Router>['post']>[1] extends never ? never : never) {
  void req;
  return undefined;
}

export function pitchRouter(service: PitchService) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await service.listPublic(pitchListQuerySchema.parse(req.query)));
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const rawIdempotencyKey = req.header('idempotency-key')?.trim();
      if (rawIdempotencyKey && rawIdempotencyKey.length > 160) {
        throw new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency key is too long.');
      }
      res
        .status(201)
        .json(
          await service.create(
            getAuth(req).user.id,
            parseBody(pitchCreateSchema, req),
            rawIdempotencyKey || undefined,
          ),
        );
    }),
  );

  router.get(
    '/mine',
    asyncHandler(async (req, res) => {
      res.json(
        await service.listOwned(getAuth(req).user.id, pitchOwnerListQuerySchema.parse(req.query)),
      );
    }),
  );

  router.get(
    '/mine/:pitchId',
    asyncHandler(async (req, res) => {
      res.json(await service.getOwned(getAuth(req).user.id, String(req.params.pitchId)));
    }),
  );

  router.patch(
    '/mine/:pitchId',
    asyncHandler(async (req, res) => {
      res.json(
        await service.update(
          getAuth(req).user.id,
          String(req.params.pitchId),
          parseBody(pitchUpdateSchema, req),
        ),
      );
    }),
  );

  router.post(
    '/mine/:pitchId/submit',
    asyncHandler(async (req, res) => {
      res.json(await service.submit(getAuth(req).user.id, String(req.params.pitchId)));
    }),
  );

  router.post(
    '/mine/:pitchId/deactivate',
    asyncHandler(async (req, res) => {
      res.json(await service.deactivate(getAuth(req).user.id, String(req.params.pitchId)));
    }),
  );

  router.post(
    '/mine/:pitchId/reactivate',
    asyncHandler(async (req, res) => {
      res.json(await service.reactivate(getAuth(req).user.id, String(req.params.pitchId)));
    }),
  );

  router.get(
    '/:pitchId',
    asyncHandler(async (req, res) => {
      res.json(await service.getPublic(String(req.params.pitchId)));
    }),
  );

  return router;
}
