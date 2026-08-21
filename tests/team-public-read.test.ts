import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { DatabaseClient } from '../apps/api/src/infrastructure/database/prisma.js';
import { PrismaTeamRepository } from '../apps/api/src/modules/teams/infrastructure/prisma-team.repository.js';

const teamProfilePage = readFileSync('apps/miniapp/src/pages/TeamProfilePage.tsx', 'utf8');
const teamApi = readFileSync('apps/miniapp/src/features/teams/api.ts', 'utf8');
const teamController = readFileSync(
  'apps/api/src/modules/teams/http/team.controller.ts',
  'utf8',
);
const teamService = readFileSync('apps/api/src/modules/teams/application/team.service.ts', 'utf8');

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
    select: {
      players: { take: number };
      lineups: { where: { isPublished: boolean; deletedAt: null } };
    };
  };

  assert.deepEqual(args.where, {
    id: 'team-1',
    status: 'ACTIVE',
    isPublic: true,
    deletedAt: null,
  });
  assert.equal(args.select.players.take, 8);
  assert.equal(args.select.lineups.where.isPublished, true);
  assert.equal(args.select.lineups.where.deletedAt, null);
});

test('managed Team read returns the complete active roster instead of the public eight-player preview', async () => {
  let findManyArgs: unknown;
  const db = {
    team: {
      findMany(args: unknown) {
        findManyArgs = args;
        return Promise.resolve([]);
      },
    },
  } as unknown as DatabaseClient;

  const repo = new PrismaTeamRepository(db);
  await repo.listManagedTeams('user-1');

  const args = findManyArgs as {
    select: {
      players: {
        take?: number;
        where: { isActive: boolean };
        select: { userId: boolean; isActive: boolean };
      };
    };
  };
  assert.equal(args.select.players.take, undefined);
  assert.equal(args.select.players.where.isActive, true);
  assert.equal(args.select.players.select.userId, true);
  assert.equal(args.select.players.select.isActive, true);
});

test('roster player update is scoped to the requested Team and active player', async () => {
  let updateArgs: unknown;
  const db = {
    teamPlayer: {
      updateMany(args: unknown) {
        updateArgs = args;
        return Promise.resolve({ count: 1 });
      },
      findFirstOrThrow() {
        return Promise.resolve({ id: 'player-1' });
      },
    },
  } as unknown as DatabaseClient;

  const repo = new PrismaTeamRepository(db);
  await repo.updatePlayer('team-1', 'player-1', { displayName: 'Updated Player' });

  const args = updateArgs as {
    where: { id: string; teamId: string; isActive: boolean };
    data: { displayName: string };
  };
  assert.deepEqual(args.where, { id: 'player-1', teamId: 'team-1', isActive: true });
  assert.equal(args.data.displayName, 'Updated Player');
});

test('roster removal is scoped to the Team and clears active lineup references', async () => {
  let playerUpdateArgs: unknown;
  let slotUpdateArgs: unknown;
  const tx = {
    teamPlayer: {
      updateMany(args: unknown) {
        playerUpdateArgs = args;
        return Promise.resolve({ count: 1 });
      },
      findFirstOrThrow() {
        return Promise.resolve({ id: 'player-1', isActive: false });
      },
    },
    teamLineupSlot: {
      updateMany(args: unknown) {
        slotUpdateArgs = args;
        return Promise.resolve({ count: 1 });
      },
    },
  };
  const db = {
    $transaction<T>(callback: (client: typeof tx) => Promise<T>) {
      return callback(tx);
    },
  } as unknown as DatabaseClient;

  const repo = new PrismaTeamRepository(db);
  await repo.deactivatePlayer('team-1', 'player-1');

  assert.deepEqual(
    (playerUpdateArgs as { where: unknown }).where,
    { id: 'player-1', teamId: 'team-1', isActive: true },
  );
  assert.deepEqual((slotUpdateArgs as { where: unknown }).where, {
    playerId: 'player-1',
    lineup: { teamId: 'team-1', deletedAt: null },
  });
  assert.deepEqual((slotUpdateArgs as { data: unknown }).data, { playerId: null });
});

test('Team edit UI is gated by the managed Teams source and writes through the protected PATCH route', () => {
  assert.match(teamProfilePage, /queryFn: listManagedTeams/);
  assert.match(teamProfilePage, /managedTeamsQuery\.data\?\.items\.find/);
  assert.match(teamProfilePage, /Edit Team/);
  assert.match(teamProfilePage, /editing && canManage/);
  assert.match(teamApi, /patch<TeamDetailItem>\(`\/api\/v1\/teams\/\$\{teamId\}`/);
});

test('authorized roster UI uses protected add edit and remove routes', () => {
  assert.match(teamProfilePage, /Add roster player/);
  assert.match(teamProfilePage, /Edit roster player/);
  assert.match(teamProfilePage, /removeTeamPlayer/);
  assert.match(teamApi, /post<TeamPlayerItem>\(`\/api\/v1\/teams\/\$\{teamId\}\/players`/);
  assert.match(
    teamApi,
    /patch<TeamPlayerItem>\(`\/api\/v1\/teams\/\$\{teamId\}\/players\/\$\{playerId\}`/,
  );
  assert.match(
    teamApi,
    /del<TeamPlayerItem>\(`\/api\/v1\/teams\/\$\{teamId\}\/players\/\$\{playerId\}`/,
  );
  assert.match(teamController, /router\.patch\([\s\S]*?\/:teamId\/players\/:playerId/);
  assert.match(teamController, /router\.delete\([\s\S]*?\/:teamId\/players\/:playerId/);
  assert.match(teamService, /updatePlayer[\s\S]*?'MANAGE_ROSTER'/);
  assert.match(teamService, /deactivatePlayer[\s\S]*?'MANAGE_ROSTER'/);
});
