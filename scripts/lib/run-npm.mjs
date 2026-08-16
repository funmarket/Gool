import { spawnSync } from 'node:child_process';
import process from 'node:process';

export function runNpm(args) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  const displayCommand = `npm ${args.join(' ')}`;

  if (result.error) {
    throw new Error(`Failed to start ${displayCommand}.`, { cause: result.error });
  }
  if (result.status !== 0) {
    throw new Error(`${displayCommand} exited with code ${result.status ?? 'unknown'}.`);
  }
}
