import { Router } from 'express';
import type { PaymentService } from '../application/payment.service.js';
import type { TelegramBotApi } from '../application/telegram-bot-api.js';
import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { env } from '../../../config/env.js';
import { hashWebhookPayload } from '../infrastructure/prisma-payment.repository.js';

interface TelegramUpdate {
  update_id: number;
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  message?: {
    from?: { id: number };
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
      provider_payment_charge_id?: string;
    };
  };
}

export function telegramWebhookRouter(service: PaymentService, telegram: TelegramBotApi) {
  const router = Router();
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      if (req.header('x-telegram-bot-api-secret-token') !== env.TELEGRAM_WEBHOOK_SECRET) {
        return res.status(401).json({ ok: false });
      }
      const update = req.body as TelegramUpdate;
      const pre = update.pre_checkout_query;
      if (pre) {
        const result =
          pre.currency === 'XTR'
            ? await service.validateStarsPreCheckout({
                payload: pre.invoice_payload,
                totalAmount: pre.total_amount,
                telegramUserId: String(pre.from.id),
              })
            : { valid: false };
        await telegram.answerPreCheckoutQuery(
          pre.id,
          result.valid,
          result.valid ? undefined : 'This GOOL Stars invoice is no longer valid.',
        );
        return res.json({ ok: true });
      }
      const successful = update.message?.successful_payment;
      const telegramUserId = update.message?.from?.id;
      if (successful && telegramUserId && successful.currency === 'XTR') {
        await service.settleStars({
          invoicePayload: successful.invoice_payload,
          totalAmount: successful.total_amount,
          telegramPaymentChargeId: successful.telegram_payment_charge_id,
          ...(successful.provider_payment_charge_id !== undefined
            ? { providerPaymentChargeId: successful.provider_payment_charge_id }
            : {}),
          telegramUserId: String(telegramUserId),
          updateId: String(update.update_id),
          payloadHash: hashWebhookPayload(update),
          requestId: String(res.locals.requestId),
        });
      }
      return res.json({ ok: true });
    }),
  );
  return router;
}
