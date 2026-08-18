import { useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type { CursorPage, EventItem } from '../types/domain';
import { notify } from '../lib/telegram';

export function CreateRequestPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [kind, setKind] = useState('PLAYER');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [position, setPosition] = useState('ANY');
  const [quantity, setQuantity] = useState(1);
  const [eventId, setEventId] = useState('');

  const events = useQuery({
    queryKey: ['events', active?.id],
    queryFn: () => get<CursorPage<EventItem>>(`/api/v1/events?communityId=${active?.id}`),
    enabled: Boolean(active),
  });

  const create = useMutation({
    mutationFn: () =>
      post('/api/v1/requests', {
        communityId: active!.id,
        eventId: eventId || undefined,
        kind,
        title,
        details: details || undefined,
        position: kind === 'POSITION' ? position : undefined,
        quantity,
        expiresAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      }),
    onSuccess: () => {
      notify('success');
      navigate('/requests');
    },
    onError: () => notify('error'),
  });

  return (
    <SimpleForm title="New request" kicker="Fast, specific, expiring">
      <select
        className="hooma-input"
        value={kind}
        onChange={(event) => setKind(event.target.value)}
      >
        <option value="PLAYER">Player</option>
        <option value="POSITION">Specific position</option>
        <option value="EQUIPMENT">Equipment</option>
        <option value="HELP">Help</option>
        <option value="OTHER">Other</option>
      </select>
      {kind === 'POSITION' && (
        <select
          className="hooma-input"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
        >
          {['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY'].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      )}
      <input
        className="hooma-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Need one goalkeeper for 7v7"
      />
      <textarea
        className="hooma-input min-h-28"
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="Details"
      />
      <input
        className="hooma-input"
        type="number"
        min={1}
        max={50}
        value={quantity}
        onChange={(event) => setQuantity(Number(event.target.value))}
      />
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
        disabled={!active || title.trim().length < 2 || create.isPending}
        onClick={() => create.mutate()}
      >
        Post request
      </button>
    </SimpleForm>
  );
}

export function SimpleForm({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <div className="page-shell">
      <div className="section-kicker">{kicker}</div>
      <h1 className="section-title">{title}</h1>
      <div className="surface-card mt-5 grid gap-3 p-4">{children}</div>
    </div>
  );
}
