import { UsersIcon } from '../../icons/UsersIcon';
import './WatchCreateButton.css';
export type WatchCreateButtonProps = { onClick: () => void };
export function WatchCreateButton({ onClick }: WatchCreateButtonProps) {
  return (
    <button type="button" className="watch-create-button-pro" onClick={onClick}>
      <UsersIcon size={25} />
      Create watch event
    </button>
  );
}
