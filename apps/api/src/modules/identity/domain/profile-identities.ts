import type { EffectiveProfileIdentityType, ProfileIdentityType } from '@hooma/contracts';

const SELECTED_IDENTITY_ORDER: ProfileIdentityType[] = ['PLAYER', 'FAN', 'GAMER'];

export function normalizeSelectedProfileIdentities(
  selected: readonly ProfileIdentityType[],
): ProfileIdentityType[] {
  const unique = new Set(selected);
  return SELECTED_IDENTITY_ORDER.filter((identity) => unique.has(identity));
}

export function resolveEffectiveProfileIdentities(
  selected: readonly ProfileIdentityType[],
  options: { hasActiveUltrasMembership?: boolean } = {},
): EffectiveProfileIdentityType[] {
  const normalized = normalizeSelectedProfileIdentities(selected);
  const effective: EffectiveProfileIdentityType[] = [];

  if (normalized.includes('PLAYER')) effective.push('PLAYER');
  if (normalized.includes('FAN')) effective.push('FAN');
  if (options.hasActiveUltrasMembership) effective.push('ULTRAFAN');
  if (normalized.includes('GAMER')) effective.push('GAMER');

  return effective.length ? effective : ['GHOST_RIDER'];
}
