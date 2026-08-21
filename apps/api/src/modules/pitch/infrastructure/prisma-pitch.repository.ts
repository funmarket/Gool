import { Prisma } from '@hooma/database';
import type {
  PitchCreateInput,
  PitchListQuery,
  PitchListingStatus,
  PitchOwnerListQuery,
  PitchUpdateInput,
} from '@hooma/contracts';
import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { decodeTimeIdCursor, encodeTimeIdCursor } from '../../../infrastructure/database/cursor.js';
import type {
  PitchListingRecord,
  PitchOwnerRecord,
  PitchRepository,
} from '../application/pitch-repository.js';

const publicSelect = {
  id: true,
  name: true,
  description: true,
  photoUrl: true,
  venueType: true,
  city: true,
  houma: true,
  fullAddress: true,
  latitude: true,
  longitude: true,
  hourlyRateMinor: true,
  currency: true,
  publicPhone: true,
  publicEmail: true,
  status: true,
  submittedAt: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PitchListingSelect;

const ownerSelect = {
  ...publicSelect,
  ownerUserId: true,
  reviewedAt: true,
  reviewedByUserId: true,
  rejectionReason: true,
} satisfies Prisma.PitchListingSelect;

type PublicRow = Prisma.PitchListingGetPayload<{ select: typeof publicSelect }>;
type OwnerRow = Prisma.PitchListingGetPayload<{ select: typeof ownerSelect }>;

function safeMinorAmount(value: bigint | null) {
  if (value === null) return null;
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) {
    throw new Error('Pitch hourly amount exceeds the supported JSON-safe range.');
  }
  return amount;
}

function mapPublic(row: PublicRow): PitchListingRecord {
  return {
    ...row,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    hourlyRateMinor: safeMinorAmount(row.hourlyRateMinor),
  };
}

function mapOwner(row: OwnerRow): PitchOwnerRecord {
  return {
    ...mapPublic(row),
    ownerUserId: row.ownerUserId,
    reviewedAt: row.reviewedAt,
    reviewedByUserId: row.reviewedByUserId,
    rejectionReason: row.rejectionReason,
  };
}

function updateData(input: PitchUpdateInput): Prisma.PitchListingUpdateManyMutationInput {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
    ...(input.venueType !== undefined ? { venueType: input.venueType } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.houma !== undefined ? { houma: input.houma } : {}),
    ...(input.fullAddress !== undefined ? { fullAddress: input.fullAddress } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(input.hourlyRateMinor !== undefined ? { hourlyRateMinor: input.hourlyRateMinor } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
    ...(input.publicPhone !== undefined ? { publicPhone: input.publicPhone } : {}),
    ...(input.publicEmail !== undefined ? { publicEmail: input.publicEmail } : {}),
  };
}

export class PrismaPitchRepository implements PitchRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listPublic(input: PitchListQuery) {
    const cursor = input.cursor ? decodeTimeIdCursor(input.cursor, 'Pitch') : null;
    const rows = await this.db.pitchListing.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        publishedAt: { not: null },
        ...(input.city ? { city: { contains: input.city, mode: 'insensitive' } } : {}),
        ...(input.houma ? { houma: { contains: input.houma, mode: 'insensitive' } } : {}),
        ...(input.venueType ? { venueType: input.venueType } : {}),
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q, mode: 'insensitive' } },
                { city: { contains: input.q, mode: 'insensitive' } },
                { houma: { contains: input.q, mode: 'insensitive' } },
                { fullAddress: { contains: input.q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(cursor
          ? {
              OR: [
                { publishedAt: { lt: cursor.at } },
                { publishedAt: cursor.at, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      select: publicSelect,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });
    const hasMore = rows.length > input.limit;
    const selected = hasMore ? rows.slice(0, input.limit) : rows;
    const items = selected.map(mapPublic);
    const last = selected.at(-1);
    return {
      items,
      nextCursor:
        hasMore && last?.publishedAt ? encodeTimeIdCursor(last.publishedAt, last.id) : null,
    };
  }

  async getPublic(pitchId: string) {
    const row = await this.db.pitchListing.findFirst({
      where: {
        id: pitchId,
        status: 'PUBLISHED',
        deletedAt: null,
        publishedAt: { not: null },
      },
      select: publicSelect,
    });
    return row ? mapPublic(row) : null;
  }

  async listOwned(userId: string, input: PitchOwnerListQuery) {
    const cursor = input.cursor ? decodeTimeIdCursor(input.cursor, 'Pitch owner') : null;
    const rows = await this.db.pitchListing.findMany({
      where: {
        ownerUserId: userId,
        deletedAt: null,
        ...(input.status ? { status: input.status } : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.at } },
                { createdAt: cursor.at, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      select: ownerSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });
    const hasMore = rows.length > input.limit;
    const selected = hasMore ? rows.slice(0, input.limit) : rows;
    const items = selected.map(mapOwner);
    const last = selected.at(-1);
    return {
      items,
      nextCursor: hasMore && last ? encodeTimeIdCursor(last.createdAt, last.id) : null,
    };
  }

  async getOwned(userId: string, pitchId: string) {
    const row = await this.db.pitchListing.findFirst({
      where: { id: pitchId, ownerUserId: userId, deletedAt: null },
      select: ownerSelect,
    });
    return row ? mapOwner(row) : null;
  }

  async create(userId: string, input: PitchCreateInput, pitchId?: string) {
    try {
      const row = await this.db.pitchListing.create({
        data: {
          ...(pitchId ? { id: pitchId } : {}),
          ownerUserId: userId,
          name: input.name,
          description: input.description ?? null,
          photoUrl: input.photoUrl ?? null,
          venueType: input.venueType ?? null,
          city: input.city ?? null,
          houma: input.houma ?? null,
          fullAddress: input.fullAddress ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          hourlyRateMinor: input.hourlyRateMinor ?? null,
          currency: input.currency ?? null,
          publicPhone: input.publicPhone ?? null,
          publicEmail: input.publicEmail ?? null,
          status: 'DRAFT',
        },
        select: ownerSelect,
      });
      return mapOwner(row);
    } catch (error) {
      if (
        pitchId &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.getOwned(userId, pitchId);
        if (existing) return existing;
      }
      throw error;
    }
  }

  async updateOwned(
    userId: string,
    pitchId: string,
    allowedStatuses: PitchListingStatus[],
    input: PitchUpdateInput,
  ) {
    const result = await this.db.pitchListing.updateMany({
      where: {
        id: pitchId,
        ownerUserId: userId,
        deletedAt: null,
        status: { in: allowedStatuses },
      },
      data: updateData(input),
    });
    if (result.count !== 1) return null;
    return this.getOwned(userId, pitchId);
  }

  async transitionOwned(
    userId: string,
    pitchId: string,
    fromStatuses: PitchListingStatus[],
    expectedUpdatedAt: Date,
    data: {
      status: PitchListingStatus;
      submittedAt?: Date | null;
      publishedAt?: Date | null;
      reviewedAt?: Date | null;
      reviewedByUserId?: string | null;
      rejectionReason?: string | null;
    },
  ) {
    const result = await this.db.pitchListing.updateMany({
      where: {
        id: pitchId,
        ownerUserId: userId,
        deletedAt: null,
        status: { in: fromStatuses },
        updatedAt: expectedUpdatedAt,
      },
      data,
    });
    if (result.count !== 1) return null;
    return this.getOwned(userId, pitchId);
  }
}
