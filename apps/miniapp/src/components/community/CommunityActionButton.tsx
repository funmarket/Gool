import type { ReactNode } from 'react';
import './CommunityActionButton.css';
export type CommunityActionButtonProps = { icon: ReactNode; label: string; onClick: () => void };
export function CommunityActionButton({ icon, label, onClick }: CommunityActionButtonProps) {
  return (
    <button type="button" className="community-action-button-pro" onClick={onClick}>
      <span>{icon}</span>
      <strong>{label}</strong>
      <i>›</i>
    </button>
  );
}
