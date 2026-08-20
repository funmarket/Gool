import type { ProfileIdentityType } from '@hooma/contracts';
import type { Club } from '../../types/domain';

export type CurrentProfile = {
  id: string;
  telegramUserId: string | null;
  username?: string | null;
  authName?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  authUsername?: string | null;
  displayAuthUsername?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  languageCode?: string | null;
  isPremium: boolean;
  profile?: {
    userId: string;
    skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MIXED';
    skillRating: number;
    preferredPositions: string[];
    favoriteClubId?: string | null;
    favoriteClub?: Club | null;
    profileIdentityTypes: ProfileIdentityType[];
    footballPersonaKey?: string | null;
    bio?: string | null;
  } | null;
  preference?: {
    activeCommunityId?: string | null;
    themeOverride?: 'TELEGRAM' | 'LIGHT' | 'DARK' | null;
  } | null;
};
