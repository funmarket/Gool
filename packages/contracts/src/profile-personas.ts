export const PROFILE_IDENTITY_TYPES = ['PLAYER', 'FAN', 'GAMER', 'GHOST_RIDER'] as const;

export type ProfileIdentityType = (typeof PROFILE_IDENTITY_TYPES)[number];

export type FootballPersonaGroup = 'FOOTBALL' | 'SUPPORTER' | 'BANTER' | 'ARABIC' | 'CLUB';

export type FootballPersona = {
  key: string;
  locale: string;
  emoji: string;
  label: string;
  group: FootballPersonaGroup;
  allowedClubId?: string;
};

export const FOOTBALL_PERSONAS = [
  { key: 'en_baller', locale: 'en', emoji: '⚽🔥', label: 'Baller', group: 'FOOTBALL' },
  { key: 'en_tekkers', locale: 'en', emoji: '🎩⚽', label: 'Tekkers', group: 'FOOTBALL' },
  { key: 'en_top_bins', locale: 'en', emoji: '🎯', label: 'Top Bins', group: 'FOOTBALL' },
  { key: 'en_gaffer', locale: 'en', emoji: '📋', label: 'Gaffer', group: 'FOOTBALL' },
  { key: 'en_safe_hands', locale: 'en', emoji: '🧤', label: 'Safe Hands', group: 'FOOTBALL' },
  {
    key: 'en_proper_fan',
    locale: 'en',
    emoji: '🏟️',
    label: 'Proper Fan',
    group: 'SUPPORTER',
  },
  {
    key: 'en_terrace_voice',
    locale: 'en',
    emoji: '📣',
    label: 'Terrace Voice',
    group: 'SUPPORTER',
  },
  {
    key: 'en_away_day_warrior',
    locale: 'en',
    emoji: '🚌',
    label: 'Away Day Warrior',
    group: 'SUPPORTER',
  },
  { key: 'en_scarf_up', locale: 'en', emoji: '🧣', label: 'Scarf Up', group: 'SUPPORTER' },
  {
    key: 'en_ref_robbed_us',
    locale: 'en',
    emoji: '🟨😂',
    label: 'Ref Robbed Us',
    group: 'BANTER',
  },
  { key: 'en_var_victim', locale: 'en', emoji: '📺😂', label: 'VAR Victim', group: 'BANTER' },
  {
    key: 'en_always_offside',
    locale: 'en',
    emoji: '🚩😂',
    label: 'Always Offside',
    group: 'BANTER',
  },
  {
    key: 'en_bench_legend',
    locale: 'en',
    emoji: '🪑🐐',
    label: 'Bench Legend',
    group: 'BANTER',
  },
  { key: 'ar_nems', locale: 'ar', emoji: '🦊', label: 'النمس', group: 'ARABIC' },
  { key: 'ar_laaib', locale: 'ar', emoji: '⚽', label: 'لعيب', group: 'ARABIC' },
  { key: 'ar_kawarji', locale: 'ar', emoji: '🔥', label: 'كوارجي', group: 'ARABIC' },
  { key: 'ar_weld_jamia', locale: 'ar', emoji: '❤️', label: 'ولد الجمعية', group: 'ARABIC' },
] as const satisfies readonly FootballPersona[];

export function normalizeProfileIdentityTypes(
  values: readonly ProfileIdentityType[] | null | undefined,
): ProfileIdentityType[] {
  if (!values?.length) return ['GHOST_RIDER'];
  return PROFILE_IDENTITY_TYPES.filter((value) => values.includes(value));
}

export function getFootballPersona(key: string | null | undefined): FootballPersona | null {
  if (!key) return null;
  return FOOTBALL_PERSONAS.find((persona) => persona.key === key) ?? null;
}

export function isFootballPersonaAllowedForClub(
  persona: FootballPersona,
  favoriteClubId: string | null | undefined,
) {
  return !persona.allowedClubId || persona.allowedClubId === favoriteClubId;
}
