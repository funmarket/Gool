import assert from 'node:assert/strict';
import test from 'node:test';
import { IdentityService } from '../apps/api/src/modules/identity/application/identity.service.js';
import type {
  IdentityRepository,
  TelegramIdentityLinkResult,
} from '../apps/api/src/modules/identity/application/identity-repository.js';
import type {
  IdentityUser,
  TelegramIdentityInput,
} from '../apps/api/src/modules/identity/domain/types.js';

const identityUser: IdentityUser = {
  id: 'user-1',
  telegramUserId: '123456',
  username: 'hooma_user',
  firstName: 'Hooma',
  lastName: 'User',
  photoUrl: null,
  languageCode: 'en',
  isPremium: false,
};

const telegramIdentity: TelegramIdentityInput = {
  telegramUserId: '123456',
  username: 'hooma_user',
  firstName: 'Hooma',
};

function serviceWithLinkResult(result: TelegramIdentityLinkResult) {
  const repo = {
    upsertTelegramUser() {
      throw new Error('upsertTelegramUser should not be called by explicit link tests');
    },
    async linkTelegramIdentity() {
      return result;
    },
    getIdentityUser() {
      return Promise.resolve(null);
    },
    getMe() {
      return Promise.resolve(null);
    },
    updateProfile() {
      return Promise.resolve(null);
    },
  } satisfies IdentityRepository;

  return new IdentityService(repo);
}

test('links Telegram identity', async () => {
  const service = serviceWithLinkResult({ status: 'linked', user: identityUser });

  const user = await service.linkTelegramIdentity('user-1', telegramIdentity);

  assert.deepEqual(user, identityUser);
});

test('Telegram link is idempotent', async () => {
  const service = serviceWithLinkResult({ status: 'already-linked', user: identityUser });

  const user = await service.linkTelegramIdentity('user-1', telegramIdentity);

  assert.deepEqual(user, identityUser);
});

test('rejects replacing current user Telegram identity', async () => {
  const service = serviceWithLinkResult({ status: 'user-already-linked' });

  await assert.rejects(
    () => service.linkTelegramIdentity('user-1', telegramIdentity),
    (error: unknown) => {
      assert.equal((error as { status?: number }).status, 409);
      assert.equal(
        (error as { code?: string }).code,
        'USER_ALREADY_HAS_TELEGRAM_IDENTITY',
      );
      return true;
    },
  );
});

test('rejects Telegram identity owned by another user', async () => {
  const service = serviceWithLinkResult({ status: 'telegram-already-linked' });

  await assert.rejects(
    () => service.linkTelegramIdentity('user-1', telegramIdentity),
    (error: unknown) => {
      assert.equal((error as { status?: number }).status, 409);
      assert.equal((error as { code?: string }).code, 'TELEGRAM_IDENTITY_ALREADY_LINKED');
      return true;
    },
  );
});
