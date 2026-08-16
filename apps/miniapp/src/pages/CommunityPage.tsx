import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Crown, Settings2, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import { initials } from '../lib/format';
import { EmptyState } from '../components/ui/EmptyState';
import type { Community, Role } from '../types/domain';

type CommunityDetailResponse = {
  role: Role;
  community: Omit<Community, 'role'> & {
    _count: {
      memberships: number;
      events: number;
      requests: number;
      rideOffers: number;
      fundraisers: number;
    };
  };
};

export function CommunityPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const detail = useQuery({
    queryKey: ['community', active?.id],
    queryFn: () => get<CommunityDetailResponse>(`/api/v1/communities/${active?.id}`),
    enabled: Boolean(active),
  });

  if (!active) {
    return (
      <div className="page-shell">
        <EmptyState
          icon={<Users />}
          title="No GOOL yet"
          text="Create or join a community to organize matches and fan meetups."
          action={
            <button className="accent-button" onClick={() => navigate('/community/new')}>
              Get started
            </button>
          }
        />
      </div>
    );
  }

  const community = detail.data?.community;
  const role = detail.data?.role ?? active.role;

  return (
    <div className="page-shell">
      <section className="surface-card overflow-hidden">
        <div
          className="h-28"
          style={{
            background:
              'radial-gradient(circle at 80% 20%,var(--accent-soft),transparent 45%),linear-gradient(135deg,var(--surface-3),var(--surface-2))',
          }}
        />
        <div className="px-5 pb-5">
          <div
            className="-mt-8 grid h-16 w-16 place-items-center rounded-[20px] border-4 text-lg font-black"
            style={{
              background: 'var(--accent)',
              color: '#050505',
              borderColor: 'var(--surface)',
            }}
          >
            {initials(active.name)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-[-.035em]">{active.name}</h1>
            {role === 'OWNER' ? (
              <Crown size={18} style={{ color: 'var(--accent)' }} />
            ) : role === 'ADMIN' ? (
              <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
            ) : null}
          </div>
          <p className="mt-1 text-sm muted">
            {community?.description || 'Your football community.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip">
              <Users size={13} />
              {community?._count.memberships ?? 0} members
            </span>
            <span className="chip">{community?._count.events ?? 0} events</span>
            <span className="chip">{community?._count.rideOffers ?? 0} rides</span>
            {community?.city && <span className="chip">{community.city}</span>}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-3">
        <button
          onClick={() => navigate('/community/members')}
          className="reference-row flex items-center gap-4 px-5 text-left"
        >
          <span className="icon-well">
            <Users />
          </span>
          <span className="flex-1 font-black">Members & roles</span>
          <ChevronRight className="muted" />
        </button>
        <button
          onClick={() => navigate('/community/new')}
          className="reference-row flex items-center gap-4 px-5 text-left"
        >
          <span className="icon-well">
            <UserPlus />
          </span>
          <span className="flex-1 font-black">Create or join another GOOL</span>
          <ChevronRight className="muted" />
        </button>
        {['OWNER', 'ADMIN'].includes(role) && (
          <button
            onClick={() => navigate('/admin')}
            className="reference-row flex items-center gap-4 px-5 text-left"
          >
            <span className="icon-well">
              <Settings2 />
            </span>
            <span className="flex-1 font-black">Admin dashboard</span>
            <ChevronRight className="muted" />
          </button>
        )}
      </div>
    </div>
  );
}
