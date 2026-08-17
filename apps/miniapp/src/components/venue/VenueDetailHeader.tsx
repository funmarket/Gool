import { OfficialStarIcon } from '../../icons/OfficialStarIcon';
import './VenueDetailHeader.css';

export type VenueDetailHeaderProps = {
  venueName: string;
  venueType?: string | null | undefined;
  venuePhotoUrl?: string | null | undefined;
  goingCount: number;
  dateLabel: string;
  rsvpLabel?: string | null | undefined;
  officialVenue?: boolean;
  joinLabel: string;
  onJoin: () => void;
  onShare?: () => void;
  joinDisabled?: boolean;
};

export function VenueDetailHeader(props: VenueDetailHeaderProps) {
  return (
    <section className="venue-detail-header-pro">
      <div className="venue-detail-header-photo">
        {props.venuePhotoUrl ? (
          <img src={props.venuePhotoUrl} alt={props.venueName} />
        ) : (
          <div className="venue-detail-header-fallback" aria-hidden>
            <span>{props.venueName.slice(0, 1)}</span>
          </div>
        )}
        {props.officialVenue && (
          <div className="venue-detail-official">
            <OfficialStarIcon size={15} />
            Official venue
          </div>
        )}
      </div>
      <div className="venue-detail-header-copy">
        <h2>{props.venueName}</h2>
        {props.venueType && <p className="venue-detail-header-type">{props.venueType}</p>}
        <div className="venue-detail-header-meta">
          <span>
            <b>{props.goingCount}</b> going
          </span>
          <i />
          <span>{props.dateLabel}</span>
        </div>
        {props.rsvpLabel && <div className="venue-detail-rsvp">{props.rsvpLabel}</div>}
        <button
          className="venue-detail-join"
          type="button"
          onClick={props.onJoin}
          disabled={props.joinDisabled}
        >
          {props.joinLabel}
        </button>
        {props.onShare && (
          <button className="venue-detail-share" type="button" onClick={props.onShare}>
            Share event
          </button>
        )}
      </div>
    </section>
  );
}
