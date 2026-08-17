import { Router } from 'express';
import { formationSaveSchema } from '@hooma/contracts';
import type { PlayService } from '../application/play.service.js';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { getAuth } from '../../../http/middleware/auth.js';
import { parseBody } from '../../../http/middleware/parse.js';
export function playRouter(service: PlayService) {
  const r = Router();
  r.get(
    '/events/:eventId/teams/randomize',
    asyncHandler(async (req, res) =>
      res.json(await service.randomize(getAuth(req).user.id, String(req.params.eventId))),
    ),
  );
  r.get(
    '/events/:eventId/formations',
    asyncHandler(async (req, res) =>
      res.json(await service.listFormations(getAuth(req).user.id, String(req.params.eventId))),
    ),
  );
  r.post(
    '/events/:eventId/formations',
    asyncHandler(async (req, res) =>
      res
        .status(201)
        .json(
          await service.createFormation(
            getAuth(req).user.id,
            String(req.params.eventId),
            parseBody(formationSaveSchema, req),
          ),
        ),
    ),
  );
  r.put(
    '/events/:eventId/formations/:formationId',
    asyncHandler(async (req, res) =>
      res.json(
        await service.updateFormation(
          getAuth(req).user.id,
          String(req.params.eventId),
          String(req.params.formationId),
          parseBody(formationSaveSchema, req),
        ),
      ),
    ),
  );
  r.post(
    '/events/:eventId/formations/:formationId/publish',
    asyncHandler(async (req, res) =>
      res.json(
        await service.publishFormation(
          getAuth(req).user.id,
          String(req.params.eventId),
          String(req.params.formationId),
        ),
      ),
    ),
  );
  return r;
}
