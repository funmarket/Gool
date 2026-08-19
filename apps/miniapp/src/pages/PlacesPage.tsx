import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { get } from '../shared/api/http-client';
import { useCommunity } from '../providers/CommunityProvider';
import type { Place } from '../types/domain';

function placeStatusLabel(place: Place) {
  if (place.status === 'VERIFIED') return 'Verified venue';
  if (place.status === 'OWNER_CLAIMED') return 'Owner claim pending';
  return 'Suggested by community';
}

export function PlacesPage() {
  const { active } = useCommunity();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const places = useQuery({
    queryKey: ['places', active?.id, search],
    queryFn: () =>
      get<Place[]>(
        `/api/v1/watch/places?communityId=${active?.id}${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ''}`,
      ),
    enabled: Boolean(active),
  });

  return (
    <div className="page-shell vintage-page">
      <div className="vintage-section-heading">
        <div>
          <div className="vintage-kicker">Watch venues</div>
          <h1 className="section-title">Places</h1>
        </div>
        <button
          type="button"
          className="vintage-text-button"
          onClick={() => navigate('/watch/places/new')}
        >
          Add a Place
        </button>
      </div>
      <div className="mt-4">
        <input
          className="hooma-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search cafes, lounges, city or houma"
        />
      </div>
      <section className="mt-5 grid gap-3" aria-label="Places">
        {places.isLoading ? (
          <div className="vintage-empty">Loading places...</div>
        ) : places.isError ? (
          <div className="vintage-empty">Places could not be loaded.</div>
        ) : places.data?.length ? (
          places.data.map((place) => (
            <article key={place.id} className="surface-card overflow-hidden">
              {place.photoUrl ? (
                <img src={place.photoUrl} alt={place.name} className="h-44 w-full object-cover" />
              ) : null}
              <div className="grid gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{place.name}</h2>
                    <p className="text-sm muted">{place.category}</p>
                  </div>
                  <span className="text-xs font-black">{placeStatusLabel(place)}</span>
                </div>
                <p className="text-sm">
                  {[place.city, place.houma].filter(Boolean).join(', ') || place.address}
                </p>
                {place.description ? <p className="text-sm muted">{place.description}</p> : null}
                {place.menuItems?.length ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {place.menuItems.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border px-3 py-1 text-xs"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {item.name}
                        {item.priceLabel ? ` · ${item.priceLabel}` : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="ghost-button mt-2"
                  onClick={() => navigate(`/watch/places/${place.id}`)}
                >
                  View Place
                </button>
              </div>
            </article>
          ))
        ) : (
          <button
            className="vintage-empty vintage-empty-action"
            onClick={() => navigate('/watch/places/new')}
          >
            <span>
              <strong>No places yet.</strong>
              <small>Add the first cafe, lounge, or watch venue.</small>
            </span>
          </button>
        )}
      </section>
    </div>
  );
}
