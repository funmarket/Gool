import { CalendarDays, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { EventItem } from '../types/domain';
import { eventDate, money } from '../lib/format';
import { BallIcon, ScarfIcon } from './icons/SoccerIcons';

export function EventCard({ event }: { event: EventItem }) {
  const navigate = useNavigate();
  const Icon = event.type === 'PLAY' ? BallIcon : ScarfIcon;
  const fee =
    event.type === 'PLAY' && event.playDetails?.paymentRequired ? event.playDetails : null;
  return (
    <button
      onClick={() => navigate(`/events/${event.id}`)}
      className="surface-card w-full overflow-hidden p-4 text-left transition active:scale-[.992]"
    >
      <div className="flex items-start gap-3">
        <div className="icon-well">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="section-kicker">{event.type}</span>
            {fee && <span className="chip py-1">{money(fee.entryFeeMinor, fee.currency)}</span>}
          </div>
          <h3 className="mt-1 truncate text-[18px] font-black">{event.title}</h3>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs font-bold muted">
        <span className="flex items-center gap-2">
          <CalendarDays size={15} />
          {eventDate(event.startsAt)}
        </span>
        {event.venueName && (
          <span className="flex items-center gap-2">
            <MapPin size={15} />
            {event.venueName}
          </span>
        )}
        <span className="flex items-center gap-2">
          <Users size={15} />
          {event._count?.rsvps || 0}
          {event.capacity ? ` / ${event.capacity}` : ''} confirmed
        </span>
      </div>
    </button>
  );
}
