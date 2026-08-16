import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarPlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type {
  CursorPage,
  EventItem,
  FundPage,
  RequestPage,
  RideListResponse,
} from '../types/domain';
import { EventCard } from '../components/EventCard';
import { FundCupIcon, RequestFlagIcon, RideBallIcon } from '../components/icons/SoccerIcons';
import { ActionRow } from '../components/ui/ActionRow';

export function HomePage() {
  const navigate = useNavigate();
  const { active } = useCommunity();
  const id = active?.id;
  const events = useQuery({
    queryKey: ['events', id],
    queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${id}`),
    enabled: !!id,
  });
  const requests = useQuery({
    queryKey: ['requests', id],
    queryFn: () => get<RequestPage>(`/api/v1/requests?communityId=${id}`),
    enabled: !!id,
  });
  const rides = useQuery({
    queryKey: ['rides', id],
    queryFn: () => get<RideListResponse>(`/api/v1/rides?communityId=${id}`),
    enabled: !!id,
  });
  const funds = useQuery({
    queryKey: ['funds', id],
    queryFn: () => get<FundPage>(`/api/v1/fundraisers?communityId=${id}`),
    enabled: !!id,
  });
  const rideCount = (rides.data?.offers.length || 0) + (rides.data?.requests.length || 0);

  return (
    <div className="page-shell">
      <section
        className="relative overflow-hidden rounded-[30px] border p-6"
        style={{
          background: 'linear-gradient(145deg,var(--surface-2),var(--surface))',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="absolute -right-8 -top-10 h-40 w-40 rounded-full blur-3xl"
          style={{ background: 'var(--accent-soft)' }}
        />
        <span className="section-kicker flex items-center gap-1.5">
          <Sparkles size={13} /> Matchday command center
        </span>
        <h1 className="mt-2 max-w-md text-[34px] font-black leading-[1.02] tracking-[-.05em]">
          Play together. Watch together. Move as one.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 muted">
          {active
            ? `Everything happening inside ${active.name}, organized around real events.`
            : 'Create or join a GOOL community to get started.'}
        </p>
        <button className="accent-button mt-5" onClick={() => navigate('/events/new')}>
          <CalendarPlus size={18} /> Create event
        </button>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="section-kicker">Next up</div>
            <h2 className="section-title">Events</h2>
          </div>
          <button
            className="flex items-center gap-1 text-xs font-black"
            onClick={() => navigate('/play')}
            style={{ color: 'var(--accent)' }}
          >
            See all <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(events.data?.items || []).slice(0, 4).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {!events.isLoading && !events.data?.items.length && (
            <div className="surface-card col-span-full p-6 text-sm muted">
              No upcoming events yet. Create the first match or watch meetup.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="section-kicker">Matchday logistics</div>
        <h2 className="section-title mb-3">Community actions</h2>
        <div className="grid gap-3">
          <ActionRow
            icon={<RequestFlagIcon className="h-6 w-6" />}
            title="Requests"
            subtitle={`${requests.data?.items.length || 0} open · players, positions, equipment, help`}
            onClick={() => navigate('/requests')}
          />
          <ActionRow
            icon={<RideBallIcon className="h-6 w-6" />}
            title="Ride"
            subtitle={`${rideCount} active · offers and ride requests`}
            onClick={() => navigate('/rides')}
          />
          <ActionRow
            icon={<FundCupIcon className="h-6 w-6" />}
            title="FundMe"
            subtitle={`${funds.data?.items.length || 0} active · pitch fees, travel, tifo, equipment`}
            onClick={() => navigate('/fundme')}
          />
        </div>
      </section>
    </div>
  );
}
