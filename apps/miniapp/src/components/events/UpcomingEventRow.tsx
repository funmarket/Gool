import './UpcomingEventRow.css';
export type UpcomingEventRowProps = {
  eventId: string;
  title: string;
  dayNumber: string;
  monthLabel: string;
  timeLabel: string;
  goingCount: number;
  homeTeam?: string | null | undefined;
  awayTeam?: string | null | undefined;
  competitionIconUrl?: string | null | undefined;
  onClick: () => void;
};
export function UpcomingEventRow(props: UpcomingEventRowProps) {
  return (
    <button type="button" className="upcoming-event-row-pro" onClick={props.onClick}>
      <span className="upcoming-event-date">
        <b>{props.dayNumber}</b>
        <small>{props.monthLabel}</small>
      </span>
      <span className="upcoming-event-competition">
        {props.competitionIconUrl ? (
          <img src={props.competitionIconUrl} alt="" />
        ) : (
          <span className="upcoming-event-ball">●</span>
        )}
      </span>
      <span className="upcoming-event-copy">
        <strong>{props.title}</strong>
        {props.homeTeam || props.awayTeam ? (
          <small>
            <b>{props.homeTeam || 'Home'}</b>
            <i>vs</i>
            <em>{props.awayTeam || 'Away'}</em>
          </small>
        ) : null}
      </span>
      <span className="upcoming-event-side">
        <span>
          <b>{props.goingCount}</b> going
        </span>
        <small>{props.timeLabel}</small>
        <i>›</i>
      </span>
    </button>
  );
}
