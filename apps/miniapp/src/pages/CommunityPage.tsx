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
  community: Omit<Community, 'role'> & { _count: { memberships: number; events: number; requests: number; rideOffers: number; fundraisers: number } };
};

export function CommunityPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const detail = useQuery({ queryKey: ['community', active?.id], queryFn: () => get<CommunityDetailResponse>(`/api/v1/communities/${active?.id}`), enabled: Boolean(active) });

  if (!active) {
    return (
      <div className="page-shell vintage-page">
        <EmptyState icon={<Users />} title="No HOOMA community yet" text="Create or join a community to organize matches and fan meetups." action={<button className="vintage-outline-cta" onClick={() => navigate('/community/new')}>Get started</button>} />
      </div>
    );
  }

  const community = detail.data?.community;
  const role = detail.data?.role ?? active.role;

  return (
    <div className="page-shell vintage-page">
      <div className="vintage-kicker">Your football community</div>
      <h1 className="vintage-display mt-1 text-5xl">HOOMA</h1>

      <section className="vintage-community-hero mt-4 p-5">
        <div className="flex items-start gap-4">
          <div className="vintage-community-mark">{initials(active.name)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-black text-white">{active.name}</h2>
              {role === 'OWNER' ? <Crown size={18} style={{ color: 'var(--hv-gold)' }} /> : role === 'ADMIN' ? <ShieldCheck size={18} style={{ color: 'var(--hv-lime)' }} /> : null}
            </div>
            <p className="vintage-copy mt-1 text-sm">{community?.description || 'Your football community.'}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="vintage-action px-3 py-3 text-center"><strong>{community?._count.memberships ?? 0}</strong><span className="vintage-copy mt-1 block text-[10px] uppercase tracking-wider">Members</span></div>
          <div className="vintage-action px-3 py-3 text-center"><strong>{community?._count.events ?? 0}</strong><span className="vintage-copy mt-1 block text-[10px] uppercase tracking-wider">Events</span></div>
          <div className="vintage-action px-3 py-3 text-center"><strong>{community?._count.rideOffers ?? 0}</strong><span className="vintage-copy mt-1 block text-[10px] uppercase tracking-wider">Rides</span></div>
          <div className="vintage-action px-3 py-3 text-center"><strong>{community?.city || '—'}</strong><span className="vintage-copy mt-1 block text-[10px] uppercase tracking-wider">City</span></div>
        </div>
      </section>

      <div className="mt-6 grid gap-3">
        <button onClick={() => navigate('/community/members')} className="vintage-action flex min-h-[74px] items-center gap-4 px-5 text-left"><span className="vintage-icon"><Users /></span><span className="flex-1 font-black text-white">Members & roles</span><ChevronRight /></button>
        <button onClick={() => navigate('/community/new')} className="vintage-action flex min-h-[74px] items-center gap-4 px-5 text-left"><span className="vintage-icon"><UserPlus /></span><span className="flex-1 font-black text-white">Create or join another community</span><ChevronRight /></button>
        {['OWNER', 'ADMIN'].includes(role) && <button onClick={() => navigate('/admin')} className="vintage-action flex min-h-[74px] items-center gap-4 px-5 text-left"><span className="vintage-icon"><Settings2 /></span><span className="flex-1 font-black text-white">Coach Control Room</span><ChevronRight /></button>}
      </div>
    </div>
  );
}
