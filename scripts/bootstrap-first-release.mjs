import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { runNpm } from './lib/run-npm.mjs';

for (const name of ['DATABASE_URL', 'DIRECT_DATABASE_URL']) {
  if (!process.env[name]) {
    throw new Error(`${name} is required.`);
  }
}

const migrationRoot = join(process.cwd(), 'packages/database/prisma/migrations');
const hasInitialMigration =
  existsSync(migrationRoot) &&
  readdirSync(migrationRoot, { withFileTypes: true }).some(
    (entry) => entry.isDirectory() && existsSync(join(migrationRoot, entry.name, 'migration.sql')),
  );

runNpm(['ci']);
runNpm(['run', 'db:generate']);
if (hasInitialMigration) {
  console.log('Initial migration already exists; validating the committed migration chain.');
} else {
  runNpm(['run', 'db:migrate', '--', '--name', 'init']);
}
runNpm(['run', 'release:check']);

console.log('First-release bootstrap passed. Review and commit the generated Prisma migration.');
