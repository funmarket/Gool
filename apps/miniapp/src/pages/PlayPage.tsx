import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { List, LocateFixed, Map as MapIcon, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { MapPanel } from '../components/MapPanel';
import { requestTelegramLocation } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import { get } from '../shared/api/http-client';
import type { CursorPage, EventItem } from '../types/domain';

export function PlayPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [center, setCenter] = useState<[number, number]>();

  const query = useQuery({
    queryKey: ['events', active?.id, 'PLAY'],
    queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}&type=PLAY`),
    enabled: Boolean(active),
  });

  const points = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter((event) => event.latitude != null && event.longitude != null)
        .map((event) => ({
          id: event.id,
          lat: Number(event.latitude),
          lng: Number(event.longitude),
          label: event.title,
        })),
    [query.data],
  );

  const locate = async () => {
    try {
      const location = await requestTelegramLocation();
      setCenter([location.longitude, location.latitude]);
      setView('map');
    } catch {
      // Permission UI belongs to the host platform/browser.
    }
  };

  return (
    <div className="page-shell">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="section-kicker">Pickup football</div>
          <h1 className="section-title">Play</h1>
          <p className="mt-1 text-sm muted">One-tap RSVP, fair waitlists, balanced squads.</p>
        </div>
        <button
          className="accent-button p-3"
          onClick={() => void navigate('/events/new?type=PLAY')}
          aria-label="Create match"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          className="ghost-button py-2.5"
          onClick={() => setView('list')}
          style={view === 'list' ? { borderColor: 'var(--accent)' } : {}}
        >
          <List size={16} /> List
        </button>
        <button
          className="ghost-button py-2.5"
          onClick={() => setView('map')}
          style={view === 'map' ? { borderColor: 'var(--accent)' } : {}}
        >
          <MapIcon size={16} /> Map
        </button>
        <button className="ghost-button ml-auto p-3" onClick={() => void locate()}>
          <LocateFixed size={17} />
        </button>
      </div>

      {view === 'map' ? (
        <div className="mt-4">
          <MapPanel
            points={points}
            {...(center ? { center } : {})}
            onPoint={(id) => {
              void navigate(`/events/${id}`);
            }}
          />
          <p className="mt-2 text-[11px] muted">
            Field markers only appear for events with coordinates. Use a production tile provider
            before launch.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {query.data?.items.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      )}
    </div>
  );
}
