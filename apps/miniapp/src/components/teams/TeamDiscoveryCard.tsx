import './TeamDiscoveryCard.css';
export type TeamDiscoveryPlayer = { id: string; displayName: string; photoUrl?: string | null };
export type TeamDiscoveryCardProps = {
  name: string;
  badgeUrl?: string | null | undefined;
  city?: string | null | undefined;
  houma?: string | null | undefined;
  playerCount: number;
  formation?: string | null | undefined;
  players: TeamDiscoveryPlayer[];
  isPublic: boolean;
  acceptingChallenges: boolean;
  onViewLineup?: (() => void) | undefined;
  onChallenge?: (() => void) | undefined;
};
export function TeamDiscoveryCard(props: TeamDiscoveryCardProps) {
  return (
    <article className="team-discovery-card-pro">
      <div className="team-discovery-badge">
        {props.badgeUrl ? (
          <img src={props.badgeUrl} alt={`${props.name} badge`} />
        ) : (
          <span>{props.name.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="team-discovery-main">
        <div className="team-discovery-heading">
          <div>
            <h3>{props.name}</h3>
            <p>{[props.city, props.houma].filter(Boolean).join(' · ') || 'Location TBA'}</p>
          </div>
          <span>{props.isPublic ? 'Public team' : 'Private team'}</span>
        </div>
        <div className="team-discovery-meta">
          <b>{props.playerCount}</b> players{props.formation ? ` · ${props.formation}` : ''}
        </div>
        {props.players.length ? (
          <div className="team-discovery-players">
            {props.players.slice(0, 5).map((player) => (
              <span key={player.id}>
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.displayName} />
                ) : (
                  player.displayName.slice(0, 1).toUpperCase()
                )}
              </span>
            ))}
            {props.players.length > 5 && <span>+{props.players.length - 5}</span>}
          </div>
        ) : null}
        <div className="team-discovery-actions">
          {props.onViewLineup && (
            <button type="button" onClick={props.onViewLineup}>
              View lineup
            </button>
          )}
          {props.acceptingChallenges && props.onChallenge && (
            <button type="button" className="primary" onClick={props.onChallenge}>
              Challenge
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
