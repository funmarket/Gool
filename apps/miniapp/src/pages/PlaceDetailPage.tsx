import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { VenueInfoGrid } from '../components/venue/VenueInfoGrid';
import { VenueMenuRow } from '../components/menu/VenueMenuRow';
import { UpcomingEventRow } from '../components/events/UpcomingEventRow';
import { PinIcon } from '../icons/PinIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { get } from '../shared/api/http-client';
import type { EventItem, Place } from '../types/domain';

function dateParts(value: string) {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString([], { day: '2-digit' }),
    month: date.toLocaleDateString([], { month: 'short' }).toUpperCase(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function placeStatusLabel(place: Place) {
  if (place.status === 'VERIFIED') return 'Official Venue';
  if (place.status === 'OWNER_CLAIMED') return 'Owner claim pending';
  return 'Suggested by Community';
}

export function PlaceDetailPage() {
  const { placeId = '' } = useParams();
  const navigate = useNavigate();
  const place = useQuery({
    queryKey: ['place', placeId],
    queryFn: () => get<Place>(`/api/v1/watch/places/${placeId}`),
    enabled: Boolean(placeId),
  });
  const events = useQuery({
    queryKey: ['place-events', placeId],
    queryFn: () => get<EventItem[]>(`/api/v1/watch/places/${placeId}/events`),
    enabled: Boolean(placeId),
  });

  if (place.isLoading) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" />
      </div>
    );
  }

  if (!place.data) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Place not found.</div>
      </div>
    );
  }

  const item = place.data;
  const contact = [item.phone, item.email].filter(Boolean).join('\n');
  const infoItems = [
    {
      key: 'address',
      label: 'Address',
      value: item.address,
      icon: <PinIcon size={17} />,
    },
    {
      key: 'houma',
      label: 'Houma',
      value: item.houma || item.city || 'Houma not provided',
      icon: <UsersIcon size={17} />,
    },
    {
      key: 'contact',
      label: 'Contact',
      value: contact || 'Contact not provided',
      icon: <PhoneIcon size={17} />,
      ...(item.phone
        ? {
            actionLabel: 'Call',
            onAction: () => {
              window.location.href = `tel:${item.phone}`;
            },
          }
        : {}),
    },
    {
      key: 'about',
      label: 'About',
      value: item.description || 'No additional place information provided.',
      icon: <InfoIcon size={17} />,
    },
  ];
  const menuItems =
    item.menuItems?.map((menuItem) => ({
      id: menuItem.id,
      name: menuItem.name,
      priceLabel: menuItem.priceLabel || '',
    })) ?? [];

  return (
    <div className="page-shell vintage-page">
      <div className="grid gap-4">
        <section className="surface-card overflow-hidden">
          <img src={item.photoUrl || ''} alt={item.name} className="h-64 w-full object-cover" />
          <div className="grid gap-3 p-4">
            <div className="vintage-kicker">Watch Place</div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="section-title">{item.name}</h1>
                <p className="text-sm muted">{item.category}</p>
                <p className="mt-2 text-sm">
                  {[item.city, item.houma].filter(Boolean).join(', ') || item.address}
                </p>
              </div>
              <span className="rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                {placeStatusLabel(item)}
              </span>
            </div>
          </div>
        </section>

        <VenueInfoGrid items={infoItems} />
        {menuItems.length ? <VenueMenuRow items={menuItems} /> : null}

        <section className="mt-2">
          <div className="vintage-section-heading">
            <h2 className="vintage-section-title">
              <CalendarIcon size={22} /> Upcoming watch events at this place
            </h2>
          </div>
          <div className="grid gap-3">
            {events.isLoading ? (
              <div className="vintage-empty">Loading upcoming watch events...</div>
            ) : events.data?.length ? (
              events.data.map((event) => {
                const d = dateParts(event.startsAt);
                return (
                  <UpcomingEventRow
                    key={event.id}
                    eventId={event.id}
                    title={event.title}
                    dayNumber={d.day}
                    monthLabel={d.month}
                    timeLabel={d.time}
                    goingCount={event._count?.rsvps ?? 0}
                    homeTeam={event.watchDetails?.homeClub?.name}
                    awayTeam={event.watchDetails?.awayClub?.name}
                    onClick={() => navigate(`/events/${event.id}`)}
                  />
                );
              })
            ) : (
              <div className="vintage-empty">No upcoming watch events at this place yet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
