import type {
  PitchCreateInput,
  PitchListQuery,
  PitchListingStatus,
  PitchOwnerListQuery,
  PitchUpdateInput,
  PitchVenueType,
} from '@hooma/contracts';

export type PitchListingRecord = {
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
  submittedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PitchOwnerRecord = PitchListingRecord & {
  ownerUserId: string;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  rejectionReason: string | null;
};

export interface PitchRepository {
  listPublic(input: PitchListQuery): Promise<{ items: PitchListingRecord[]; nextCursor: string | null }>;
  getPublic(pitchId: string): Promise<PitchListingRecord | null>;
  listOwned(
    userId: string,
    input: PitchOwnerListQuery,
  ): Promise<{ items: PitchOwnerRecord[]; nextCursor: string | null }>;
  getOwned(userId: string, pitchId: string): Promise<PitchOwnerRecord | null>;
  create(userId: string, input: PitchCreateInput): Promise<PitchOwnerRecord>;
  updateOwned(
    userId: string,
    pitchId: string,
    allowedStatuses: PitchListingStatus[],
    input: PitchUpdateInput,
  ): Promise<PitchOwnerRecord | null>;
  transitionOwned(
    userId: string,
    pitchId: string,
    fromStatuses: PitchListingStatus[],
    data: {
      status: PitchListingStatus;
      submittedAt?: Date | null;
      publishedAt?: Date | null;
      reviewedAt?: Date | null;
      reviewedByUserId?: string | null;
      rejectionReason?: string | null;
    },
  ): Promise<PitchOwnerRecord | null>;
}
