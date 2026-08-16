import { chatMessageSchema } from '@gool/contracts';
import { Router } from 'express';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { getAuth } from '../../../http/middleware/auth.js';
import { parseBody } from '../../../http/middleware/parse.js';
import type { ChatService } from '../application/chat.service.js';

export function chatRouter(service: ChatService) {
  const router = Router();

  router.get(
    '/events/:eventId',
    asyncHandler(async (req, res) => {
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      res.json(
        await service.list(getAuth(req).user.id, String(req.params.eventId), {
          ...(cursor !== undefined ? { cursor } : {}),
          ...(limit !== undefined ? { limit } : {}),
        }),
      );
    }),
  );

  router.post(
    '/events/:eventId',
    asyncHandler(async (req, res) => {
      const input = parseBody(chatMessageSchema, req);
      res
        .status(201)
        .json(await service.post(getAuth(req).user.id, String(req.params.eventId), input.body));
    }),
  );

  router.delete(
    '/events/:eventId/messages/:messageId',
    asyncHandler(async (req, res) =>
      res.json(
        await service.remove(
          getAuth(req).user.id,
          String(req.params.eventId),
          String(req.params.messageId),
        ),
      ),
    ),
  );

  return router;
}
