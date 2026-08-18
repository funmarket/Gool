import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PitchHero } from '../components/hero/PitchHero';
import { PitchListingDraft } from '../components/venue/PitchListingDraft';
import { PitchSearchControls } from '../components/venue/PitchSearchControls';

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
        <h2 className="vintage-section-title">Nearby venues</h2>
        <div className="vintage-empty vintage-pitch-empty mt-3">
          <h3 className="vintage-section-title">No pitches listed yet</h3>
          <p className="vintage-copy">
            {hasFilters
              ? 'No published pitches match the current search and location filters.'
              : 'Real published venues will appear here with their photo, City, Houma, hourly rate and public contact data.'}
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
      </section>
    </div>
  );
}
