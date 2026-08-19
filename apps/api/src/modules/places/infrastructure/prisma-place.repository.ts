import type { PlaceCreateInput } from '@hooma/contracts';
import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import type { PlaceRepository } from '../application/place-repository.js';

export class PrismaPlaceRepository implements PlaceRepository {
  constructor(private readonly db: DatabaseClient) {}

  private accessWhere(userId: string, communityId?: string) {
    const accessClauses: object[] = [
      { communityId: null },
      { community: { memberships: { some: { userId, status: 'ACTIVE' as const } } } },
    ];
    if (communityId) {
      accessClauses.length = 0;
      accessClauses.push({
        AND: [
          { communityId },
          { community: { memberships: { some: { userId, status: 'ACTIVE' as const } } } },
        ],
      });
    }
    return { OR: accessClauses };
  }

  private placeInclude(userId: string) {
    return {
      fanHubs: {
        where: { deletedAt: null },
        include: { clubs: { include: { club: true } } },
        take: 1,
      },
      menuItems: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' as const } },
      claims: {
        where: { userId },
        select: { id: true, status: true },
        take: 1,
      },
    };
  }

  list(userId: string, input: { communityId?: string; query?: string; limit: number }) {
    return this.db.place.findMany({
      where: {
        deletedAt: null,
        AND: [
          this.accessWhere(userId, input.communityId),
          ...(input.query
            ? [
                {
                  OR: [
                    { name: { contains: input.query, mode: 'insensitive' as const } },
                    { category: { contains: input.query, mode: 'insensitive' as const } },
                    { city: { contains: input.query, mode: 'insensitive' as const } },
                    { houma: { contains: input.query, mode: 'insensitive' as const } },
                    { address: { contains: input.query, mode: 'insensitive' as const } },
                  ],
                },
              ]
            : []),
        ],
      },
      include: this.placeInclude(userId),
      orderBy: [{ status: 'desc' }, { createdAt: 'desc' }],
      take: input.limit,
    });
  }

  get(userId: string, placeId: string) {
    return this.db.place.findFirst({
      where: {
        id: placeId,
        deletedAt: null,
        AND: [this.accessWhere(userId)],
      },
      include: this.placeInclude(userId),
    });
  }

  listUpcomingEvents(userId: string, placeId: string, input: { limit: number }) {
    return this.db.event.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        startsAt: { gte: new Date() },
        community: { memberships: { some: { userId, status: 'ACTIVE' } } },
        watchDetails: { fanHub: { placeId, deletedAt: null } },
      },
      include: {
        community: { select: { id: true, name: true, avatarUrl: true } },
        watchDetails: {
          include: {
            homeClub: true,
            awayClub: true,
            fanHub: {
              include: {
                place: {
                  include: {
                    menuItems: {
                      where: { deletedAt: null },
                      orderBy: { sortOrder: 'asc' as const },
                    },
                  },
                },
              },
            },
          },
        },
        rsvps: {
          where: { userId },
          select: { id: true, status: true, seatHoldExpiresAt: true },
        },
        _count: {
          select: { rsvps: { where: { status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } } } },
        },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take: input.limit,
    });
  }

  create(userId: string, input: PlaceCreateInput) {
    return this.db.$transaction(async (tx) => {
      const place = await tx.place.create({
        data: {
          communityId: input.communityId || null,
          createdByUserId: userId,
          name: input.name,
          category: input.category,
          description: input.description || null,
          address: input.address,
          city: input.city || null,
          houma: input.houma || null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          phone: input.phone || null,
          email: input.email || null,
          websiteUrl: input.websiteUrl || null,
          photoUrl: input.photoUrl || null,
          status: input.ownerClaim ? 'OWNER_CLAIMED' : 'COMMUNITY_SUGGESTED',
        },
      });

      if (input.menuItems.length) {
        await tx.placeMenuItem.createMany({
          data: input.menuItems.map((item, sortOrder) => ({
            placeId: place.id,
            name: item.name,
            priceLabel: item.priceLabel || null,
            sortOrder,
          })),
        });
      }

      if (input.ownerClaim) {
        await tx.placeOwnerClaim.create({
          data: {
            placeId: place.id,
            userId,
            status: 'PENDING',
            businessName: input.ownerClaim.businessName || input.name,
            contactName: input.ownerClaim.contactName || null,
            contactPhone: input.ownerClaim.contactPhone || input.phone || null,
            contactEmail: input.ownerClaim.contactEmail || input.email || null,
            note: input.ownerClaim.note || null,
          },
        });
      }

      if (input.makeFanHub) {
        const hub = await tx.fanHub.create({
          data: {
            placeId: place.id,
            communityId: input.communityId || null,
            createdByUserId: userId,
            name: input.name,
            venueName: input.name,
            address: input.address,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            verified: false,
          },
        });
        if (input.clubIds.length) {
          await tx.fanHubClub.createMany({
            data: input.clubIds.map((clubId) => ({ fanHubId: hub.id, clubId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.place.findUniqueOrThrow({
        where: { id: place.id },
        include: this.placeInclude(userId),
      });
    });
  }
}
