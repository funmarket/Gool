import express from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import type { AppContainer } from './container.js';
import { env } from '../config/env.js';
import { requestId } from '../http/middleware/request-id.js';
import { errorHandler } from '../http/middleware/error-handler.js';
import { hybridAuth } from '../http/middleware/auth.js';
import { rateLimit } from '../http/middleware/rate-limit.js';
import { v1Router } from '../http/v1/router.js';
import { telegramWebhookRouter } from '../modules/payments/http/telegram-webhook.controller.js';

function corsOptions(): CorsOptions {
  if (env.NODE_ENV !== 'production') return { origin: true, credentials: true };

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!env.APP_BASE_URL) return callback(null, false);
      return callback(null, origin === env.APP_BASE_URL);
    },
  };
}

export function buildApp(container: AppContainer) {
  const app = express();
  app.disable('x-powered-by');
  app.set('json replacer', (_key: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
  app.use(helmet());
  app.use(cors(corsOptions()));

  // Express 5 catch-all. Better Auth must receive the raw request before JSON parsing.
  app.all('/api/auth/*splat', toNodeHandler(container.auth));

  app.use(express.json({ limit: '256kb' }));
  app.use(requestId);
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'hooma-api' }));
  app.use(
    '/webhooks/telegram',
    telegramWebhookRouter(container.services.payments, container.telegram),
  );
  app.use(
    '/api/v1',
    rateLimit(container.rateLimitStore, { scope: 'api', windowMs: 60_000, max: 180 }),
    hybridAuth(container.services.identity, container.auth, { optional: true }),
    v1Router(container),
  );
  app.use(errorHandler);
  return app;
}
