import type {
  PitchCreateRequest,
  PitchListingStatus,
  PitchUpdateRequest,
  PitchVenueType,
} from '@hooma/contracts';
import { get, patch, post } from '../../shared/api/http-client';

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
  status: PitchListingStatus;
  submittedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PitchOwnerItem = PitchListingItem & {
  ownerUserId: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  rejectionReason: string | null;
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
};

function publicPitchListPath(filters: PitchListFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('q', filters.search.trim());
  if (filters.city.trim()) params.set('city', filters.city.trim());
  if (filters.houma.trim()) params.set('houma', filters.houma.trim());
  params.set('limit', '20');
  return `/api/v1/pitch?${params.toString()}`;
}

export function listPublicPitches(filters: PitchListFilters) {
  return get<PitchPageResponse>(publicPitchListPath(filters));
}

export function createPitchDraft(input: PitchCreateRequest) {
  return post<PitchOwnerItem>('/api/v1/pitch', input);
}

export function updatePitchDraft(pitchId: string, input: PitchUpdateRequest) {
  return patch<PitchOwnerItem>(`/api/v1/pitch/mine/${encodeURIComponent(pitchId)}`, input);
}
