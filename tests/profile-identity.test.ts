import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  FOOTBALL_PERSONAS,
  getFootballPersona,
  isFootballPersonaAllowedForClub,
  normalizeProfileIdentityTypes,
  profileUpdateSchema,
  type FootballPersona,
} from '@hooma/contracts';

test('empty profile identity selection defaults to Ghost Rider', () => {
  assert.deepEqual(normalizeProfileIdentityTypes([]), ['GHOST_RIDER']);
  assert.deepEqual(normalizeProfileIdentityTypes(undefined), ['GHOST_RIDER']);
});

test('specific identities and Ghost Rider can coexist without duplicates', () => {
  assert.deepEqual(
    normalizeProfileIdentityTypes(['GHOST_RIDER', 'PLAYER', 'FAN', 'PLAYER']),
    ['PLAYER', 'FAN', 'GHOST_RIDER'],
  );
});

test('profile contract accepts all four identity types and an optional persona', () => {
  const parsed = profileUpdateSchema.parse({
    profileIdentityTypes: ['PLAYER', 'FAN', 'GAMER', 'GHOST_RIDER'],
    footballPersonaKey: 'en_baller',
  });

  assert.deepEqual(parsed.profileIdentityTypes, ['PLAYER', 'FAN', 'GAMER', 'GHOST_RIDER']);
  assert.equal(parsed.footballPersonaKey, 'en_baller');
});

test('Arabic football persona remains a cultural identity rather than a translated label', () => {
  const persona = getFootballPersona('ar_nems');
  assert.ok(persona);
  assert.equal(persona.locale, 'ar');
  assert.equal(persona.label, 'النمس');
  assert.equal(getFootballPersona(persona.key)?.label, 'النمس');
});

test('generic personas are independent from favorite club selection', () => {
  const persona = getFootballPersona('en_baller');
  assert.ok(persona);
  assert.equal(isFootballPersonaAllowedForClub(persona, null), true);
  assert.equal(isFootballPersonaAllowedForClub(persona, 'club-any'), true);
});

test('club-restricted persona validation uses canonical club ids', () => {
  const persona: FootballPersona = {
    key: 'test_club_persona',
    locale: 'en',
    emoji: '⚽',
    label: 'Club Persona',
    group: 'CLUB',
    allowedClubId: 'club-arsenal-canonical',
  };

  assert.equal(isFootballPersonaAllowedForClub(persona, 'club-arsenal-canonical'), true);
  assert.equal(isFootballPersonaAllowedForClub(persona, 'club-liverpool-canonical'), false);
});

test('persona catalog stores stable keys rather than rendered labels as identity', () => {
  assert.ok(FOOTBALL_PERSONAS.length > 0);
  for (const persona of FOOTBALL_PERSONAS) {
    assert.notEqual(persona.key, persona.label);
    assert.match(persona.key, /^[a-z0-9_]+$/);
  }
});

test('profile migration preserves Fan and maps neutral users to Ghost Rider', () => {
  const migration = readFileSync(
    'packages/database/prisma/migrations/20260820193000_profile_identity_and_persona/migration.sql',
    'utf8',
  );

  assert.match(migration, /WHEN "profileAudience" = 'FAN'/);
  assert.match(migration, /ARRAY\['FAN'\]/);
  assert.match(migration, /ARRAY\['GHOST_RIDER'\]/);
  assert.match(migration, /DROP COLUMN "profileAudience"/);
  assert.match(migration, /DROP TYPE "ProfileAudience"/);
});

test('profile identities remain separate from Coach and Platform Admin authority', () => {
  const platformAdmin = readFileSync(
    'apps/api/src/modules/platform-admin/application/platform-admin.service.ts',
    'utf8',
  );
  const communities = readFileSync(
    'apps/api/src/modules/communities/application/community.service.ts',
    'utf8',
  );

  assert.doesNotMatch(platformAdmin, /profileIdentityTypes|footballPersonaKey/);
  assert.doesNotMatch(communities, /profileIdentityTypes|footballPersonaKey/);
});
