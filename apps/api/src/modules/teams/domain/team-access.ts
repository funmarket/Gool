export type LegacyTeamRole = 'OWNER' | 'ADMIN';

export type TeamCapability =
  'CREATE_TEAM' | 'EDIT_TEAM' | 'MANAGE_ROSTER' | 'MANAGE_LINEUP' | 'CREATE_CHALLENGE';

const LEGACY_TEAM_CAPABILITIES: Record<LegacyTeamRole, ReadonlySet<TeamCapability>> = {
  OWNER: new Set<TeamCapability>([
    'CREATE_TEAM',
    'EDIT_TEAM',
    'MANAGE_ROSTER',
    'MANAGE_LINEUP',
    'CREATE_CHALLENGE',
  ]),
  ADMIN: new Set<TeamCapability>([
    'CREATE_TEAM',
    'EDIT_TEAM',
    'MANAGE_ROSTER',
    'MANAGE_LINEUP',
    'CREATE_CHALLENGE',
  ]),
};

export function legacyTeamRoleHasCapability(
  role: LegacyTeamRole,
  capability: TeamCapability,
): boolean {
  return LEGACY_TEAM_CAPABILITIES[role].has(capability);
}
