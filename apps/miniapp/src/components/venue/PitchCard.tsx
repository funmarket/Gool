import { useNavigate } from 'react-router-dom';
import { HoumaStampIcon } from '../../icons/HoumaStampIcon';
import { OfficialStarIcon } from '../../icons/OfficialStarIcon';
import './PitchCard.css';

export type PitchCardProps = {
  name: string;
  city: string;
  area: string;
  pricePerHour: number;
  currency: string;
  photoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  houma?: string | null;
  onAddressClick?: () => void;
  onHoumaClick?: () => void;
  onContactClick?: () => void;
};

export function PitchCard(props: PitchCardProps) {
  const navigate = useNavigate();

  const addressAction = props.onAddressClick ?? (props.address
    ? () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.address || '')}`, '_blank', 'noopener,noreferrer')
    : undefined);

  const houmaAction = props.onHoumaClick ?? (props.houma
    ? () => navigate(`/pitch?houma=${encodeURIComponent(props.houma || '')}`)
    : undefined);

  const contactAction = props.onContactClick ?? (props.phone
    ? () => { window.location.href = `tel:${props.phone}`; }
    : undefined);

  return (
    <article className="pitch-card-pro">
      <div className="pitch-card-pro-photo">
        {props.photoUrl ? (
          <img src={props.photoUrl} alt={props.name} />
        ) : (
          <div className="pitch-card-pro-photo-fallback"><span>HOOMA</span></div>
        )}
        <HoumaStampIcon className="pitch-card-pro-stamp" size={52} title="HOOMA" />
      </div>

      <div className="pitch-card-pro-body">
        <h3>{props.name}</h3>
        <div className="pitch-card-pro-location">
          <span className="pitch-card-pro-pin">●</span>
          {props.city} · {props.area}
        </div>
        <div className="pitch-card-pro-price">
          <strong>{props.pricePerHour}</strong>
          <span>{props.currency} / hour</span>
        </div>
        <div className="pitch-card-pro-actions">
          <button type="button" onClick={addressAction} disabled={!addressAction}>Address</button>
          <button type="button" onClick={houmaAction} disabled={!houmaAction}>Houma</button>
          <button type="button" onClick={contactAction} disabled={!contactAction}>Contact</button>
        </div>
      </div>

      <aside className="pitch-card-pro-stub" aria-hidden>
        <OfficialStarIcon size={14} />
        <span>Pitch · Rent · Score</span>
      </aside>
    </article>
  );
}
