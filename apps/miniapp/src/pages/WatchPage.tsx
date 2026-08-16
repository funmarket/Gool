import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LocateFixed, MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapPanel } from '../components/MapPanel';
import { EventCard } from '../components/EventCard';
import { get } from '../shared/api/http-client';
import { requestTelegramLocation } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import type { Club, CursorPage, EventItem } from '../types/domain';

type FanHub = {
  id: string;
  name: string;
  venueName: string;
  latitude: string | number;
  longitude: string | number;
  verified: boolean;
  clubs?: Array<{ club: Club }>;
};

export function WatchPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [clubId, setClubId] = useState('');
  const [center, setCenter] = useState<[number, number]>();

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

  const points = useMemo(
    () =>
      (hubs.data || []).map((hub) => ({
        id: hub.id,
        lat: Number(hub.latitude),
        lng: Number(hub.longitude),
        label: hub.venueName,
      })),
    [hubs.data],
  );

  const locate = async () => {
    const location = await requestTelegramLocation();
    setCenter([location.longitude, location.latitude]);
  };

  return (
    <div className="page-shell">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-kicker">Fan meetups</div>
          <h1 className="section-title">Watch</h1>
          <p className="mt-1 text-sm muted">Find your crowd, club and matchday venue.</p>
        </div>
        <button
          className="accent-button p-3"
          onClick={() => void navigate('/events/new?type=WATCH')}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="mt-5 flex gap-2">
        <select
          className="gool-input"
          value={clubId}
          onChange={(event) => setClubId(event.target.value)}
        >
          <option value="">All club allegiances</option>
          {clubs.data?.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
        <button
          className="ghost-button p-3"
          onClick={() => void locate()}
          aria-label="Use my location"
        >
          <LocateFixed size={18} />
        </button>
      </div>

      <div className="mt-4">
        <MapPanel points={points} {...(center ? { center } : {})} />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {hubs.data?.slice(0, 6).map((hub) => (
          <div key={hub.id} className="surface-card p-4">
            <div className="flex items-start gap-3">
              <span className="icon-well">
                <MapPin size={20} />
              </span>
              <div>
                <div className="font-black">{hub.venueName}</div>
                <div className="text-xs muted">
                  {hub.clubs?.map((link) => link.club.name).join(' · ') || 'All supporters'}
                  {hub.verified ? ' · Verified' : ''}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 mt-8">
        <div className="section-kicker">Match rooms</div>
        <h2 className="section-title">Upcoming watches</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {events.data?.items.map((event) => (
          <EventCard event={event} key={event.id} />
        ))}
      </div>
    </div>
  );
}
