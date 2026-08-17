import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, MapPin, Shield, Users } from 'lucide-react';
import { TeamLineupPitch } from '../components/teams/TeamLineupPitch';
import { get } from '../shared/api/http-client';
import type { TeamDetailItem } from '../types/domain';

export function TeamProfilePage() {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => get<TeamDetailItem>(`/api/v1/teams/${teamId}`),
    enabled: Boolean(teamId),
  });
  const team = teamQuery.data;
  const lineup = team?.lineups?.[0] ?? null;

  if (teamQuery.isLoading) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Team not found.</div>
      </div>
    );
  }

  return (
    <div className="page-shell vintage-page">
      <section className="team-profile-hero">
        <span className="team-profile-badge">
          {team.badgeUrl ? (
            <img src={team.badgeUrl} alt={`${team.name} badge`} />
          ) : (
            <Shield size={56} />
          )}
        </span>
        <div className="min-w-0">
          <div className="vintage-kicker">Public team</div>
          <h1 className="team-profile-title">{team.name}</h1>
          <p className="team-profile-meta">
            <MapPin size={16} />{' '}
            {[team.city, team.houma].filter(Boolean).join(', ') || 'Location TBA'}
          </p>
          <p className="team-profile-meta">
            <Users size={16} /> {team._count?.players ?? team.players?.length ?? 0} players
          </p>
        </div>
      </section>

      <section className="teams-section">
        <div className="vintage-section-heading">
          <div>
            <div className="vintage-kicker">Lineup</div>
            <h2 className="section-title">Published shape</h2>
          </div>
          {team.acceptingChallenges && (
            <button
              className="accent-button shrink-0 px-4"
              onClick={() => navigate(`/teams/${team.id}/challenge`)}
            >
              Challenge
            </button>
          )}
        </div>
        <TeamLineupPitch teamName={team.name} lineup={lineup} />
      </section>

      <section className="teams-section">
        <div className="vintage-kicker">Roster</div>
        <h2 className="section-title">Players</h2>
        <div className="mt-4 grid gap-2">
          {team.players?.length ? (
            team.players.map((player) => (
              <article className="team-roster-row" key={player.id}>
                <span>
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt="" />
                  ) : (
                    player.displayName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <strong>{player.displayName}</strong>
                <small>
                  {player.position ?? 'ANY'}
                  {player.shirtNumber != null ? ` #${player.shirtNumber}` : ''}
                </small>
              </article>
            ))
          ) : (
            <div className="vintage-empty">
              <strong>No roster published.</strong>
            </div>
          )}
        </div>
      </section>

      <button className="vintage-outline-cta mt-5 w-full" onClick={() => navigate('/teams')}>
        Back to Teams <ChevronRight size={18} />
      </button>
    </div>
  );
}
