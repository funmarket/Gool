import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChallengeCard, type ChallengeCardTeam } from '../components/teams/ChallengeCard';
import { get } from '../shared/api/http-client';
import { eventDate } from '../lib/format';
import type { TeamChallengeDetailItem, TeamDetailItem } from '../types/domain';

function cardTeam(team: TeamDetailItem): ChallengeCardTeam {
  const lineup = team.lineups?.[0];
  return {
    name: team.name,
    city: team.city,
    houma: team.houma,
    badgeUrl: team.badgeUrl,
    formation: lineup?.formation,
    leaderName: 'Coach',
    lineup: lineup?.slots.map((slot) => ({
      id: slot.id,
      name: slot.player?.displayName ?? slot.role,
      number: slot.player?.shirtNumber ?? slot.sortOrder + 1,
      x: slot.x,
      y: slot.y,
    })),
  };
}

export function TeamChallengeDetailPage() {
  const { challengeId = '' } = useParams();
  const navigate = useNavigate();
  const challengeQuery = useQuery({
    queryKey: ['team-challenge', challengeId],
    queryFn: () => get<TeamChallengeDetailItem>(`/api/v1/teams/challenges/${challengeId}`),
    enabled: Boolean(challengeId),
  });
  const challenge = challengeQuery.data;

  if (challengeQuery.isLoading) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Challenge not found.</div>
      </div>
    );
  }

  return (
    <div className="page-shell vintage-page">
      <ChallengeCard
        cardNumber={challenge.id.slice(-8).toUpperCase()}
        statusLabel={`Challenge ${challenge.status.toLowerCase()}`}
        homeTeam={cardTeam(challenge.challengerTeam)}
        awayTeam={cardTeam(challenge.challengedTeam)}
        scheduledLabel={
          challenge.proposedStartsAt ? eventDate(challenge.proposedStartsAt) : 'Scheduling TBA'
        }
        venueLabel={challenge.proposedVenue}
        matchTypeLabel={challenge.proposedFormat ?? 'Community Challenge'}
        homeMessage={challenge.message}
        awayMessage={
          challenge.status === 'ACCEPTED' ? 'Challenge accepted. Coordination is open.' : null
        }
        onOpenMatch={
          challenge.game?.id ? () => navigate(`/teams/games/${challenge.game?.id}`) : undefined
        }
      />
    </div>
  );
}
