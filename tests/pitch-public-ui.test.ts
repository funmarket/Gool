import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync('apps/miniapp/src/App.tsx', 'utf8');
const pitchApi = readFileSync('apps/miniapp/src/features/pitch/api.ts', 'utf8');
const pitchPage = readFileSync('apps/miniapp/src/pages/PitchPage.tsx', 'utf8');
const pitchDetailPage = readFileSync('apps/miniapp/src/pages/PitchDetailPage.tsx', 'utf8');
const telegramBackButton = readFileSync('apps/miniapp/src/hooks/useTelegramBackButton.ts', 'utf8');

test('Pitch public detail route is registered and loads the canonical public Pitch endpoint', () => {
  assert.match(app, /path="\/pitch\/:pitchId"/);
  assert.match(app, /PitchDetailPage/);
  assert.match(pitchDetailPage, /pitchQueryKeys\.publicDetail\(pitchId\)/);
  assert.match(pitchDetailPage, /getPublicPitch\(pitchId\)/);
  assert.match(pitchApi, /`\/api\/v1\/pitch\/\$\{pitchId\}`/);
});

test('Pitch frontend reuses canonical contract types instead of duplicating venue/status unions', () => {
  assert.match(pitchApi, /import type \{ PitchListingStatus, PitchVenueType \} from '@hooma\/contracts'/);
  assert.doesNotMatch(pitchApi, /export type PitchVenueType\s*=/);
  assert.doesNotMatch(pitchApi, /status:\s*'DRAFT'\s*\|/);
});

test('Pitch browse remains server-backed and detail reuses the real Pitch card presentation', () => {
  assert.match(pitchPage, /listPublicPitches\(filters\)/);
  assert.match(pitchPage, /minorToMajor\(pitch\.hourlyRateMinor, currency\)/);
  assert.match(pitchPage, /expandedPitchId === pitch\.id/);
  assert.match(pitchDetailPage, /<PitchCard/);
  assert.match(pitchDetailPage, /expanded/);
  assert.doesNotMatch(pitchDetailPage, /BOOK|booking|availability/i);
});

test('Pitch is a Telegram root tab while Pitch detail remains a child route', () => {
  assert.match(telegramBackButton, /'\/pitch'/);
  assert.doesNotMatch(telegramBackButton, /'\/pitch\/:pitchId'/);
  assert.doesNotMatch(telegramBackButton, /'\/more'/);
});
