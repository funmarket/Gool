import ticketTemplate from '../../assets/home-event-ticket-template.png';
import { CalendarIcon } from '../../icons/CalendarIcon';
import { PinIcon } from '../../icons/PinIcon';
import { UsersIcon } from '../../icons/UsersIcon';
import './HomeEventTicketCard.css';

export type HomeEventTicketCardProps = {
  label?: string;
  title: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogoUrl?: string | null | undefined;
  awayTeamLogoUrl?: string | null | undefined;
  venueName: string;
  venueLocation: string;
  dateLabel: string;
  timeLabel: string;
  goingCount: number;
  statusLabel?: 'OFFICIAL VENUE' | 'SUGGESTED BY COMMUNITY' | undefined;
  onClick: () => void;
};

function shortName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function TeamCrest({ name, logoUrl }: { name: string; logoUrl?: string | null | undefined }) {
  return (
    <span className="home-event-ticket-crest">
      {logoUrl ? <img src={logoUrl} alt={`${name} crest`} /> : <span>{shortName(name)}</span>}
    </span>
  );
}

export function HomeEventTicketCard({
  label = 'NEXT MATCH',
  title,
  homeTeamName,
  awayTeamName,
  homeTeamLogoUrl,
  awayTeamLogoUrl,
  venueName,
  venueLocation,
  dateLabel,
  timeLabel,
  goingCount,
  statusLabel,
  onClick,
}: HomeEventTicketCardProps) {
  return (
    <button
      type="button"
      className="home-event-ticket"
      aria-label={`Open ${title}`}
      onClick={onClick}
    >
      <img className="home-event-ticket-template" src={ticketTemplate} alt="" aria-hidden="true" />
      <span className="home-event-ticket-overlay">
        <span className="home-event-ticket-heading">
          <TeamCrest name={homeTeamName} logoUrl={homeTeamLogoUrl} />
          <span className="home-event-ticket-title-group">
            <span className="home-event-ticket-label">{label}</span>
            <strong className="home-event-ticket-title">{title}</strong>
            <span className="home-event-ticket-teams">
              <b>{homeTeamName}</b>
              <span>vs</span>
              <em>{awayTeamName}</em>
            </span>
          </span>
          <TeamCrest name={awayTeamName} logoUrl={awayTeamLogoUrl} />
        </span>

        <span className="home-event-ticket-info home-event-ticket-location">
          <PinIcon size={18} />
          <span>
            <strong>{venueName}</strong>
            <small>{venueLocation}</small>
          </span>
        </span>

        <span className="home-event-ticket-info home-event-ticket-date">
          <CalendarIcon size={18} />
          <span>
            <strong>{dateLabel}</strong>
            <small>{timeLabel}</small>
          </span>
        </span>

        <span className="home-event-ticket-going">
          <UsersIcon size={19} />
          <strong>{goingCount}</strong>
          <span>going</span>
        </span>

        {statusLabel ? <span className="home-event-ticket-status">{statusLabel}</span> : null}
      </span>
    </button>
  );
}
