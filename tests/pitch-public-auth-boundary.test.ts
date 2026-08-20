import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express, { type NextFunction, type Request, type Response } from 'express';
import { errorHandler } from '../apps/api/src/http/middleware/error-handler.js';
import { telegramAuth } from '../apps/api/src/http/middleware/auth.js';
import type { IdentityService } from '../apps/api/src/modules/identity/application/identity.service.js';
import type { PitchService } from '../apps/api/src/modules/pitch/application/pitch.service.js';
import { pitchRouter } from '../apps/api/src/modules/pitch/http/pitch.controller.js';

const fakeIdentity = {
  upsertTelegramUser() {
    throw new Error('Telegram identity should not be resolved for an anonymous request');
  },
} as unknown as IdentityService;

const fakePitch = {
  listPublic() {
    return Promise.resolve({ items: [], nextCursor: null });
  },
  getPublic(pitchId: string) {
    return Promise.resolve({
      id: pitchId,
      name: 'Public Pitch',
      description: null,
      photoUrl: 'https://example.com/pitch.jpg',
      venueType: 'FOOTBALL_PITCH',
      city: 'Tunis',
      houma: 'Centre',
      fullAddress: '1 Football Road',
      latitude: null,
      longitude: null,
      hourlyRateMinor: 6000,
      currency: 'TND',
      publicPhone: '+21600000000',
      publicEmail: null,
      status: 'PUBLISHED',
      submittedAt: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
} as unknown as PitchService;

function requestId(_req: Request, res: Response, next: NextFunction) {
  res.locals.requestId = 'pitch-public-test';
  next();
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use(telegramAuth(fakeIdentity, { optional: true }));
  app.use('/api/v1/pitch', pitchRouter(fakePitch));
  app.use(errorHandler);
  return app;
}

async function withServer(app: ReturnType<typeof buildApp>, run: (baseUrl: string) => Promise<void>) {
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

test('anonymous public Pitch detail succeeds without Telegram credentials', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/pitch/public-pitch`);
    const body = (await response.json()) as { id: string; status: string };

    assert.equal(response.status, 200);
    assert.equal(body.id, 'public-pitch');
    assert.equal(body.status, 'PUBLISHED');
  });
});

test('anonymous Pitch owner routes remain protected', async () => {
  await withServer(buildApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/pitch/mine`);
    const body = (await response.json()) as { error: { code: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTH_REQUIRED');
  });
});
