import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import type { FormationSaveInput, PlayRepository } from '../application/play-repository.js';
import { AppError } from '../../../http/errors/app-error.js';
export class PrismaPlayRepository implements PlayRepository {
  constructor(private readonly db: DatabaseClient) {}
  async getAccess(eventId: string) {
    const event = await this.db.event.findFirst({
      where: { id: eventId, type: 'PLAY', deletedAt: null },
      select: { id: true, communityId: true, createdByUserId: true },
    });
    return event
      ? {
          eventId: event.id,
          communityId: event.communityId,
          createdByUserId: event.createdByUserId,
        }
      : null;
  }
  async confirmedPlayers(eventId: string) {
    const rows = await this.db.eventRsvp.findMany({
      where: { eventId, status: 'CONFIRMED' },
      include: { user: { include: { profile: true } } },
    });
    return rows.map(({ user }) => ({
      id: user.id,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'GOOL player',
      rating: user.profile?.skillRating ?? 50,
      preferredPositions: user.profile?.preferredPositions ?? [],
    }));
  }
  listFormations(eventId: string) {
    return this.db.formation.findMany({
      where: { playEventId: eventId, deletedAt: null },
      include: {
        slots: {
          include: {
            user: {
              select: { id: true, username: true, firstName: true, lastName: true, photoUrl: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
  async createFormation(userId: string, eventId: string, input: FormationSaveInput) {
    return this.db.formation.create({
      data: {
        playEventId: eventId,
        createdByUserId: userId,
        name: input.name,
        format: input.format,
        published: input.published,
        slots: {
          create: input.slots.map((slot) => ({
            userId: slot.userId || null,
            team: slot.team,
            position: slot.position,
            label: slot.label,
            x: slot.x,
            y: slot.y,
          })),
        },
      },
      include: { slots: true },
    });
  }
  async updateFormation(formationId: string, input: FormationSaveInput) {
    return this.db.$transaction(async (tx) => {
      const formation = await tx.formation.findFirst({
        where: { id: formationId, deletedAt: null },
      });
      if (!formation) throw new AppError(404, 'FORMATION_NOT_FOUND', 'Formation not found.');
      await tx.formationSlot.deleteMany({ where: { formationId } });
      return tx.formation.update({
        where: { id: formationId },
        data: {
          name: input.name,
          format: input.format,
          published: input.published,
          slots: {
            create: input.slots.map((slot) => ({
              userId: slot.userId || null,
              team: slot.team,
              position: slot.position,
              label: slot.label,
              x: slot.x,
              y: slot.y,
            })),
          },
        },
        include: { slots: true },
      });
    });
  }
  publishFormation(formationId: string) {
    return this.db.formation.update({ where: { id: formationId }, data: { published: true } });
  }
}
