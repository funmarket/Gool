import type { RequestHandler } from 'express';
import type { RateLimitStore } from '../../infrastructure/rate-limit/rate-limit-store.js';

interface AuthenticatedRateLimitRequest {
  auth?: { user: { id: string } };
}

export function rateLimit(
  store: RateLimitStore,
  input: { windowMs: number; max: number; scope: string },
): RequestHandler {
  return async (req, res, next) => {
    try {
      const auth = (req as typeof req & AuthenticatedRateLimitRequest).auth;
      const identity = String(auth?.user.id || req.ip || 'anon');
      const hit = await store.increment(`${input.scope}:${identity}`, input.windowMs);

      res.setHeader('x-ratelimit-limit', String(input.max));
      res.setHeader('x-ratelimit-remaining', String(Math.max(0, input.max - hit.count)));

      if (hit.count > input.max) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests.',
            requestId: String(res.locals.requestId || 'unknown'),
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
