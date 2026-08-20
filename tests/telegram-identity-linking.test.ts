import assert from 'node:assert/strict';
import test from 'node:test';
import { IdentityService } from '../apps/api/src/modules/identity/application/identity.service.js';
import type {
  IdentityRepository,
  TelegramIdentityLinkResult,
  WebCredentialsLinkResult,
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

const webCredentials = {
  email: 'player@example.com',
  username: 'player11',
  password: 'correct-horse-battery-staple',
};

function baseRepo() {
  return {
    upsertTelegramUser() {
      throw new Error('upsertTelegramUser should not be called by explicit link tests');
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
  };
}

function serviceWithTelegramLinkResult(result: TelegramIdentityLinkResult) {
  const repo = {
    ...baseRepo(),
    async linkTelegramIdentity() {
      return result;
    },
    async linkWebCredentials() {
      throw new Error('linkWebCredentials should not be called by Telegram link tests');
    },
  } satisfies IdentityRepository;

  return new IdentityService(repo);
}

function serviceWithWebCredentialLinkResult(result: WebCredentialsLinkResult) {
  const repo = {
    ...baseRepo(),
    async linkTelegramIdentity() {
      throw new Error('linkTelegramIdentity should not be called by web credential link tests');
    },
    async linkWebCredentials() {
      return result;
    },
  } satisfies IdentityRepository;

  return new IdentityService(repo);
}

test('links Telegram identity', async () => {
  const service = serviceWithTelegramLinkResult({ status: 'linked', user: identityUser });

  const user = await service.linkTelegramIdentity('user-1', telegramIdentity);

  assert.deepEqual(user, identityUser);
});

test('Telegram link is idempotent', async () => {
  const service = serviceWithTelegramLinkResult({ status: 'already-linked', user: identityUser });

  const user = await service.linkTelegramIdentity('user-1', telegramIdentity);

  assert.deepEqual(user, identityUser);
});

test('rejects replacing current user Telegram identity', async () => {
  const service = serviceWithTelegramLinkResult({ status: 'user-already-linked' });

  await assert.rejects(
    () => service.linkTelegramIdentity('user-1', telegramIdentity),
    (error: unknown) => {
      assert.equal((error as { status?: number }).status, 409);
      assert.equal((error as { code?: string }).code, 'USER_ALREADY_HAS_TELEGRAM_IDENTITY');
      return true;
    },
  );
});

test('rejects Telegram identity owned by another user', async () => {
  const service = serviceWithTelegramLinkResult({ status: 'telegram-already-linked' });

  await assert.rejects(
    () => service.linkTelegramIdentity('user-1', telegramIdentity),
    (error: unknown) => {
      assert.equal((error as { status?: number }).status, 409);
      assert.equal((error as { code?: string }).code, 'TELEGRAM_IDENTITY_ALREADY_LINKED');
      return true;
    },
  );
});

test('links web credentials to the existing canonical Telegram user', async () => {
  const service = serviceWithWebCredentialLinkResult({ status: 'linked', user: identityUser });

  const user = await service.linkWebCredentials('user-1', webCredentials, 'hashed-password');

  assert.deepEqual(user, identityUser);
});

test('rejects adding a second credential account to the same user', async () => {
  const service = serviceWithWebCredentialLinkResult({ status: 'web-credentials-already-linked' });

  await assert.rejects(
    () => service.linkWebCredentials('user-1', webCredentials, 'hashed-password'),
    (error: unknown) => {
      assert.equal((error as { status?: number }).status, 409);
      assert.equal((error as { code?: string }).code, 'WEB_CREDENTIALS_ALREADY_LINKED');
      return true;
    },
  );
});

test('rejects email already owned by another canonical user', async () => {
  const service = serviceWithWebCredentialLinkResult({ status: 'email-already-linked' });

  await assert.rejects(
    () => service.linkWebCredentials('user-1', webCredentials, 'hashed-password'),
    (error: unknown) => {
      assert.equal((error as { status?: number }).status, 409);
      assert.equal((error as { code?: string }).code, 'EMAIL_ALREADY_LINKED');
      return true;
    },
  );
});

test('rejects login username already owned by another canonical user', async () => {
  const service = serviceWithWebCredentialLinkResult({ status: 'username-already-linked' });

  await assert.rejects(
    () => service.linkWebCredentials('user-1', webCredentials, 'hashed-password'),
    (error: unknown) => {
      assert.equal((error as { status?: number }).status, 409);
      assert.equal((error as { code?: string }).code, 'AUTH_USERNAME_ALREADY_LINKED');
      return true;
    },
  );
});
