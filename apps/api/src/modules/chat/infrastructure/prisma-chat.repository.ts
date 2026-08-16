import type { DatabaseClient } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../http/errors/app-error.js';
import { decodeTimeIdCursor, encodeTimeIdCursor } from '../../../infrastructure/database/cursor.js';
import type { ChatRepository } from '../application/chat-repository.js';

export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly db: DatabaseClient) {}

  async roomForEvent(eventId: string) {
    const room = await this.db.eventChatRoom.findUnique({
      where: { eventId },
      include: { event: { select: { communityId: true } } },
    });
    return room
      ? {
          id: room.id,
          eventId: room.eventId,
          opensAt: room.opensAt,
          closesAt: room.closesAt,
          communityId: room.event.communityId,
        }
      : null;
  }

  async listMessages(roomId: string, input: { cursor?: string; limit: number }) {
    const cursor = input.cursor ? decodeTimeIdCursor(input.cursor, 'Chat') : null;
    const rows = await this.db.eventChatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.at } },
                { createdAt: cursor.at, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
    });
    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;
    return {
      items,
      nextCursor:
        hasMore && items.at(-1)
          ? encodeTimeIdCursor(items.at(-1)!.createdAt, items.at(-1)!.id)
          : null,
    };
  }

  createMessage(roomId: string, userId: string, body: string) {
    return this.db.eventChatMessage.create({
      data: { roomId, userId, body },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
    });
  }

  async softDelete(messageId: string, userId: string, isAdmin: boolean) {
    const message = await this.db.eventChatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new AppError(404, 'CHAT_MESSAGE_NOT_FOUND', 'Message not found.');
    if (message.userId !== userId && !isAdmin) {
      throw new AppError(403, 'CHAT_DELETE_FORBIDDEN', 'You cannot delete this message.');
    }
    return this.db.eventChatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }
}
