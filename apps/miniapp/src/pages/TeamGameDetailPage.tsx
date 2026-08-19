import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Trophy } from 'lucide-react';
import { TeamLineupPitch } from '../components/teams/TeamLineupPitch';
import { getTeamGame, teamQueryKeys } from '../features/teams/api';
import { eventDate } from '../lib/format';

export function TeamGameDetailPage() {
  const { gameId = '' } = useParams();
  const gameQuery = useQuery({
    queryKey: teamQueryKeys.gameDetail(gameId),
    queryFn: () => getTeamGame(gameId),
    enabled: Boolean(gameId),
  });
  const game = gameQuery.data;

  if (gameQuery.isLoading) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Game not found.</div>
      </div>
    );
  }

  return (
    <div className="page-shell vintage-page">
      <div className="vintage-kicker">Accepted challenge</div>
      <h1 className="team-profile-title">
        {game.homeTeam.name} vs {game.awayTeam.name}
      </h1>
      <section className="team-game-summary mt-5">
        <span>
          <Trophy size={18} /> {game.status}
        </span>
        <span>
          <CalendarDays size={18} />{' '}
          {game.scheduledAt ? eventDate(game.scheduledAt) : 'Scheduling TBA'}
        </span>
        <span>
          <MapPin size={18} /> {game.venueName ?? 'Venue TBA'}
        </span>
      </section>
      <section className="teams-section grid gap-3 sm:grid-cols-2">
        <TeamLineupPitch
          teamName={game.homeTeam.name}
          lineup={game.homeTeam.lineups?.[0] ?? null}
        />
        <TeamLineupPitch
          teamName={game.awayTeam.name}
          lineup={game.awayTeam.lineups?.[0] ?? null}
        />
      </section>
    </div>
  );
}
