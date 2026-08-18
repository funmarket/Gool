import { Router } from 'express';
import {
  cashConfirmSchema,
  cashVoidSchema,
  starsProductConfigureSchema,
  starsPurchaseSchema,
  starsRefundSchema,
} from '@hooma/contracts';
import type { PaymentService } from '../application/payment.service.js';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { parseBody } from '../../../http/middleware/parse.js';
import { getAuth } from '../../../http/middleware/auth.js';
import { AppError } from '../../../http/errors/app-error.js';

export function paymentRouter(service: PaymentService) {
  const router = Router();

  router.get(
    '/digital/products',
    asyncHandler(async (req, res) => {
      const communityId = String(req.query.communityId || '');
      if (!communityId) {
        throw new AppError(400, 'COMMUNITY_ID_REQUIRED', 'communityId is required.');
      }
      res.json(await service.listDigitalProducts(getAuth(req).user.id, communityId));
    }),
  );

  router.put(
    '/digital/products/supporter-badge',
    asyncHandler(async (req, res) => {
      const input = parseBody(starsProductConfigureSchema, req);
      res.json(
        await service.configureSupporterBadge({
          actorUserId: getAuth(req).user.id,
          communityId: input.communityId,
          starsAmount: input.starsAmount,
          active: input.active,
        }),
      );
    }),
  );

  router.post(
    '/digital/stars',
    asyncHandler(async (req, res) => {
      const input = parseBody(starsPurchaseSchema, req);
      const key = req.header('idempotency-key')?.trim();
      if (!key) {
        throw new AppError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key is required.');
      }
      if (key.length > 180) {
        throw new AppError(
          400,
          'IDEMPOTENCY_KEY_INVALID',
          'Idempotency-Key must be 180 characters or fewer.',
        );
      }
      res.status(201).json(
        await service.createStarsInvoice({
          userId: getAuth(req).user.id,
          communityId: input.communityId,
          sku: input.sku,
          idempotencyKey: key,
        }),
      );
    }),
  );

  router.get(
    '/:paymentIntentId',
    asyncHandler(async (req, res) => {
      const payment = await service.getForUser(
        String(req.params.paymentIntentId),
        getAuth(req).user.id,
      );
      if (!payment) throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
      res.json(payment);
    }),
  );

  router.post(
    '/:paymentIntentId/cancel',
    asyncHandler(async (req, res) => {
      res.json(
        await service.cancelForUser(
          String(req.params.paymentIntentId),
          getAuth(req).user.id,
          String(res.locals.requestId),
        ),
      );
    }),
  );

  router.post(
    '/:paymentIntentId/cash/confirm',
    asyncHandler(async (req, res) => {
      const input = parseBody(cashConfirmSchema, req);
      res.json(
        await service.confirmCash({
          paymentIntentId: String(req.params.paymentIntentId),
          actorUserId: getAuth(req).user.id,
          ...(input.note !== undefined ? { note: input.note } : {}),
          requestId: String(res.locals.requestId),
        }),
      );
    }),
  );

  router.post(
    '/:paymentIntentId/cash/void',
    asyncHandler(async (req, res) => {
      const input = parseBody(cashVoidSchema, req);
      res.json(
        await service.voidCash({
          paymentIntentId: String(req.params.paymentIntentId),
          actorUserId: getAuth(req).user.id,
          reason: input.reason,
          requestId: String(res.locals.requestId),
        }),
      );
    }),
  );

  router.post(
    '/:paymentIntentId/stars/refund',
    asyncHandler(async (req, res) => {
      const input = parseBody(starsRefundSchema, req);
      res.json(
        await service.refundStars({
          paymentIntentId: String(req.params.paymentIntentId),
          actorUserId: getAuth(req).user.id,
          reason: input.reason,
          requestId: String(res.locals.requestId),
        }),
      );
    }),
  );

  return router;
}
