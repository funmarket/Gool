import { runNpm } from './lib/run-npm.mjs';

const verificationSteps = [
  ['run', 'deploy:preflight'],
  ['ci'],
  ['run', 'architecture:check'],
  ['run', 'db:validate'],
  ['run', 'db:generate'],
  ['run', 'lint'],
  ['run', 'typecheck'],
  ['run', 'test'],
  ['run', 'format:check'],
  ['run', 'build'],
  ['run', 'security:check'],
];

for (const args of verificationSteps) runNpm(args);

// Database mutation happens only after all source/build/security gates are green.
runNpm(['run', 'db:migrate:deploy']);
runNpm(['run', 'db:migration:check']);
