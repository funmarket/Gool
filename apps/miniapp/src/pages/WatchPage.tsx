import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, LocateFixed, MapPin, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapPanel } from '../components/MapPanel';
import { get } from '../shared/api/http-client';
import { requestTelegramLocation } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import type { Club, CursorPage, EventItem } from '../types/domain';

type FanHub = { id:string; name:string; venueName:string; latitude:string|number; longitude:string|number; verified:boolean; clubs?:Array<{club:Club}> };

export function WatchPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [clubId,setClubId]=useState('');
  const [center,setCenter]=useState<[number,number]>();
  const clubs=useQuery({queryKey:['clubs'],queryFn:()=>get<Club[]>('/api/v1/watch/clubs?limit=100')});
  const events=useQuery({queryKey:['events',active?.id,'WATCH'],queryFn:()=>get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}&type=WATCH`),enabled:Boolean(active)});
  const hubs=useQuery({queryKey:['hubs',active?.id,clubId],queryFn:()=>get<FanHub[]>(`/api/v1/watch/hubs?communityId=${active?.id}${clubId?`&clubId=${encodeURIComponent(clubId)}`:''}`),enabled:Boolean(active)});
  const points=useMemo(()=>(hubs.data||[]).map(h=>({id:h.id,lat:Number(h.latitude),lng:Number(h.longitude),label:h.venueName})),[hubs.data]);
  const locate=async()=>{const location=await requestTelegramLocation();setCenter([location.longitude,location.latitude])};

  return <div className="page-shell vintage-page">
    <section className="vintage-watch-hero">
      <div className="vintage-kicker">Watch together</div>
      <div className="relative z-[1] flex items-end justify-between gap-4">
        <div><h1 className="vintage-display text-[64px] leading-none">Watch</h1><p className="vintage-copy mt-1 text-sm">Watch together. Find the match. Find the crowd.</p></div>
        <button className="vintage-outline-cta" onClick={()=>navigate('/events/new?type=WATCH')}><Plus size={20}/><span className="hidden sm:inline">Create watch event</span></button>
      </div>
    </section>

    <section className="mt-5 flex gap-2">
      <select className="vintage-control w-full px-4" value={clubId} onChange={e=>setClubId(e.target.value)}><option value="">All clubs</option>{clubs.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <button className="vintage-control grid w-[54px] shrink-0 place-items-center" onClick={()=>void locate()} aria-label="Use my location"><LocateFixed size={19}/></button>
    </section>

    <section className="mt-7">
      <div className="vintage-kicker">Upcoming matches</div><h2 className="vintage-section-title mb-3 text-[32px]">Collector tickets</h2>
      <div className="grid gap-4">
        {events.data?.items.map((event,index)=><button key={event.id} onClick={()=>navigate(`/events/${event.id}`)} className="vintage-ticket grid min-h-[174px] w-full grid-cols-[1fr_48px] text-left">
          <div className="relative z-[1] p-5">
            <div className="flex items-center justify-between border-b border-black/25 pb-2 text-[10px] font-black uppercase tracking-[.18em]"><span>Collector series</span><span>No. {String(index+1).padStart(4,'0')} ★</span></div>
            <div className="vintage-ticket-title mt-3 text-[32px] leading-none">{event.title}</div>
            <div className="vintage-ticket-meta mt-4 grid grid-cols-2 gap-3 py-3 text-sm"><span className="flex gap-2"><MapPin size={17}/>{event.venueName||'Venue TBA'}</span><span className="flex gap-2"><CalendarDays size={17}/>{new Date(event.startsAt).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span></div>
            <div className="mt-3 flex items-center gap-2 font-black"><Users size={18}/>{event._count?.rsvps||0} going</div>
          </div>
          <div className="vintage-stub relative z-[1] flex items-center justify-center"><span className="vintage-ticket-title rotate-180 text-[15px] [writing-mode:vertical-rl]">HOOMA · WATCH</span></div>
        </button>)}
        {!events.isLoading&&!events.data?.items.length&&<div className="vintage-empty p-6 text-center"><strong className="vintage-section-title block text-[24px]">No watch events yet</strong><span className="text-sm">Create the first watch event for your crowd.</span></div>}
      </div>
    </section>

    <section className="mt-8">
      <div className="flex items-end justify-between"><div><div className="vintage-kicker">Watch together near you</div><h2 className="vintage-section-title text-[30px]">Places</h2></div></div>
      <div className="mt-3 overflow-hidden rounded-[10px] border vintage-rule"><MapPanel points={points} {...(center?{center}:{})}/></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{hubs.data?.slice(0,6).map(h=><div key={h.id} className="vintage-panel rounded-[10px] p-4"><div className="flex items-center gap-3"><span className="vintage-icon"><MapPin size={20}/></span><div><strong className="text-[17px] font-black text-white">{h.venueName}</strong><div className="vintage-copy text-xs">{h.clubs?.map(l=>l.club.name).join(' · ')||'All supporters'}{h.verified?' · Official venue':''}</div></div></div></div>)}</div>
    </section>
  </div>;
}
