import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../shared/api/http-client';
import { majorToMinor, moneyInputStep } from '../lib/format';
import { notify, requestTelegramLocation } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import type { CursorPage, EventItem } from '../types/domain';
import { SimpleForm } from './CreateRequestPage';

export function CreateRidePage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'OFFER_SEATS' | 'NEED_RIDE'>('OFFER_SEATS');
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [originLatitude, setOriginLatitude] = useState<number>();
  const [originLongitude, setOriginLongitude] = useState<number>();
  const [destination, setDestination] = useState('');
  const [destinationLatitude, setDestinationLatitude] = useState('');
  const [destinationLongitude, setDestinationLongitude] = useState('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState('0');
  const [currency, setCurrency] = useState('TND');
  const [eventId, setEventId] = useState('');
  const [cashSelection, setCashSelection] = useState<{
    communityId: string;
    value: boolean;
  } | null>(null);

  const defaultCashEnabled =
    active?.paymentDefaults?.find((item) => item.method === 'CASH')?.enabled ?? true;

  const cashAccepted =
    cashSelection !== null && cashSelection.communityId === active?.id
      ? cashSelection.value
      : defaultCashEnabled;

  const isPaid = mode === 'OFFER_SEATS' && Number(price) > 0;
  const events = useQuery({
    queryKey: ['events', active?.id],
    queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}`),
    enabled: Boolean(active),
  });

  const fillOriginFromCurrentLocation = async () => {
    const location = await requestTelegramLocation();
    setOriginLatitude(location.latitude);
    setOriginLongitude(location.longitude);
    setOrigin('My current area');
  };

  const create = useMutation({
    mutationFn: () => {
      const base = {
        communityId: active!.id,
        eventId: eventId || undefined,
        title: title.trim(),
      };
      if (mode === 'NEED_RIDE') {
        return post('/api/v1/rides/requests', {
          ...base,
          pickupLabel: origin,
          pickupLatitude: originLatitude,
          pickupLongitude: originLongitude,
          seatsNeeded: seats,
          desiredDepartureAt: new Date(date).toISOString(),
        });
      }
      return post('/api/v1/rides/offers', {
        ...base,
        originLabel: origin,
        originLatitude,
        originLongitude,
        destinationLabel: destination,
        destinationLatitude: Number(destinationLatitude),
        destinationLongitude: Number(destinationLongitude),
        departureAt: new Date(date).toISOString(),
        seatsTotal: seats,
        costSplitMode: isPaid ? 'FIXED' : 'FREE',
        seatPriceMinor: majorToMinor(Number(price || 0), currency),
        currency: currency.trim().toUpperCase(),
        acceptedPaymentMethods: isPaid && cashAccepted ? ['CASH'] : [],
        liveTrackingEnabled: true,
      });
    },
    onSuccess: () => {
      notify('success');
      navigate('/rides');
    },
    onError: () => notify('error'),
  });

  const canPublish = Boolean(
    active &&
    title.trim().length >= 2 &&
    origin &&
    originLatitude != null &&
    originLongitude != null &&
    date &&
    (mode === 'NEED_RIDE' ||
      (destination && destinationLatitude && destinationLongitude && (!isPaid || cashAccepted))),
  );

  return (
    <SimpleForm title="New ride" kicker="Event-linked transport">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="ghost-button"
          onClick={() => setMode('OFFER_SEATS')}
          style={mode === 'OFFER_SEATS' ? { borderColor: 'var(--accent)' } : {}}
        >
          Offer seats
        </button>
        <button
          className="ghost-button"
          onClick={() => setMode('NEED_RIDE')}
          style={mode === 'NEED_RIDE' ? { borderColor: 'var(--accent)' } : {}}
        >
          Need ride
        </button>
      </div>

      <input
        className="hooma-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={mode === 'OFFER_SEATS' ? 'Ride to Friday 7v7' : 'Need a ride to Friday 7v7'}
      />
      <div className="flex gap-2">
        <input
          className="hooma-input"
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
          placeholder="Pickup area"
        />
        <button
          className="ghost-button shrink-0"
          onClick={() => void fillOriginFromCurrentLocation()}
        >
          Use location
        </button>
      </div>

      {mode === 'OFFER_SEATS' && (
        <>
          <input
            className="hooma-input"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Destination label"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="hooma-input"
              value={destinationLatitude}
              onChange={(event) => setDestinationLatitude(event.target.value)}
              placeholder="Destination lat"
            />
            <input
              className="hooma-input"
              value={destinationLongitude}
              onChange={(event) => setDestinationLongitude(event.target.value)}
              placeholder="Destination lng"
            />
          </div>
        </>
      )}

      <input
        className="hooma-input"
        type="datetime-local"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      <label className="text-xs font-black">
        {mode === 'OFFER_SEATS' ? 'Seats available' : 'Seats needed'}
        <input
          className="hooma-input mt-1"
          type="number"
          min={1}
          max={mode === 'OFFER_SEATS' ? 20 : 8}
          value={seats}
          onChange={(event) => setSeats(Number(event.target.value))}
        />
      </label>

      {mode === 'OFFER_SEATS' && (
        <>
          <div className="grid grid-cols-[1fr_96px] gap-2">
            <input
              className="hooma-input"
              type="number"
              min="0"
              step={moneyInputStep(currency)}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Seat cost"
            />
            <input
              className="hooma-input uppercase"
              maxLength={3}
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              placeholder="TND"
            />
          </div>
          {isPaid && (
            <label
              className="flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold"
              style={{ borderColor: 'var(--border)' }}
            >
              <input
                type="checkbox"
                checked={cashAccepted}
                onChange={(event) =>
                  setCashSelection({ communityId: active?.id ?? '', value: event.target.checked })
                }
              />
              Accept cash for ride cost sharing
            </label>
          )}
        </>
      )}

      <select
        className="hooma-input"
        value={eventId}
        onChange={(event) => setEventId(event.target.value)}
      >
        <option value="">No event attached</option>
        {events.data?.items.map((event) => (
          <option value={event.id} key={event.id}>
            {event.title}
          </option>
        ))}
      </select>
      <button
        className="accent-button"
        disabled={!canPublish || create.isPending}
        onClick={() => create.mutate()}
      >
        Publish ride
      </button>
    </SimpleForm>
  );
}
