import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { get, post } from '../shared/api/http-client';
import { notify } from '../lib/telegram';
import type { CursorPage, Person } from '../types/domain';

type Message = {
  id: string;
  body: string;
  createdAt: string;
  user: Person;
};

export function EventChatPage() {
  const { eventId = '' } = useParams();
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['chat', eventId],
    queryFn: () => get<CursorPage<Message>>(`/api/v1/chat/events/${eventId}`),
    refetchInterval: 5_000,
  });
  const send = useMutation({
    mutationFn: () => post(`/api/v1/chat/events/${eventId}`, { body }),
    onSuccess: async () => {
      setBody('');
      notify('success');
      await queryClient.invalidateQueries({ queryKey: ['chat', eventId] });
    },
    onError: () => notify('error'),
  });

  return (
    <div className="page-shell">
      <div className="section-kicker">Temporary room</div>
      <h1 className="section-title">Event chat</h1>
      <p className="mt-1 text-sm muted">Built for matchday coordination, not permanent clutter.</p>
      <div className="mt-5 grid gap-2">
        {query.data?.items.map((message) => (
          <div className="surface-card p-3" key={message.id}>
            <div className="text-xs font-black" style={{ color: 'var(--accent)' }}>
              {message.user.firstName || message.user.username || 'HOOMA member'}
            </div>
            <div className="mt-1 text-sm">{message.body}</div>
          </div>
        ))}
      </div>
      <div
        className="fixed inset-x-0 layer-composer mx-auto flex max-w-[760px] gap-2 px-4"
        style={{ bottom: 'calc(82px + var(--safe-bottom))' }}
      >
        <input
          className="hooma-input shadow-xl"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && body.trim()) send.mutate();
          }}
          placeholder="Message the event…"
        />
        <button
          className="accent-button p-4"
          disabled={!body.trim() || send.isPending}
          onClick={() => send.mutate()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
