import { useNavigate } from 'react-router-dom';
import hoomaLogo from '../assets/hooma-logo-reference.png';
import { BellIcon } from '../icons/BellIcon';
import { ProfileIcon } from '../icons/ProfileIcon';

export function AppHeader() {
  const navigate = useNavigate();
  return (
    <header className="app-topbar">
      <button onClick={() => navigate('/')} className="app-logo-button" aria-label="HOOMA home">
        <img src={hoomaLogo} alt="HOOMA" className="app-logo" />
      </button>
      <div className="app-top-actions">
        <button
          aria-label="Notifications"
          className="app-round-button app-bell-button app-notification-button"
        >
          <BellIcon size={22} />
          <span className="app-notification-dot" />
        </button>
        <button
          aria-label="Profile and more"
          className="app-round-button app-profile-button"
          onClick={() => navigate('/more')}
        >
          <ProfileIcon size={22} />
        </button>
      </div>
    </header>
  );
}
