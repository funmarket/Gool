import type { EventItem } from '../types/domain';

export function watchEventMatchesFilters(
  event: EventItem,
  filters: { clubId?: string; query?: string },
) {
  const clubId = filters.clubId?.trim();
  const query = filters.query?.trim().toLowerCase();
  const matchesClub =
    !clubId ||
    event.watchDetails?.homeClubId === clubId ||
    event.watchDetails?.awayClubId === clubId;
  const matchesSearch =
    !query ||
    (() => {
      const place = event.watchDetails?.fanHub?.place;
      return [
        event.title,
        event.watchDetails?.homeClub?.name,
        event.watchDetails?.awayClub?.name,
        event.watchDetails?.fanHub?.name,
        event.watchDetails?.fanHub?.venueName,
        place?.name,
        place?.category,
        place?.city,
        place?.houma,
        place?.address,
        event.venueName,
        event.address,
      ];
    })()
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));

  return matchesClub && matchesSearch;
}
