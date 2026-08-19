import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { useCommunity } from '../providers/CommunityProvider';
import { get } from '../shared/api/http-client';
import type { CursorPage, EventItem } from '../types/domain';

export function EventsPage() {
  const navigate = useNavigate();
  const { active, isLoading: communityIsLoading } = useCommunity();
  const query = useQuery({
    queryKey: ['events', active?.id],
    queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}`),
    enabled: Boolean(active),
  });

  const events = query.data?.items ?? [];
  const playEvents = events.filter((event) => event.type === 'PLAY');
  const watchEvents = events.filter((event) => event.type === 'WATCH');

  if (communityIsLoading) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Loading events…</div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-kicker">Events</div>
        <h1 className="vintage-display">All events</h1>
        <div className="vintage-empty mt-5">
          <strong>No community selected.</strong>
          <small>Create or join a HOOMA community to see Play and Watch events.</small>
          <button type="button" className="vintage-outline-cta mt-4" onClick={() => navigate('/community/new')}>
            Create or join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell vintage-page">
      <div className="vintage-kicker">Events</div>
      <h1 className="vintage-display">All events</h1>
      <p className="vintage-copy mt-2 text-sm">
        Browse pickup matches and watch gatherings for {active.name}.
      </p>

      {query.isLoading ? (
        <div className="vintage-empty mt-5">Loading events…</div>
      ) : query.isError ? (
        <div className="vintage-empty mt-5">Events could not be loaded.</div>
      ) : events.length ? (
        <div className="mt-5 grid gap-6">
          {playEvents.length ? (
            <section aria-labelledby="events-play-title" className="grid gap-3">
              <div className="vintage-section-heading">
                <div>
                  <div className="vintage-kicker">Pickup matches</div>
                  <h2 id="events-play-title" className="vintage-section-title">
                    Play
                  </h2>
                </div>
              </div>
              <div className="grid gap-3">
                {playEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="vintage" />
                ))}
              </div>
            </section>
          ) : null}

          {watchEvents.length ? (
            <section aria-labelledby="events-watch-title" className="grid gap-3">
              <div className="vintage-section-heading">
                <div>
                  <div className="vintage-kicker">Watch together</div>
                  <h2 id="events-watch-title" className="vintage-section-title">
                    Watch
                  </h2>
                </div>
              </div>
              <div className="grid gap-3">
                {watchEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="vintage" />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="vintage-empty mt-5">
          <strong>No events yet.</strong>
          <small>Create the first pickup match or watch event for this community.</small>
          <button
            type="button"
            className="vintage-outline-cta mt-4"
            onClick={() => navigate('/events/new')}
          >
            Create event
          </button>
        </div>
      )}
    </div>
  );
}
