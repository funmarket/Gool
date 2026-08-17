import { CalendarDays, MapPin, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { EventItem } from '../../types/domain';

type VintageWatchTicketProps = {
  event: EventItem;
  venueName?: string | null;
  venuePhotoUrl?: string | null;
  locationDetail?: string | null;
  officialVenue?: boolean;
  collectorNumber?: number;
};

function safeText(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function splitTeams(event: EventItem) {
  const home = event.watchDetails?.homeClub?.name;
  const away = event.watchDetails?.awayClub?.name;
  if (home && away) return { teamA: home, teamB: away, title: event.title };

  const parts = event.title.split(/\s+vs\s+/i);
  return {
    teamA: safeText(parts[0], event.title),
    teamB: safeText(parts[1], ''),
    title: event.title,
  };
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: 'Date TBA', timeLabel: 'Time TBA', stubLabel: 'TBA' };
  }

  return {
    dateLabel: new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(date),
    timeLabel: new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
    stubLabel: new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
    })
      .format(date)
      .toUpperCase(),
  };
}

export function VintageWatchTicket({
  event,
  venueName,
  venuePhotoUrl,
  locationDetail,
  officialVenue = false,
  collectorNumber = 1,
}: VintageWatchTicketProps) {
  const navigate = useNavigate();
  const { teamA, teamB, title } = splitTeams(event);
  const { dateLabel, timeLabel, stubLabel } = dateParts(event.startsAt);
  const venue = safeText(venueName ?? event.venueName, 'Watch venue');
  const location = safeText(
    locationDetail ?? event.address ?? event.community?.name,
    'Location details not provided',
  );
  const going = event._count?.rsvps ?? 0;

  return (
    <button
      type="button"
      className="hv-ticket"
      onClick={() => navigate(`/events/${event.id}`)}
      aria-label={`Open ${event.title}`}
    >
      <span className="hv-ticket-photo">
        {venuePhotoUrl ? (
          <img src={venuePhotoUrl} alt={venue} />
        ) : (
          <span className="hv-ticket-photo-placeholder" aria-label="Venue photo not provided">
            <span>{venue}</span>
          </span>
        )}
        <span className="hv-ticket-badge">
          {officialVenue ? 'Official venue' : 'Suggested by community'}
        </span>
      </span>

      <span className="hv-ticket-main">
        <span className="hv-ticket-meta-top">
          <span>Collector series</span>
          <span>No. {String(collectorNumber).padStart(4, '0')} ★</span>
        </span>

        <span className="hv-ticket-match">
          <span className="hv-club-crest hv-club-crest--home" aria-hidden>
            {teamA.slice(0, 2).toUpperCase()}
          </span>
          <span className="hv-ticket-title-wrap">
            <span className="hv-ticket-title">{title}</span>
            <span className="hv-ticket-teams">
              <span className="team-a">{teamA}</span>
              {teamB && (
                <>
                  <span className="vs">vs</span>
                  <span className="team-b">{teamB}</span>
                </>
              )}
            </span>
          </span>
          <span className="hv-club-crest hv-club-crest--away" aria-hidden>
            {(teamB || 'HC').slice(0, 2).toUpperCase()}
          </span>
        </span>

        <span className="hv-ticket-details">
          <span className="hv-ticket-place">
            <MapPin size={17} strokeWidth={2.6} />
            <span>
              <strong>{venue}</strong>
              <span>{location}</span>
            </span>
          </span>

          <span className="hv-ticket-date">
            <CalendarDays size={17} strokeWidth={2.6} />
            <span>
              <strong>{dateLabel}</strong>
              <span>{timeLabel}</span>
            </span>
          </span>
        </span>

        <span className="hv-ticket-footer">
          <span className="hv-going">
            <UsersRound size={18} strokeWidth={2.8} />
            {going} going
          </span>
          <span className={`hv-status-stamp ${officialVenue ? '' : 'hv-status-stamp--community'}`}>
            {officialVenue ? 'Official venue' : 'Community pick'}
          </span>
        </span>
      </span>

      <span className="hv-ticket-stub" aria-hidden>
        <span>
          {title} · {stubLabel}
        </span>
      </span>

      <span className="hv-ticket-edge" aria-hidden />
    </button>
  );
}
