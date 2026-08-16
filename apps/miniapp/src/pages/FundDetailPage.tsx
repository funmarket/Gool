import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { get, postIdempotent } from '../shared/api/http-client';
import { majorToMinor, money, moneyInputStep } from '../lib/format';
import { notify } from '../lib/telegram';
import { useCommunity } from '../providers/CommunityProvider';
import type { FundPage, PaymentSummary } from '../types/domain';

type ContributionResult = {
  id: string;
  amountMinor: string | number;
  status: string;
  paymentIntent?: PaymentSummary | null;
};

export function FundDetailPage() {
  const { fundId = '' } = useParams();
  const { active } = useCommunity();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('10');
  const [lastPayment, setLastPayment] = useState<PaymentSummary | null>(null);
  const contributionKey = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ['fundraisers', active?.id],
    queryFn: () => get<FundPage>(`/api/v1/fundraisers?communityId=${active?.id}`),
    enabled: Boolean(active),
  });
  const fund = query.data?.items.find((item) => item.id === fundId);
  const acceptsCash = Boolean(
    fund?.paymentMethods?.some((item) => item.method === 'CASH' && item.enabled),
  );
  const isOpen = fund?.status === 'OPEN';

  const contribute = useMutation({
    mutationFn: () => {
      contributionKey.current ||= crypto.randomUUID();
      return postIdempotent<ContributionResult>(
        `/api/v1/fundraisers/${fundId}/contributions`,
        {
          amountMinor: majorToMinor(Number(amount), fund?.currency || 'TND'),
          anonymous: false,
          paymentMethod: 'CASH',
        },
        contributionKey.current,
      );
    },
    onSuccess: async (result) => {
      contributionKey.current = null;
      notify('success');
      setLastPayment(result.paymentIntent ?? null);
      await queryClient.invalidateQueries({ queryKey: ['fundraisers'] });
    },
    onError: () => notify('error'),
  });

  if (!fund) {
    return (
      <div className="page-shell">
        <div className="surface-card p-6">Loading FundMe…</div>
      </div>
    );
  }

  const goal = Number(fund.goalMinor);
  const percentage =
    goal > 0 ? Math.min(100, Math.round((Number(fund.collectedMinor) / goal) * 100)) : 0;

  return (
    <div className="page-shell pt-4">
      <div className="section-kicker">{fund.purpose.replaceAll('_', ' ')}</div>
      <h1 className="section-title">{fund.title}</h1>
      <div className="surface-card mt-5 p-5">
        <div className="text-3xl font-black">{money(fund.collectedMinor, fund.currency)}</div>
        <div className="mt-1 text-sm muted">raised of {money(fund.goalMinor, fund.currency)}</div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full"
          style={{ background: 'var(--surface-3)' }}
        >
          <div
            className="h-full"
            style={{ width: `${percentage}%`, background: 'var(--accent)' }}
          />
        </div>
        {fund.description && <p className="mt-4 text-sm leading-6 muted">{fund.description}</p>}

        <div className="mt-3 text-xs font-black uppercase tracking-wider muted">
          {fund.status.replaceAll('_', ' ')}
        </div>

        {acceptsCash && isOpen ? (
          <>
            <label className="mt-5 block text-xs font-black">
              Cash contribution · {fund.currency}
              <input
                className="gool-input mt-1"
                type="number"
                min={moneyInputStep(fund.currency)}
                step={moneyInputStep(fund.currency)}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  contributionKey.current = null;
                }}
              />
            </label>
            <button
              className="accent-button mt-3 w-full"
              disabled={Number(amount) <= 0 || contribute.isPending}
              onClick={() => contribute.mutate()}
            >
              Record cash pledge
            </button>
            <p className="mt-3 text-xs leading-5 muted">
              It counts as raised only after an authorized organizer, admin or owner confirms the
              cash was received.
            </p>
          </>
        ) : !isOpen ? (
          <p className="mt-5 text-sm font-bold">
            This fundraiser is no longer accepting contributions.
          </p>
        ) : (
          <p className="mt-5 text-sm font-bold">This fundraiser has no enabled payment method.</p>
        )}

        {lastPayment?.status === 'AWAITING_CASH' && (
          <div
            className="mt-4 rounded-2xl px-4 py-3 text-sm font-bold"
            style={{ background: 'var(--accent-soft)' }}
          >
            Cash pledge recorded. Pay the organizer or an authorized community admin to complete it.
          </div>
        )}
      </div>
    </div>
  );
}
