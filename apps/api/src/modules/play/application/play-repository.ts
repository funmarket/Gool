import type { z } from 'zod';
import type { formationSaveSchema } from '@hooma/contracts';
export type FormationSaveInput = z.infer<typeof formationSaveSchema>;
export interface PlayEventAccess {
  eventId: string;
  communityId: string;
  createdByUserId: string;
}
export interface PlayRepository {
  getAccess(eventId: string): Promise<PlayEventAccess | null>;
  confirmedPlayers(
    eventId: string,
  ): Promise<Array<{ id: string; name: string; rating: number; preferredPositions: string[] }>>;
  listFormations(eventId: string): Promise<unknown>;
  createFormation(userId: string, eventId: string, input: FormationSaveInput): Promise<unknown>;
  updateFormation(formationId: string, input: FormationSaveInput): Promise<unknown>;
  publishFormation(formationId: string): Promise<unknown>;
}
