import type { ReactNode } from 'react';
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card px-6 py-9 text-center">
      <div
        className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
