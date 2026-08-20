import type { PlatformRole } from '../../platform-admin/application/platform-admin.repository.js';

export interface IdentityUser {
  id: string;
  telegramUserId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  languageCode: string | null;
  isPremium: boolean;
}

export interface IdentityFavoriteClub {
  id: string;
  name: string;
  slug: string;
  countryCode: string | null;
  logoUrl: string | null;
}

export interface IdentityProfile {
  userId: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MIXED';
  skillRating: number;
  preferredPositions: string[];
  favoriteClubId: string | null;
  profileAudience: 'SPECTATOR' | 'FAN';
  bio: string | null;
  favoriteClub: IdentityFavoriteClub | null;
}

export interface IdentityPreference {
  userId: string;
  activeCommunityId: string | null;
  themeOverride: 'TELEGRAM' | 'LIGHT' | 'DARK';
}

export interface IdentityMeData extends IdentityUser {
  profile: IdentityProfile | null;
  preference: IdentityPreference | null;
}

export interface PlatformCapabilities {
  canAccessPlatformAdmin: boolean;
  canReviewWatchPlaces: boolean;
  canReviewPitchListings: boolean;
}

export interface IdentityMe extends IdentityMeData {
  platformRoles: PlatformRole[];
  capabilities: PlatformCapabilities;
}

export interface TelegramIdentityInput {
  telegramUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
  isPremium?: boolean;
}
