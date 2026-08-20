import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  normalizeSelectedProfileIdentities,
  resolveEffectiveProfileIdentities,
} from '../apps/api/src/modules/identity/domain/profile-identities.ts';

test('selected identities have one stable canonical order', () => {
  assert.deepEqual(normalizeSelectedProfileIdentities(['GAMER', 'PLAYER', 'FAN']), [
    'PLAYER',
    'FAN',
    'GAMER',
  ]);
});

test('Ghost Rider is returned only when no specific identity is active', () => {
  assert.deepEqual(resolveEffectiveProfileIdentities([]), ['GHOST_RIDER']);
  assert.deepEqual(resolveEffectiveProfileIdentities(['FAN']), ['FAN']);
});

test('UltraFan is derived and keeps the canonical effective identity order', () => {
  assert.deepEqual(
    resolveEffectiveProfileIdentities(['GAMER', 'PLAYER', 'FAN'], {
      hasActiveUltrasMembership: true,
    }),
    ['PLAYER', 'FAN', 'ULTRAFAN', 'GAMER'],
  );
  assert.deepEqual(resolveEffectiveProfileIdentities([], { hasActiveUltrasMembership: true }), [
    'ULTRAFAN',
  ]);
});

test('me read and profile update responses use the same identity projector', () => {
  const repository = readFileSync(
    'apps/api/src/modules/identity/infrastructure/prisma-identity.repository.ts',
    'utf8',
  );

  assert.match(repository, /profileIdentities: \{ select: \{ type: true \} \}/);
  assert.match(repository, /async getMe\(userId: string\)[\s\S]*?return toMeView\(user\);/);
  assert.match(
    repository,
    /async updateProfile\(userId: string,[\s\S]*?select: meSelect,[\s\S]*?return toMeView\(user\);/,
  );
});
