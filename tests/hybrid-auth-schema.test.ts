import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const schema = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');
const authSource = fs.readFileSync('apps/api/src/auth/better-auth.ts', 'utf8');
const identityControllerSource = fs.readFileSync(
  'apps/api/src/modules/identity/http/identity.controller.ts',
  'utf8',
);
const identityRepositorySource = fs.readFileSync(
  'apps/api/src/modules/identity/infrastructure/prisma-identity.repository.ts',
  'utf8',
);

test('Better Auth extends canonical User instead of creating a duplicate auth user', () => {
  assert.match(schema, /model User \{/);
  assert.doesNotMatch(schema, /model (AuthUser|WebUser|TelegramUser) \{/);
  assert.match(schema, /authUsername\s+String\?/);
  assert.match(schema, /authSessions\s+AuthSession\[\]/);
  assert.match(schema, /authAccounts\s+AuthAccount\[\]/);
  assert.match(authSource, /modelName: 'User'/);
  assert.match(authSource, /emailAndPassword:\s*\{/);
  assert.doesNotMatch(authSource, /socialProviders/);
});

test('Telegram-first web credentials reuse Better Auth password and canonical account storage', () => {
  assert.match(identityControllerSource, /auth\.provider !== 'telegram'/);
  assert.match(identityControllerSource, /betterAuth\.\$context/);
  assert.match(identityControllerSource, /context\.password\.hash\(input\.password\)/);
  assert.match(identityRepositorySource, /providerId: 'credential'/);
  assert.match(identityRepositorySource, /accountId: userId/);
  assert.match(identityRepositorySource, /userId,/);
  assert.doesNotMatch(identityRepositorySource, /tx\.user\.create\(/);
});
