import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express, { type Request, type Response } from 'express';
import type { HoomaAuth } from '../apps/api/src/auth/better-auth.js';
import {
  hybridAuth,
  type AuthenticatedRequest,
} from '../apps/api/src/http/middleware/auth.js';
import type { IdentityService } from '../apps/api/src/modules/identity/application/identity.service.js';

const canonicalUser = {
  id: 'user-web-1',
  telegramUserId: null,
  username: null,
  firstName: null,
  lastName: null,
  photoUrl: null,
  languageCode: null,
  isPremium: false,
};

function fakeIdentity() {
  return {
    getIdentityUser(userId: string) {
      return Promise.resolve(userId === canonicalUser.id ? canonicalUser : null);
    },
  } as unknown as IdentityService;
}

function fakeAuth(sessionUserId: string | null, onSession?: () => void) {
  return {
    api: {
      getSession() {
        onSession?.();
        return Promise.resolve(
          sessionUserId
            ? {
                session: { id: 'session-1', userId: sessionUserId },
                user: { id: sessionUserId },
              }
            : null,
        );
      },
    },
  } as unknown as HoomaAuth;
}

async function withServer(
  auth: HoomaAuth,
  run: (baseUrl: string) => Promise<void>,
) {
  const app = express();
  app.use(hybridAuth(fakeIdentity(), auth, { optional: true }));
  app.get('/whoami', (req: Request, res: Response) => {
    const request = req as Partial<AuthenticatedRequest>;
    if (!request.auth) return res.json({ provider: 'guest', userId: null });
    return res.json({ provider: request.auth.provider, userId: request.auth.user.id });
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('valid Better Auth session resolves the canonical HOOMA User.id', async () => {
  await withServer(fakeAuth(canonicalUser.id), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/whoami`, {
      headers: { cookie: 'better-auth.session_token=opaque-session' },
    });
    const body = (await response.json()) as { provider: string; userId: string | null };

    assert.equal(response.status, 200);
    assert.deepEqual(body, { provider: 'session', userId: canonicalUser.id });
  });
});

test('missing web session remains Guest on optional-auth routes', async () => {
  await withServer(fakeAuth(null), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/whoami`);
    const body = (await response.json()) as { provider: string; userId: string | null };

    assert.equal(response.status, 200);
    assert.deepEqual(body, { provider: 'guest', userId: null });
  });
});

test('session for a missing canonical user fails closed', async () => {
  await withServer(fakeAuth('missing-user'), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/whoami`, {
      headers: { cookie: 'better-auth.session_token=opaque-session' },
    });
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_INVALID');
  });
});

test('supplied invalid Telegram Authorization never falls back to a web session', async () => {
  let sessionLookups = 0;
  await withServer(fakeAuth(canonicalUser.id, () => (sessionLookups += 1)), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/whoami`, {
      headers: {
        authorization: 'Bearer invalid-telegram-proof',
        cookie: 'better-auth.session_token=opaque-session',
      },
    });
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_INVALID');
    assert.equal(sessionLookups, 0);
  });
});
