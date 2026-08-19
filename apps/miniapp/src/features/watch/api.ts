import { checkInSchema } from '@hooma/contracts';
import { get, post } from '../../shared/api/http-client';
import type { Club, FanHub } from '../../types/domain';

export type WatchCheckInResult = {
  checkIn: unknown;
  distanceMeters: number;
  unlockedDeals: Array<{
    id: string;
    title: string;
    description?: string | null;
    redemptionCode?: string | null;
  }>;
};

export const watchQueryKeys = {
  clubs: () => ['clubs'] as const,
  hubs: (communityId?: string) => ['watch-hubs', communityId] as const,
};

export function listWatchClubs(limit = 100) {
  return get<Club[]>(`/api/v1/watch/clubs?limit=${limit}`);
}

export function listWatchHubs(communityId: string) {
  const params = new URLSearchParams({ communityId });
  return get<FanHub[]>(`/api/v1/watch/hubs?${params.toString()}`);
}

export function checkInToWatchEvent(
  eventId: string,
  input: { latitude: number; longitude: number; fanHubId?: string },
) {
  return post<WatchCheckInResult>(
    `/api/v1/watch/events/${eventId}/check-in`,
    checkInSchema.parse(input),
  );
}
