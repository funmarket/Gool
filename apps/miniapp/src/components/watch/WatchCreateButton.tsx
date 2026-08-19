import { UsersIcon } from '../../icons/UsersIcon';
import './WatchCreateButton.css';
export type WatchCreateButtonProps = {
  onClick: () => void;
  label?: string;
  variant?: 'primary' | 'secondary';
};
export function WatchCreateButton({
  onClick,
  label = 'Create watch event',
  variant = 'primary',
}: WatchCreateButtonProps) {
  return (
    <button type="button" className={`watch-create-button-pro ${variant}`} onClick={onClick}>
      <UsersIcon size={25} />
      {label}
    </button>
  );
}
