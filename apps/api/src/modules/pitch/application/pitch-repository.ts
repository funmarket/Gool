import type {
  PitchCreateInput,
  PitchListQuery,
  PitchListingStatus,
  PitchOwnerListQuery,
  PitchUpdateInput,
} from '@hooma/contracts';

export interface PitchRepository {
  listPublic(input: PitchListQuery): Promise<unknown>;
  getPublic(pitchId: string): Promise<unknown | null>;
  listOwned(userId: string, input: PitchOwnerListQuery): Promise<unknown>;
  getOwned(userId: string, pitchId: string): Promise<Record<string, unknown> | null>;
  create(userId: string, input: PitchCreateInput): Promise<unknown>;
  updateOwned(
    userId: string,
    pitchId: string,
    allowedStatuses: PitchListingStatus[],
    input: PitchUpdateInput,
  ): Promise<unknown | null>;
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
  ): Promise<unknown | null>;
}
