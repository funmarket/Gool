import { FormEvent, useState } from 'react';
import './PitchListingDraft.css';

type Draft = {
  name: string;
  photoUrl: string;
  city: string;
  houma: string;
  address: string;
  hourlyRate: string;
  currency: string;
  phone: string;
  email: string;
};

const STORAGE_KEY = 'hooma:pitch-listing-draft';
const EMPTY_DRAFT: Draft = {
  name: '',
  photoUrl: '',
  city: '',
  houma: '',
  address: '',
  hourlyRate: '',
  currency: 'USD',
  phone: '',
  email: '',
};

function loadDraft(): Draft {
  if (typeof window === 'undefined') return EMPTY_DRAFT;

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? { ...EMPTY_DRAFT, ...(JSON.parse(value) as Partial<Draft>) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

export type PitchListingDraftProps = {
  onClose: () => void;
};

export function PitchListingDraft({ onClose }: PitchListingDraftProps) {
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof Draft, value: string) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setSaved(true);
  };

  return (
    <section className="pitch-listing-draft" aria-labelledby="pitch-listing-title">
      <div className="pitch-listing-draft-head">
        <div>
          <div className="vintage-kicker">Venue owner</div>
          <h2 id="pitch-listing-title" className="vintage-section-title">
            List your pitch
          </h2>
        </div>
        <button type="button" className="pitch-listing-close" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="pitch-listing-note">
        Save the required venue details as a draft on this device. Publishing is intentionally not
        faked here because this frontend bundle does not contain a Pitch listing API endpoint.
      </p>

      <form onSubmit={saveDraft} className="pitch-listing-grid">
        <label>
          <span>Venue name</span>
          <input
            required
            value={draft.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </label>
        <label>
          <span>Real photo URL</span>
          <input
            required
            type="url"
            value={draft.photoUrl}
            onChange={(event) => update('photoUrl', event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          <span>City</span>
          <input
            required
            value={draft.city}
            onChange={(event) => update('city', event.target.value)}
          />
        </label>
        <label>
          <span>Houma</span>
          <input
            required
            value={draft.houma}
            onChange={(event) => update('houma', event.target.value)}
          />
        </label>
        <label className="pitch-listing-wide">
          <span>Full address</span>
          <input
            required
            value={draft.address}
            onChange={(event) => update('address', event.target.value)}
          />
        </label>
        <label>
          <span>Hourly rate</span>
          <input
            required
            inputMode="decimal"
            value={draft.hourlyRate}
            onChange={(event) => update('hourlyRate', event.target.value)}
          />
        </label>
        <label>
          <span>Currency</span>
          <input
            required
            maxLength={3}
            value={draft.currency}
            onChange={(event) => update('currency', event.target.value.toUpperCase())}
          />
        </label>
        <label>
          <span>Phone</span>
          <input
            type="tel"
            value={draft.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={draft.email}
            onChange={(event) => update('email', event.target.value)}
          />
        </label>
        <div className="pitch-listing-wide pitch-listing-actions">
          <button type="submit" className="accent-button">
            Save draft
          </button>
          {saved ? <span role="status">Draft saved on this device.</span> : null}
        </div>
      </form>
    </section>
  );
}
