import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function ActionRow({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
  variant = 'default',
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  variant?: 'default' | 'vintage';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'reference-row action-row flex w-full items-center gap-4 px-5 py-4 text-left transition active:scale-[.992]',
        variant === 'vintage' && 'action-row-vintage',
      )}
    >
      <span className="icon-well">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-black tracking-[-.015em]">{title}</span>
        {subtitle && <span className="mt-1 block text-xs font-semibold muted">{subtitle}</span>}
      </span>
      {trailing || <ChevronRight size={22} className="muted" />}
    </button>
  );
}
