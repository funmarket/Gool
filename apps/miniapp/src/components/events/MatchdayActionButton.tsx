import type { ReactNode } from 'react';
import './MatchdayActionButton.css';
export type MatchdayActionButtonProps = {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  onClick: () => void;
};
export function MatchdayActionButton({
  title,
  subtitle,
  icon,
  onClick,
}: MatchdayActionButtonProps) {
  return (
    <button type="button" className="matchday-action-button-pro" onClick={onClick}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <i>›</i>
    </button>
  );
}
