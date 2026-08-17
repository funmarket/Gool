import { BallIcon } from '../../icons/BallIcon';
import { CalendarIcon } from '../../icons/CalendarIcon';
import { PinIcon } from '../../icons/PinIcon';
import { UsersIcon } from '../../icons/UsersIcon';
import { OfficialStarIcon } from '../../icons/OfficialStarIcon';
import './VintageCollectorTicket.css';

export type VintageCollectorTicketProps = {
  collectorNumber: number;
  matchTitle: string;
  teamAName: string;
  teamBName: string;
  teamALogoUrl?: string | null | undefined;
  teamBLogoUrl?: string | null | undefined;
  venueName: string;
  venueLocation: string;
  dateLabel: string;
  timeLabel: string;
  goingCount: number;
  officialVenue: boolean;
  stubLabel: string;
  venuePhotoUrl?: string | null | undefined;
  suggestedByCommunity?: boolean;
  onClick?: () => void;
};

function TeamMark({ name, url }: { name: string; url?: string | null | undefined }) {
  return (
    <span className="vc-ticket-team-mark">
      {url ? (
        <img src={url} alt={`${name} crest`} />
      ) : (
        <span>{name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}

export function VintageCollectorTicket(props: VintageCollectorTicketProps) {
  const content = (
    <>
      {props.venuePhotoUrl && (
        <div className="vc-ticket-photo">
          <img src={props.venuePhotoUrl} alt={props.venueName} />
        </div>
      )}
      <div className="vc-ticket-main">
        <div className="vc-ticket-top">
          <span className="vc-ticket-next-label">Next match</span>
          <span className="vc-ticket-series">
            HOOMA / No. {String(props.collectorNumber).padStart(4, '0')}
          </span>
        </div>
        <div className="vc-ticket-match">
          <TeamMark name={props.teamAName} url={props.teamALogoUrl} />
          <div className="vc-ticket-title-wrap">
            <strong className="vc-ticket-title">{props.matchTitle}</strong>
            <div className="vc-ticket-versus">
              <b>{props.teamAName}</b>
              <span>vs</span>
              <em>{props.teamBName}</em>
            </div>
          </div>
          <TeamMark name={props.teamBName} url={props.teamBLogoUrl} />
        </div>
        <div className="vc-ticket-info">
          <div className="vc-ticket-info-cell">
            <PinIcon size={20} />
            <div>
              <strong>{props.venueName}</strong>
              <small>{props.venueLocation}</small>
            </div>
          </div>
          <div className="vc-ticket-info-cell vc-ticket-date">
            <CalendarIcon size={20} />
            <div>
              <strong>{props.dateLabel}</strong>
              <small>{props.timeLabel}</small>
            </div>
          </div>
        </div>
        <div className="vc-ticket-footer">
          <span className="vc-ticket-going">
            <UsersIcon size={21} />
            <strong>{props.goingCount}</strong> going
          </span>
          {props.officialVenue ? (
            <span className="vc-ticket-badge">
              <OfficialStarIcon size={14} />
              Official venue
            </span>
          ) : props.suggestedByCommunity ? (
            <span className="vc-ticket-badge vc-ticket-badge-muted">Suggested by community</span>
          ) : null}
        </div>
      </div>
      <aside className="vc-ticket-stub" aria-hidden>
        <span className="vc-ticket-stub-ball">
          <BallIcon size={26} />
        </span>
        <span className="vc-ticket-stub-copy">{props.stubLabel}</span>
        <small>{props.dateLabel}</small>
      </aside>
    </>
  );

  if (props.onClick)
    return (
      <button type="button" className="vc-ticket vc-ticket-button" onClick={props.onClick}>
        {content}
      </button>
    );
  return <article className="vc-ticket">{content}</article>;
}
