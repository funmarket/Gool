import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, CarFront, Flag, Plus, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type { CursorPage, EventItem, FundPage, RequestPage, RideListResponse } from '../types/domain';
import { EventCard } from '../components/EventCard';

export function HomePage() {
  const navigate = useNavigate();
  const { active } = useCommunity();
  const id = active?.id;
  const events = useQuery({ queryKey: ['events', id], queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${id}`), enabled: !!id });
  const requests = useQuery({ queryKey: ['requests', id], queryFn: () => get<RequestPage>(`/api/v1/requests?communityId=${id}`), enabled: !!id });
  const rides = useQuery({ queryKey: ['rides', id], queryFn: () => get<RideListResponse>(`/api/v1/rides?communityId=${id}`), enabled: !!id });
  const funds = useQuery({ queryKey: ['funds', id], queryFn: () => get<FundPage>(`/api/v1/fundraisers?communityId=${id}`), enabled: !!id });
  const rideCount = (rides.data?.offers.length || 0) + (rides.data?.requests.length || 0);
  const quick = [
    { label: 'Teams', note: 'Manage squads', icon: Users, to: '/community' },
    { label: 'Requests', note: `${requests.data?.items.length || 0} open`, icon: Flag, to: '/requests' },
    { label: 'Ride', note: `${rideCount} active`, icon: CarFront, to: '/rides' },
    { label: 'FundMe', note: `${funds.data?.items.length || 0} active`, icon: Trophy, to: '/fundme' },
  ];
  return (
    <div className="page-shell vintage-page">
      <section className="border-b vintage-rule pb-6 pt-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="vintage-kicker">Matchday command center</div>
            <h1 className="vintage-display mt-2 text-[48px] leading-[.88] sm:text-[62px]">Matchday<br/><span style={{ color: 'var(--hv-lime)' }}>command center</span></h1>
            <p className="mt-4 max-w-lg text-sm leading-6 muted">Play together. Watch together. Move as one.<br/>{active ? `Everything happening inside ${active.name}.` : 'Create or join a HOOMA community to get started.'}</p>
          </div>
          <button className="vintage-cta shrink-0 px-4" onClick={() => navigate('/events/new')}><Plus size={20}/> <span className="hidden sm:inline">Create a Match</span></button>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <div><div className="vintage-kicker">Next up</div><h2 className="vintage-display text-[30px]">Events</h2></div>
          <button className="flex items-center gap-1 text-sm font-black" style={{ color: 'var(--hv-lime)' }} onClick={() => navigate('/play')}>See all <ArrowRight size={16}/></button>
        </div>
        {(events.data?.items || []).length ? <div className="grid gap-3 sm:grid-cols-2">{(events.data?.items || []).slice(0, 4).map((event) => <EventCard key={event.id} event={event}/>)}</div> : !events.isLoading && <div className="vintage-empty flex items-center gap-4 p-5"><span className="vintage-icon"><CalendarDays/></span><div><strong className="block text-[var(--hv-cream)]">No upcoming events yet.</strong><span className="text-sm">Create the first match or watch meetup.</span></div></div>}
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quick.map(({ label, note, icon: Icon, to }) => <button key={label} className="vintage-action min-h-[142px] p-4 text-left" onClick={() => navigate(to)}><span className="vintage-icon"><Icon size={24}/></span><strong className="mt-4 block text-lg text-[var(--hv-cream)]">{label}</strong><span className="text-xs muted">{note}</span></button>)}
      </section>

      <section className="mt-8">
        <div className="vintage-kicker">Matchday logistics</div><h2 className="vintage-display mb-3 text-[30px]">Community actions</h2>
        <div className="grid gap-3">
          {[['Requests', `${requests.data?.items.length || 0} open · players, positions, equipment, help`, Flag, '/requests'], ['Ride', `${rideCount} active · offers and ride requests`, CarFront, '/rides'], ['FundMe', `${funds.data?.items.length || 0} active · pitch fees, travel, tifo, equipment`, Trophy, '/fundme']].map(([title, subtitle, Icon, to]) => <button key={String(title)} className="vintage-action flex min-h-[86px] items-center gap-4 p-4 text-left" onClick={() => navigate(String(to))}><span className="vintage-icon"><Icon size={23}/></span><span className="min-w-0 flex-1"><strong className="block text-lg text-[var(--hv-cream)]">{String(title)}</strong><span className="text-xs muted">{String(subtitle)}</span></span><ArrowRight style={{ color: 'var(--hv-lime)' }}/></button>)}
        </div>
      </section>
    </div>
  );
}
