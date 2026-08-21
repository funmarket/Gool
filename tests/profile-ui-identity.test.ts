import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import prettier from 'prettier';

const profilePage = readFileSync('apps/miniapp/src/pages/ProfilePage.tsx', 'utf8');
const identityContract = readFileSync('packages/contracts/src/identity.ts', 'utf8');
const morePage = readFileSync('apps/miniapp/src/pages/MorePage.tsx', 'utf8');
const profileApi = readFileSync('apps/miniapp/src/features/profile/api.ts', 'utf8');
const profileTypes = readFileSync('apps/miniapp/src/features/profile/types.ts', 'utf8');
const identityRepository = readFileSync(
  'apps/api/src/modules/identity/infrastructure/prisma-identity.repository.ts',
  'utf8',
);
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

test('HOOMA presentation is editable and stored separately from Telegram identity metadata', () => {
  assert.match(profilePage, /HOOMA display name/);
  assert.match(profilePage, /HOOMA username/);
  assert.match(profilePage, /HOOMA profile photo URL/);
  assert.match(profilePage, /me\.presentation\?\.displayName/);
  assert.match(profilePage, /me\.presentation\?\.username/);
  assert.match(profilePage, /me\.presentation\?\.photoUrl/);
  assert.match(presentationSchema, /model UserProfilePresentation/);
  assert.match(identityRepository, /tx\.userProfilePresentation\.upsert/);
  assert.doesNotMatch(identityRepository, /data: \{ photoUrl \}/);
});

test('formatter diagnostic for profile ownership files', async () => {
  const options = {
    singleQuote: true,
    semi: true,
    trailingComma: 'all' as const,
    printWidth: 100,
  };
  console.log('PROFILE_FORMATTED_START');
  console.log(await prettier.format(profilePage, { ...options, parser: 'typescript' }));
  console.log('PROFILE_FORMATTED_END');
  console.log('IDENTITY_FORMATTED_START');
  console.log(await prettier.format(identityContract, { ...options, parser: 'typescript' }));
  console.log('IDENTITY_FORMATTED_END');
  assert.fail('PROFILE_FORMATTER_DIAGNOSTIC');
});
