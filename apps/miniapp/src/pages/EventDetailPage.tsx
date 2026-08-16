import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPin,
  MessageCircle,
  Shirt,
  Users,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActionRow } from '../components/ui/ActionRow';
import {
  BallIcon,
  FundCupIcon,
  RequestFlagIcon,
  RideBallIcon,
  ScarfIcon,
} from '../components/icons/SoccerIcons';
import { del, get, post } from '../shared/api/http-client';
import { eventDate, money } from '../lib/format';
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
};

function paymentLabel(payment?: PaymentSummary | null) {
  if (!payment) return null;
  if (payment.selectedMethod === 'CASH' && payment.status === 'AWAITING_CASH') {
    return 'Cash due to organizer';
  }
  if (payment.selectedMethod === 'CASH' && payment.status === 'PAID') return 'Paid in cash';
  return payment.status.replaceAll('_', ' ').toLowerCase();
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

  if (eventQuery.isLoading) {
    return (
      <div className="page-shell">
        <div className="surface-card h-72 animate-pulse" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="page-shell">
        <div className="surface-card p-6">Event not found.</div>
      </div>
    );
  }

  const Icon = event.type === 'PLAY' ? BallIcon : ScarfIcon;
  const fee = event.playDetails;
  const confirmedCount = event.rsvps.filter((item) =>
    ['CONFIRMED', 'ATTENDED'].includes(item.status),
  ).length;

  return (
    <div className="page-shell pt-4">
      <section className="surface-card overflow-hidden">
        <div
          className="h-32 p-5"
          style={{
            background:
              'radial-gradient(circle at 85% 20%,var(--accent-soft),transparent 50%),linear-gradient(135deg,var(--surface-3),var(--surface-2))',
          }}
        >
          <span className="section-kicker">{event.type} event</span>
        </div>
        <div className="px-5 pb-5">
          <span
            className="icon-well -mt-7 h-14 w-14 border-4"
            style={{ borderColor: 'var(--surface)' }}
          >
            <Icon className="h-7 w-7" />
          </span>
          <h1 className="mt-3 text-[30px] font-black leading-tight tracking-[-.045em]">
            {event.title}
          </h1>
          {event.description && <p className="mt-2 text-sm leading-6 muted">{event.description}</p>}

          <div className="mt-5 grid gap-2.5 text-sm font-bold">
            <span className="flex gap-2">
              <CalendarDays size={17} style={{ color: 'var(--accent)' }} />
              {eventDate(event.startsAt)}
            </span>
            {event.venueName && (
              <span className="flex gap-2">
                <MapPin size={17} style={{ color: 'var(--accent)' }} />
                {event.venueName}
              </span>
            )}
            <span className="flex gap-2">
              <Users size={17} style={{ color: 'var(--accent)' }} />
              {confirmedCount}
              {event.capacity ? ` / ${event.capacity}` : ''} going
            </span>
            {paidPlay && fee && (
              <span className="flex gap-2">
                <DollarSign size={17} style={{ color: 'var(--accent)' }} />
                {money(fee.entryFeeMinor, fee.currency)} · Cash
              </span>
            )}
          </div>

          {rsvp && (
            <div
              className="mt-4 rounded-2xl px-4 py-3 text-sm font-black"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <CheckCircle2 size={17} className="mr-2 inline" />
              {rsvp.status === 'WAITLISTED'
                ? `Waitlist #${rsvp.waitlistPosition ?? '—'}`
                : rsvp.status.replaceAll('_', ' ')}
              {paymentLabel(latestPayment) && (
                <span className="ml-2 opacity-80">· {paymentLabel(latestPayment)}</span>
              )}
            </div>
          )}

          {event.status !== 'PUBLISHED' && !rsvp && (
            <p className="mt-4 text-sm font-bold">This event is not currently open for RSVP.</p>
          )}
          {paidPlay && !cashAccepted && (
            <p className="mt-4 text-sm font-bold">
              This paid event currently has no enabled real-world payment method. Ask an organizer
              to update the event.
            </p>
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
        </div>
      </section>

      <section className="mt-7">
        <div className="section-kicker">Attached to this event</div>
        <h2 className="section-title mb-3">Matchday hub</h2>
        <div className="grid gap-3">
          <ActionRow
            icon={<RequestFlagIcon className="h-6 w-6" />}
            title="Requests"
            subtitle={`${event.requests.length} open`}
            onClick={() => navigate(`/requests?eventId=${event.id}`)}
          />
          <ActionRow
            icon={<RideBallIcon className="h-6 w-6" />}
            title="Ride"
            subtitle={`${event.rideOffers.length} ride options`}
            onClick={() => navigate(`/rides?eventId=${event.id}`)}
          />
          <ActionRow
            icon={<FundCupIcon className="h-6 w-6" />}
            title="FundMe"
            subtitle={`${event.fundraisers.length} active funds`}
            onClick={() => navigate(`/fundme?eventId=${event.id}`)}
          />
          {event.type === 'PLAY' && (
            <ActionRow
              icon={<Shirt />}
              title="Formation builder"
              subtitle="5v5 · 7v7 · 11v11 drag & drop"
              onClick={() => navigate(`/events/${event.id}/formation`)}
            />
          )}
          <ActionRow
            icon={<MessageCircle />}
            title="Temporary event chat"
            subtitle="Opens around match time and expires after"
            onClick={() => navigate(`/events/${event.id}/chat`)}
          />
          {event.type === 'WATCH' && (
            <ActionRow
              icon={<Clock3 />}
              title="Check in & unlock deals"
              onClick={() => navigate(`/events/${event.id}/check-in`)}
            />
          )}
        </div>
      </section>
    </div>
  );
}
