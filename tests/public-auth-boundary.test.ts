import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express, { type NextFunction, type Request, type Response } from 'express';
import { errorHandler } from '../apps/api/src/http/middleware/error-handler.js';
import {
  type AuthContext,
  type AuthenticatedRequest,
  telegramAuth,
} from '../apps/api/src/http/middleware/auth.js';
import type { IdentityService } from '../apps/api/src/modules/identity/application/identity.service.js';
import type { TeamService } from '../apps/api/src/modules/teams/application/team.service.js';
import { teamRouter } from '../apps/api/src/modules/teams/http/team.controller.js';

const fakeIdentity = {
  upsertTelegramUser() {
    throw new Error('Telegram identity should not be resolved for an anonymous request');
  },
} as unknown as IdentityService;

const fakeTeams = {
  listPublic() {
    return Promise.resolve({ items: [{ id: 'public-team', name: 'Public Team' }], nextCursor: null });
  },
  managedTeams(userId: string) {
    return Promise.resolve({ items: [{ id: 'managed-team', managerUserId: userId }] });
  },
} as unknown as TeamService;

const authenticatedContext: AuthContext = {
  user: {
    id: 'user-1',
    telegramUserId: '123456',
    username: 'hooma-user',
    firstName: 'Hooma',
    lastName: 'User',
    photoUrl: null,
    languageCode: 'en',
    isPremium: false,
  },
  telegramUser: { id: '123456', username: 'hooma-user' },
};

function requestId(_req: Request, res: Response, next: NextFunction) {
  res.locals.requestId = 'test-request';
  next();
}

function buildBoundaryApp(authenticated = false) {
  const app = express();
  app.use(express.json());
  app.use(requestId);

  if (authenticated) {
    app.use((req, _res, next) => {
      (req as AuthenticatedRequest).auth = authenticatedContext;
      next();
    });
  }

  app.use(telegramAuth(fakeIdentity, { optional: true }));
  app.use('/api/v1/teams', teamRouter(fakeTeams));
  app.use(errorHandler);
  return app;
}

async function withServer(
  app: ReturnType<typeof buildBoundaryApp>,
  run: (baseUrl: string) => Promise<void>,
) {
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

test('anonymous public Team read succeeds without Telegram credentials', async () => {
  await withServer(buildBoundaryApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/teams`);
    const body = (await response.json()) as { items: Array<{ id: string }> };

    assert.equal(response.status, 200);
    assert.equal(body.items[0]?.id, 'public-team');
  });
});

test('anonymous protected Team management route returns AUTH_REQUIRED', async () => {
  await withServer(buildBoundaryApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/teams/managed`);
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_REQUIRED');
  });
});

test('authenticated Team management request preserves existing behavior', async () => {
  await withServer(buildBoundaryApp(true), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/teams/managed`);
    const body = (await response.json()) as {
      items: Array<{ id: string; managerUserId: string }>;
    };

    assert.equal(response.status, 200);
    assert.deepEqual(body.items[0], { id: 'managed-team', managerUserId: 'user-1' });
  });
});

test('optional authentication does not downgrade supplied invalid credentials to Guest', async () => {
  await withServer(buildBoundaryApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/teams`, {
      headers: { authorization: 'Bearer not-a-hooma-session' },
    });
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_INVALID');
  });
});
