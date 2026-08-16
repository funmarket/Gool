export interface ChatRepository {
  roomForEvent(eventId: string): Promise<{
    id: string;
    eventId: string;
    opensAt: Date;
    closesAt: Date;
    communityId: string;
  } | null>;
  listMessages(roomId: string, input: { cursor?: string; limit: number }): Promise<unknown>;
  createMessage(roomId: string, userId: string, body: string): Promise<unknown>;
  softDelete(messageId: string, userId: string, isAdmin: boolean): Promise<unknown>;
}
