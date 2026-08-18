import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { post } from '../shared/api/http-client';
import { notify } from '../lib/telegram';
import { SimpleForm } from './CreateRequestPage';

export function NewCommunityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [joinMode, setJoinMode] = useState<'slug' | 'invite'>('slug');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  const mutation = useMutation({
    mutationFn: () => {
      if (mode === 'create') {
        return post('/api/v1/communities', {
          name,
          slug,
          city: city || undefined,
          description: description || undefined,
          visibility,
        });
      }
      return joinMode === 'invite'
        ? post('/api/v1/communities/join/invite', { code: inviteCode.trim() })
        : post('/api/v1/communities/join', { slug });
    },
    onSuccess: async () => {
      notify('success');
      await queryClient.invalidateQueries({ queryKey: ['communities'] });
      navigate('/community');
    },
    onError: () => notify('error'),
  });

  const canSubmit =
    mode === 'create'
      ? Boolean(name && slug)
      : joinMode === 'invite'
        ? inviteCode.trim().length >= 16
        : Boolean(slug);

  return (
    <SimpleForm
      title={mode === 'create' ? 'Create HOOMA' : 'Join HOOMA'}
      kicker="Many communities, one identity"
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          className="ghost-button"
          style={mode === 'create' ? { borderColor: 'var(--accent)' } : {}}
          onClick={() => setMode('create')}
        >
          Create
        </button>
        <button
          className="ghost-button"
          style={mode === 'join' ? { borderColor: 'var(--accent)' } : {}}
          onClick={() => setMode('join')}
        >
          Join
        </button>
      </div>

      {mode === 'create' ? (
        <>
          <input
            className="hooma-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSlug(
                event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, ''),
              );
            }}
            placeholder="North End HOOMA"
          />
          <input
            className="hooma-input"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City (optional)"
          />
          <textarea
            className="hooma-input min-h-24"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What brings this community together?"
          />
          <select
            className="hooma-input"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')}
          >
            <option value="PUBLIC">Public · anyone can join by slug</option>
            <option value="PRIVATE">Private · invite code required</option>
          </select>
          <input
            className="hooma-input"
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            placeholder="community-slug"
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="ghost-button"
              style={joinMode === 'slug' ? { borderColor: 'var(--accent)' } : {}}
              onClick={() => setJoinMode('slug')}
            >
              Public slug
            </button>
            <button
              className="ghost-button"
              style={joinMode === 'invite' ? { borderColor: 'var(--accent)' } : {}}
              onClick={() => setJoinMode('invite')}
            >
              Invite code
            </button>
          </div>
          {joinMode === 'invite' ? (
            <input
              className="hooma-input"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="Paste your private invite code"
            />
          ) : (
            <input
              className="hooma-input"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              placeholder="community-slug"
            />
          )}
        </>
      )}

      <button
        className="accent-button"
        disabled={!canSubmit || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mode === 'create' ? 'Create community' : 'Join community'}
      </button>
      {mutation.error && (
        <div className="text-sm" style={{ color: 'var(--danger)' }}>
          {mutation.error.message}
        </div>
      )}
    </SimpleForm>
  );
}
