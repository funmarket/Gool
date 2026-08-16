import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../shared/api/http-client';
import { majorToMinor, moneyInputStep } from '../lib/format';
import { notify } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import type { CursorPage, EventItem } from '../types/domain';
import { SimpleForm } from './CreateRequestPage';

export function CreateFundPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState('PITCH_FEES');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('100');
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

  const events = useQuery({
    queryKey: ['events', active?.id],
    queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}`),
    enabled: Boolean(active),
  });

  const create = useMutation({
    mutationFn: () =>
      post('/api/v1/fundraisers', {
        communityId: active!.id,
        eventId: eventId || undefined,
        purpose,
        title,
        description: description || undefined,
        goalMinor: majorToMinor(Number(goal), currency),
        currency: currency.trim().toUpperCase(),
        allowAnonymous: true,
        acceptedPaymentMethods: cashAccepted ? ['CASH'] : [],
      }),
    onSuccess: () => {
      notify('success');
      navigate('/fundme');
    },
    onError: () => notify('error'),
  });

  return (
    <SimpleForm title="New FundMe" kicker="Transparent by design">
      <select
        className="gool-input"
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
      >
        {['PITCH_FEES', 'EQUIPMENT', 'TRAVEL', 'TIFO', 'COMMUNITY', 'OTHER'].map((item) => (
          <option key={item} value={item}>
            {item.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
      <input
        className="gool-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Cover next month's pitch booking"
      />
      <textarea
        className="gool-input min-h-28"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="What the money covers"
      />
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <input
          className="gool-input"
          type="number"
          min={moneyInputStep(currency)}
          step={moneyInputStep(currency)}
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Goal"
        />
        <input
          className="gool-input uppercase"
          maxLength={3}
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          placeholder="TND"
        />
      </div>
      <select
        className="gool-input"
        value={eventId}
        onChange={(event) => setEventId(event.target.value)}
      >
        <option value="">Community-wide fund</option>
        {events.data?.items.map((event) => (
          <option value={event.id} key={event.id}>
            {event.title}
          </option>
        ))}
      </select>
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
        Accept cash contributions
      </label>
      <button
        className="accent-button"
        disabled={!active || !title || Number(goal) <= 0 || !cashAccepted || create.isPending}
        onClick={() => create.mutate()}
      >
        Create FundMe
      </button>
    </SimpleForm>
  );
}
