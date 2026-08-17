import { useState } from 'react';
import { SearchIcon } from '../../icons/SearchIcon';
import { PinIcon } from '../../icons/PinIcon';
import { ChevronDownIcon } from '../../icons/ChevronDownIcon';
import { UsersIcon } from '../../icons/UsersIcon';
import './PitchSearchControls.css';

export type PitchSearchControlsProps = {
  search: string;
  city: string;
  houma: string;
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onHoumaChange: (value: string) => void;
};

export function PitchSearchControls({
  search,
  city,
  houma,
  onSearchChange,
  onCityChange,
  onHoumaChange,
}: PitchSearchControlsProps) {
  const [openFilter, setOpenFilter] = useState<'city' | 'houma' | null>(null);

  return (
    <section className="pitch-search-controls-pro" aria-label="Pitch search and filters">
      <label className="pitch-search-main">
        <SearchIcon size={24} />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search venues, areas..."
          aria-label="Search pitches"
        />
      </label>

      <button
        type="button"
        className={openFilter === 'city' || city ? 'pitch-filter-active' : undefined}
        onClick={() => setOpenFilter((current) => (current === 'city' ? null : 'city'))}
        aria-expanded={openFilter === 'city'}
      >
        <PinIcon size={20} />
        <span>{city || 'City'}</span>
        <ChevronDownIcon size={17} />
      </button>

      <button
        type="button"
        className={openFilter === 'houma' || houma ? 'pitch-filter-active' : undefined}
        onClick={() => setOpenFilter((current) => (current === 'houma' ? null : 'houma'))}
        aria-expanded={openFilter === 'houma'}
      >
        <UsersIcon size={20} />
        <span>{houma || 'Houma'}</span>
        <ChevronDownIcon size={17} />
      </button>

      {openFilter === 'city' ? (
        <div className="pitch-filter-editor">
          <PinIcon size={18} />
          <input
            autoFocus
            value={city}
            onChange={(event) => onCityChange(event.target.value)}
            placeholder="Type a city"
            aria-label="Filter pitches by city"
          />
          {city ? (
            <button type="button" onClick={() => onCityChange('')}>
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      {openFilter === 'houma' ? (
        <div className="pitch-filter-editor">
          <UsersIcon size={18} />
          <input
            autoFocus
            value={houma}
            onChange={(event) => onHoumaChange(event.target.value)}
            placeholder="Type a houma"
            aria-label="Filter pitches by houma"
          />
          {houma ? (
            <button type="button" onClick={() => onHoumaChange('')}>
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
