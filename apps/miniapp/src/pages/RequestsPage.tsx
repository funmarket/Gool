import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RequestFlagIcon } from '../icons/RequestFlagIcon';
import { get, post } from '../shared/api/http-client';
import { eventDate } from '../lib/format';
import { notify } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import type { RequestPage } from '../types/domain';

export function RequestsPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['requests', active?.id],
    queryFn: () => get<RequestPage>(`/api/v1/requests?communityId=${active?.id}`),
    enabled: Boolean(active),
  });
  const claim = useMutation({
    mutationFn: (id: string) => post(`/api/v1/requests/${id}/claim`, { quantity: 1 }),
    onSuccess: () => {
      notify('success');
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: () => notify('error'),
  });

  return (
    <div className="page-shell">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-kicker">Short-lived asks</div>
          <h1 className="section-title">Requests</h1>
          <p className="mt-1 text-sm muted">
            Fill a position, bring gear, or help matchday happen.
          </p>
        </div>
        <button className="accent-button p-3" onClick={() => navigate('/requests/new')}>
          <Plus />
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {query.data?.items.map((request) => {
          const claimed = (request.claims || [])
            .filter((item) => item.status !== 'WITHDRAWN')
            .reduce((sum, item) => sum + item.quantity, 0);
          return (
            <article className="surface-card p-4" key={request.id}>
              <div className="flex gap-3">
                <span className="icon-well">
                  <RequestFlagIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="section-kicker">
                      {request.kind}
                      {request.position ? ` · ${request.position}` : ''}
                    </span>
                    <span className="chip py-1">
                      {claimed}/{request.quantity} claimed
                    </span>
                  </div>
                  <h2 className="mt-1 text-lg font-black">{request.title}</h2>
                  {request.details && <p className="mt-1 text-sm muted">{request.details}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold muted">
                    {request.event && (
                      <span className="flex items-center gap-1">
                        <Users size={13} />
                        {request.event.title}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock3 size={13} /> until {eventDate(request.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                disabled={claim.isPending || claimed >= request.quantity}
                onClick={() => claim.mutate(request.id)}
                className="accent-button mt-4 w-full"
              >
                <Check size={17} /> I can help
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
