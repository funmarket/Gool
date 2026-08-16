import { Router } from 'express';
import { z } from 'zod';
import type { AdminService } from '../application/admin.service.js';
import type { AdminPaymentStatus } from '../application/admin-read.repository.js';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { getAuth } from '../../../http/middleware/auth.js';

const paymentStatuses = [
  'CREATED',
  'AWAITING_PAYMENT',
  'AWAITING_CASH',
  'PROCESSING',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
] as const satisfies readonly AdminPaymentStatus[];

const paymentQuerySchema = z.object({
  method: z.enum(['CASH', 'TELEGRAM_STARS']).optional(),
  status: z.enum(paymentStatuses).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const auditQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export function adminRouter(service: AdminService) {
  const router = Router();

  router.get(
    '/communities',
    asyncHandler(async (req, res) => res.json(await service.listManaged(getAuth(req).user.id))),
  );

  router.get(
    '/communities/:communityId/dashboard',
    asyncHandler(async (req, res) =>
      res.json(await service.dashboard(getAuth(req).user.id, String(req.params.communityId))),
    ),
  );

  router.get(
    '/communities/:communityId/payments',
    asyncHandler(async (req, res) => {
      const query = paymentQuerySchema.parse(req.query);
      res.json(
        await service.payments(getAuth(req).user.id, String(req.params.communityId), {
          ...(query.method !== undefined ? { method: query.method } : {}),
          ...(query.status !== undefined ? { status: query.status } : {}),
          ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
          ...(query.limit !== undefined ? { limit: query.limit } : {}),
        }),
      );
    }),
  );

  router.get(
    '/communities/:communityId/audit',
    asyncHandler(async (req, res) => {
      const query = auditQuerySchema.parse(req.query);
      res.json(
        await service.audit(getAuth(req).user.id, String(req.params.communityId), {
          ...(query.cursor !== undefined ? { cursor: query.cursor } : {}),
          ...(query.limit !== undefined ? { limit: query.limit } : {}),
        }),
      );
    }),
  );

  router.patch(
    '/communities/:communityId/members/:membershipId/ban',
    asyncHandler(async (req, res) =>
      res.json(
        await service.ban(
          getAuth(req).user.id,
          String(req.params.communityId),
          String(req.params.membershipId),
          String(res.locals.requestId),
        ),
      ),
    ),
  );

  router.delete(
    '/events/:eventId',
    asyncHandler(async (req, res) =>
      res.json(
        await service.cancelEvent(
          getAuth(req).user.id,
          String(req.params.eventId),
          String(res.locals.requestId),
        ),
      ),
    ),
  );

  return router;
}
