import { Settings, UserRound, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActionRow } from '../components/ui/ActionRow';
import { useCommunity } from '../providers/CommunityProvider';
export function MorePage() {
  const navigate = useNavigate();
  const { active } = useCommunity();
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
            title="Admin"
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
      </div>
    </div>
  );
}
