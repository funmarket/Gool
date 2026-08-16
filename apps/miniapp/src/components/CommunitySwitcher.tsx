import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Plus, Settings2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '../providers/CommunityProvider';
import { initials } from '../lib/format';

export function CommunitySwitcher() {
  const { active, communities, switchCommunity } = useCommunity();
  const navigate = useNavigate();
  if (!active)
    return (
      <button className="ghost-button" onClick={() => navigate('/community/new')}>
        <Plus size={18} /> Create GOOL
      </button>
    );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex min-w-0 items-center gap-2 rounded-2xl border px-2.5 py-2 text-left outline-none"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <span
            className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl text-xs font-black"
            style={{ background: 'var(--accent)', color: '#050505' }}
          >
            {active.avatarUrl ? (
              <img src={active.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(active.name)
            )}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block text-[9px] font-black uppercase tracking-[.15em] muted">
              Your GOOL
            </span>
            <span className="block max-w-40 truncate text-sm font-black">{active.name}</span>
          </span>
          <ChevronDown size={16} className="muted" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="layer-popover w-[min(92vw,380px)] rounded-[24px] border p-2 shadow-2xl animate-rise"
          style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)' }}
        >
          <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[.18em] muted">
            Switch community
          </div>
          {communities.map((community) => (
            <DropdownMenu.Item
              key={community.id}
              onSelect={() => void switchCommunity(community.id)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 outline-none hover:bg-[var(--surface-2)]"
            >
              <span
                className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl text-xs font-black"
                style={{
                  background: community.id === active.id ? 'var(--accent)' : 'var(--surface-3)',
                  color: community.id === active.id ? '#050505' : 'var(--text)',
                }}
              >
                {community.avatarUrl ? (
                  <img src={community.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(community.name)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">{community.name}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold muted">
                  {community.role !== 'MEMBER' && <ShieldCheck size={12} />} {community.role}
                </span>
              </span>
              {community.id === active.id && <Check size={19} style={{ color: 'var(--accent)' }} />}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-2 h-px" style={{ background: 'var(--border)' }} />
          <DropdownMenu.Item
            onSelect={() => navigate('/community/new')}
            className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-sm font-black outline-none hover:bg-[var(--surface-2)]"
          >
            <Plus size={19} style={{ color: 'var(--accent)' }} /> Create / join community
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => navigate('/admin')}
            className="flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-sm font-black outline-none hover:bg-[var(--surface-2)]"
          >
            <Settings2 size={19} style={{ color: 'var(--accent)' }} /> Manage communities
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
