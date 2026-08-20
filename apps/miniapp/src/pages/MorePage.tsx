import { LogIn, LogOut, Settings, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActionRow } from '../components/ui/ActionRow';
import { useAuth } from '../providers/AuthProvider';
import { useCommunity } from '../providers/CommunityProvider';

export function MorePage() {
  const navigate = useNavigate();
  const { active } = useCommunity();
  const { method, isAuthenticated, canWebLogout, logout } = useAuth();

  return (
    <div className="page-shell vintage-page">
      <div className="vintage-kicker">HOOMA</div>
      <h1 className="vintage-display">More</h1>
      <div className="mt-5 grid gap-3">
        <ActionRow
          icon={<UserRound />}
          title="My player profile"
          onClick={() => navigate('/profile')}
          variant="vintage"
        />
        {active && ['OWNER', 'ADMIN'].includes(active.role) && (
          <ActionRow
            icon={<ShieldCheck />}
            title="Coach Control Room"
            onClick={() => navigate('/admin')}
            variant="vintage"
          />
        )}
        <ActionRow
          icon={<Settings />}
          title="Settings"
          onClick={() => navigate('/settings')}
          variant="vintage"
        />
        {!isAuthenticated && method !== 'loading' && (
          <ActionRow
            icon={<LogIn />}
            title="Sign in or create account"
            onClick={() => navigate('/login?returnTo=%2Fmore')}
            variant="vintage"
          />
        )}
        {canWebLogout && (
          <ActionRow
            icon={<LogOut />}
            title="Sign out"
            onClick={() => void logout()}
            variant="vintage"
          />
        )}
        {method === 'telegram' && (
          <div className="reference-row px-5 py-4 text-sm muted">
            Signed in directly through Telegram. Telegram provides the active identity for this Mini
            App session.
          </div>
        )}
      </div>
    </div>
  );
}
