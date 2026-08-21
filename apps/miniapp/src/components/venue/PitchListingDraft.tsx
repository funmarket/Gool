import { useMutation } from '@tanstack/react-query';
import type { PitchCreateRequest, PitchUpdateRequest, PitchVenueType } from '@hooma/contracts';
import { FormEvent, useState } from 'react';
import { createPitchDraft, updatePitchDraft } from '../../features/pitch/api';
import { majorToMinor } from '../../lib/format';
import './PitchListingDraft.css';

type Draft = {
  name: string;
  description: string;
  photoUrl: string;
  venueType: PitchVenueType | '';
  city: string;
  houma: string;
  address: string;
  hourlyRate: string;
  currency: string;
  phone: string;
  email: string;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  photoUrl: '',
  venueType: '',
  city: '',
  houma: '',
  address: '',
  hourlyRate: '',
  currency: 'USD',
  phone: '',
  email: '',
};

const venueTypeOptions: Array<{ value: PitchVenueType; label: string }> = [
  { value: 'FOOTBALL_PITCH', label: 'Football pitch' },
  { value: 'MINI_PITCH', label: 'Mini pitch' },
  { value: 'FUTSAL', label: 'Futsal' },
  { value: 'PRIVATE_STADIUM', label: 'Private stadium' },
  { value: 'INDOOR_FOOTBALL', label: 'Indoor football' },
  { value: 'OUTDOOR_FOOTBALL', label: 'Outdoor football' },
  { value: 'OTHER_FOOTBALL', label: 'Other football venue' },
];

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function createRequest(draft: Draft): PitchCreateRequest {
  const rate = Number(draft.hourlyRate);
  return {
    name: draft.name.trim(),
    description: optional(draft.description),
    photoUrl: optional(draft.photoUrl),
    venueType: draft.venueType || undefined,
    city: optional(draft.city),
    houma: optional(draft.houma),
    fullAddress: optional(draft.address),
    hourlyRateMinor:
      draft.hourlyRate.trim() && Number.isFinite(rate)
        ? majorToMinor(rate, draft.currency)
        : undefined,
    currency: optional(draft.currency),
    publicPhone: optional(draft.phone),
    publicEmail: optional(draft.email),
  };
}

function updateRequest(draft: Draft): PitchUpdateRequest {
  const rate = Number(draft.hourlyRate);
  return {
    name: draft.name.trim(),
    description: optional(draft.description) ?? null,
    photoUrl: optional(draft.photoUrl) ?? null,
    venueType: draft.venueType || null,
    city: optional(draft.city) ?? null,
    houma: optional(draft.houma) ?? null,
    fullAddress: optional(draft.address) ?? null,
    hourlyRateMinor:
      draft.hourlyRate.trim() && Number.isFinite(rate)
        ? majorToMinor(rate, draft.currency)
        : null,
    currency: optional(draft.currency) ?? null,
    publicPhone: optional(draft.phone) ?? null,
    publicEmail: optional(draft.email) ?? null,
  };
}

export type PitchListingDraftProps = {
  onClose: () => void;
};

export function PitchListingDraft({ onClose }: PitchListingDraftProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [savedPitchId, setSavedPitchId] = useState<string | null>(null);

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!savedPitchId) return createPitchDraft(createRequest(draft));
      return updatePitchDraft(savedPitchId, updateRequest(draft));
    },
    onSuccess: (saved) => {
      setSavedPitchId(saved.id);
    },
  });

  const update = (key: keyof Draft, value: string) => {
    saveDraft.reset();
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (draft.name.trim().length < 2 || saveDraft.isPending) return;
    saveDraft.mutate();
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
        Save this venue as a private draft in your HOOMA account. You can complete the publication
        details before submitting it for review.
      </p>

      <form onSubmit={handleSave} className="pitch-listing-grid">
        <label>
          <span>Venue name *</span>
          <input
            required
            minLength={2}
            value={draft.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </label>
        <label>
          <span>Venue type</span>
          <select
            value={draft.venueType}
            onChange={(event) => update('venueType', event.target.value)}
          >
            <option value="">Choose later</option>
            {venueTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="pitch-listing-wide">
          <span>Description</span>
          <textarea
            maxLength={1200}
            value={draft.description}
            onChange={(event) => update('description', event.target.value)}
          />
        </label>
        <label>
          <span>Real photo URL</span>
          <input
            type="url"
            value={draft.photoUrl}
            onChange={(event) => update('photoUrl', event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          <span>City</span>
          <input value={draft.city} onChange={(event) => update('city', event.target.value)} />
        </label>
        <label>
          <span>Houma</span>
          <input value={draft.houma} onChange={(event) => update('houma', event.target.value)} />
        </label>
        <label className="pitch-listing-wide">
          <span>Full address</span>
          <input value={draft.address} onChange={(event) => update('address', event.target.value)} />
        </label>
        <label>
          <span>Hourly rate</span>
          <input
            inputMode="decimal"
            value={draft.hourlyRate}
            onChange={(event) => update('hourlyRate', event.target.value)}
          />
        </label>
        <label>
          <span>Currency</span>
          <input
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
          <button
            type="submit"
            className="accent-button"
            disabled={draft.name.trim().length < 2 || saveDraft.isPending}
          >
            {saveDraft.isPending ? 'Saving…' : 'Save for later'}
          </button>
          {saveDraft.isSuccess ? <span role="status">Draft saved to your HOOMA account.</span> : null}
          {saveDraft.isError ? (
            <span role="alert" className="pitch-listing-error">
              {saveDraft.error instanceof Error ? saveDraft.error.message : 'Unable to save draft.'}
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
