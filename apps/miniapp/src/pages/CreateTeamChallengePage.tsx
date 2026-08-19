import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, Send, Shield } from 'lucide-react';
import {
  createTeamChallenge,
  getTeam,
  listManagedTeams,
  teamQueryKeys,
} from '../features/teams/api';
import { notify } from '../lib/telegram';

export function CreateTeamChallengePage() {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const [challengerTeamId, setChallengerTeamId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [message, setMessage] = useState('');

  const target = useQuery({
    queryKey: teamQueryKeys.detail(teamId),
    queryFn: () => getTeam(teamId),
    enabled: Boolean(teamId),
  });
  const managed = useQuery({
    queryKey: teamQueryKeys.managed(),
    queryFn: listManagedTeams,
  });

  const availableChallengers = useMemo(
    () => managed.data?.items.filter((team) => team.id !== teamId) ?? [],
    [managed.data?.items, teamId],
  );
  const selectedChallengerId = challengerTeamId || availableChallengers[0]?.id || '';

  const createChallenge = useMutation({
    mutationFn: () =>
      createTeamChallenge({
        challengerTeamId: selectedChallengerId,
        challengedTeamId: teamId,
        ...(startsAt ? { proposedStartsAt: new Date(startsAt) } : {}),
        ...(venue.trim() ? { proposedVenue: venue.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      }),
    onSuccess: (challenge) => {
      notify('success');
      navigate(`/teams/challenges/${challenge.id}`);
    },
    onError: () => notify('error'),
  });

  if (target.isLoading || managed.isLoading) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" />
      </div>
    );
  }

  if (!target.data) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Team not found.</div>
      </div>
    );
  }

  return (
    <div className="page-shell vintage-page">
      <div className="vintage-kicker">Coach challenge</div>
      <h1 className="vintage-section-title">Challenge {target.data.name}</h1>
      <p className="vintage-copy mt-2 text-sm">
        Send a real request from one of the Teams you coach.
      </p>

      <section className="team-challenge-form mt-5">
        <label>
          <span>Your team</span>
          <select
            className="hooma-input"
            value={selectedChallengerId}
            onChange={(event) => setChallengerTeamId(event.target.value)}
            disabled={!availableChallengers.length}
          >
            {availableChallengers.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            <CalendarDays size={16} /> Proposed time
          </span>
          <input
            className="hooma-input"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </label>
        <label>
          <span>
            <MapPin size={16} /> Venue
          </span>
          <input
            className="hooma-input"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Pitch or meeting point"
          />
        </label>
        <label>
          <span>
            <Shield size={16} /> Message
          </span>
          <textarea
            className="hooma-input min-h-28"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Respectful challenge note"
          />
        </label>
        <button
          className="accent-button w-full"
          disabled={!selectedChallengerId || createChallenge.isPending}
          onClick={() => createChallenge.mutate()}
        >
          <Send size={18} /> Send challenge
        </button>
        {!availableChallengers.length && (
          <div className="vintage-empty">
            <strong>No managed team available.</strong>
            <small>Create a Team from the Coach Control Room first.</small>
          </div>
        )}
      </section>
    </div>
  );
}
