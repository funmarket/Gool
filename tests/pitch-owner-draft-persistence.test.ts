import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pitchCreateSchema } from '@hooma/contracts';

const apiPath = new URL('../apps/miniapp/src/features/pitch/api.ts', import.meta.url);
const formPath = new URL(
  '../apps/miniapp/src/components/venue/PitchListingDraft.tsx',
  import.meta.url,
);
const controllerPath = new URL(
  '../apps/api/src/modules/pitch/http/pitch.controller.ts',
  import.meta.url,
);
const repositoryPath = new URL(
  '../apps/api/src/modules/pitch/infrastructure/prisma-pitch.repository.ts',
  import.meta.url,
);

test('Pitch draft contract allows a real account draft with only a valid name', () => {
  const result = pitchCreateSchema.parse({ name: 'My football pitch' });
  assert.equal(result.name, 'My football pitch');
});

test('Pitch owner draft reuses the existing create and owned-update routes', async () => {
  const [apiSource, formSource, controllerSource, repositorySource] = await Promise.all([
    readFile(apiPath, 'utf8'),
    readFile(formPath, 'utf8'),
    readFile(controllerPath, 'utf8'),
    readFile(repositoryPath, 'utf8'),
  ]);

  assert.match(apiSource, /post<PitchOwnerItem>\('\/api\/v1\/pitch', input\)/);
  assert.match(
    apiSource,
    /patch<PitchOwnerItem>\(`\/api\/v1\/pitch\/mine\/\$\{encodeURIComponent\(pitchId\)\}`, input\)/,
  );
  assert.match(controllerSource, /service\.create\(getAuth\(req\)\.user\.id/);
  assert.match(repositorySource, /this\.db\.pitchListing\.create\(/);
  assert.match(repositorySource, /status: 'DRAFT'/);
  assert.match(formSource, /createPitchDraft\(createRequest\(draft\)\)/);
  assert.match(formSource, /updatePitchDraft\(savedPitchId, updateRequest\(draft\)\)/);
  assert.match(formSource, /setSavedPitchId\(saved\.id\)/);
  assert.doesNotMatch(formSource, /localStorage/);
  assert.doesNotMatch(formSource, /hooma:pitch-listing-draft/);
});
