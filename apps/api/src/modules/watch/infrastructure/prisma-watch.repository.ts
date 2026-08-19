import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../http/errors/app-error.js';
import type {
  CheckInInput,
  FanHubCreateInput,
  VenueDealCreateInput,
  WatchRepository,
} from '../application/watch-repository.js';

export class PrismaWatchRepository implements WatchRepository {
  constructor(private readonly db: DatabaseClient) {}

  listClubs(input: { countryCode?: string; query?: string; limit: number }) {
    return this.db.footballClub.findMany({
      where: {
        ...(input.countryCode ? { countryCode: input.countryCode.toUpperCase() } : {}),
        ...(input.query ? { name: { contains: input.query, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { name: 'asc' },
      take: input.limit,
    });
  }

  listHubs(userId: string, input: { communityId?: string; clubId?: string; limit: number }) {
    const accessClauses: object[] = [
      { communityId: null },
      { community: { memberships: { some: { userId, status: 'ACTIVE' as const } } } },
    ];
    if (input.communityId) {
      accessClauses.length = 0;
      accessClauses.push(
        { communityId: null },
        {
          AND: [
            { communityId: input.communityId },
            { community: { memberships: { some: { userId, status: 'ACTIVE' as const } } } },
          ],
        },
      );
    }

    return this.db.fanHub.findMany({
      where: {
        deletedAt: null,
        AND: [
          { OR: accessClauses },
          ...(input.clubId ? [{ clubs: { some: { clubId: input.clubId } } }] : []),
        ],
      },
      include: {
        place: {
          include: {
            menuItems: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
          },
        },
        clubs: { include: { club: true } },
        deals: { where: { deletedAt: null } },
      },
      orderBy: [{ verified: 'desc' }, { createdAt: 'desc' }],
      take: input.limit,
    });
  }

  async createHub(userId: string, input: FanHubCreateInput) {
    return this.db.$transaction(async (tx) => {
      const hub = await tx.fanHub.create({
        data: {
          communityId: input.communityId || null,
          createdByUserId: userId,
          name: input.name,
          venueName: input.venueName,
          address: input.address || null,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });
      if (input.clubIds.length) {
        await tx.fanHubClub.createMany({
          data: input.clubIds.map((clubId) => ({ fanHubId: hub.id, clubId })),
          skipDuplicates: true,
        });
      }
      return tx.fanHub.findUniqueOrThrow({
        where: { id: hub.id },
        include: {
          place: {
            include: {
              menuItems: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
            },
          },
          clubs: { include: { club: true } },
        },
      });
    });
  }

  async getEventForCheckIn(eventId: string, userId: string) {
    const event = await this.db.event.findFirst({
      where: {
        id: eventId,
        type: 'WATCH',
        status: 'PUBLISHED',
        deletedAt: null,
        community: { memberships: { some: { userId, status: 'ACTIVE' } } },
      },
      select: { id: true, communityId: true, latitude: true, longitude: true },
    });
    return event
      ? {
          id: event.id,
          communityId: event.communityId,
          latitude: event.latitude == null ? null : Number(event.latitude),
          longitude: event.longitude == null ? null : Number(event.longitude),
        }
      : null;
  }

  async getFanHub(fanHubId: string) {
    const hub = await this.db.fanHub.findFirst({
      where: { id: fanHubId, deletedAt: null },
      select: { id: true, communityId: true, latitude: true, longitude: true },
    });
    return hub
      ? {
          id: hub.id,
          communityId: hub.communityId,
          latitude: Number(hub.latitude),
          longitude: Number(hub.longitude),
        }
      : null;
  }

  upsertCheckIn(userId: string, eventId: string, input: CheckInInput) {
    return this.db.checkIn.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: {
        eventId,
        userId,
        fanHubId: input.fanHubId || null,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      update: {
        fanHubId: input.fanHubId || null,
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });
  }

  async unlockedDeals(userId: string, eventId: string) {
    const now = new Date();
    const checkIn = await this.db.checkIn.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return this.db.venueDeal.findMany({
      where: {
        deletedAt: null,
        eventId,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
        OR: [
          { requiresCheckIn: false },
          ...(checkIn?.fanHubId ? [{ requiresCheckIn: true, fanHubId: checkIn.fanHubId }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        redemptionCode: true,
        requiresCheckIn: true,
        startsAt: true,
        endsAt: true,
        fanHubId: true,
      },
    });
  }

  createDeal(userId: string, input: VenueDealCreateInput) {
    return this.db.$transaction(async (tx) => {
      const hub = await tx.fanHub.findFirst({
        where: { id: input.fanHubId, deletedAt: null },
        select: { id: true, communityId: true },
      });
      if (!hub || (hub.communityId !== null && hub.communityId !== input.communityId)) {
        throw new AppError(
          409,
          'FAN_HUB_COMMUNITY_MISMATCH',
          'The selected Fan Hub is not available to this community.',
        );
      }

      if (input.eventId) {
        const event = await tx.event.findFirst({
          where: {
            id: input.eventId,
            communityId: input.communityId,
            type: 'WATCH',
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!event) {
          throw new AppError(
            409,
            'DEAL_EVENT_COMMUNITY_MISMATCH',
            'The attached Watch Event must belong to the same community.',
          );
        }
      }

      return tx.venueDeal.create({
        data: {
          fanHubId: input.fanHubId,
          communityId: input.communityId,
          eventId: input.eventId || null,
          createdByUserId: userId,
          title: input.title,
          description: input.description || null,
          redemptionCode: input.redemptionCode || null,
          requiresCheckIn: input.requiresCheckIn,
          startsAt: input.startsAt || null,
          endsAt: input.endsAt || null,
        },
      });
    });
  }

  async listDeals(userId: string, eventId: string) {
    const event = await this.db.event.findFirst({
      where: {
        id: eventId,
        type: 'WATCH',
        deletedAt: null,
        community: { memberships: { some: { userId, status: 'ACTIVE' } } },
      },
      select: { id: true },
    });
    if (!event) throw new AppError(404, 'WATCH_EVENT_NOT_FOUND', 'Watch event not found.');

    const now = new Date();
    const checkedIn = await this.db.checkIn.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    const deals = await this.db.venueDeal.findMany({
      where: {
        eventId,
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return deals.map((deal) => ({
      ...deal,
      redemptionCode:
        !deal.requiresCheckIn || checkedIn?.fanHubId === deal.fanHubId ? deal.redemptionCode : null,
      locked: deal.requiresCheckIn && checkedIn?.fanHubId !== deal.fanHubId,
    }));
  }
}
