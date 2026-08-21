import type {
  PitchCreateRequest,
  PitchListingStatus,
  PitchUpdateRequest,
  PitchVenueType,
} from '@hooma/contracts';
import { patch, post } from '../../shared/api/http-client';

export type PitchOwnerItem = {
  id: string;
  ownerUserId: string;
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
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export function createPitchDraft(input: PitchCreateRequest) {
  return post<PitchOwnerItem>('/api/v1/pitch', input);
}

export function updatePitchDraft(pitchId: string, input: PitchUpdateRequest) {
  return patch<PitchOwnerItem>(`/api/v1/pitch/mine/${encodeURIComponent(pitchId)}`, input);
}
