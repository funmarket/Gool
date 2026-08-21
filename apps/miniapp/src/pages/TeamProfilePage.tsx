import type { TeamPlayerCreateInput, TeamPlayerUpdateInput } from '@hooma/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, MapPin, Pencil, Plus, Shield, Trash2, Users } from 'lucide-react';
import { TeamLineupPitch } from '../components/teams/TeamLineupPitch';
import {
  addTeamPlayer,
  getTeam,
  listManagedTeams,
  removeTeamPlayer,
  teamQueryKeys,
  updateTeam,
  updateTeamPlayer,
} from '../features/teams/api';
import { notify } from '../lib/telegram';
import type { TeamDetailItem } from '../types/domain';

const PLAYER_POSITIONS = ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'W', 'ST', 'ANY'] as const;
type RosterPlayer = NonNullable<TeamDetailItem['players']>[number];

async function refreshTeamQueries(queryClient: ReturnType<typeof useQueryClient>, teamId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(teamId) }),
    queryClient.invalidateQueries({ queryKey: teamQueryKeys.managed() }),
    queryClient.invalidateQueries({ queryKey: teamQueryKeys.all }),
  ]);
}

function TeamEditForm({ team, onDone }: { team: TeamDetailItem; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(team.name);
  const [city, setCity] = useState(team.city ?? '');
  const [houma, setHouma] = useState(team.houma ?? '');
  const [badgeUrl, setBadgeUrl] = useState(team.badgeUrl ?? '');
  const [isPublic, setIsPublic] = useState(team.isPublic);
  const [acceptingChallenges, setAcceptingChallenges] = useState(team.acceptingChallenges);

  const mutation = useMutation({
    mutationFn: () =>
      updateTeam(team.id, {
        name: name.trim(),
        city: city.trim() || undefined,
        houma: houma.trim() || undefined,
        badgeUrl: badgeUrl.trim() || undefined,
        isPublic,
        acceptingChallenges,
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(teamQueryKeys.detail(team.id), updated);
      await refreshTeamQueries(queryClient, team.id);
      notify('success');
      onDone();
    },
    onError: () => notify('error'),
  });

  return (
    <section className="teams-section">
      <div className="vintage-kicker">Team management</div>
      <h2 className="section-title">Edit Team</h2>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-[17px] font-semibold">
          Team name
          <input
            className="hooma-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-[17px] font-semibold">
          Badge / photo URL
          <input
            className="hooma-input"
            type="url"
            value={badgeUrl}
            onChange={(event) => setBadgeUrl(event.target.value)}
            placeholder="https://example.com/team-badge.png"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-[17px] font-semibold">
            City
            <input
              className="hooma-input"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-[17px] font-semibold">
            Houma
            <input
              className="hooma-input"
              value={houma}
              onChange={(event) => setHouma(event.target.value)}
            />
          </label>
        </div>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-[17px] font-semibold">
          Public Team
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-[17px] font-semibold">
          Accept challenges
          <input
            type="checkbox"
            checked={acceptingChallenges}
            onChange={(event) => setAcceptingChallenges(event.target.checked)}
          />
        </label>
        {mutation.isError ? (
          <div className="vintage-empty">Team changes could not be saved.</div>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="ghost-button"
            onClick={onDone}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="accent-button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || name.trim().length < 2}
          >
            {mutation.isPending ? 'Saving…' : 'Save Team'}
          </button>
        </div>
      </div>
    </section>
  );
}

function RosterPlayerForm({
  teamId,
  player,
  onDone,
}: {
  teamId: string;
  player?: RosterPlayer;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(player?.displayName ?? '');
  const [shirtNumber, setShirtNumber] = useState(
    player?.shirtNumber != null ? String(player.shirtNumber) : '',
  );
  const [position, setPosition] = useState(player?.position ?? '');
  const [photoUrl, setPhotoUrl] = useState(player?.photoUrl ?? '');

  const mutation = useMutation({
    mutationFn: () => {
      const parsedNumber = shirtNumber.trim() === '' ? undefined : Number(shirtNumber);
      if (player) {
        const input: TeamPlayerUpdateInput = {
          displayName: displayName.trim(),
          shirtNumber: parsedNumber ?? null,
          position: position ? (position as NonNullable<TeamPlayerUpdateInput['position']>) : null,
          photoUrl: photoUrl.trim() || null,
        };
        return updateTeamPlayer(teamId, player.id, input);
      }
      const input: TeamPlayerCreateInput = {
        displayName: displayName.trim(),
        ...(parsedNumber !== undefined ? { shirtNumber: parsedNumber } : {}),
        ...(position ? { position: position as NonNullable<TeamPlayerCreateInput['position']> } : {}),
        ...(photoUrl.trim() ? { photoUrl: photoUrl.trim() } : {}),
      };
      return addTeamPlayer(teamId, input);
    },
    onSuccess: async () => {
      await refreshTeamQueries(queryClient, teamId);
      notify('success');
      onDone();
    },
    onError: () => notify('error'),
  });

  const shirtNumberValue = shirtNumber.trim() === '' ? null : Number(shirtNumber);
  const invalidNumber =
    shirtNumberValue !== null &&
    (!Number.isInteger(shirtNumberValue) || shirtNumberValue < 0 || shirtNumberValue > 99);

  return (
    <div className="mt-3 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[17px] font-semibold">{player ? 'Edit roster player' : 'Add roster player'}</div>
      <label className="grid gap-2 text-[17px] font-semibold">
        Display name
        <input
          className="hooma-input"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-[17px] font-semibold">
          Shirt number
          <input
            className="hooma-input"
            type="number"
            min="0"
            max="99"
            value={shirtNumber}
            onChange={(event) => setShirtNumber(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-[17px] font-semibold">
          Position
          <select
            className="hooma-input"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
          >
            <option value="">Not set</option>
            {PLAYER_POSITIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-[17px] font-semibold">
        Photo URL
        <input
          className="hooma-input"
          type="url"
          value={photoUrl}
          onChange={(event) => setPhotoUrl(event.target.value)}
          placeholder="https://example.com/player.jpg"
        />
      </label>
      {mutation.isError ? <div className="vintage-empty">Roster changes could not be saved.</div> : null}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="ghost-button" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </button>
        <button
          type="button"
          className="accent-button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || displayName.trim().length < 1 || invalidNumber}
        >
          {mutation.isPending ? 'Saving…' : player ? 'Save player' : 'Add player'}
        </button>
      </div>
    </div>
  );
}

function ManagedRoster({ teamId, players }: { teamId: string; players: RosterPlayer[] }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [confirmingPlayerId, setConfirmingPlayerId] = useState<string | null>(null);

  const removeMutation = useMutation({
    mutationFn: (playerId: string) => removeTeamPlayer(teamId, playerId),
    onSuccess: async () => {
      setConfirmingPlayerId(null);
      await refreshTeamQueries(queryClient, teamId);
      notify('success');
    },
    onError: () => notify('error'),
  });

  return (
    <section className="teams-section">
      <div className="vintage-section-heading">
        <div>
          <div className="vintage-kicker">Team management</div>
          <h2 className="section-title">Roster</h2>
          <p className="mt-1 text-[15px] muted">
            These are roster entries. HOOMA membership and Team responsibilities are managed separately.
          </p>
        </div>
        <button
          type="button"
          className="accent-button shrink-0 px-4"
          onClick={() => {
            setAdding((value) => !value);
            setEditingPlayerId(null);
          }}
        >
          <Plus size={17} /> {adding ? 'Close' : 'Add player'}
        </button>
      </div>

      {adding ? <RosterPlayerForm teamId={teamId} onDone={() => setAdding(false)} /> : null}

      <div className="mt-4 grid gap-2">
        {players.length ? (
          players.map((player) => (
            <div key={player.id}>
              <article className="team-roster-row">
                <span>
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt="" />
                  ) : (
                    player.displayName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <strong>{player.displayName}</strong>
                <small>
                  {player.position ?? 'ANY'}
                  {player.shirtNumber != null ? ` #${player.shirtNumber}` : ''}
                </small>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="ghost-button px-3 py-2"
                    onClick={() => {
                      setEditingPlayerId((current) => (current === player.id ? null : player.id));
                      setAdding(false);
                      setConfirmingPlayerId(null);
                    }}
                    aria-label={`Edit ${player.displayName}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="ghost-button px-3 py-2"
                    onClick={() => {
                      if (confirmingPlayerId === player.id) {
                        removeMutation.mutate(player.id);
                      } else {
                        setConfirmingPlayerId(player.id);
                        setEditingPlayerId(null);
                      }
                    }}
                    disabled={removeMutation.isPending}
                    aria-label={
                      confirmingPlayerId === player.id
                        ? `Confirm removal of ${player.displayName}`
                        : `Remove ${player.displayName}`
                    }
                  >
                    <Trash2 size={16} /> {confirmingPlayerId === player.id ? 'Confirm' : ''}
                  </button>
                </div>
              </article>
              {editingPlayerId === player.id ? (
                <RosterPlayerForm
                  teamId={teamId}
                  player={player}
                  onDone={() => setEditingPlayerId(null)}
                />
              ) : null}
            </div>
          ))
        ) : (
          <div className="vintage-empty">
            <strong>No roster players yet.</strong>
          </div>
        )}
      </div>
    </section>
  );
}

export function TeamProfilePage() {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const teamQuery = useQuery({
    queryKey: teamQueryKeys.detail(teamId),
    queryFn: () => getTeam(teamId),
    enabled: Boolean(teamId),
  });
  const managedTeamsQuery = useQuery({
    queryKey: teamQueryKeys.managed(),
    queryFn: listManagedTeams,
    retry: false,
  });
  const team = teamQuery.data;
  const managedTeam = managedTeamsQuery.data?.items.find((item) => item.id === teamId);
  const canManage = Boolean(managedTeam);
  const lineup = team?.lineups?.[0] ?? null;
  const rosterPlayers = (canManage ? managedTeam?.players : team?.players) ?? [];

  if (teamQuery.isLoading) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty h-72 animate-pulse" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page-shell vintage-page">
        <div className="vintage-empty">Team not found.</div>
      </div>
    );
  }

  return (
    <div className="page-shell vintage-page">
      <section className="team-profile-hero">
        <span className="team-profile-badge">
          {team.badgeUrl ? (
            <img src={team.badgeUrl} alt={`${team.name} badge`} />
          ) : (
            <Shield size={56} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="vintage-kicker">{canManage ? 'Your Team' : 'Public team'}</div>
          <h1 className="team-profile-title">{team.name}</h1>
          <p className="team-profile-meta">
            <MapPin size={16} />{' '}
            {[team.city, team.houma].filter(Boolean).join(', ') || 'Location TBA'}
          </p>
          <p className="team-profile-meta">
            <Users size={16} /> {team._count?.players ?? rosterPlayers.length} players
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            className="ghost-button shrink-0 px-3 py-2.5"
            onClick={() => setEditing((value) => !value)}
          >
            <Pencil size={17} /> {editing ? 'Close' : 'Edit Team'}
          </button>
        ) : null}
      </section>

      {editing && canManage ? <TeamEditForm team={team} onDone={() => setEditing(false)} /> : null}

      <section className="teams-section">
        <div className="vintage-section-heading">
          <div>
            <div className="vintage-kicker">Lineup</div>
            <h2 className="section-title">Published shape</h2>
          </div>
          {team.acceptingChallenges && !canManage ? (
            <button
              className="accent-button shrink-0 px-4"
              onClick={() => navigate(`/teams/${team.id}/challenge`)}
            >
              Challenge
            </button>
          ) : null}
        </div>
        <TeamLineupPitch teamName={team.name} lineup={lineup} />
      </section>

      {canManage ? (
        <ManagedRoster teamId={team.id} players={rosterPlayers} />
      ) : (
        <section className="teams-section">
          <div className="vintage-kicker">Roster</div>
          <h2 className="section-title">Players</h2>
          <div className="mt-4 grid gap-2">
            {rosterPlayers.length ? (
              rosterPlayers.map((player) => (
                <article className="team-roster-row" key={player.id}>
                  <span>
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt="" />
                    ) : (
                      player.displayName.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <strong>{player.displayName}</strong>
                  <small>
                    {player.position ?? 'ANY'}
                    {player.shirtNumber != null ? ` #${player.shirtNumber}` : ''}
                  </small>
                </article>
              ))
            ) : (
              <div className="vintage-empty">
                <strong>No roster published.</strong>
              </div>
            )}
          </div>
        </section>
      )}

      <button className="vintage-outline-cta mt-5 w-full" onClick={() => navigate('/teams')}>
        Back to Teams <ChevronRight size={18} />
      </button>
    </div>
  );
}
