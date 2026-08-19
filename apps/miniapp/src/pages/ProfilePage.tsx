import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '../lib/telegram';
import { get, patch } from '../shared/api/http-client';
import type { Club, Me } from '../types/domain';

const POSITION_OPTIONS = [
  'GK',
  'CB',
  'FB',
  'WB',
  'DM',
  'CM',
  'AM',
  'W',
  'ST',
  'ANY',
] as const;

const AUDIENCE_OPTIONS = [
  {
    value: 'SPECTATOR' as const,
    title: 'Spectator',
    detail: 'Public profile for browsing, watching, and light participation.',
  },
  {
    value: 'FAN' as const,
    title: 'Fan',
    detail: 'Public supporter identity for football-first social presence.',
  },
];

function fullName(me: Me) {
  const name = [me.firstName, me.lastName].filter(Boolean).join(' ').trim();
  return name || me.username || 'HOOMA member';
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function ProfileCard({
  me,
  photoUrl,
  photoBroken,
  onPhotoError,
}: {
  me: Me;
  photoUrl: string;
  photoBroken: boolean;
  onPhotoError: () => void;
}) {
  const profile = me.profile;
  const name = fullName(me);
  const audience = profile?.profileAudience ?? 'SPECTATOR';
  const positions = profile?.preferredPositions?.length
    ? profile.preferredPositions.join(' · ')
    : 'Flexible role';

  return (
    <section className="surface-card overflow-hidden border border-[#d6ff38]/20 bg-black/60 shadow-[0_0_0_1px_rgba(214,255,56,0.08),0_32px_80px_rgba(0,0,0,0.45)]">
      <div className="relative min-h-[34rem] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,255,56,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,196,72,0.12),transparent_28%),linear-gradient(180deg,rgba(10,10,10,0.9),rgba(0,0,0,0.98))]" />
        <div className="relative grid h-full gap-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="section-kicker">Player card</div>
              <div className="mt-1 text-[2rem] font-black leading-none tracking-tight text-[#f4efe2] sm:text-[2.4rem]">
                {name}
              </div>
              <div className="mt-2 text-[0.95rem] font-medium text-[#d2ccbc]">
                {me.username ? `@${me.username}` : 'Public football identity'}
              </div>
            </div>

            <div className="rounded-2xl border border-[#d6ff38]/25 bg-black/55 px-3 py-2 text-right">
              <div className="text-[0.75rem] font-black uppercase tracking-[0.28em] text-[#d6ff38]">
                OVR
              </div>
              <div className="text-[2rem] font-black leading-none text-[#f4efe2]">
                {profile?.skillRating ?? 50}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#d6ff38]/20 bg-[#0a0a0a]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(214,255,56,0.06),rgba(0,0,0,0.85))]" />
              <div className="relative aspect-[3/4]">
                {!photoBroken && photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                    onError={onPhotoError}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(214,255,56,0.18),rgba(0,0,0,0.95))]">
                    <div className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-[#d6ff38]/40 bg-black/50 text-5xl font-black tracking-[0.18em] text-[#f4efe2]">
                      {initials(name)}
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[0.75rem] font-black uppercase tracking-[0.3em] text-[#d6ff38]">
                      Public label
                    </div>
                    <div className="mt-1 text-2xl font-black text-[#f4efe2]">{audience}</div>
                  </div>
                  <div className="rounded-2xl border border-[#d6ff38]/30 bg-black/50 px-3 py-2 text-right">
                    <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#d6ff38]">
                      Skill
                    </div>
                    <div className="text-[1rem] font-semibold text-[#f4efe2]">
                      {profile?.skillLevel ?? 'MIXED'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                <div className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-[#d6ff38]">
                  Position
                </div>
                <div className="mt-2 text-[1.1rem] font-semibold text-[#f4efe2]">{positions}</div>
              </div>

              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                <div className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-[#d6ff38]">
                  Favorite club
                </div>
                <div className="mt-2 text-[1.1rem] font-semibold text-[#f4efe2]">
                  {profile?.favoriteClub?.name || 'No club selected'}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                <div className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-[#d6ff38]">
                  Bio
                </div>
                <p className="mt-2 text-[0.98rem] leading-7 text-[#d2ccbc]">
                  {profile?.bio || 'Add a short football bio to tell other players what you bring.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileForm({ me, clubs }: { me: Me; clubs: Club[] }) {
  const queryClient = useQueryClient();
  const [photoUrl, setPhotoUrl] = useState(me.photoUrl || '');
  const [photoBroken, setPhotoBroken] = useState(false);
  const [skill, setSkill] = useState(me.profile?.skillLevel || 'MIXED');
  const [favoriteClubId, setFavoriteClubId] = useState(me.profile?.favoriteClubId || '');
  const [bio, setBio] = useState(me.profile?.bio || '');
  const [profileAudience, setProfileAudience] = useState<'SPECTATOR' | 'FAN'>(
    me.profile?.profileAudience || 'SPECTATOR',
  );
  const [preferredPositions, setPreferredPositions] = useState<string[]>(
    me.profile?.preferredPositions || [],
  );

  const togglePosition = (position: string) => {
    setPreferredPositions((current) => {
      if (current.includes(position)) return current.filter((value) => value !== position);
      if (current.length >= 5) return current;
      return [...current, position];
    });
  };

  const mutation = useMutation({
    mutationFn: () =>
      patch<Me>('/api/v1/me/profile', {
        photoUrl: photoUrl.trim() || null,
        skillLevel: skill,
        favoriteClubId: favoriteClubId || null,
        profileAudience,
        bio: bio || null,
        preferredPositions,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated);
      notify('success');
    },
    onError: () => notify('error'),
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <ProfileCard
        me={me}
        photoUrl={photoUrl.trim()}
        photoBroken={photoBroken}
        onPhotoError={() => setPhotoBroken(true)}
      />
      <div className="surface-card grid gap-4 p-4">
        <div>
          <div className="section-kicker">Edit profile</div>
          <h2 className="section-title">Public football identity</h2>
          <p className="mt-2 text-sm muted">
            Use a direct image link for the profile photo. Choose how the public sees the card.
          </p>
        </div>

        <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
          Photo URL
          <input
            className="hooma-input"
            type="url"
            value={photoUrl}
            onChange={(event) => {
              setPhotoBroken(false);
              setPhotoUrl(event.target.value);
            }}
            placeholder="https://example.com/player-photo.jpg"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-[#f4efe2]">Public label</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {AUDIENCE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={[
                  'grid cursor-pointer gap-1 rounded-2xl border p-3 transition',
                  profileAudience === option.value
                    ? 'border-[#d6ff38]/60 bg-[#d6ff38]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ].join(' ')}
              >
                <span className="flex items-center gap-2 text-base font-semibold text-[#f4efe2]">
                  <input
                    type="radio"
                    name="profileAudience"
                    value={option.value}
                    checked={profileAudience === option.value}
                    onChange={() => setProfileAudience(option.value)}
                  />
                  {option.title}
                </span>
                <span className="text-sm text-[#d2ccbc]">{option.detail}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
          Skill level
          <select className="hooma-input" value={skill} onChange={(event) => setSkill(event.target.value)}>
            {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MIXED'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-[#f4efe2]">Preferred positions</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {POSITION_OPTIONS.map((position) => {
              const checked = preferredPositions.includes(position);
              return (
                <label
                  key={position}
                  className={[
                    'flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-2 transition',
                    checked
                      ? 'border-[#d6ff38]/60 bg-[#d6ff38]/10 text-[#f4efe2]'
                      : 'border-white/10 bg-white/5 text-[#d2ccbc] hover:border-white/20',
                  ].join(' ')}
                >
                  <span className="font-semibold">{position}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePosition(position)}
                  />
                </label>
              );
            })}
          </div>
          <p className="text-xs muted">Choose up to 5 positions.</p>
        </fieldset>

        <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
          Club allegiance
          <select
            className="hooma-input"
            value={favoriteClubId}
            onChange={(event) => setFavoriteClubId(event.target.value)}
          >
            <option value="">No favorite club</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
          Bio
          <textarea
            className="hooma-input min-h-28"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Short player bio"
          />
        </label>

        <button className="accent-button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Save profile
        </button>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => get<Me>('/api/v1/me') });
  const clubsQuery = useQuery({
    queryKey: ['clubs'],
    queryFn: () => get<Club[]>('/api/v1/watch/clubs'),
  });

  return (
    <div className="page-shell">
      <div className="section-kicker">Football passport</div>
      <h1 className="section-title">Player Card</h1>
      <p className="mt-2 max-w-2xl text-sm muted">
        The profile is now a public football card. Photo uses a link, and the visible label is
        Spectator or Fan.
      </p>
      {meQuery.data ? (
        <ProfileForm me={meQuery.data} clubs={clubsQuery.data ?? []} />
      ) : (
        <div className="surface-card mt-5 h-56 animate-pulse" />
      )}
    </div>
  );
}
