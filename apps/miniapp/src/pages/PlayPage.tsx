import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlayHero } from '../components/hero/PlayHero';
import { PickupMatchCard } from '../components/play/PickupMatchCard';
import { UsersIcon } from '../icons/UsersIcon';
import { useCommunity } from '../providers/CommunityProvider';
import { get } from '../shared/api/http-client';
import type { CursorPage, EventItem } from '../types/domain';

function dateLabel(value:string){return new Date(value).toLocaleString([],{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}

export function PlayPage(){
  const {active}=useCommunity();
  const navigate=useNavigate();
  const query=useQuery({queryKey:['events',active?.id,'PLAY'],queryFn:()=>get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}&type=PLAY`),enabled:Boolean(active)});
  return <div className="page-shell vintage-page">
    <PlayHero onCreateMatch={()=>navigate('/events/new?type=PLAY')}/>
    <section className="vintage-home-section" aria-labelledby="players-looking-title"><div className="vintage-section-heading"><div><div className="vintage-kicker">Players</div><h2 id="players-looking-title" className="vintage-section-title">Looking to play</h2></div></div><div className="play-player-strip"><div className="vintage-empty play-player-empty"><div className="flex items-center gap-4"><span className="vintage-icon"><UsersIcon size={26}/></span><div><strong>Player listings will appear here.</strong><small>Only real player listings and explicitly published contact details render in this feed.</small></div></div></div></div></section>
    <section className="vintage-home-section" aria-labelledby="open-matches-title"><div className="vintage-section-heading"><div><div className="vintage-kicker">Open matches</div><h2 id="open-matches-title" className="vintage-section-title">Pickup games</h2></div><UsersIcon size={22}/></div>{query.isLoading?<div className="vintage-empty">Loading matches…</div>:query.isError?<div className="vintage-empty">Matches could not be loaded.</div>:query.data?.items.length?<div className="play-match-list">{query.data.items.map(event=><PickupMatchCard key={event.id} title={event.title} dateLabel={dateLabel(event.startsAt)} venueName={event.venueName} goingCount={event._count?.rsvps??0} capacity={event.capacity} format={event.playDetails?.format} onClick={()=>navigate(`/events/${event.id}`)}/>)}</div>:<div className="vintage-empty"><strong>No open matches yet.</strong><small>Create the first pickup match for this community.</small></div>}</section>
  </div>;
}
