import type { FanHub, Place } from '../types/domain';

export function isOfficialWatchPlace(place?: Place | null, fanHub?: FanHub | null) {
  return place?.status === 'VERIFIED' || fanHub?.verified === true;
}

export function watchPlaceLocation(place?: Place | null, fallback?: string | null) {
  if (place?.city && place.houma) return `${place.city}, Houma: ${place.houma}`;
  if (place?.city) return place.city;
  if (place?.houma) return `Houma: ${place.houma}`;
  return fallback ?? '';
}
