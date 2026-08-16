import { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, Shirt, Shuffle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post } from '../shared/api/http-client';
import { notify } from '../lib/telegram';

type Player = { id: string; name: string; rating?: number };
type EventData = {
  id: string;
  title: string;
  playDetails?: { format: Format } | null;
  rsvps: Array<{
    status: string;
    user: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      profile?: { skillRating?: number } | null;
    };
  }>;
};
type TeamResponse = { teams: Array<{ key: 'A' | 'B'; players: Player[] }> };
type Format = 'FIVE_V_FIVE' | 'SEVEN_V_SEVEN' | 'ELEVEN_V_ELEVEN';
type Position = 'GK' | 'CB' | 'FB' | 'WB' | 'DM' | 'CM' | 'AM' | 'W' | 'ST' | 'ANY';
type Slot = {
  id: string;
  team: 'A' | 'B';
  label: string;
  position: Position;
  x: number;
  y: number;
  userId?: string | null;
};

const formationSlots: Record<Format, Array<{ p: Position; x: number; y: number }>> = {
  FIVE_V_FIVE: [
    { p: 'GK', x: 50, y: 90 },
    { p: 'CB', x: 50, y: 68 },
    { p: 'W', x: 25, y: 42 },
    { p: 'W', x: 75, y: 42 },
    { p: 'ST', x: 50, y: 15 },
  ],
  SEVEN_V_SEVEN: [
    { p: 'GK', x: 50, y: 92 },
    { p: 'CB', x: 50, y: 72 },
    { p: 'FB', x: 20, y: 62 },
    { p: 'FB', x: 80, y: 62 },
    { p: 'CM', x: 50, y: 44 },
    { p: 'W', x: 25, y: 22 },
    { p: 'W', x: 75, y: 22 },
  ],
  ELEVEN_V_ELEVEN: [
    { p: 'GK', x: 50, y: 94 },
    { p: 'FB', x: 15, y: 72 },
    { p: 'CB', x: 38, y: 78 },
    { p: 'CB', x: 62, y: 78 },
    { p: 'FB', x: 85, y: 72 },
    { p: 'DM', x: 50, y: 58 },
    { p: 'CM', x: 30, y: 43 },
    { p: 'CM', x: 70, y: 43 },
    { p: 'W', x: 18, y: 20 },
    { p: 'ST', x: 50, y: 12 },
    { p: 'W', x: 82, y: 20 },
  ],
};

function makeSlots(format: Format): Slot[] {
  return (['A', 'B'] as const).flatMap((team) =>
    formationSlots[format].map((slot, index) => ({
      id: `${team}-${index}`,
      team,
      label: slot.p,
      position: slot.p,
      x: slot.x,
      y: slot.y,
    })),
  );
}

function DraggablePlayer({ player }: { player: Player }) {
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: `player:${player.id}`,
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="chip cursor-grab touch-none"
      style={{ opacity: isDragging ? 0.55 : 1 }}
    >
      <Shirt size={13} />
      {player.name}
    </button>
  );
}

function DroppableSlot({ slot, player }: { slot: Slot; player?: Player }) {
  const { isOver, setNodeRef } = useDroppable({ id: `slot:${slot.id}` });
  return (
    <div
      ref={setNodeRef}
      className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <div
        className="mx-auto grid h-9 w-9 place-items-center rounded-full border-2 text-[10px] font-black shadow-lg"
        style={{
          background: isOver ? 'var(--accent)' : 'var(--surface)',
          borderColor: 'var(--accent)',
          color: isOver ? '#050505' : 'var(--text)',
        }}
      >
        {player?.name
          ?.split(' ')
          .map((value) => value[0])
          .join('')
          .slice(0, 2) || slot.label}
      </div>
      {player && (
        <div className="mt-1 max-w-16 truncate text-[9px] font-black text-white drop-shadow">
          {player.name}
        </div>
      )}
    </div>
  );
}

export function FormationBuilderPage() {
  const { eventId = '' } = useParams();
  const navigate = useNavigate();
  const event = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => get<EventData>(`/api/v1/events/${eventId}`),
  });
  const [format, setFormat] = useState<Format>('SEVEN_V_SEVEN');
  const [slots, setSlots] = useState<Slot[]>(() => makeSlots('SEVEN_V_SEVEN'));
  const initializedFromEvent = useRef(false);

  useEffect(() => {
    const eventFormat = event.data?.playDetails?.format;
    if (initializedFromEvent.current || !eventFormat) return;
    initializedFromEvent.current = true;
    setFormat(eventFormat);
    setSlots(makeSlots(eventFormat));
  }, [event.data?.playDetails?.format]);

  const players = useMemo<Player[]>(
    () =>
      event.data?.rsvps
        .filter((rsvp) => ['CONFIRMED', 'ATTENDED'].includes(rsvp.status))
        .map((rsvp) => ({
          id: rsvp.user.id,
          name:
            [rsvp.user.firstName, rsvp.user.lastName].filter(Boolean).join(' ') ||
            rsvp.user.username ||
            'GOOL player',
          rating: rsvp.user.profile?.skillRating ?? 50,
        })) ?? [],
    [event.data],
  );

  const byId = new Map(players.map((player) => [player.id, player]));
  const assigned = new Set(slots.map((slot) => slot.userId).filter(Boolean));

  const randomize = useMutation({
    mutationFn: () => get<TeamResponse>(`/api/v1/play/events/${eventId}/teams/randomize`),
    onSuccess: (data) => {
      const next = makeSlots(format);
      for (const team of data.teams) {
        const teamSlots = next.filter((slot) => slot.team === team.key);
        team.players.slice(0, teamSlots.length).forEach((player, index) => {
          if (teamSlots[index]) teamSlots[index].userId = player.id;
        });
      }
      setSlots(next);
      notify('success');
    },
    onError: () => notify('error'),
  });

  const save = useMutation({
    mutationFn: () =>
      post(`/api/v1/play/events/${eventId}/formations`, {
        name: `${format.replaceAll('_', ' ')} matchday`,
        format,
        published: false,
        slots: slots.map((slot) => ({
          userId: slot.userId || null,
          team: slot.team,
          label: slot.label,
          position: slot.position,
          x: slot.x,
          y: slot.y,
        })),
      }),
    onSuccess: () => {
      notify('success');
      navigate(`/events/${eventId}`);
    },
    onError: () => notify('error'),
  });

  const changeFormat = (nextFormat: Format) => {
    setFormat(nextFormat);
    setSlots(makeSlots(nextFormat));
  };

  const dragEnd = (dragEvent: DragEndEvent) => {
    const playerId = String(dragEvent.active.id).replace('player:', '');
    const over = dragEvent.over?.id ? String(dragEvent.over.id) : '';
    if (!over.startsWith('slot:')) return;
    const slotId = over.replace('slot:', '');
    setSlots((previous) =>
      previous.map((slot) =>
        slot.id === slotId
          ? { ...slot, userId: playerId }
          : slot.userId === playerId
            ? { ...slot, userId: null }
            : slot,
      ),
    );
  };

  return (
    <div className="page-shell">
      <div className="section-kicker">Tactical board</div>
      <h1 className="section-title">Formation builder</h1>
      <p className="mt-1 text-sm muted">
        Drag confirmed players into both teams, or auto-balance by skill and preferred position.
      </p>

      <div className="mt-4 flex gap-2 overflow-auto">
        {(['FIVE_V_FIVE', 'SEVEN_V_SEVEN', 'ELEVEN_V_ELEVEN'] as Format[]).map((candidate) => (
          <button
            key={candidate}
            className="ghost-button shrink-0 py-2.5"
            style={
              format === candidate
                ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
                : {}
            }
            onClick={() => changeFormat(candidate)}
          >
            {candidate === 'FIVE_V_FIVE' ? '5v5' : candidate === 'SEVEN_V_SEVEN' ? '7v7' : '11v11'}
          </button>
        ))}
        <button
          className="accent-button ml-auto shrink-0 py-2.5"
          disabled={randomize.isPending}
          onClick={() => randomize.mutate()}
        >
          <Shuffle size={15} />
          Balance
        </button>
      </div>

      <DndContext onDragEnd={dragEnd}>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(['A', 'B'] as const).map((team) => (
            <section key={team}>
              <div className="mb-2 text-center text-xs font-black">TEAM {team}</div>
              <div
                className="relative aspect-[.72] overflow-hidden rounded-[26px] border-2"
                style={{
                  borderColor: 'var(--border-strong)',
                  background:
                    'linear-gradient(90deg,rgba(255,255,255,.035) 50%,transparent 50%),#123d27',
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/35" />
                <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35" />
                {slots
                  .filter((slot) => slot.team === team)
                  .map((slot) => {
                    const player = slot.userId ? byId.get(slot.userId) : undefined;
                    return (
                      <DroppableSlot key={slot.id} slot={slot} {...(player ? { player } : {})} />
                    );
                  })}
              </div>
            </section>
          ))}
        </div>

        <div className="surface-card mt-4 p-4">
          <div className="mb-2 text-xs font-black uppercase tracking-wider muted">
            Available roster
          </div>
          <div className="flex flex-wrap gap-2">
            {players
              .filter((player) => !assigned.has(player.id))
              .map((player) => (
                <DraggablePlayer key={player.id} player={player} />
              ))}
            {players.length === 0 && (
              <span className="text-sm muted">No confirmed players yet.</span>
            )}
          </div>
        </div>
      </DndContext>

      <button
        className="accent-button mt-4 w-full"
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        <Save size={17} />
        Save formation
      </button>
    </div>
  );
}
