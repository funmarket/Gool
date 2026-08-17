import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FundCupIcon } from '../icons/FundCupIcon';
import { get } from '../shared/api/http-client';
import { money } from '../lib/format';
import { useCommunity } from '../providers/CommunityProvider';
import type { FundItem, FundPage } from '../types/domain';

function progress(fund: FundItem) {
  const goal = Number(fund.goalMinor);
  if (!Number.isFinite(goal) || goal <= 0) return 0;
  return Math.min(100, Math.round((Number(fund.collectedMinor) / goal) * 100));
}

export function FundMePage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['fundraisers', active?.id],
    queryFn: () => get<FundPage>(`/api/v1/fundraisers?communityId=${active?.id}`),
    enabled: Boolean(active),
  });

  return (
    <div className="page-shell">
      <div className="flex items-end justify-between">
        <div>
          <div className="section-kicker">Transparent community money</div>
          <h1 className="section-title">FundMe</h1>
          <p className="mt-1 text-sm muted">
            Pitch fees, travel, tifo and equipment with visible progress.
          </p>
        </div>
        <button className="accent-button p-3" onClick={() => navigate('/fundme/new')}>
          <Plus />
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {query.data?.items.map((fund: FundItem) => {
          const percentage = progress(fund);
          return (
            <article key={fund.id} className="surface-card p-4">
              <div className="flex gap-3">
                <span className="icon-well">
                  <FundCupIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="section-kicker">{fund.purpose.replaceAll('_', ' ')}</span>
                  <h2 className="mt-1 text-lg font-black">{fund.title}</h2>
                  {fund.event && (
                    <div className="mt-1 text-xs font-bold muted">
                      Attached to {fund.event.title}
                    </div>
                  )}
                </div>
              </div>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full"
                style={{ background: 'var(--surface-3)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percentage}%`, background: 'var(--accent)' }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-black">
                <span>{money(fund.collectedMinor, fund.currency)}</span>
                <span className="muted">
                  of {money(fund.goalMinor, fund.currency)} · {percentage}%
                </span>
              </div>
              <button
                className="accent-button mt-4 w-full"
                onClick={() => navigate(`/fundme/${fund.id}`)}
              >
                Contribute
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
