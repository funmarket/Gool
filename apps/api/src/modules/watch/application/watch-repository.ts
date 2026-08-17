import type { z } from 'zod';
import type { checkInSchema, fanHubCreateSchema, venueDealCreateSchema } from '@hooma/contracts';

export type FanHubCreateInput = z.infer<typeof fanHubCreateSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type VenueDealCreateInput = z.infer<typeof venueDealCreateSchema>;

export interface WatchRepository {
  listClubs(input: { countryCode?: string; query?: string; limit: number }): Promise<unknown>;
  listHubs(
    userId: string,
    input: { communityId?: string; clubId?: string; limit: number },
  ): Promise<unknown>;
  createHub(userId: string, input: FanHubCreateInput): Promise<unknown>;
  getEventForCheckIn(
    eventId: string,
    userId: string,
  ): Promise<{
    id: string;
    communityId: string;
    latitude: number | null;
    longitude: number | null;
  } | null>;
  getFanHub(fanHubId: string): Promise<{
    id: string;
    communityId: string | null;
    latitude: number;
    longitude: number;
  } | null>;
  upsertCheckIn(userId: string, eventId: string, input: CheckInInput): Promise<unknown>;
  unlockedDeals(userId: string, eventId: string): Promise<unknown>;
  createDeal(userId: string, input: VenueDealCreateInput): Promise<unknown>;
  listDeals(userId: string, eventId: string): Promise<unknown>;
}
