import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { VintageCollectorTicket } from '../components/ticket/VintageCollectorTicket';
import { VenueDetailHeader } from '../components/venue/VenueDetailHeader';
import { VenueInfoGrid } from '../components/venue/VenueInfoGrid';
import { VenueMenuRow } from '../components/menu/VenueMenuRow';
import { UpcomingEventRow } from '../components/events/UpcomingEventRow';
import { MatchdayActionButton } from '../components/events/MatchdayActionButton';
import { BallIcon } from '../icons/BallIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { PinIcon } from '../icons/PinIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { RequestFlagIcon } from '../icons/RequestFlagIcon';
import { RideBallIcon } from '../icons/RideBallIcon';
import { FundCupIcon } from '../icons/FundCupIcon';
import { FormationIcon } from '../icons/FormationIcon';
import { ChatIcon } from '../icons/ChatIcon';
import { CheckInIcon } from '../icons/CheckInIcon';
import { DollarIcon } from '../icons/DollarIcon';
import { del, get, post } from '../shared/api/http-client';
import { eventDate, money } from '../lib/format';
import { isOfficialWatchPlace, watchPlaceLocation } from '../lib/watch-place-display';
import { notify } from '../lib/telegram';
import { useTelegramMainButton } from '../hooks/useTelegramMainButton';
import type { EventItem, Me, PaymentSummary } from '../types/domain';

type EventDetail = EventItem & {
  rsvps: NonNullable<EventItem['rsvps']>;
  requests: Array<{ id: string; title: string }>;
  rideOffers: Array<{ id: string; title: string; status: string }>;
  fundraisers: Array<{ id: string; title: string; status: string }>;
  formations: Array<{ id: string; name: string; format: string; published: boolean }>;
  chatRoom?: { id: string; opensAt: string; closesAt: string } | null;
  venuePhotoUrl?: string | null;
  venueType?: string | null;
  houma?: string | null;
  venuePhone?: string | null;
  venueAbout?: string | null;
  officialVenue?: boolean;
  venueMenu?: Array<{ id: string; name: string; priceLabel: string }>;
  upcomingVenueEvents?: Array<{
    id: string;
    title: string;
    startsAt: string;
    goingCount: number;
    homeTeam?: string | null;
    awayTeam?: string | null;
    competitionIconUrl?: string | null;
  }>;
};

function paymentLabel(payment?: PaymentSummary | null) {
  if (!payment) return null;
  if (payment.selectedMethod === 'CASH' && payment.status === 'AWAITING_CASH')
    return 'Cash due to organizer';
  if (payment.selectedMethod === 'CASH' && payment.status === 'PAID') return 'Paid in cash';
  return payment.status.replaceAll('_', ' ').toLowerCase();
}

function dateParts(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    day: date.toLocaleDateString([], { day: '2-digit' }),
    month: date.toLocaleDateString([], { month: 'short' }).toUpperCase(),
  };
}

function MatchdayActions({
  event,
  navigate,
}: {
  event: EventDetail;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <section className="mt-7">
      <div className="vintage-kicker">Matchday hub</div>
      <h2 className="vintage-section-title mb-3">Event actions</h2>
      <div className="grid gap-3">
        <MatchdayActionButton
          icon={<RequestFlagIcon size={23} />}
          title="Requests"
          subtitle={`${event.requests.length} open`}
          onClick={() => navigate(`/requests?eventId=${event.id}`)}
        />
        <MatchdayActionButton
          icon={<RideBallIcon size={23} />}
          title="Ride"
          subtitle={`${event.rideOffers.length} ride options`}
          onClick={() => navigate(`/rides?eventId=${event.id}`)}
        />
        <MatchdayActionButton
          icon={<FundCupIcon size={23} />}
          title="FundMe"
          subtitle={`${event.fundraisers.length} active funds`}
          onClick={() => navigate(`/fundme?eventId=${event.id}`)}
        />
        {event.type === 'PLAY' && (
          <MatchdayActionButton
            icon={<FormationIcon size={23} />}
            title="Formation builder"
            subtitle="5v5 · 7v7 · 11v11 drag & drop"
            onClick={() => navigate(`/events/${event.id}/formation`)}
          />
        )}
        <MatchdayActionButton
          icon={<ChatIcon size={23} />}
          title="Temporary event chat"
          subtitle="Opens around match time and expires after"
          onClick={() => navigate(`/events/${event.id}/chat`)}
        />
        {event.type === 'WATCH' && (
          <MatchdayActionButton
            icon={<CheckInIcon size={23} />}
            title="Check in & unlock deals"
            onClick={() => navigate(`/events/${event.id}/check-in`)}
          />
        )}
      </div>
    </section>
  );
}

export function EventDetailPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const eventQuery = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => get<EventDetail>(`/api/v1/events/${eventId}`),
    enabled: Boolean(eventId),
  });
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => get<Me>('/api/v1/me') });
  const event = eventQuery.data;
  const watchPlaceId = event?.watchDetails?.fanHub?.place?.id;
  const placeEventsQuery = useQuery({
    queryKey: ['place-events', watchPlaceId],
    queryFn: () => get<EventItem[]>(`/api/v1/watch/places/${watchPlaceId}/events`),
    enabled: event?.type === 'WATCH' && Boolean(watchPlaceId),
  });
  const rsvp = event?.rsvps.find(
    (item) =>
      item.userId === meQuery.data?.id &&
      ['PENDING_PAYMENT', 'CONFIRMED', 'WAITLISTED', 'ATTENDED'].includes(item.status),
  );
  const latestPayment = rsvp?.paymentIntent;
  const paidPlay = event?.type === 'PLAY' && event.playDetails?.paymentRequired === true;
  const cashAccepted = Boolean(
    event?.paymentMethods?.some((item) => item.method === 'CASH' && item.enabled),
  );

  const join = useMutation({
    mutationFn: () =>
      post(`/api/v1/events/${eventId}/rsvp`, paidPlay ? { paymentMethod: 'CASH' } : {}),
    onSuccess: async () => {
      notify('success');
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => notify('error'),
  });
  const cancel = useMutation({
    mutationFn: () => del(`/api/v1/events/${eventId}/rsvp`),
    onSuccess: async () => {
      notify('success');
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => notify('error'),
  });

  const joinBlocked =
    Boolean(event && event.status !== 'PUBLISHED') || Boolean(paidPlay && !cashAccepted);
  const handleRsvp = () => {
    if (rsvp) cancel.mutate();
    else join.mutate();
  };
  useTelegramMainButton(rsvp ? 'Cancel RSVP' : 'Join event', handleRsvp, {
    visible: Boolean(event),
    enabled: Boolean(rsvp) || !joinBlocked,
  });

  if (eventQuery.isLoading)
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" />
      </div>
    );
  if (!event)
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Event not found.</div>
      </div>
    );

  const fee = event.playDetails;
  const confirmedCount = event.rsvps.filter((item) =>
    ['CONFIRMED', 'ATTENDED'].includes(item.status),
  ).length;

  if (event.type === 'WATCH') {
    const home = event.watchDetails?.homeClub;
    const away = event.watchDetails?.awayClub;
    const fanHub = event.watchDetails?.fanHub;
    const place = fanHub?.place;
    const officialVenue = isOfficialWatchPlace(place, fanHub);
    const parts = dateParts(event.startsAt);
    const share = async () => {
      if (navigator.share)
        await navigator.share({
          title: event.title,
          text: event.description || event.title,
          url: window.location.href,
        });
      else await navigator.clipboard?.writeText(window.location.href);
    };
    const infoItems = [
      {
        key: 'address',
        label: 'Address',
        value: place?.address || event.address || fanHub?.address || 'Address not provided',
        icon: <PinIcon size={17} />,
      },
      {
        key: 'fanHub',
        label: 'Houma',
        value: place?.houma || fanHub?.name || event.community?.name || 'Houma not provided',
        icon: <UsersIcon size={17} />,
      },
      {
        key: 'contact',
        label: 'Contact',
        value: [place?.phone, place?.email].filter(Boolean).join('\n') || 'Contact not provided',
        icon: <PhoneIcon size={17} />,
        ...(place?.phone
          ? {
              actionLabel: 'Call',
              onAction: () => {
                window.location.href = `tel:${place.phone}`;
              },
            }
          : {}),
      },
      {
        key: 'about',
        label: 'About',
        value:
          place?.description || event.description || 'No additional venue information provided.',
        icon: <InfoIcon size={17} />,
      },
    ];
    const menuItems =
      place?.menuItems
        ?.filter((item) => item.name)
        .map((item) => ({
          id: item.id,
          name: item.name,
          priceLabel: item.priceLabel || '',
        })) ?? [];
    const upcomingPlaceEvents =
      placeEventsQuery.data?.filter((item) => item.id !== event.id).slice(0, 3) ?? [];
    return (
      <div className="page-shell vintage-page">
        <div className="grid gap-4">
          <VintageCollectorTicket
            collectorNumber={1}
            matchTitle={event.title}
            teamAName={home?.name || 'Home'}
            teamBName={away?.name || 'Away'}
            teamALogoUrl={home?.logoUrl}
            teamBLogoUrl={away?.logoUrl}
            venueName={place?.name || event.venueName || fanHub?.venueName || 'Venue TBA'}
            venueLocation={
              watchPlaceLocation(place) ||
              place?.address ||
              event.address ||
              fanHub?.address ||
              event.community?.name ||
              'Location TBA'
            }
            dateLabel={parts.date}
            timeLabel={parts.time}
            goingCount={confirmedCount}
            officialVenue={officialVenue}
            suggestedByCommunity={Boolean(fanHub) && !officialVenue}
            stubLabel={event.title}
            venuePhotoUrl={place?.photoUrl}
          />
          <div className="mt-4">
            <VenueDetailHeader
              venueName={place?.name || event.venueName || fanHub?.venueName || event.title}
              venueType={place?.category || (fanHub ? 'Fan hub' : 'Watch venue')}
              venuePhotoUrl={place?.photoUrl}
              goingCount={confirmedCount}
              dateLabel={`${parts.date} · ${parts.time}`}
              rsvpLabel={
                rsvp
                  ? rsvp.status === 'WAITLISTED'
                    ? `Waitlist #${rsvp.waitlistPosition ?? '—'}`
                    : rsvp.status.replaceAll('_', ' ')
                  : null
              }
              officialVenue={officialVenue}
              joinLabel={rsvp ? 'Cancel RSVP' : 'Join event'}
              onJoin={handleRsvp}
              onShare={() => void share()}
              joinDisabled={join.isPending || cancel.isPending || (!rsvp && joinBlocked)}
            />
          </div>
          <div className="mt-4">
            <VenueInfoGrid items={infoItems} />
          </div>
          {menuItems.length ? <VenueMenuRow items={menuItems} /> : null}
          {upcomingPlaceEvents.length ? (
            <section className="mt-6">
              <div className="vintage-section-heading">
                <h2 className="vintage-section-title">Upcoming watch events at this place</h2>
              </div>
              <div className="grid gap-3">
                {upcomingPlaceEvents.map((item) => {
                  const d = dateParts(item.startsAt);
                  return (
                    <UpcomingEventRow
                      key={item.id}
                      eventId={item.id}
                      title={item.title}
                      dayNumber={d.day}
                      monthLabel={d.month}
                      timeLabel={d.time}
                      goingCount={item._count?.rsvps ?? 0}
                      homeTeam={item.watchDetails?.homeClub?.name}
                      awayTeam={item.watchDetails?.awayClub?.name}
                      onClick={() => navigate(`/events/${item.id}`)}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
          <MatchdayActions event={event} navigate={navigate} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell vintage-page">
      <section className="surface-card overflow-hidden p-5">
        <div className="vintage-kicker">Pickup match</div>
        <div className="mt-3 flex items-start gap-4">
          <span className="vintage-icon">
            <BallIcon size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[30px] font-black leading-tight tracking-[-.045em] text-white">
              {event.title}
            </h1>
            {event.description && (
              <p className="mt-2 text-sm leading-6 muted">{event.description}</p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-2.5 text-sm font-bold text-[#d8d4cb]">
          <span className="flex gap-2">
            <CalendarIcon size={17} />
            {eventDate(event.startsAt)}
          </span>
          {event.venueName && (
            <span className="flex gap-2">
              <PinIcon size={17} />
              {event.venueName}
            </span>
          )}
          <span className="flex gap-2">
            <UsersIcon size={17} />
            {confirmedCount}
            {event.capacity ? ` / ${event.capacity}` : ''} going
          </span>
          {paidPlay && fee && (
            <span className="flex gap-2">
              <DollarIcon size={17} />
              {money(fee.entryFeeMinor, fee.currency)} · Cash
            </span>
          )}
        </div>
        {rsvp && (
          <div className="mt-4 rounded-[10px] border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3 text-sm font-black text-[var(--accent)]">
            {rsvp.status === 'WAITLISTED'
              ? `Waitlist #${rsvp.waitlistPosition ?? '—'}`
              : rsvp.status.replaceAll('_', ' ')}
            {paymentLabel(latestPayment) && (
              <span className="ml-2 opacity-80">· {paymentLabel(latestPayment)}</span>
            )}
          </div>
        )}
        <button
          className="accent-button mt-5 w-full"
          onClick={handleRsvp}
          disabled={join.isPending || cancel.isPending || (!rsvp && joinBlocked)}
        >
          {rsvp
            ? 'Cancel RSVP'
            : paidPlay && fee
              ? `Join · ${money(fee.entryFeeMinor, fee.currency)} cash`
              : 'Join in one tap'}
        </button>
      </section>
      <MatchdayActions event={event} navigate={navigate} />
    </div>
  );
}
