import assert from 'node:assert/strict';
import test from 'node:test';
import type { DatabaseClient } from '../apps/api/src/infrastructure/database/prisma.js';
import { PrismaTeamRepository } from '../apps/api/src/modules/teams/infrastructure/prisma-team.repository.js';

test('public Team detail only selects published lineups', async () => {
  let findFirstArgs: unknown;
  const db = {
    team: {
      findFirst(args: unknown) {
        findFirstArgs = args;
        return Promise.resolve(null);
      },
    },
  } as unknown as DatabaseClient;

  const repo = new PrismaTeamRepository(db);
  await repo.getPublic('team-1');

  const args = findFirstArgs as {
    where: { id: string; status: string; isPublic: boolean; deletedAt: null };
    select: { lineups: { where: { isPublished: boolean; deletedAt: null } } };
  };

  assert.deepEqual(args.where, {
    id: 'team-1',
    status: 'ACTIVE',
    isPublic: true,
    deletedAt: null,
  });
  assert.equal(args.select.lineups.where.isPublished, true);
  assert.equal(args.select.lineups.where.deletedAt, null);
});
