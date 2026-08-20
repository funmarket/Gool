import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { profileUpdateSchema } from '../packages/contracts/src/identity.ts';

const schema = readFileSync('packages/database/prisma/schema.prisma', 'utf8');
const migration = readFileSync(
  'packages/database/prisma/migrations/20260820213000_add_profile_identities/migration.sql',
  'utf8',
);
const repository = readFileSync(
  'apps/api/src/modules/identity/infrastructure/prisma-identity.repository.ts',
  'utf8',
);

test('selected profile identities are limited to Player, Fan, and Gamer', () => {
  const parsed = profileUpdateSchema.parse({
    selectedIdentities: ['PLAYER', 'FAN', 'GAMER'],
  });
  assert.deepEqual(parsed.selectedIdentities, ['PLAYER', 'FAN', 'GAMER']);

  assert.throws(() => profileUpdateSchema.parse({ selectedIdentities: ['ULTRAFAN'] }));
  assert.throws(() => profileUpdateSchema.parse({ selectedIdentities: ['GHOST_RIDER'] }));
  assert.throws(() => profileUpdateSchema.parse({ selectedIdentities: ['FAN', 'FAN'] }));
});

test('profile identity persistence is canonical and scoped to User', () => {
  assert.match(schema, /enum ProfileIdentityType \{\s+PLAYER\s+FAN\s+GAMER\s+\}/);
  assert.match(schema, /model UserProfileIdentity \{/);
  assert.match(schema, /@@id\(\[userId, type\]\)/);
  assert.match(
    schema,
    /user User @relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/,
  );
});

test('legacy Fan is backfilled while Spectator remains the Ghost Rider fallback', () => {
  assert.match(migration, /WHERE "profileAudience" = 'FAN'/);
  assert.doesNotMatch(migration, /'SPECTATOR'::"ProfileIdentityType"/);
  assert.doesNotMatch(migration, /'GHOST_RIDER'::"ProfileIdentityType"/);
});

test('legacy profile audience writes stay synchronized during transition', () => {
  assert.match(repository, /profile\.profileAudience === 'FAN'/);
  assert.match(repository, /type: 'FAN'/);
  assert.match(repository, /deleteMany\(\{ where: \{ userId, type: 'FAN' \} \}\)/);
});
