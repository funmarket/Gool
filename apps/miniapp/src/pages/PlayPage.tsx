import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { List, LocateFixed, Map as MapIcon, Plus, Users } from 'lucide-react';
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
        .map((event) => ({ id: event.id, lat: Number(event.latitude), lng: Number(event.longitude), label: event.title })),
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
    <div className="page-shell vintage-page">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="vintage-kicker">Pickup football</div>
          <h1 className="vintage-display mt-1 text-5xl">Play</h1>
          <p className="vintage-copy mt-1 text-sm">Find a game. Join the players. Get on the pitch.</p>
        </div>
        <button className="vintage-outline-cta !min-h-11 !px-4" onClick={() => void navigate('/events/new?type=PLAY')}>
          <Plus size={19} /> Create match
        </button>
      </div>

      {/* Players is the new discovery layer. Do not fabricate player listings in the client.
          Codex/local implementation should connect this section to the real player-listing API/store
          when that source exists, showing only explicitly public photo/age/city/houma/contact fields. */}
      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="vintage-kicker">Looking to play</div>
            <h2 className="vintage-section-title mt-1 text-2xl">Players</h2>
          </div>
          <button className="vintage-outline-cta !min-h-10 !px-3 text-xs" disabled title="Connect to the player-listing source before enabling">
            <Users size={16} /> Players
          </button>
        </div>
        <div className="vintage-empty mt-3 px-5 py-5">
          <strong className="block text-sm text-white">Player listings belong here.</strong>
          <p className="mt-1 text-xs leading-5">Use real published listings only: photo, display name, optional public age, city, Houma, looking for Match/Team/Both, and only contact methods the player explicitly publishes.</p>
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="vintage-kicker">Pickup requests</div>
            <h2 className="vintage-section-title mt-1 text-2xl">Open matches</h2>
          </div>
          <div className="flex gap-2">
            <button className="vintage-control flex items-center gap-2 px-3 text-xs font-bold" onClick={() => setView('list')} style={view === 'list' ? { borderColor: 'var(--hv-lime)' } : {}}><List size={16} /> List</button>
            <button className="vintage-control flex items-center gap-2 px-3 text-xs font-bold" onClick={() => setView('map')} style={view === 'map' ? { borderColor: 'var(--hv-lime)' } : {}}><MapIcon size={16} /> Map</button>
            <button className="vintage-control grid w-[50px] place-items-center" onClick={() => void locate()} aria-label="Use my location"><LocateFixed size={17} /></button>
          </div>
        </div>

        {view === 'map' ? (
          <div className="mt-4">
            <MapPanel points={points} {...(center ? { center } : {})} onPoint={(id) => void navigate(`/events/${id}`)} />
            <p className="vintage-copy mt-2 text-[11px]">Field markers appear for events with coordinates.</p>
          </div>
        ) : (
          <div className="vintage-match-card-wrap mt-4 grid gap-3 sm:grid-cols-2">
            {query.data?.items.map((event) => <EventCard event={event} key={event.id} />)}
          </div>
        )}
      </section>
    </div>
  );
}
