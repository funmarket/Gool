import './UpcomingGameCard.css';
export type UpcomingGameCardProps = {
  homeName: string;
  awayName: string;
  homeBadgeUrl?: string | null | undefined;
  awayBadgeUrl?: string | null | undefined;
  dateLabel: string;
  status: string;
  onClick?: () => void;
};
export function UpcomingGameCard(props: UpcomingGameCardProps) {
  return (
    <button type="button" className="team-game-card-pro" onClick={props.onClick}>
      <div className="team-game-matchup">
        <span>
          {props.homeBadgeUrl ? (
            <img src={props.homeBadgeUrl} alt={`${props.homeName} badge`} />
          ) : (
            props.homeName.slice(0, 2).toUpperCase()
          )}
        </span>
        <b>VS</b>
        <span>
          {props.awayBadgeUrl ? (
            <img src={props.awayBadgeUrl} alt={`${props.awayName} badge`} />
          ) : (
            props.awayName.slice(0, 2).toUpperCase()
          )}
        </span>
      </div>
      <div className="team-game-names">
        <span>{props.homeName}</span>
        <span>{props.awayName}</span>
      </div>
      <div className="team-game-date">{props.dateLabel}</div>
      <div className="team-game-status">{props.status}</div>
    </button>
  );
}
