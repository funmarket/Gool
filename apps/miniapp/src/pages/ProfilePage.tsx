import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '../lib/telegram';
import { get, patch } from '../shared/api/http-client';
import type { Club, Me } from '../types/domain';

function ProfileForm({ me, clubs }: { me: Me; clubs: Club[] }) {
  const queryClient = useQueryClient();
  const [skill, setSkill] = useState(me.profile?.skillLevel || 'MIXED');
  const [favoriteClubId, setFavoriteClubId] = useState(me.profile?.favoriteClubId || '');
  const [bio, setBio] = useState(me.profile?.bio || '');

  const mutation = useMutation({
    mutationFn: () =>
      patch<Me>('/api/v1/me/profile', {
        skillLevel: skill,
        favoriteClubId: favoriteClubId || null,
        bio: bio || null,
        preferredPositions: me.profile?.preferredPositions || [],
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated);
      notify('success');
    },
    onError: () => notify('error'),
  });

  return (
    <div className="surface-card mt-5 grid gap-3 p-4">
      <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider muted">
        Skill level
        <select
          className="gool-input"
          value={skill}
          onChange={(event) => setSkill(event.target.value)}
        >
          {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MIXED'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider muted">
        Club allegiance
        <select
          className="gool-input"
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

      <label className="grid gap-1.5 text-xs font-black uppercase tracking-wider muted">
        Bio
        <textarea
          className="gool-input min-h-28"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Short player bio"
        />
      </label>

      <button
        className="accent-button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Save profile
      </button>
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
      <div className="section-kicker">Player identity</div>
      <h1 className="section-title">Profile</h1>
      {meQuery.data ? (
        <ProfileForm key={meQuery.data.id} me={meQuery.data} clubs={clubsQuery.data ?? []} />
      ) : (
        <div className="surface-card mt-5 h-56 animate-pulse" />
      )}
    </div>
  );
}
