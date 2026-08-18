import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { WatchHero } from '../components/hero/WatchHero';
import { WatchCreateButton } from '../components/watch/WatchCreateButton';
import { WatchSearchControls } from '../components/watch/WatchSearchControls';
import { VintageCollectorTicket } from '../components/ticket/VintageCollectorTicket';
import { get } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type { Club, CursorPage, EventItem } from '../types/domain';

type FanHub = {
  id: string;
  name: string;
  venueName: string;
  verified: boolean;
  photoUrl?: string | null;
  clubs?: Array<{ club: Club }>;
};

function dateParts(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export function WatchPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [clubId, setClubId] = useState('');
  const [search, setSearch] = useState('');
  const clubs = useQuery({
    queryKey: ['clubs'],
    queryFn: () => get<Club[]>('/api/v1/watch/clubs?limit=100'),
  });
  const events = useQuery({
    queryKey: ['events', active?.id, 'WATCH'],
    queryFn: () =>
      get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}&type=WATCH`),
    enabled: Boolean(active),
  });
  const hubs = useQuery({
    queryKey: ['hubs', active?.id, clubId],
    queryFn: () =>
      get<FanHub[]>(
        `/api/v1/watch/hubs?communityId=${active?.id}${clubId ? `&clubId=${encodeURIComponent(clubId)}` : ''}`,
      ),
    enabled: Boolean(active),
  });
  const query = search.trim().toLowerCase();
  const visibleEvents = (events.data?.items ?? []).filter(
    (event) =>
      !query ||
      [
        event.title,
        event.watchDetails?.homeClub?.name,
        event.watchDetails?.awayClub?.name,
        event.venueName,
        event.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
  );
  const visibleHubs = (hubs.data ?? []).filter(
    (hub) =>
      !query ||
      [hub.name, hub.venueName, hub.clubs?.map((link) => link.club.name).join(' ')]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
  );
  const hasError = clubs.isError || events.isError || hubs.isError;

  return (
    <div className="page-shell vintage-page">
      <div className="grid gap-4">
        <WatchHero />
        <WatchCreateButton onClick={() => navigate('/events/new?type=WATCH')} />
        <WatchSearchControls
          search={search}
          onSearchChange={setSearch}
          clubId={clubId}
          clubs={(clubs.data ?? []).map((club) => ({ id: club.id, name: club.name }))}
          onClubChange={setClubId}
        />
        {hasError && (
          <div className="vintage-empty" role="alert">
            <strong>Watch data unavailable.</strong>
            <small>
              The page keeps the real server data contract and does not insert demo events.
            </small>
          </div>
        )}
        <section className="grid gap-3" aria-label="Watch events">
          {events.isLoading ? (
            <div className="vintage-empty">Loading collector tickets…</div>
          ) : visibleEvents.length ? (
            visibleEvents.map((event, index) => {
              const hub = visibleHubs.length ? visibleHubs[index % visibleHubs.length] : undefined;
              const home = event.watchDetails?.homeClub;
              const away = event.watchDetails?.awayClub;
              const parts = dateParts(event.startsAt);
              return (
                <VintageCollectorTicket
                  key={event.id}
                  collectorNumber={index + 1}
                  matchTitle={event.title}
                  teamAName={home?.name || 'Home'}
                  teamBName={away?.name || 'Away'}
                  teamALogoUrl={home?.logoUrl}
                  teamBLogoUrl={away?.logoUrl}
                  venueName={event.venueName || hub?.venueName || 'Venue TBA'}
                  venueLocation={event.address || active?.name || 'Location TBA'}
                  dateLabel={parts.date}
                  timeLabel={parts.time}
                  goingCount={event._count?.rsvps ?? 0}
                  officialVenue={hub?.verified === true}
                  suggestedByCommunity={Boolean(hub) && hub?.verified !== true}
                  stubLabel={event.title}
                  venuePhotoUrl={hub?.photoUrl}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              );
            })
          ) : (
            <div className="vintage-empty">
              <strong>No watch events yet.</strong>
              <small>
                Create a real watch event and it will appear as a collector ticket here.
              </small>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
