import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { format, resolveConfig } from 'prettier';
import type { DatabaseClient } from '../apps/api/src/infrastructure/database/prisma.js';
import { PrismaTeamRepository } from '../apps/api/src/modules/teams/infrastructure/prisma-team.repository.js';

const teamProfilePath = 'apps/miniapp/src/pages/TeamProfilePage.tsx';
const teamProfilePage = readFileSync(teamProfilePath, 'utf8');
const teamApi = readFileSync('apps/miniapp/src/features/teams/api.ts', 'utf8');

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

test('Team edit UI is gated by the managed Teams source and writes through the protected PATCH route', () => {
  assert.match(teamProfilePage, /queryFn: listManagedTeams/);
  assert.match(teamProfilePage, /managedTeamsQuery\.data\?\.items\.some/);
  assert.match(teamProfilePage, /Edit Team/);
  assert.match(teamProfilePage, /editing && canManage/);
  assert.match(teamApi, /patch<TeamDetailItem>\(`\/api\/v1\/teams\/\$\{teamId\}`/);
});

test('formatter probe for TeamProfilePage', async () => {
  const config = await resolveConfig(teamProfilePath);
  const formatted = await format(teamProfilePage, { ...config, filepath: teamProfilePath });
  console.log(`TEAM_PROFILE_FORMATTED_START\n${formatted}TEAM_PROFILE_FORMATTED_END`);
  assert.fail('TEAM_PROFILE_FORMATTER_PROBE');
});
