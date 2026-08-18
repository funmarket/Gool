import { useNavigate } from 'react-router-dom';
import type { EventItem } from '../types/domain';
import { eventDate, money } from '../lib/format';
import { cn } from '../lib/cn';
import { BallIcon } from '../icons/BallIcon';
import { ScarfIcon } from '../icons/ScarfIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { PinIcon } from '../icons/PinIcon';
import { UsersIcon } from '../icons/UsersIcon';

type EventCardProps = { event: EventItem; variant?: 'default' | 'vintage' };
export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const navigate = useNavigate();
  const Icon = event.type === 'PLAY' ? BallIcon : ScarfIcon;
  const fee =
    event.type === 'PLAY' && event.playDetails?.paymentRequired ? event.playDetails : null;
  return (
    <button
      type="button"
      onClick={() => navigate(`/events/${event.id}`)}
      className={cn(
        'surface-card event-card w-full overflow-hidden p-4 text-left transition active:scale-[.992]',
        variant === 'vintage' && 'event-card-vintage',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="icon-well">
          <Icon size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="section-kicker">
              {event.type === 'PLAY' ? 'Pickup match' : 'Watch together'}
            </span>
            {fee && <span className="chip py-1">{money(fee.entryFeeMinor, fee.currency)}</span>}
          </div>
          <h3 className="mt-1 truncate text-[18px] font-black text-white">{event.title}</h3>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs font-bold muted">
        <span className="flex items-center gap-2">
          <CalendarIcon size={15} />
          {eventDate(event.startsAt)}
        </span>
        {event.venueName && (
          <span className="flex items-center gap-2">
            <PinIcon size={15} />
            {event.venueName}
          </span>
        )}
        <span className="flex items-center gap-2">
          <UsersIcon size={15} />
          {event._count?.rsvps || 0}
          {event.capacity ? ` / ${event.capacity}` : ''} confirmed
        </span>
      </div>
    </button>
  );
}
