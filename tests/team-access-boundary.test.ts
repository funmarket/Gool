import assert from 'node:assert/strict';
import test from 'node:test';
import {
  legacyTeamRoleHasCapability,
  type LegacyTeamRole,
  type TeamCapability,
} from '../apps/api/src/modules/teams/domain/team-access.ts';

const capabilities: TeamCapability[] = [
  'CREATE_TEAM',
  'EDIT_TEAM',
  'MANAGE_ROSTER',
  'MANAGE_LINEUP',
  'CREATE_CHALLENGE',
];

test('legacy Team managers retain current capabilities during migration', () => {
  for (const role of ['OWNER', 'ADMIN'] satisfies LegacyTeamRole[]) {
    for (const capability of capabilities) {
      assert.equal(legacyTeamRoleHasCapability(role, capability), true);
    }
  }
});
