import { get } from '../../shared/api/http-client';

export type PitchVenueType =
  | 'FOOTBALL_PITCH'
  | 'MINI_PITCH'
  | 'FUTSAL'
  | 'PRIVATE_STADIUM'
  | 'INDOOR_FOOTBALL'
  | 'OUTDOOR_FOOTBALL'
  | 'OTHER_FOOTBALL';

export type PitchListingItem = {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  venueType: PitchVenueType | null;
  city: string | null;
  houma: string | null;
  fullAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  hourlyRateMinor: number | null;
  currency: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'INACTIVE';
  submittedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PitchPageResponse = {
  items: PitchListingItem[];
  nextCursor: string | null;
};

export type PitchListFilters = {
  search: string;
  city: string;
  houma: string;
};

export const pitchQueryKeys = {
  all: ['pitch'] as const,
  publicList: (filters: PitchListFilters) => [...pitchQueryKeys.all, 'public', filters] as const,
  publicDetail: (pitchId: string) => [...pitchQueryKeys.all, 'public', 'detail', pitchId] as const,
};

function publicPitchListPath(filters: PitchListFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('q', filters.search.trim());
  if (filters.city.trim()) params.set('city', filters.city.trim());
  if (filters.houma.trim()) params.set('houma', filters.houma.trim());
  params.set('limit', '20');
  const query = params.toString();
  return `/api/v1/pitch?${query}`;
}

export function listPublicPitches(filters: PitchListFilters) {
  return get<PitchPageResponse>(publicPitchListPath(filters));
}

export function getPublicPitch(pitchId: string) {
  return get<PitchListingItem>(`/api/v1/pitch/${pitchId}`);
}
