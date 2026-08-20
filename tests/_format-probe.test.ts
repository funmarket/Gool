import { readFileSync } from 'node:fs';
import test from 'node:test';
import { format } from 'prettier';

test('format probe', async () => {
  for (const path of [
    'apps/api/src/modules/teams/application/team.service.ts',
    'apps/api/src/modules/teams/domain/team-access.ts',
  ]) {
    const source = readFileSync(path, 'utf8');
    console.log(`FORMAT_PROBE:${path}\n${await format(source, { filepath: path })}\nEND_FORMAT_PROBE`);
  }
  throw new Error('FORMAT_PROBE_COMPLETE');
});
