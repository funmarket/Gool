import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PitchHero } from '../components/hero/PitchHero';
import { PitchCard } from '../components/venue/PitchCard';
import { PitchListingDraft } from '../components/venue/PitchListingDraft';
import { PitchSearchControls } from '../components/venue/PitchSearchControls';
import { listPublicPitches, pitchQueryKeys } from '../features/pitch/api';
import { minorToMajor } from '../lib/format';

export function PitchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [houma, setHouma] = useState(searchParams.get('houma') ?? '');
  const [showListingDraft, setShowListingDraft] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set('q', search.trim());
    if (city.trim()) next.set('city', city.trim());
    if (houma.trim()) next.set('houma', houma.trim());
    setSearchParams(next, { replace: true });
  }, [search, city, houma, setSearchParams]);

  const filters = { search, city, houma };
  const pitchesQuery = useQuery({
    queryKey: pitchQueryKeys.publicList(filters),
    queryFn: () => listPublicPitches(filters),
  });
  const pitches = pitchesQuery.data?.items ?? [];
  const hasFilters = Boolean(search.trim() || city.trim() || houma.trim());

  return (
    <div className="page-shell vintage-page">
      <PitchHero
        onAddPlace={() => {
          setShowListingDraft(true);
          window.requestAnimationFrame(() => {
            document
              .getElementById('pitch-listing-draft-anchor')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }}
      />

      <PitchSearchControls
        search={search}
        city={city}
        houma={houma}
        onSearchChange={setSearch}
        onCityChange={setCity}
        onHoumaChange={setHouma}
      />

      <div id="pitch-listing-draft-anchor">
        {showListingDraft ? <PitchListingDraft onClose={() => setShowListingDraft(false)} /> : null}
      </div>

      <section className="vintage-home-section">
        <div className="vintage-kicker">Places to play</div>
        <h2 className="vintage-section-title">Published venues</h2>

        {pitchesQuery.isPending ? (
          <div className="vintage-empty vintage-pitch-empty mt-3" role="status" aria-live="polite">
            <h3 className="vintage-section-title">Loading pitches…</h3>
            <p className="vintage-copy">Loading published football venues.</p>
          </div>
        ) : pitchesQuery.isError ? (
          <div className="vintage-empty vintage-pitch-empty mt-3" role="alert">
            <h3 className="vintage-section-title">Couldn't load pitches</h3>
            <p className="vintage-copy">The public Pitch feed could not be loaded right now.</p>
            <button type="button" className="ghost-button" onClick={() => pitchesQuery.refetch()}>
              Try again
            </button>
          </div>
        ) : pitches.length > 0 ? (
          <div className="mt-3 grid gap-3">
            {pitches.map((pitch) => {
              const currency = pitch.currency || '';
              const hourlyRate =
                pitch.hourlyRateMinor !== null && currency
                  ? minorToMajor(pitch.hourlyRateMinor, currency)
                  : 0;

              return (
                <PitchCard
                  key={pitch.id}
                  name={pitch.name}
                  city={pitch.city || ''}
                  area={pitch.houma || ''}
                  houma={pitch.houma}
                  pricePerHour={hourlyRate}
                  currency={currency}
                  photoUrl={pitch.photoUrl}
                  address={pitch.fullAddress}
                  phone={pitch.publicPhone}
                />
              );
            })}
          </div>
        ) : (
          <div className="vintage-empty vintage-pitch-empty mt-3">
            <h3 className="vintage-section-title">No pitches listed yet</h3>
            <p className="vintage-copy">
              {hasFilters
                ? 'No published pitches match the current search and location filters.'
                : 'No published football venues are available yet.'}
            </p>
            {hasFilters ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setSearch('');
                  setCity('');
                  setHouma('');
                }}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
