import type { KeyboardEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { HoumaStampIcon } from '../../icons/HoumaStampIcon';
import { PinIcon } from '../../icons/PinIcon';
import { UsersIcon } from '../../icons/UsersIcon';
import { OfficialStarIcon } from '../../icons/OfficialStarIcon';
import './PitchCard.css';

export type PitchCardProps = {
  id: string;
  name: string;
  city: string;
  houma: string;
  pricePerHour: number;
  currency: string;
  photoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  venueType?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  expanded?: boolean;
  onToggle?: () => void;
};

function venueTypeLabel(value?: string | null) {
  if (!value) return null;
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function openContactUrl(url: string) {
  window.open(url, '_self');
}

export function PitchCard(props: PitchCardProps) {
  const navigate = useNavigate();
  const expanded = props.expanded ?? false;

  const addressAction = props.address
    ? () => {
        const query =
          props.latitude !== null &&
          props.latitude !== undefined &&
          props.longitude !== null &&
          props.longitude !== undefined
            ? `${props.latitude},${props.longitude}`
            : props.address || '';
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
          '_blank',
          'noopener,noreferrer',
        );
      }
    : undefined;

  const houmaAction = props.houma
    ? () => navigate(`/pitch?houma=${encodeURIComponent(props.houma)}`)
    : undefined;

  const contactAction = props.phone
    ? () => openContactUrl(`tel:${props.phone}`)
    : props.email
      ? () => openContactUrl(`mailto:${props.email}`)
      : undefined;

  const stopAndRun = (action?: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    action?.();
  };

  const toggleFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (!props.onToggle) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      props.onToggle();
    }
  };

  return (
    <article
      className={`pitch-card-pro${expanded ? ' pitch-card-pro-expanded' : ''}`}
      data-pitch-id={props.id}
      onClick={props.onToggle}
      onKeyDown={toggleFromKeyboard}
      tabIndex={props.onToggle ? 0 : undefined}
      aria-expanded={props.onToggle ? expanded : undefined}
    >
      <div className="pitch-card-pro-photo">
        {props.photoUrl ? (
          <img src={props.photoUrl} alt={`${props.name} football venue`} loading="lazy" />
        ) : (
          <div className="pitch-card-pro-photo-fallback" aria-label="Venue photo unavailable">
            <span>HOOMA</span>
          </div>
        )}
        <HoumaStampIcon className="pitch-card-pro-stamp" size={52} title="HOOMA" />
      </div>

      <div className="pitch-card-pro-body">
        <h3>{props.name}</h3>
        <div className="pitch-card-pro-location">
          <PinIcon size={18} />
          <span>
            {props.city} · {props.houma}
          </span>
        </div>
        <div className="pitch-card-pro-price">
          <strong>{props.pricePerHour}</strong>
          <span>{props.currency} / hour</span>
        </div>
        <div className="pitch-card-pro-actions" aria-label={`${props.name} actions`}>
          <button type="button" onClick={stopAndRun(addressAction)} disabled={!addressAction}>
            <PinIcon size={17} />
            <span>Address</span>
          </button>
          <button type="button" onClick={stopAndRun(houmaAction)} disabled={!houmaAction}>
            <UsersIcon size={17} />
            <span>Houma</span>
          </button>
          <button type="button" onClick={stopAndRun(contactAction)} disabled={!contactAction}>
            <Phone size={17} aria-hidden="true" />
            <span>Contact</span>
          </button>
        </div>
      </div>

      <aside className="pitch-card-pro-stub" aria-hidden="true">
        <OfficialStarIcon size={14} />
        <span>HOOMA · PITCH · PLAY</span>
      </aside>

      {expanded ? (
        <div className="pitch-card-pro-details" onClick={(event) => event.stopPropagation()}>
          {props.venueType ? (
            <div className="pitch-card-pro-detail-block">
              <span className="pitch-card-pro-detail-label">Venue type</span>
              <strong>{venueTypeLabel(props.venueType)}</strong>
            </div>
          ) : null}

          {props.address ? (
            <div className="pitch-card-pro-detail-block">
              <span className="pitch-card-pro-detail-label">Full address</span>
              <p>{props.address}</p>
            </div>
          ) : null}

          {props.description ? (
            <div className="pitch-card-pro-detail-block">
              <span className="pitch-card-pro-detail-label">About</span>
              <p>{props.description}</p>
            </div>
          ) : null}

          {props.phone || props.email ? (
            <div className="pitch-card-pro-detail-block">
              <span className="pitch-card-pro-detail-label">Contact</span>
              {props.phone ? <p>{props.phone}</p> : null}
              {props.email ? <p>{props.email}</p> : null}
            </div>
          ) : null}

          {contactAction ? (
            <button
              type="button"
              className="pitch-card-pro-contact-owner"
              onClick={stopAndRun(contactAction)}
            >
              Contact owner
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
