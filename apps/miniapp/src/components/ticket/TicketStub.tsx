import type { ReactNode } from 'react';
import './TicketStub.css';

type TicketStubProps = {
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function TicketStub({ label, icon, className }: TicketStubProps) {
  return (
    <aside className={['hooma-ticket-stub', className].filter(Boolean).join(' ')} aria-hidden>
      <div className="hooma-ticket-stub-icon">{icon}</div>
      <span>{label}</span>
    </aside>
  );
}
