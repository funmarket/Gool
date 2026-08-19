import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  PitchCreateInput,
  PitchListQuery,
  PitchListingStatus,
  PitchOwnerListQuery,
  PitchUpdateInput,
} from '@hooma/contracts';
import type {
  PitchOwnerRecord,
  PitchRepository,
} from '../apps/api/src/modules/pitch/application/pitch-repository.js';
import { PitchService } from '../apps/api/src/modules/pitch/application/pitch.service.js';

function listing(status: PitchListingStatus): PitchOwnerRecord {
  const now = new Date('2026-08-19T12:00:00.000Z');
  return {
    id: 'pitch-1',
    ownerUserId: 'user-1',
    name: 'Arena Football',
    description: 'Private football ground.',
    photoUrl: 'https://example.com/pitch.jpg',
    venueType: 'FOOTBALL_PITCH',
    city: 'Tunis',
    houma: 'Centre',
    fullAddress: '1 Football Street',
    latitude: 36.8,
    longitude: 10.18,
    hourlyRateMinor: 60000,
    currency: 'TND',
    publicPhone: '+21600000000',
    publicEmail: null,
    status,
    submittedAt: null,
    publishedAt: status === 'PUBLISHED' ? now : null,
    reviewedAt: status === 'PUBLISHED' ? now : null,
    reviewedByUserId: status === 'PUBLISHED' ? 'platform-admin' : null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
}

class FakePitchRepository implements PitchRepository {
  constructor(public current: PitchOwnerRecord) {}

  listPublic(input: PitchListQuery) {
    void input;
    return Promise.resolve({ items: [], nextCursor: null });
  }

  getPublic() {
    return Promise.resolve(this.current.status === 'PUBLISHED' ? this.current : null);
  }

  listOwned(userId: string, input: PitchOwnerListQuery) {
    void userId;
    void input;
    return Promise.resolve({ items: [this.current], nextCursor: null });
  }

  getOwned(userId: string, pitchId: string) {
    return Promise.resolve(
      userId === this.current.ownerUserId && pitchId === this.current.id ? this.current : null,
    );
  }

  create(userId: string, input: PitchCreateInput) {
    void userId;
    void input;
    return Promise.resolve(this.current);
  }

  updateOwned(
    userId: string,
    pitchId: string,
    allowedStatuses: PitchListingStatus[],
    input: PitchUpdateInput,
  ) {
    void userId;
    void pitchId;
    void input;
    return Promise.resolve(allowedStatuses.includes(this.current.status) ? this.current : null);
  }

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
  ) {
    void userId;
    void pitchId;
    if (!fromStatuses.includes(this.current.status)) return Promise.resolve(null);
    this.current = { ...this.current, ...data, updatedAt: new Date() };
    return Promise.resolve(this.current);
  }
}

test('Pitch submit moves a complete draft to pending review', async () => {
  const repo = new FakePitchRepository(listing('DRAFT'));
  const service = new PitchService(repo);

  const result = await service.submit('user-1', 'pitch-1');

  assert.equal(result.status, 'PENDING_REVIEW');
  assert.ok(result.submittedAt instanceof Date);
  assert.equal(result.publishedAt, null);
});

test('Pitch submit rejects an incomplete draft', async () => {
  const incomplete = { ...listing('DRAFT'), photoUrl: null };
  const service = new PitchService(new FakePitchRepository(incomplete));

  await assert.rejects(() => service.submit('user-1', 'pitch-1'));
});

test('Pitch owner cannot edit a published listing', async () => {
  const service = new PitchService(new FakePitchRepository(listing('PUBLISHED')));

  await assert.rejects(
    () => service.update('user-1', 'pitch-1', { name: 'New Name' }),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PITCH_EDIT_NOT_ALLOWED',
  );
});

test('Pitch reactivation returns to review instead of publishing directly', async () => {
  const repo = new FakePitchRepository(listing('INACTIVE'));
  const service = new PitchService(repo);

  const result = await service.reactivate('user-1', 'pitch-1');

  assert.equal(result.status, 'PENDING_REVIEW');
  assert.equal(result.publishedAt, null);
});
