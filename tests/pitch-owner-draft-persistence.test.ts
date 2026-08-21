import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiPath = new URL('../apps/miniapp/src/features/pitch/api.ts', import.meta.url);
const formPath = new URL('../apps/miniapp/src/components/venue/PitchListingDraft.tsx', import.meta.url);

test('Pitch owner draft uses real API persistence instead of localStorage', async () => {
  const [apiSource, formSource] = await Promise.all([
    readFile(apiPath, 'utf8'),
    readFile(formPath, 'utf8'),
  ]);

  assert.match(apiSource, /post<PitchOwnerItem>\('\/api\/v1\/pitch'/);
  assert.match(apiSource, /patch<PitchOwnerItem>\(`\/api\/v1\/pitch\/mine\/\$\{encodeURIComponent\(pitchId\)\}`/);
  assert.match(formSource, /createPitchDraft\(createRequest\(draft\)\)/);
  assert.match(formSource, /updatePitchDraft\(savedPitchId, updateRequest\(draft\)\)/);
  assert.match(formSource, /Save for later/);
  assert.doesNotMatch(formSource, /localStorage/);
  assert.doesNotMatch(formSource, /hooma:pitch-listing-draft/);
});

test('Pitch owner draft includes canonical publication fields without requiring them to save a draft', async () => {
  const source = await readFile(formPath, 'utf8');

  assert.match(source, /venueType: PitchVenueType \| ''/);
  assert.match(source, /Description/);
  assert.match(source, /Venue type/);
  assert.match(source, /disabled=\{draft\.name\.trim\(\)\.length < 2 \|\| saveDraft\.isPending\}/);
});
