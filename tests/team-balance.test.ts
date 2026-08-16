import assert from 'node:assert/strict';
import test from 'node:test';
import { balanceTeams } from '../apps/api/src/modules/play/domain/team-balance.js';

const players = [
  { id: 'p1', name: 'A', rating: 95, preferredPositions: ['ST'] },
  { id: 'p2', name: 'B', rating: 90, preferredPositions: ['CM'] },
  { id: 'p3', name: 'C', rating: 80, preferredPositions: ['GK'] },
  { id: 'p4', name: 'D', rating: 75, preferredPositions: ['CB'] },
  { id: 'p5', name: 'E', rating: 60, preferredPositions: ['W'] },
  { id: 'p6', name: 'F', rating: 55, preferredPositions: ['FB'] },
];

test('team balancing assigns every player exactly once', () => {
  const teams = balanceTeams(players, 2);
  const assigned = teams.flatMap((team) => team.players.map((player) => player.id));
  assert.equal(assigned.length, players.length);
  assert.deepEqual([...assigned].sort(), players.map((player) => player.id).sort());
});

test('team balancing keeps team sizes within one player', () => {
  const teams = balanceTeams(players.slice(0, 5), 2);
  assert.ok(Math.abs(teams[0]!.players.length - teams[1]!.players.length) <= 1);
});

test('team balancing distributes duplicate primary positions across teams', () => {
  const duplicatePositions = [
    { id: 'gk-1', name: 'Keeper One', rating: 95, preferredPositions: ['GK'] },
    { id: 'st-1', name: 'Striker', rating: 90, preferredPositions: ['ST'] },
    { id: 'cb-1', name: 'Defender', rating: 80, preferredPositions: ['CB'] },
    { id: 'gk-2', name: 'Keeper Two', rating: 75, preferredPositions: ['GK'] },
  ];

  const teams = balanceTeams(duplicatePositions, 2);
  const goalkeeperCounts = teams.map(
    (team) => team.players.filter((player) => player.preferredPositions[0] === 'GK').length,
  );

  assert.deepEqual(goalkeeperCounts, [1, 1]);
  assert.deepEqual(
    teams.map((team) => team.players.length),
    [2, 2],
  );
});

test('team balancing keeps flexible players position-neutral', () => {
  const flexiblePlayers = [
    { id: 'a', name: 'A', rating: 90, preferredPositions: [] },
    { id: 'b', name: 'B', rating: 80, preferredPositions: ['ANY'] },
    { id: 'c', name: 'C', rating: 70, preferredPositions: [] },
    { id: 'd', name: 'D', rating: 60, preferredPositions: ['ANY'] },
  ];

  const teams = balanceTeams(flexiblePlayers, 2);
  assert.deepEqual(
    teams.map((team) => team.players.length),
    [2, 2],
  );
});

test('team balancing is deterministic even when tied input order changes', () => {
  const tiedPlayers = [
    { id: 'd', name: 'D', rating: 50, preferredPositions: ['GK'] },
    { id: 'b', name: 'B', rating: 50, preferredPositions: ['GK'] },
    { id: 'c', name: 'C', rating: 50, preferredPositions: ['ST'] },
    { id: 'a', name: 'A', rating: 50, preferredPositions: ['ST'] },
  ];

  const first = balanceTeams(tiedPlayers, 2).map((team) => team.players.map((player) => player.id));
  const second = balanceTeams([...tiedPlayers].reverse(), 2).map((team) =>
    team.players.map((player) => player.id),
  );

  assert.deepEqual(first, second);
});

test('team balancing does not leak internal position counters in the API result', () => {
  const [team] = balanceTeams(players, 2);
  assert.ok(team);
  assert.equal('positionCounts' in team, false);
});
