import {
  pitchPublicationSchema,
  type PitchCreateInput,
  type PitchListQuery,
  type PitchOwnerListQuery,
  type PitchUpdateInput,
} from '@hooma/contracts';
import { AppError } from '../../../http/errors/app-error.js';
import type { PitchOwnerRecord, PitchRepository } from './pitch-repository.js';

const editableStatuses = ['DRAFT', 'REJECTED', 'INACTIVE'] as const;

function publicationCandidate(listing: PitchOwnerRecord) {
  return {
    name: listing.name,
    ...(listing.description !== null ? { description: listing.description } : {}),
    photoUrl: listing.photoUrl,
    venueType: listing.venueType,
    city: listing.city,
    houma: listing.houma,
    fullAddress: listing.fullAddress,
    ...(listing.latitude !== null ? { latitude: listing.latitude } : {}),
    ...(listing.longitude !== null ? { longitude: listing.longitude } : {}),
    hourlyRateMinor: listing.hourlyRateMinor,
    currency: listing.currency,
    ...(listing.publicPhone !== null ? { publicPhone: listing.publicPhone } : {}),
    ...(listing.publicEmail !== null ? { publicEmail: listing.publicEmail } : {}),
  };
}

export class PitchService {
  constructor(private readonly repo: PitchRepository) {}

  listPublic(input: PitchListQuery) {
    return this.repo.listPublic(input);
  }

  async getPublic(pitchId: string) {
    const pitch = await this.repo.getPublic(pitchId);
    if (!pitch) throw new AppError(404, 'PITCH_NOT_FOUND', 'Pitch not found.');
    return pitch;
  }

  listOwned(userId: string, input: PitchOwnerListQuery) {
    return this.repo.listOwned(userId, input);
  }

  async getOwned(userId: string, pitchId: string) {
    const pitch = await this.repo.getOwned(userId, pitchId);
    if (!pitch) throw new AppError(404, 'PITCH_NOT_FOUND', 'Pitch not found.');
    return pitch;
  }

  create(userId: string, input: PitchCreateInput) {
    return this.repo.create(userId, input);
  }

  async update(userId: string, pitchId: string, input: PitchUpdateInput) {
    const current = await this.getOwned(userId, pitchId);
    if (
      current.status !== 'DRAFT' &&
      current.status !== 'REJECTED' &&
      current.status !== 'INACTIVE'
    ) {
      throw new AppError(
        409,
        'PITCH_EDIT_NOT_ALLOWED',
        'This Pitch cannot be edited in its current state.',
      );
    }
    const updated = await this.repo.updateOwned(userId, pitchId, [...editableStatuses], input);
    if (!updated) {
      throw new AppError(
        409,
        'PITCH_STATE_CHANGED',
        'This Pitch changed state before the update completed.',
      );
    }
    return updated;
  }

  async submit(userId: string, pitchId: string) {
    const current = await this.getOwned(userId, pitchId);
    if (current.status !== 'DRAFT' && current.status !== 'REJECTED') {
      throw new AppError(
        409,
        'PITCH_SUBMIT_NOT_ALLOWED',
        'Only a draft or rejected Pitch can be submitted for review.',
      );
    }
    pitchPublicationSchema.parse(publicationCandidate(current));
    const submitted = await this.repo.transitionOwned(userId, pitchId, ['DRAFT', 'REJECTED'], {
      status: 'PENDING_REVIEW',
      submittedAt: new Date(),
      publishedAt: null,
      reviewedAt: null,
      reviewedByUserId: null,
      rejectionReason: null,
    });
    if (!submitted) {
      throw new AppError(
        409,
        'PITCH_STATE_CHANGED',
        'This Pitch changed state before submission completed.',
      );
    }
    return submitted;
  }

  async deactivate(userId: string, pitchId: string) {
    await this.getOwned(userId, pitchId);
    const deactivated = await this.repo.transitionOwned(userId, pitchId, ['PUBLISHED'], {
      status: 'INACTIVE',
      publishedAt: null,
    });
    if (!deactivated) {
      throw new AppError(
        409,
        'PITCH_DEACTIVATE_NOT_ALLOWED',
        'Only a published Pitch can be deactivated.',
      );
    }
    return deactivated;
  }

  async reactivate(userId: string, pitchId: string) {
    const current = await this.getOwned(userId, pitchId);
    if (current.status !== 'INACTIVE') {
      throw new AppError(
        409,
        'PITCH_REACTIVATE_NOT_ALLOWED',
        'Only an inactive Pitch can be submitted again for review.',
      );
    }
    pitchPublicationSchema.parse(publicationCandidate(current));
    const reactivated = await this.repo.transitionOwned(userId, pitchId, ['INACTIVE'], {
      status: 'PENDING_REVIEW',
      submittedAt: new Date(),
      publishedAt: null,
      reviewedAt: null,
      reviewedByUserId: null,
      rejectionReason: null,
    });
    if (!reactivated) {
      throw new AppError(
        409,
        'PITCH_STATE_CHANGED',
        'This Pitch changed state before reactivation completed.',
      );
    }
    return reactivated;
  }
}
