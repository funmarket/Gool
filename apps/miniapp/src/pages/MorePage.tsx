import { HelpCircle, MapPinned, Settings, Share2, Star, UserRound, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActionRow } from '../components/ui/ActionRow';
import { FundCupIcon, RequestFlagIcon, RideBallIcon } from '../components/icons/SoccerIcons';
import { useCommunity } from '../providers/CommunityProvider';
export function MorePage() {
  const navigate = useNavigate();
  const { active } = useCommunity();
  return (
    <div className="page-shell">
      <div className="section-kicker">HOOMA</div>
      <h1 className="section-title">More</h1>
      <div className="mt-5 grid gap-3">
        <ActionRow icon={<MapPinned />} title="Pitch" subtitle="Find a football venue" onClick={() => navigate('/pitch')} />
        <ActionRow icon={<RequestFlagIcon className="h-6 w-6" />} title="Requests" onClick={() => navigate('/requests')} />
        <ActionRow icon={<RideBallIcon className="h-6 w-6" />} title="Ride" onClick={() => navigate('/rides')} />
        <ActionRow icon={<FundCupIcon className="h-6 w-6" />} title="FundMe" onClick={() => navigate('/fundme')} />
      </div>
      <div className="mb-3 mt-7 text-lg font-black">Other actions</div>
      <div className="grid gap-3">
        <ActionRow icon={<UserRound />} title="My player profile" onClick={() => navigate('/profile')} />
        {active && ['OWNER', 'ADMIN'].includes(active.role) && <ActionRow icon={<ShieldCheck />} title="Admin" onClick={() => navigate('/admin')} />}
        <ActionRow icon={<Settings />} title="Settings" onClick={() => navigate('/settings')} />
        <ActionRow icon={<Star />} title="Rate HOOMA" />
        <ActionRow icon={<HelpCircle />} title="Support" />
        <ActionRow icon={<Share2 />} title="Share App" />
      </div>
    </div>
  );
}
