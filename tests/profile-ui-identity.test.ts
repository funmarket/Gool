import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const profilePage = readFileSync('apps/miniapp/src/pages/ProfilePage.tsx', 'utf8');
const morePage = readFileSync('apps/miniapp/src/pages/MorePage.tsx', 'utf8');
const profileApi = readFileSync('apps/miniapp/src/features/profile/api.ts', 'utf8');
const profileTypes = readFileSync('apps/miniapp/src/features/profile/types.ts', 'utf8');
const identityContracts = readFileSync('packages/contracts/src/identity.ts', 'utf8');
const identityRepository = readFileSync(
  'apps/api/src/modules/identity/infrastructure/prisma-identity.repository.ts',
  'utf8',
);
const errorHandler = readFileSync('apps/api/src/http/middleware/error-handler.ts', 'utf8');
const presentationSchema = readFileSync(
  'packages/database/prisma/profile-presentation.prisma',
  'utf8',
);

test('Profile UI exposes only self-selectable Player, Fan, and Gamer identities', () => {
  assert.match(profilePage, /value: 'PLAYER'/);
  assert.match(profilePage, /value: 'FAN'/);
  assert.match(profilePage, /value: 'GAMER'/);
  assert.doesNotMatch(profilePage, /value: 'ULTRAFAN'/);
  assert.doesNotMatch(profilePage, /value: 'GHOST_RIDER'/);
  assert.doesNotMatch(profilePage, /AUDIENCE_OPTIONS/);
  assert.doesNotMatch(profilePage, /profileAudience/);
});

test('Profile writes canonical selected identities instead of legacy audience', () => {
  assert.match(profilePage, /selectedIdentities,/);
  assert.match(profileApi, /profileUpdateSchema\.parse\(input\)/);
});

test('Player presentation and editing are conditional on Player identity', () => {
  assert.match(profilePage, /selectedIdentities\.includes\('PLAYER'\)/);
  assert.match(profilePage, /\{isPlayer \?/);
  assert.match(profilePage, /Player details/);
  assert.match(profilePage, /OVR/);
});

test('UltraFan and Ghost Rider remain effective identities, not user-selected identities', () => {
  assert.match(profileTypes, /\| 'ULTRAFAN'/);
  assert.match(profileTypes, /\| 'GHOST_RIDER'/);
  assert.match(profilePage, /current\.includes\('ULTRAFAN'\)/);
  assert.match(profilePage, /\['GHOST_RIDER'\]/);
  assert.match(profilePage, /cannot be selected manually/);
});

test('More exposes the multi-identity HOOMA profile instead of a player-only profile entry', () => {
  assert.match(morePage, /title="My HOOMA profile"/);
  assert.match(morePage, /Create or edit your HOOMA identity/);
  assert.doesNotMatch(morePage, /My player profile/);
  assert.match(morePage, /navigate\('\/profile'\)/);
});

test('HOOMA presentation keeps editable display name and photo without a competing username', () => {
  assert.match(profilePage, /HOOMA display name/);
  assert.match(profilePage, /HOOMA profile photo URL/);
  assert.doesNotMatch(profilePage, /HOOMA username/);
  assert.match(profilePage, /me\.presentation\?\.displayName/);
  assert.match(profilePage, /me\.presentation\?\.photoUrl/);
  assert.doesNotMatch(profilePage, /me\.presentation\?\.username/);
  assert.match(presentationSchema, /model UserProfilePresentation/);
  assert.match(identityRepository, /tx\.userProfilePresentation\.upsert/);
  assert.doesNotMatch(identityRepository, /displayUsername:/);
});

test('Profile update contract cannot create or replace a presentation username', () => {
  const profileUpdateBlock = identityContracts.match(
    /export const profileUpdateSchema = z\.object\(\{([\s\S]*?)\n\}\);/,
  );
  assert.ok(profileUpdateBlock);
  assert.doesNotMatch(profileUpdateBlock[1], /\busername\s*:/);
});

test('Telegram presentation remains fallback and is not silently captured as a HOOMA override', () => {
  assert.match(profilePage, /useState\(me\.presentation\?\.displayName \|\| ''\)/);
  assert.match(profilePage, /useState\(me\.presentation\?\.photoUrl \|\| ''\)/);
  assert.match(profilePage, /displayName\.trim\(\) \|\| telegramFallbackName\(me\)/);
  assert.match(profilePage, /photoUrl\.trim\(\) \|\| me\.photoUrl \|\| ''/);
  assert.match(profilePage, /const visibleUsername = me\.effectiveUsername \?\? ''/);
});

test('obsolete presentation username conflict mapping is removed', () => {
  assert.doesNotMatch(errorHandler, /PROFILE_USERNAME_TAKEN/);
  assert.doesNotMatch(errorHandler, /UserProfilePresentation/);
});

test('profile read model exposes one provider-owned effective username', () => {
  assert.match(identityRepository, /authUsername: true/);
  assert.match(identityRepository, /displayAuthUsername: true/);
  assert.match(
    identityRepository,
    /const effectiveUsername = displayAuthUsername \?\? authUsername \?\? base\.username \?\? null/,
  );
  assert.match(identityRepository, /effectiveUsername,/);
  assert.doesNotMatch(identityRepository, /displayUsername: true/);
  assert.doesNotMatch(identityRepository, /username: true,\n\s*displayUsername: true/);
});
