import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, CarFront, Flag, Plus, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type { CursorPage, EventItem, FundPage, RequestPage, RideListResponse } from '../types/domain';
import { EventCard } from '../components/EventCard';

/**
 * VISUAL REFERENCE ONLY.
 * Current local HomePage data/state/routes are authoritative and must be traced before porting this styling.
 * Do not replace the current local AppHeader or BottomNav from this branch.
 * Do not add MapPanel or any map dependency.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { active } = useCommunity();
  const id = active?.id;
  const events = useQuery({ queryKey: ['events', id], queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${id}`), enabled: !!id });
  const requests = useQuery({ queryKey: ['requests', id], queryFn: () => get<RequestPage>(`/api/v1/requests?communityId=${id}`), enabled: !!id });
  const rides = useQuery({ queryKey: ['rides', id], queryFn: () => get<RideListResponse>(`/api/v1/rides?communityId=${id}`), enabled: !!id });
  const funds = useQuery({ queryKey: ['funds', id], queryFn: () => get<FundPage>(`/api/v1/fundraisers?communityId=${id}`), enabled: !!id });
  const rideCount = (rides.data?.offers.length || 0) + (rides.data?.requests.length || 0);

  // These four are the one and only Home action group. Do not recreate a second "Community Actions" group.
  const quick = [
    { label: 'Teams', note: 'Manage squads', icon: Users, to: '/teams' },
    { label: 'Requests', note: `${requests.data?.items.length || 0} open`, icon: Flag, to: '/requests' },
    { label: 'Ride', note: `${rideCount} active`, icon: CarFront, to: '/rides' },
    { label: 'FundMe', note: `${funds.data?.items.length || 0} active`, icon: Trophy, to: '/fundme' },
  ];

  return (
    <div className="page-shell vintage-page">
      <section className="vintage-home-hero pt-3">
        <div className="relative z-[1] flex items-start justify-between gap-4">
          <div className="max-w-[520px]">
            <h1 className="vintage-home-title text-[58px] leading-[.9] sm:text-[72px]">Match Day</h1>
            <p className="vintage-copy mt-4 text-sm leading-6">Play together. Watch together. Move as one.<br />{active ? `Everything happening inside ${active.name}.` : 'Create or join a HOOMA community to get started.'}</p>
          </div>
          <button className="vintage-outline-cta shrink-0" onClick={() => navigate('/events/new')}><Plus size={20} /><span className="hidden sm:inline">Create a Match</span></button>
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <div><div className="vintage-kicker">Next up</div><h2 className="vintage-section-title text-[30px]">Events</h2></div>
          <button className="flex items-center gap-1 text-sm font-black text-[var(--hv-lime)]" onClick={() => navigate('/play')}>See all <ArrowRight size={16} /></button>
        </div>
        {(events.data?.items || []).length ? (
          <div className="grid gap-3 sm:grid-cols-2">{(events.data?.items || []).slice(0, 4).map((event) => <EventCard key={event.id} event={event} />)}</div>
        ) : !events.isLoading ? (
          <div className="vintage-empty flex items-center gap-4 p-5"><span className="vintage-icon"><CalendarDays /></span><div><strong className="block text-white">No upcoming events yet.</strong><span className="text-sm">Create the first match or watch meetup.</span></div></div>
        ) : null}
      </section>

      <section className="mt-6">
        <div className="vintage-kicker mb-3">Quick actions</div>
        <div className="vintage-home-grid grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quick.map(({ label, note, icon: Icon, to }) => (
            <button key={label} className="vintage-action p-4 text-left" onClick={() => navigate(to)}>
              <span className="vintage-icon"><Icon size={25} /></span>
              <strong className="mt-4 block text-[17px] font-black text-white">{label}</strong>
              <span className="mt-1 block text-xs text-[var(--hv-muted)]">{label === 'Requests' || label === 'Ride' || label === 'FundMe' ? <><span className="count-accent">{note.split(' ')[0]}</span> {note.substring(note.indexOf(' ') + 1)}</> : note}</span>
            </button>
          ))}
        </div>
      </section>

      {/* INTENTIONAL: no Community Actions section. It duplicated Teams / Requests / Ride / FundMe. */}

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div><div className="vintage-kicker">Football data</div><h2 className="vintage-section-title text-[30px]">Trending Now</h2></div>
        </div>
        <div className="vintage-empty px-5 py-5">
          <strong className="block text-sm text-white">Trending feed connects here.</strong>
          <p className="mt-1 text-xs leading-5">Never hardcode demo news, scores, players, views or editorial cards. The local implementation should consume HOOMA's server-side normalized football feed and render LIVE_MATCH, UPCOMING_MATCH, RESULT, TABLE and TOP_SCORER cards horizontally. User swipe only; no auto-scroll.</p>
        </div>
      </section>
    </div>
  );
}
