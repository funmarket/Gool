import type { Me } from '../../types/domain';

export type SelectedProfileIdentity = 'PLAYER' | 'FAN' | 'GAMER';
export type EffectiveProfileIdentity = SelectedProfileIdentity | 'ULTRAFAN' | 'GHOST_RIDER';

export type ProfileMe = Omit<Me, 'profile'> & {
  presentation?: {
    displayName?: string | null;
    username?: string | null;
    photoUrl?: string | null;
  } | null;
  profile?:
    | (NonNullable<Me['profile']> & {
        selectedIdentities: SelectedProfileIdentity[];
        effectiveIdentities: EffectiveProfileIdentity[];
      })
    | null;
};
