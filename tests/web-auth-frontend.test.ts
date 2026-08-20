import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const httpClient = fs.readFileSync('apps/miniapp/src/shared/api/http-client.ts', 'utf8');
const authProvider = fs.readFileSync('apps/miniapp/src/providers/AuthProvider.tsx', 'utf8');
const loginPage = fs.readFileSync('apps/miniapp/src/pages/LoginPage.tsx', 'utf8');
const communityProvider = fs.readFileSync(
  'apps/miniapp/src/providers/CommunityProvider.tsx',
  'utf8',
);
const appRoutes = fs.readFileSync('apps/miniapp/src/App.tsx', 'utf8');
const authServer = fs.readFileSync('apps/api/src/auth/better-auth.ts', 'utf8');

test('web API calls include Better Auth session credentials without replacing Telegram auth', () => {
  assert.match(httpClient, /credentials: requestOptions\.credentials \?\? 'include'/);
  assert.match(httpClient, /headers\.authorization = `tma \$\{raw\}`/);
});

test('frontend auth state keeps Telegram, web session, and Guest as distinct modes', () => {
  assert.match(authProvider, /'guest' \| 'telegram' \| 'session'/);
  assert.match(authProvider, /hasTelegramLaunchData\(\)/);
  assert.match(authProvider, /getWebSession\(\)/);
});

test('web login supports independent registration and email-or-username sign in', () => {
  assert.match(loginPage, /signUpWeb\(email, username, password\)/);
  assert.match(loginPage, /signInWeb\(identifier, password\)/);
  assert.match(loginPage, /safeReturnTo/);
});

test('guest providers and Profile route respect the auth boundary', () => {
  assert.match(communityProvider, /enabled: isAuthenticated/);
  assert.match(appRoutes, /path="\/login"/);
  assert.match(appRoutes, /<RequireAuth>/);
  assert.match(appRoutes, /<ProfilePage \/>/);
});

test('web signup initializes HOOMA profile rows and production cookie attributes', () => {
  assert.match(authServer, /databaseHooks:/);
  assert.match(authServer, /db\.playerProfile\.upsert/);
  assert.match(authServer, /db\.userPreference\.upsert/);
  assert.match(authServer, /sameSite: 'none'/);
  assert.match(authServer, /secure: true/);
  assert.match(authServer, /trustedOrigins: env\.APP_BASE_URL/);
});
