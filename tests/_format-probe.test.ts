import { readFileSync } from 'node:fs';
import test from 'node:test';
import { format, resolveConfig } from 'prettier';

test('format probe', async () => {
  for (const path of [
    'apps/api/src/modules/teams/application/team.service.ts',
    'apps/api/src/modules/teams/domain/team-access.ts',
  ]) {
    const source = readFileSync(path, 'utf8');
    const config = (await resolveConfig(path)) ?? {};
    console.log(
      `FORMAT_PROBE:${path}\n${await format(source, { ...config, filepath: path })}\nEND_FORMAT_PROBE`,
    );
  }
  throw new Error('FORMAT_PROBE_COMPLETE');
});
