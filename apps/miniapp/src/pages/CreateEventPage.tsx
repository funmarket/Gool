import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { get, post } from '../shared/api/http-client';
import { majorToMinor, moneyInputStep } from '../lib/format';
import { notify } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import type { Club, EventItem } from '../types/domain';

export function CreateEventPage() {
  const { active } = useCommunity();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialType = searchParams.get('type') === 'WATCH' ? 'WATCH' : 'PLAY';

  const [type, setType] = useState<'PLAY' | 'WATCH'>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(initialType === 'PLAY' ? '14' : '40');
  const [format, setFormat] = useState<'FIVE_V_FIVE' | 'SEVEN_V_SEVEN' | 'ELEVEN_V_ELEVEN'>(
    'SEVEN_V_SEVEN',
  );
  const [fee, setFee] = useState('0');
  const [currency, setCurrency] = useState('TND');
  const [cashSelection, setCashSelection] = useState<{
    communityId: string;
    value: boolean;
  } | null>(null);
  const [cashRsvpPolicy, setCashRsvpPolicy] = useState<
    'CONFIRM_IMMEDIATELY' | 'REQUIRE_CASH_CONFIRMATION'
  >('CONFIRM_IMMEDIATELY');
  const [homeClubId, setHomeClubId] = useState('');
  const [awayClubId, setAwayClubId] = useState('');

  const clubs = useQuery({
    queryKey: ['clubs'],
    queryFn: () => get<Club[]>('/api/v1/watch/clubs?limit=100'),
    enabled: type === 'WATCH',
  });

  const defaultCashEnabled =
    active?.paymentDefaults?.find((item) => item.method === 'CASH')?.enabled ?? true;

  const cashAccepted =
    cashSelection !== null && cashSelection.communityId === active?.id
      ? cashSelection.value
      : defaultCashEnabled;

  const isPaid = type === 'PLAY' && Number(fee) > 0;
  const canPublish = Boolean(
    active &&
    title.trim().length >= 2 &&
    date &&
    (type !== 'PLAY' || !isPaid || cashAccepted) &&
    (type !== 'WATCH' || !homeClubId || homeClubId !== awayClubId),
  );

  const create = useMutation({
    mutationFn: () => {
      const common = {
        communityId: active!.id,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt: new Date(date).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        venueName: venue.trim() || undefined,
        capacity: Number(capacity) || undefined,
        waitlistEnabled: true,
        cashRsvpPolicy,
      };
      if (type === 'PLAY') {
        const pitchType =
          format === 'FIVE_V_FIVE'
            ? 'FIVE_A_SIDE'
            : format === 'SEVEN_V_SEVEN'
              ? 'SEVEN_A_SIDE'
              : 'ELEVEN_A_SIDE';
        return post<EventItem>('/api/v1/events', {
          ...common,
          type: 'PLAY',
          pitchType,
          skillLevel: 'MIXED',
          format,
          entryFeeMinor: majorToMinor(Number(fee || 0), currency),
          currency: currency.trim().toUpperCase(),
          paymentRequired: isPaid,
          acceptedPaymentMethods: isPaid && cashAccepted ? ['CASH'] : [],
        });
      }
      return post<EventItem>('/api/v1/events', {
        ...common,
        type: 'WATCH',
        homeClubId: homeClubId || undefined,
        awayClubId: awayClubId || undefined,
      });
    },
    onSuccess: (event) => {
      notify('success');
      navigate(`/events/${event.id}`);
    },
    onError: () => notify('error'),
  });

  return (
    <div className="page-shell pt-4">
      <div className="section-kicker">Unified backbone</div>
      <h1 className="section-title">Create event</h1>

      <div className="surface-card mt-5 p-4">
        <div className="grid grid-cols-2 gap-2">
          {(['PLAY', 'WATCH'] as const).map((eventType) => (
            <button
              key={eventType}
              className="ghost-button"
              onClick={() => setType(eventType)}
              style={
                type === eventType
                  ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
                  : {}
              }
            >
              {eventType === 'PLAY' ? 'Play' : 'Watch'}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          <label className="text-xs font-black">
            Title
            <input
              className="gool-input mt-1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={type === 'PLAY' ? 'Friday 7v7 under the lights' : 'Derby watch party'}
            />
          </label>

          <label className="text-xs font-black">
            Description
            <textarea
              className="gool-input mt-1 min-h-24"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What players or supporters should know"
            />
          </label>

          <label className="text-xs font-black">
            Starts
            <input
              type="datetime-local"
              className="gool-input mt-1"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          <label className="text-xs font-black">
            Venue
            <input
              className="gool-input mt-1"
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Pitch / pub / fan hub"
            />
          </label>

          <label className="text-xs font-black">
            Capacity
            <input
              type="number"
              min="2"
              className="gool-input mt-1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
          </label>

          {type === 'PLAY' && (
            <>
              <label className="text-xs font-black">
                Format
                <select
                  className="gool-input mt-1"
                  value={format}
                  onChange={(event) => setFormat(event.target.value as typeof format)}
                >
                  <option value="FIVE_V_FIVE">5v5</option>
                  <option value="SEVEN_V_SEVEN">7v7</option>
                  <option value="ELEVEN_V_ELEVEN">11v11</option>
                </select>
              </label>

              <div className="grid grid-cols-[1fr_96px] gap-3">
                <label className="text-xs font-black">
                  Fee
                  <input
                    type="number"
                    min="0"
                    step={moneyInputStep(currency)}
                    className="gool-input mt-1"
                    value={fee}
                    onChange={(event) => setFee(event.target.value)}
                  />
                </label>
                <label className="text-xs font-black">
                  Currency
                  <input
                    className="gool-input mt-1 uppercase"
                    maxLength={3}
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  />
                </label>
              </div>

              {isPaid && (
                <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-sm font-black">Accepted payment methods</div>
                  <label className="mt-3 flex items-center gap-3 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={cashAccepted}
                      onChange={(event) =>
                        setCashSelection({
                          communityId: active?.id ?? '',
                          value: event.target.checked,
                        })
                      }
                    />
                    Cash
                  </label>
                  <p className="mt-2 text-xs leading-5 muted">
                    Cash is the real-world payment rail enabled at launch. The payer cannot mark
                    their own payment as received.
                  </p>

                  <label className="mt-4 block text-xs font-black">
                    Cash RSVP policy
                    <select
                      className="gool-input mt-1"
                      value={cashRsvpPolicy}
                      onChange={(event) =>
                        setCashRsvpPolicy(event.target.value as typeof cashRsvpPolicy)
                      }
                    >
                      <option value="CONFIRM_IMMEDIATELY">
                        Reserve seat now; collect cash later
                      </option>
                      <option value="REQUIRE_CASH_CONFIRMATION">
                        Pending until cash is confirmed
                      </option>
                    </select>
                  </label>
                </div>
              )}
            </>
          )}

          {type === 'WATCH' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-black">
                Home club
                <select
                  className="gool-input mt-1"
                  value={homeClubId}
                  onChange={(event) => setHomeClubId(event.target.value)}
                >
                  <option value="">Optional</option>
                  {clubs.data?.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-black">
                Away club
                <select
                  className="gool-input mt-1"
                  value={awayClubId}
                  onChange={(event) => setAwayClubId(event.target.value)}
                >
                  <option value="">Optional</option>
                  {clubs.data?.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <button
            disabled={!canPublish || create.isPending}
            onClick={() => create.mutate()}
            className="accent-button mt-2 w-full"
          >
            Publish {type === 'PLAY' ? 'match' : 'watch event'}
          </button>
        </div>
      </div>
    </div>
  );
}
