import type { ReactNode } from 'react';
import './VenueInfoGrid.css';

export type VenueInfoItem = {
  key: string;
  label: string;
  value: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};
export type VenueInfoGridProps = { items: VenueInfoItem[] };
export function VenueInfoGrid({ items }: VenueInfoGridProps) {
  return (
    <section className="venue-info-grid-pro">
      {items.map((item) => (
        <article key={item.key} className="venue-info-tile-pro">
          <div className="venue-info-title-pro">
            {item.icon}
            {item.label}
          </div>
          <div className="venue-info-value-pro">{item.value}</div>
          {item.actionLabel && item.onAction ? (
            <button type="button" onClick={item.onAction}>
              {item.actionLabel}
            </button>
          ) : null}
        </article>
      ))}
    </section>
  );
}
