import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FOOTBALL_PERSONAS,
  getFootballPersona,
  normalizeProfileIdentityTypes,
  type FootballPersonaGroup,
  type ProfileIdentityType,
} from '@hooma/contracts';
import {
  getCurrentProfile,
  listFavoriteClubOptions,
  profileQueryKeys,
  updateCurrentProfile,
} from '../features/profile/api';
import type { CurrentProfile } from '../features/profile/types';
import { notify } from '../lib/telegram';
import type { Club } from '../types/domain';

const POSITION_OPTIONS = ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY'] as const;

const IDENTITY_OPTIONS: Array<{
  value: ProfileIdentityType;
  title: string;
  detail: string;
}> = [
  {
    value: 'PLAYER',
    title: 'Player',
    detail: 'I play football or want to find matches.',
  },
  {
    value: 'FAN',
    title: 'Fan',
    detail: 'Football culture, clubs, matches and supporters.',
  },
  {
    value: 'GAMER',
    title: 'Gamer',
    detail: 'Football gaming and competitive football games.',
  },
  {
    value: 'GHOST_RIDER',
    title: 'Ghost Rider',
    detail: 'Just exploring for now.',
  },
];

const PERSONA_GROUPS: Array<{ value: FootballPersonaGroup; label: string }> = [
  { value: 'FOOTBALL', label: 'Football' },
  { value: 'SUPPORTER', label: 'Supporter' },
  { value: 'BANTER', label: 'Banter' },
  { value: 'ARABIC', label: 'Arabic' },
  { value: 'CLUB', label: 'Your Club' },
];

type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MIXED';

function fullName(me: CurrentProfile) {
  const telegramName = [me.firstName, me.lastName].filter(Boolean).join(' ').trim();
  return (
    me.authName ||
    telegramName ||
    me.displayAuthUsername ||
    me.authUsername ||
    me.username ||
    'HOOMA member'
  );
}

function publicHandle(me: CurrentProfile) {
  const handle = me.displayAuthUsername || me.authUsername || me.username;
  return handle ? `@${handle}` : 'Public football identity';
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function identityLabels(types: ProfileIdentityType[]) {
  const normalized = normalizeProfileIdentityTypes(types);
  const specific = normalized.filter((type) => type !== 'GHOST_RIDER');
  const visible = specific.length ? specific : ['GHOST_RIDER'];
  return visible.map((type) => IDENTITY_OPTIONS.find((option) => option.value === type)?.title ?? type);
}

function ProfileCard({
  me,
  photoUrl,
  photoBroken,
  onPhotoError,
  profileIdentityTypes,
  footballPersonaKey,
}: {
  me: CurrentProfile;
  photoUrl: string;
  photoBroken: boolean;
  onPhotoError: () => void;
  profileIdentityTypes: ProfileIdentityType[];
  footballPersonaKey: string;
}) {
  const profile = me.profile;
  const name = fullName(me);
  const identities = identityLabels(profileIdentityTypes);
  const persona = getFootballPersona(footballPersonaKey);
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
              <div className="mt-2 text-[17px] font-medium text-[#d2ccbc]">{publicHandle(me)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {identities.map((identity) => (
                  <span
                    key={identity}
                    className="rounded-full border border-[#d6ff38]/25 bg-[#d6ff38]/10 px-2.5 py-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[#f4efe2]"
                  >
                    {identity}
                  </span>
                ))}
              </div>
              {persona && (
                <div className="mt-3 text-[17px] font-semibold text-[#d6ff38]">
                  {persona.emoji} {persona.label}
                </div>
              )}
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
                      Identity
                    </div>
                    <div className="mt-1 text-xl font-black text-[#f4efe2]">
                      {identities.join(' · ')}
                    </div>
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
                <p className="mt-2 text-[17px] leading-7 text-[#d2ccbc]">
                  {profile?.bio || 'Add a short football bio to tell the community who you are.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileForm({ me, clubs }: { me: CurrentProfile; clubs: Club[] }) {
  const queryClient = useQueryClient();
  const [photoUrl, setPhotoUrl] = useState(me.photoUrl || '');
  const [photoBroken, setPhotoBroken] = useState(false);
  const [skill, setSkill] = useState<SkillLevel>(me.profile?.skillLevel || 'MIXED');
  const [favoriteClubId, setFavoriteClubId] = useState(me.profile?.favoriteClubId || '');
  const [bio, setBio] = useState(me.profile?.bio || '');
  const [profileIdentityTypes, setProfileIdentityTypes] = useState<ProfileIdentityType[]>(
    me.profile?.profileIdentityTypes?.length ? me.profile.profileIdentityTypes : ['GHOST_RIDER'],
  );
  const [footballPersonaKey, setFootballPersonaKey] = useState(
    me.profile?.footballPersonaKey || '',
  );
  const [preferredPositions, setPreferredPositions] = useState<string[]>(
    me.profile?.preferredPositions || [],
  );

  const availablePersonas = useMemo(
    () =>
      FOOTBALL_PERSONAS.filter(
        (persona) => !persona.allowedClubId || persona.allowedClubId === favoriteClubId,
      ),
    [favoriteClubId],
  );

  const personaGroups = useMemo(
    () =>
      PERSONA_GROUPS.map((group) => ({
        ...group,
        items: availablePersonas.filter((persona) => persona.group === group.value),
      })).filter((group) => group.items.length > 0),
    [availablePersonas],
  );

  const toggleIdentity = (identity: ProfileIdentityType) => {
    setProfileIdentityTypes((current) =>
      current.includes(identity)
        ? current.filter((value) => value !== identity)
        : [...current, identity],
    );
  };

  const togglePosition = (position: string) => {
    setPreferredPositions((current) => {
      if (current.includes(position)) return current.filter((value) => value !== position);
      if (current.length >= 5) return current;
      return [...current, position];
    });
  };

  const mutation = useMutation({
    mutationFn: () =>
      updateCurrentProfile({
        photoUrl: photoUrl.trim() || null,
        skillLevel: skill,
        favoriteClubId: favoriteClubId || null,
        profileIdentityTypes,
        footballPersonaKey: footballPersonaKey || null,
        bio: bio || null,
        preferredPositions,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueryKeys.me(), updated);
      const updatedIdentities = updated.profile?.profileIdentityTypes;
      setProfileIdentityTypes(
        updatedIdentities?.length ? updatedIdentities : ['GHOST_RIDER'],
      );
      setFootballPersonaKey(updated.profile?.footballPersonaKey || '');
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
        profileIdentityTypes={profileIdentityTypes}
        footballPersonaKey={footballPersonaKey}
      />
      <div className="surface-card grid gap-5 p-4">
        <div>
          <div className="section-kicker">Edit profile</div>
          <h2 className="section-title">Public football identity</h2>
          <p className="mt-2 text-[17px] muted">
            Shape your HOOMA identity. These choices describe you and never grant permissions.
          </p>
        </div>

        <label className="grid gap-1.5 text-[17px] font-semibold text-[#f4efe2]">
          Profile photo URL
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
          <legend className="text-[17px] font-semibold text-[#f4efe2]">
            What best describes you? <span className="font-normal muted">(choose more than one)</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {IDENTITY_OPTIONS.map((option) => {
              const checked = profileIdentityTypes.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={[
                    'grid cursor-pointer gap-1 rounded-2xl border p-3 transition',
                    checked
                      ? 'border-[#d6ff38]/60 bg-[#d6ff38]/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2 text-[17px] font-semibold text-[#f4efe2]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleIdentity(option.value)}
                    />
                    {option.title}
                  </span>
                  <span className="text-[15px] text-[#d2ccbc]">{option.detail}</span>
                </label>
              );
            })}
          </div>
          {!profileIdentityTypes.length && (
            <p className="text-[15px] muted">
              No selection will be saved as Ghost Rider — just exploring for now.
            </p>
          )}
        </fieldset>

        <label className="grid gap-1.5 text-[17px] font-semibold text-[#f4efe2]">
          Your football nickname
          <select
            className="hooma-input"
            value={footballPersonaKey}
            onChange={(event) => setFootballPersonaKey(event.target.value)}
          >
            <option value="">No nickname</option>
            {personaGroups.map((group) => (
              <optgroup key={group.value} label={group.label}>
                {group.items.map((persona) => (
                  <option key={persona.key} value={persona.key}>
                    {persona.emoji} {persona.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="text-[15px] font-normal muted">
            Nicknames are football persona only. They do not change your permissions.
          </span>
        </label>

        <label className="grid gap-1.5 text-[17px] font-semibold text-[#f4efe2]">
          Skill level
          <select
            className="hooma-input"
            value={skill}
            onChange={(event) => setSkill(event.target.value as SkillLevel)}
          >
            {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MIXED'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-[17px] font-semibold text-[#f4efe2]">Preferred positions</legend>
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
                  <span className="text-[17px] font-semibold">{position}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePosition(position)}
                  />
                </label>
              );
            })}
          </div>
          <p className="text-[15px] muted">Choose up to 5 positions.</p>
        </fieldset>

        <label className="grid gap-1.5 text-[17px] font-semibold text-[#f4efe2]">
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

        <label className="grid gap-1.5 text-[17px] font-semibold text-[#f4efe2]">
          Bio
          <textarea
            className="hooma-input min-h-28"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Short football bio"
          />
        </label>

        {mutation.isError && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-[17px] text-red-100">
            {mutation.error instanceof Error ? mutation.error.message : 'Could not save the profile.'}
          </div>
        )}

        <button
          className="accent-button"
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const meQuery = useQuery({ queryKey: profileQueryKeys.me(), queryFn: getCurrentProfile });
  const clubsQuery = useQuery({
    queryKey: profileQueryKeys.favoriteClubOptions(),
    queryFn: listFavoriteClubOptions,
  });

  return (
    <div className="page-shell">
      <div className="section-kicker">Football passport</div>
      <h1 className="section-title">Player Card</h1>
      <p className="mt-2 max-w-2xl text-[17px] muted">
        Build a football identity that can be Player, Fan, Gamer, Ghost Rider, or any combination.
      </p>

      {meQuery.isPending && (
        <div className="surface-card mt-5 p-6 text-[17px] muted" role="status" aria-live="polite">
          Loading your football profile…
        </div>
      )}

      {meQuery.isError && (
        <section className="surface-card mt-5 p-6 text-center">
          <div className="section-kicker">Profile unavailable</div>
          <h2 className="section-title mt-2">Could not load your football profile</h2>
          <p className="mt-3 text-[17px] muted">
            {meQuery.error instanceof Error ? meQuery.error.message : 'The profile request failed.'}
          </p>
          <button
            className="accent-button mt-5"
            type="button"
            onClick={() => void meQuery.refetch()}
          >
            Try again
          </button>
        </section>
      )}

      {meQuery.data && (
        <>
          {clubsQuery.isError && (
            <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-[17px] text-amber-100">
              Favorite clubs could not be refreshed. Your existing profile is still available.
            </div>
          )}
          <div className="mt-5">
            <ProfileForm me={meQuery.data} clubs={clubsQuery.data ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
