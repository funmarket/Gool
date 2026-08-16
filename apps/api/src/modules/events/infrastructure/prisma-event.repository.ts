import { Prisma } from '@gool/database';
import type { EventCreateInput, EventUpdateInput } from '@gool/contracts';
import type { TransactionHandle } from '../../../application/unit-of-work.js';
import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { transactionClient } from '../../../infrastructure/database/unit-of-work.js';
import { decodeTimeIdCursor, encodeTimeIdCursor } from '../../../infrastructure/database/cursor.js';
import { AppError } from '../../../http/errors/app-error.js';
import type {
  EventRepository,
  RsvpCancellationPreparation,
  RsvpJoinPreparation,
  RsvpRepository,
} from '../application/event-repository.js';

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly db: DatabaseClient) {}

  async listForUser(
    userId: string,
    input: {
      communityId?: string;
      type?: 'PLAY' | 'WATCH';
      from: Date;
      cursor?: string;
      limit: number;
    },
  ) {
    const cursor = input.cursor ? decodeTimeIdCursor(input.cursor, 'Event') : null;
    const rows = await this.db.event.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        startsAt: { gte: input.from },
        ...(input.communityId
          ? { communityId: input.communityId }
          : { community: { memberships: { some: { userId, status: 'ACTIVE' } } } }),
        ...(input.type ? { type: input.type } : {}),
        ...(cursor
          ? {
              OR: [{ startsAt: { gt: cursor.at } }, { startsAt: cursor.at, id: { gt: cursor.id } }],
            }
          : {}),
      },
      include: {
        community: { select: { id: true, name: true, avatarUrl: true } },
        playDetails: true,
        watchDetails: { include: { homeClub: true, awayClub: true } },
        paymentMethods: { where: { enabled: true }, orderBy: { sortOrder: 'asc' } },
        rsvps: {
          where: { userId },
          select: {
            id: true,
            status: true,
            seatHoldExpiresAt: true,
            paymentIntent: {
              select: {
                id: true,
                status: true,
                selectedMethod: true,
                amountMinor: true,
                currency: true,
              },
            },
          },
        },
        _count: {
          select: { rsvps: { where: { status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } } } },
        },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      take: input.limit + 1,
    });

    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;
    return {
      items,
      nextCursor:
        hasMore && items.at(-1)
          ? encodeTimeIdCursor(items.at(-1)!.startsAt, items.at(-1)!.id)
          : null,
    };
  }

  async create(userId: string, input: EventCreateInput) {
    return this.db.$transaction(
      async (tx) => {
        const event = await tx.event.create({
          data: {
            communityId: input.communityId,
            createdByUserId: userId,
            type: input.type,
            title: input.title,
            description: input.description || null,
            startsAt: input.startsAt,
            endsAt: input.endsAt || null,
            timezone: input.timezone,
            venueName: input.venueName || null,
            address: input.address || null,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            capacity: input.capacity ?? null,
            waitlistEnabled: input.waitlistEnabled,
            cashRsvpPolicy: input.cashRsvpPolicy,
          },
        });

        if (input.type === 'PLAY') {
          await tx.playEventDetails.create({
            data: {
              eventId: event.id,
              pitchType: input.pitchType,
              skillLevel: input.skillLevel,
              format: input.format,
              entryFeeMinor: input.entryFeeMinor,
              currency: input.currency,
              paymentRequired: input.paymentRequired,
            },
          });
          if (input.paymentRequired) {
            for (const [sortOrder, method] of input.acceptedPaymentMethods.entries()) {
              await tx.eventPaymentMethod.create({
                data: { eventId: event.id, method, enabled: true, sortOrder },
              });
            }
          }
        } else {
          await tx.watchEventDetails.create({
            data: {
              eventId: event.id,
              homeClubId: input.homeClubId || null,
              awayClubId: input.awayClubId || null,
            },
          });
        }

        const closeBase = input.endsAt ?? new Date(input.startsAt.getTime() + 3 * 60 * 60_000);
        await tx.eventChatRoom.create({
          data: {
            eventId: event.id,
            opensAt: new Date(input.startsAt.getTime() - 24 * 60 * 60_000),
            closesAt: new Date(closeBase.getTime() + 6 * 60 * 60_000),
          },
        });

        return tx.event.findUniqueOrThrow({
          where: { id: event.id },
          include: { playDetails: true, watchDetails: true, paymentMethods: true, chatRoom: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async update(eventId: string, actorUserId: string, input: EventUpdateInput, requestId: string) {
    return this.db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
        const event = await tx.event.findFirst({ where: { id: eventId, deletedAt: null } });
        if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
        if (event.status === 'CANCELLED') {
          throw new AppError(409, 'EVENT_CANCELLED', 'A cancelled event cannot be edited.');
        }

        const nextStartsAt = input.startsAt ?? event.startsAt;
        const nextEndsAt = input.endsAt === undefined ? event.endsAt : input.endsAt;
        if (nextEndsAt && nextEndsAt <= nextStartsAt) {
          throw new AppError(
            400,
            'EVENT_TIME_INVALID',
            'Event end time must be after its start time.',
          );
        }

        if (input.capacity !== undefined && input.capacity !== null) {
          const occupied = await tx.eventRsvp.count({
            where: { eventId, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
          });
          if (input.capacity < occupied) {
            throw new AppError(
              409,
              'EVENT_CAPACITY_BELOW_OCCUPANCY',
              `Capacity cannot be lower than the ${occupied} currently reserved seats.`,
            );
          }
        }

        const updated = await tx.event.update({
          where: { id: eventId },
          data: {
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
            ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
            ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
            ...(input.venueName !== undefined ? { venueName: input.venueName } : {}),
            ...(input.address !== undefined ? { address: input.address } : {}),
            ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
            ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
            ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
            ...(input.waitlistEnabled !== undefined
              ? { waitlistEnabled: input.waitlistEnabled }
              : {}),
            ...(input.cashRsvpPolicy !== undefined ? { cashRsvpPolicy: input.cashRsvpPolicy } : {}),
          },
        });

        if (input.startsAt !== undefined || input.endsAt !== undefined) {
          const closeBase = nextEndsAt ?? new Date(nextStartsAt.getTime() + 3 * 60 * 60_000);
          await tx.eventChatRoom.updateMany({
            where: { eventId },
            data: {
              opensAt: new Date(nextStartsAt.getTime() - 24 * 60 * 60_000),
              closesAt: new Date(closeBase.getTime() + 6 * 60 * 60_000),
            },
          });
        }

        await tx.auditLog.create({
          data: {
            actorUserId,
            communityId: event.communityId,
            action: 'EVENT_UPDATED',
            entityType: 'Event',
            entityId: eventId,
            beforeJson: {
              title: event.title,
              startsAt: event.startsAt.toISOString(),
              endsAt: event.endsAt?.toISOString() ?? null,
              capacity: event.capacity,
            },
            afterJson: {
              title: updated.title,
              startsAt: updated.startsAt.toISOString(),
              endsAt: updated.endsAt?.toISOString() ?? null,
              capacity: updated.capacity,
            },
            requestId,
          },
        });
        await tx.outboxEvent.create({
          data: {
            eventType: 'EVENT_UPDATED',
            aggregateType: 'Event',
            aggregateId: eventId,
            payload: { eventId, communityId: event.communityId },
          },
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async get(eventId: string, userId: string) {
    const event = await this.db.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        community: { memberships: { some: { userId, status: 'ACTIVE' } } },
      },
      include: {
        community: true,
        createdBy: {
          select: { id: true, username: true, firstName: true, lastName: true, photoUrl: true },
        },
        playDetails: {
          include: {
            formations: {
              where: { deletedAt: null },
              include: { slots: true },
              orderBy: { updatedAt: 'desc' },
              take: 3,
            },
          },
        },
        watchDetails: { include: { homeClub: true, awayClub: true } },
        paymentMethods: { where: { enabled: true }, orderBy: { sortOrder: 'asc' } },
        rsvps: {
          include: { user: { include: { profile: true } }, paymentIntent: true },
          orderBy: { createdAt: 'asc' },
        },
        requests: {
          where: {
            deletedAt: null,
            status: { in: ['OPEN', 'PARTIAL'] },
            expiresAt: { gt: new Date() },
          },
        },
        rideOffers: {
          where: { deletedAt: null, status: { in: ['OPEN', 'FULL'] } },
          include: { matches: true },
        },
        fundraisers: {
          where: { deletedAt: null, status: 'OPEN' },
          include: { contributions: { where: { status: 'PAID' } } },
        },
        chatRoom: true,
      },
    });
    if (!event) return null;

    const waitlist = event.rsvps
      .filter((rsvp) => rsvp.status === 'WAITLISTED')
      .sort((a, b) => {
        const left = a.waitlistSequence ?? 9_999_999_999n;
        const right = b.waitlistSequence ?? 9_999_999_999n;
        return left < right ? -1 : left > right ? 1 : 0;
      });
    const positions = new Map(waitlist.map((rsvp, index) => [rsvp.id, index + 1]));

    const play = event.playDetails
      ? (() => {
          const { formations, ...details } = event.playDetails;
          return { details, formations };
        })()
      : { details: null, formations: [] };

    return {
      ...event,
      playDetails: play.details,
      formations: play.formations,
      rsvps: event.rsvps.map((rsvp) => ({
        ...rsvp,
        waitlistSequence: undefined,
        waitlistPosition: rsvp.status === 'WAITLISTED' ? (positions.get(rsvp.id) ?? null) : null,
      })),
    };
  }

  async communityIdForEvent(eventId: string) {
    return (
      (
        await this.db.event.findFirst({
          where: { id: eventId, deletedAt: null },
          select: { communityId: true },
        })
      )?.communityId ?? null
    );
  }

  async cancel(eventId: string, actorUserId: string, requestId: string, handle: TransactionHandle) {
    const tx = transactionClient(handle);
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
    const event = await tx.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: {
        rsvps: {
          where: { status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'WAITLISTED'] } },
          include: { paymentIntent: true },
        },
      },
    });
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
    if (event.status === 'CANCELLED') {
      return { event, pendingPaymentIntentIds: [] };
    }

    const pendingPaymentIntentIds: string[] = [];
    const cancellableRsvpIds: string[] = [];
    for (const rsvp of event.rsvps) {
      if (
        rsvp.paymentIntent &&
        ['CREATED', 'AWAITING_PAYMENT', 'AWAITING_CASH'].includes(rsvp.paymentIntent.status)
      ) {
        pendingPaymentIntentIds.push(rsvp.paymentIntent.id);
        cancellableRsvpIds.push(rsvp.id);
        continue;
      }
      if (!rsvp.paymentIntent || rsvp.status === 'WAITLISTED') {
        cancellableRsvpIds.push(rsvp.id);
      }
      // A confirmed RSVP with a PAID intent deliberately remains confirmed until the
      // cash settlement is explicitly voided/refunded. This preserves refund history.
    }

    if (cancellableRsvpIds.length) {
      await tx.eventRsvp.updateMany({
        where: { id: { in: cancellableRsvpIds } },
        data: { status: 'CANCELLED' },
      });
    }

    const updated = await tx.event.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        communityId: event.communityId,
        action: 'EVENT_CANCELLED',
        entityType: 'Event',
        entityId: eventId,
        beforeJson: { status: event.status },
        afterJson: { status: 'CANCELLED' },
        requestId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: 'EVENT_CANCELLED',
        aggregateType: 'Event',
        aggregateId: eventId,
        payload: { eventId, communityId: event.communityId },
      },
    });
    return { event: updated, pendingPaymentIntentIds };
  }
}

export class PrismaRsvpRepository implements RsvpRepository {
  async prepareJoin(
    eventId: string,
    userId: string,
    paymentMethod: 'CASH' | undefined,
    handle: TransactionHandle,
  ): Promise<RsvpJoinPreparation> {
    const tx = transactionClient(handle);
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;

    const event = await tx.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { playDetails: true, paymentMethods: { where: { enabled: true } } },
    });
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
    if (event.status !== 'PUBLISHED') {
      throw new AppError(409, 'EVENT_NOT_OPEN', 'This event is not open for RSVP.');
    }

    const membership = await tx.membership.findUnique({
      where: { communityId_userId: { communityId: event.communityId, userId } },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new AppError(403, 'COMMUNITY_ACCESS_DENIED', 'Not an active member of this community');
    }

    const existing = await tx.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
      include: { paymentIntent: true },
    });
    if (existing && ['CONFIRMED', 'PENDING_PAYMENT', 'WAITLISTED'].includes(existing.status)) {
      return { kind: 'COMPLETE', result: existing };
    }

    const isPaid =
      event.type === 'PLAY' &&
      event.playDetails?.paymentRequired === true &&
      event.playDetails.entryFeeMinor > 0n;
    const cashAccepted = event.paymentMethods.some(
      (method) => method.method === 'CASH' && method.enabled,
    );
    if (isPaid && (paymentMethod !== 'CASH' || !cashAccepted)) {
      throw new AppError(400, 'PAYMENT_METHOD_REQUIRED', 'Choose an accepted payment method.');
    }

    const occupied = await tx.eventRsvp.count({
      where: { eventId, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
    });
    const isFull = event.capacity != null && occupied >= event.capacity;
    if (isFull) {
      if (!event.waitlistEnabled) {
        throw new AppError(409, 'EVENT_FULL', 'This match is currently full.');
      }
      const max = await tx.eventRsvp.aggregate({
        where: { eventId, status: 'WAITLISTED' },
        _max: { waitlistSequence: true },
      });
      const sequence = (max._max.waitlistSequence ?? 0n) + 1n;
      const rsvp = await tx.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: {
          eventId,
          userId,
          status: 'WAITLISTED',
          preferredPaymentMethod: isPaid ? 'CASH' : null,
          waitlistSequence: sequence,
        },
        update: {
          status: 'WAITLISTED',
          preferredPaymentMethod: isPaid ? 'CASH' : null,
          waitlistSequence: sequence,
          seatHoldExpiresAt: null,
          paymentIntentId: null,
        },
      });
      return { kind: 'COMPLETE', result: rsvp };
    }

    if (!isPaid) {
      const rsvp = await tx.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, status: 'CONFIRMED' },
        update: {
          status: 'CONFIRMED',
          preferredPaymentMethod: null,
          waitlistSequence: null,
          paymentIntentId: null,
        },
      });
      return { kind: 'COMPLETE', result: rsvp };
    }

    const rsvpStatus =
      event.cashRsvpPolicy === 'REQUIRE_CASH_CONFIRMATION' ? 'PENDING_PAYMENT' : 'CONFIRMED';
    const rsvp = await tx.eventRsvp.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: {
        eventId,
        userId,
        status: rsvpStatus,
        preferredPaymentMethod: 'CASH',
      },
      update: {
        status: rsvpStatus,
        preferredPaymentMethod: 'CASH',
        waitlistSequence: null,
        paymentIntentId: null,
      },
    });

    return {
      kind: 'PAYMENT_REQUIRED',
      rsvpId: rsvp.id,
      userId,
      communityId: event.communityId,
      amountMinor: event.playDetails!.entryFeeMinor,
      currency: event.playDetails!.currency,
      rsvpStatus,
    };
  }

  attachPayment(rsvpId: string, paymentIntentId: string, handle: TransactionHandle) {
    return transactionClient(handle).eventRsvp.update({
      where: { id: rsvpId },
      data: { paymentIntentId },
      include: { paymentIntent: true },
    });
  }

  async cancelAndPreparePromotion(
    eventId: string,
    userId: string,
    handle: TransactionHandle,
  ): Promise<RsvpCancellationPreparation> {
    const tx = transactionClient(handle);
    await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
    const event = await tx.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { playDetails: true, paymentMethods: { where: { enabled: true } } },
    });
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');

    const rsvp = await tx.eventRsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!rsvp || rsvp.status === 'CANCELLED') {
      throw new AppError(404, 'RSVP_NOT_FOUND', 'Active RSVP not found');
    }

    const releasedSeat = ['CONFIRMED', 'PENDING_PAYMENT'].includes(rsvp.status);
    await tx.eventRsvp.update({ where: { id: rsvp.id }, data: { status: 'CANCELLED' } });

    if (!releasedSeat) {
      return {
        cancelled: true,
        cancelledPaymentIntentId: rsvp.paymentIntentId,
        promotedRsvpId: null,
        promotedPayment: null,
      };
    }

    const promote = await tx.eventRsvp.findFirst({
      where: { eventId, status: 'WAITLISTED' },
      orderBy: [{ waitlistSequence: 'asc' }, { createdAt: 'asc' }],
    });
    if (!promote) {
      return {
        cancelled: true,
        cancelledPaymentIntentId: rsvp.paymentIntentId,
        promotedRsvpId: null,
        promotedPayment: null,
      };
    }

    const isPaid =
      event.type === 'PLAY' &&
      event.playDetails?.paymentRequired === true &&
      event.playDetails.entryFeeMinor > 0n;
    if (!isPaid) {
      await tx.eventRsvp.update({
        where: { id: promote.id },
        data: { status: 'CONFIRMED', waitlistSequence: null },
      });
      return {
        cancelled: true,
        cancelledPaymentIntentId: rsvp.paymentIntentId,
        promotedRsvpId: promote.id,
        promotedPayment: null,
      };
    }

    const cashAccepted = event.paymentMethods.some(
      (method) => method.method === 'CASH' && method.enabled,
    );
    if (!cashAccepted || promote.preferredPaymentMethod !== 'CASH') {
      throw new AppError(
        409,
        'WAITLIST_PAYMENT_METHOD_UNAVAILABLE',
        'The next waitlisted player no longer has an accepted payment method.',
      );
    }

    const promotedStatus =
      event.cashRsvpPolicy === 'REQUIRE_CASH_CONFIRMATION' ? 'PENDING_PAYMENT' : 'CONFIRMED';
    await tx.eventRsvp.update({
      where: { id: promote.id },
      data: { status: promotedStatus, waitlistSequence: null },
    });

    return {
      cancelled: true,
      cancelledPaymentIntentId: rsvp.paymentIntentId,
      promotedRsvpId: promote.id,
      promotedPayment: {
        rsvpId: promote.id,
        userId: promote.userId,
        communityId: event.communityId,
        amountMinor: event.playDetails!.entryFeeMinor,
        currency: event.playDetails!.currency,
        rsvpStatus: promotedStatus,
      },
    };
  }

  async markPaymentSettled(rsvpId: string, handle: TransactionHandle): Promise<void> {
    const tx = transactionClient(handle);
    await tx.eventRsvp.updateMany({
      where: { id: rsvpId, status: 'PENDING_PAYMENT' },
      data: { status: 'CONFIRMED' },
    });
  }

  async markPaymentRefunded(rsvpId: string, handle: TransactionHandle): Promise<void> {
    const tx = transactionClient(handle);
    await tx.eventRsvp.updateMany({
      where: { id: rsvpId, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
      data: { status: 'REFUNDED' },
    });
  }

  async markPaymentCancelled(rsvpId: string, handle: TransactionHandle): Promise<void> {
    const tx = transactionClient(handle);
    await tx.eventRsvp.updateMany({
      where: { id: rsvpId, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED' },
    });
  }
}
