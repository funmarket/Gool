import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@hooma/database';
import { eventCreateSchema } from '../packages/contracts/src/events.js';
import { placeCreateSchema } from '../packages/contracts/src/places.js';
import { eventLocationFromFanHub } from '../apps/api/src/modules/events/infrastructure/prisma-event.repository.js';
import { watchEventMatchesFilters } from '../apps/miniapp/src/lib/watch-event-filters.js';
import type { EventItem, FanHub } from '../apps/miniapp/src/types/domain.js';

const startsAt = new Date('2026-08-18T20:00:00.000Z');

function watchEvent(
  id: string,
  fanHub: FanHub | null,
  overrides: Partial<EventItem> = {},
): EventItem {
  return {
    id,
    communityId: 'community_1',
    type: 'WATCH',
    status: 'PUBLISHED',
    title: overrides.title ?? 'El Clasico',
    startsAt: startsAt.toISOString(),
    timezone: 'UTC',
    waitlistEnabled: true,
    cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
    venueName: fanHub?.venueName ?? null,
    address: fanHub?.address ?? null,
    watchDetails: {
      homeClubId: 'real',
      awayClubId: 'barca',
      homeClub: { id: 'real', slug: 'real-madrid', name: 'Real Madrid' },
      awayClub: { id: 'barca', slug: 'fc-barcelona', name: 'Barcelona' },
      fanHubId: fanHub?.id ?? null,
      fanHub,
    },
    _count: { rsvps: 24 },
    ...overrides,
  };
}

test('Watch event creation requires an authoritative Fan Hub id', () => {
  assert.doesNotThrow(() =>
    eventCreateSchema.parse({
      communityId: 'community_1',
      type: 'WATCH',
      title: 'Derby watch night',
      startsAt,
      timezone: 'UTC',
      waitlistEnabled: true,
      cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
      fanHubId: 'fan_hub_1',
    }),
  );

  assert.throws(() =>
    eventCreateSchema.parse({
      communityId: 'community_1',
      type: 'WATCH',
      title: 'Derby watch night',
      startsAt,
      timezone: 'UTC',
      waitlistEnabled: true,
      cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
    }),
  );
});

test('Play event creation does not require a Fan Hub id', () => {
  assert.doesNotThrow(() =>
    eventCreateSchema.parse({
      communityId: 'community_1',
      type: 'PLAY',
      title: 'Friday 7v7',
      startsAt,
      timezone: 'UTC',
      waitlistEnabled: true,
      cashRsvpPolicy: 'CONFIRM_IMMEDIATELY',
      pitchType: 'SEVEN_A_SIDE',
      skillLevel: 'MIXED',
      format: 'SEVEN_V_SEVEN',
      entryFeeMinor: 0n,
      currency: 'TND',
      paymentRequired: false,
      acceptedPaymentMethods: [],
    }),
  );
});

test('Fan Hub location is the source for Watch event venue fields', () => {
  const location = eventLocationFromFanHub({
    venueName: 'Arena Cafe',
    address: 'La Marsa',
    latitude: new Prisma.Decimal('36.8781000'),
    longitude: new Prisma.Decimal('10.3249000'),
  });

  assert.deepEqual(
    {
      venueName: location.venueName,
      address: location.address,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    },
    {
      venueName: 'Arena Cafe',
      address: 'La Marsa',
      latitude: '36.8781',
      longitude: '10.3249',
    },
  );
});

test('Place creation captures business profile fields for linked Fan Hubs', () => {
  const place = placeCreateSchema.parse({
    communityId: 'community_1',
    name: 'Arena Cafe',
    category: 'Sports cafe & lounge',
    description: 'Live matches, food, and good vibes.',
    address: 'Avenue Taieb Mhiri, La Marsa 2070',
    city: 'Tunis',
    houma: 'La Marsa',
    latitude: 36.8781,
    longitude: 10.3249,
    phone: '+216 71 980 123',
    email: 'hello@arenacafe.tn',
    websiteUrl: '',
    photoUrl: 'https://example.com/arena.jpg',
    makeFanHub: true,
    menuItems: [
      { name: 'Espresso', priceLabel: '4 TND' },
      { name: 'Pizza', priceLabel: '18 TND' },
    ],
    ownerClaim: {
      businessName: 'Arena Cafe',
      contactName: 'Venue owner',
      contactPhone: '+216 71 980 123',
      contactEmail: 'hello@arenacafe.tn',
    },
  });

  assert.equal(place.makeFanHub, true);
  assert.equal(place.websiteUrl, undefined);
  assert.equal(place.ownerClaim?.businessName, 'Arena Cafe');
  assert.deepEqual(
    place.menuItems.map((item) => item.name),
    ['Espresso', 'Pizza'],
  );
});

test('Place creation requires a photo URL and public contact method', () => {
  assert.throws(() =>
    placeCreateSchema.parse({
      communityId: 'community_1',
      name: 'No Photo Lounge',
      category: 'Hookah Lounge',
      address: 'La Marsa',
      latitude: 36.8781,
      longitude: 10.3249,
      phone: '+216 71 980 123',
    }),
  );

  assert.throws(() =>
    placeCreateSchema.parse({
      communityId: 'community_1',
      name: 'No Contact Cafe',
      category: 'Cafe',
      address: 'La Marsa',
      latitude: 36.8781,
      longitude: 10.3249,
      photoUrl: 'https://example.com/place.jpg',
    }),
  );
});

test('Watch filtering uses each event actual Fan Hub and is stable across ordering', () => {
  const arena = {
    id: 'hub_arena',
    communityId: 'community_1',
    name: 'Arena Hub',
    venueName: 'Arena Cafe',
    address: 'La Marsa',
    verified: true,
  };
  const derby = {
    id: 'hub_derby',
    communityId: 'community_1',
    name: 'Derby Hub',
    venueName: 'Derby Lounge',
    address: 'El Menzah',
    verified: true,
  };
  const firstOrder = [watchEvent('event_a', arena), watchEvent('event_b', derby)];
  const reversed = [...firstOrder].reverse();

  assert.deepEqual(
    firstOrder
      .filter((event) => watchEventMatchesFilters(event, { query: 'arena' }))
      .map((event) => event.id),
    ['event_a'],
  );
  assert.deepEqual(
    reversed
      .filter((event) => watchEventMatchesFilters(event, { query: 'arena' }))
      .map((event) => event.id),
    ['event_a'],
  );
});

test('Watch filtering supports clubs and legacy events without a Fan Hub', () => {
  const legacy = watchEvent('legacy_watch', null, {
    title: 'Legacy watch night',
    venueName: 'Historical Venue',
    address: 'Old Address',
  });

  assert.equal(watchEventMatchesFilters(legacy, { clubId: 'real' }), true);
  assert.equal(watchEventMatchesFilters(legacy, { query: 'historical' }), true);
  assert.equal(watchEventMatchesFilters(legacy, { query: 'missing fan hub' }), false);
});
