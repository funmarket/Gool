import type { ReactNode } from 'react';
import './VenueMenuRow.css';

export type VenueMenuItem = { id: string; name: string; priceLabel: string; icon?: ReactNode };
export type VenueMenuRowProps = { items: VenueMenuItem[]; onViewAll?: () => void };
export function VenueMenuRow({ items, onViewAll }: VenueMenuRowProps) {
  if (!items.length) return null;
  return (
    <section className="venue-menu-pro">
      <header>
        <h3>Menu</h3>
        {onViewAll && (
          <button type="button" onClick={onViewAll}>
            View full menu →
          </button>
        )}
      </header>
      <div className="venue-menu-scroll">
        {items.map((item) => (
          <article key={item.id}>
            <div className="venue-menu-icon">{item.icon}</div>
            <strong>{item.name}</strong>
            <span>{item.priceLabel}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
