import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pitchPagePath = new URL('../apps/miniapp/src/pages/PitchPage.tsx', import.meta.url);
const pitchApiPath = new URL('../apps/miniapp/src/features/pitch/api.ts', import.meta.url);

test('Pitch public feed is wired to the real backend and rendered by PitchPage', async () => {
  const [pageSource, apiSource] = await Promise.all([
    readFile(pitchPagePath, 'utf8'),
    readFile(pitchApiPath, 'utf8'),
  ]);

  assert.match(apiSource, /\/api\/v1\/pitch\?/);
  assert.match(pageSource, /useQuery\(/);
  assert.match(pageSource, /listPublicPitches\(filters\)/);
  assert.match(pageSource, /pitches\.map\(\(pitch\) =>/);
  assert.match(pageSource, /<PitchCard/);
  assert.doesNotMatch(pageSource, /Real published venues will appear here/);
});
