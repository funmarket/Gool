import { MapPin, Shield, Shirt, Trophy, Users } from 'lucide-react';

export type ChallengeLineupPlayer = {
  id: string;
  name: string;
  number: number;
  x: number;
  y: number;
};

export type ChallengeCardTeam = {
  name: string;
  city?: string | null | undefined;
  houma?: string | null | undefined;
  badgeUrl?: string | null | undefined;
  formation?: string | null | undefined;
  leaderName?: string | null | undefined;
  leaderHandle?: string | null | undefined;
  lineup?: ChallengeLineupPlayer[] | undefined;
};

export type ChallengeCardProps = {
  cardNumber: string;
  statusLabel: string;
  homeTeam: ChallengeCardTeam;
  awayTeam: ChallengeCardTeam;
  scheduledLabel?: string | null | undefined;
  venueLabel?: string | null | undefined;
  matchTypeLabel?: string | null | undefined;
  rulesLabel?: string | null | undefined;
  homeMessage?: string | null | undefined;
  awayMessage?: string | null | undefined;
  onOpenMatch?: (() => void) | undefined;
};

function TeamBadge({ team }: { team: ChallengeCardTeam }) {
  return (
    <span
      className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[24px] border"
      style={{
        background: 'linear-gradient(145deg, rgba(39,247,111,0.22), rgba(0,0,0,0.76))',
        borderColor: 'var(--gold)',
        boxShadow: 'inset 0 0 24px rgba(39,247,111,0.18)',
      }}
    >
      {team.badgeUrl ? (
        <img src={team.badgeUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Shield size={42} style={{ color: 'var(--accent)' }} />
      )}
    </span>
  );
}

function MiniPitch({ team }: { team: ChallengeCardTeam }) {
  const players = team.lineup || [];
  return (
    <div
      className="relative h-48 overflow-hidden rounded-2xl border p-3"
      style={{
        background:
          'linear-gradient(180deg, rgba(39,247,111,0.16), rgba(4,28,12,0.9)), repeating-linear-gradient(90deg, transparent 0 36px, rgba(255,255,255,0.03) 36px 37px)',
        borderColor: 'rgba(242,201,76,0.32)',
      }}
    >
      <div className="flex justify-between text-xs font-black uppercase tracking-[0.08em]">
        <span style={{ color: 'var(--accent)' }}>{team.name}</span>
        <span style={{ color: 'var(--accent)' }}>{team.formation || 'Lineup'}</span>
      </div>
      <div className="absolute inset-x-4 bottom-3 top-9 rounded-xl border border-white/10" />
      {players.map((player) => (
        <span
          key={player.id}
          className="absolute grid h-8 w-8 place-items-center rounded-full border text-xs font-black"
          style={{
            left: `${player.x}%`,
            top: `${player.y}%`,
            transform: 'translate(-50%, -50%)',
            background: '#071006',
            borderColor: 'var(--gold)',
            color: 'var(--accent)',
          }}
          title={player.name}
        >
          {player.number}
        </span>
      ))}
      {!players.length && (
        <div className="absolute inset-x-4 top-20 text-center text-xs font-bold muted">
          Published lineup appears here.
        </div>
      )}
    </div>
  );
}

function TeamLeader({ team }: { team: ChallengeCardTeam }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full border">
          <Users size={24} />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-black" style={{ color: 'var(--accent)' }}>
            Team leader
          </span>
          <span className="block truncate text-base font-black">
            {team.leaderName || 'Leader pending'}
          </span>
          {team.leaderHandle && <span className="block text-xs muted">{team.leaderHandle}</span>}
        </span>
      </div>
    </div>
  );
}

export function ChallengeCard({
  cardNumber,
  statusLabel,
  homeTeam,
  awayTeam,
  scheduledLabel,
  venueLabel,
  matchTypeLabel,
  rulesLabel,
  homeMessage,
  awayMessage,
  onOpenMatch,
}: ChallengeCardProps) {
  return (
    <article
      className="rounded-[30px] border p-3 shadow-2xl"
      style={{
        background:
          'linear-gradient(135deg, #dfc78d, #f3e6c8 18%, #9d8050 44%, #f6e7c5 68%, #8b7147)',
        borderColor: '#f7e1ad',
      }}
    >
      <div
        className="rounded-[24px] border p-4"
        style={{
          background:
            'radial-gradient(circle at 80% 12%, rgba(39,247,111,0.2), transparent 16rem), linear-gradient(180deg, #071006, #030303)',
          borderColor: 'rgba(242,201,76,0.55)',
        }}
      >
        <header className="flex items-center justify-between gap-3">
          <img src="/brand/hooma-wordmark.png" alt="HOOMA" className="h-auto w-20 object-contain" />
          <div
            className="rounded-xl border px-4 py-2 text-center text-lg font-black uppercase tracking-[0.12em]"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
          >
            Challenge Card
          </div>
          <div className="text-right text-xs font-black" style={{ color: 'var(--gold)' }}>
            No.
            <br />
            {cardNumber}
          </div>
        </header>

        <section className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3">
            <TeamBadge team={homeTeam} />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black uppercase">{homeTeam.name}</h2>
              <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                {homeTeam.city || 'City TBA'}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.14em]">Houma</p>
              <p className="text-sm muted">{homeTeam.houma || 'TBA'}</p>
            </div>
          </div>
          <div
            className="grid h-16 w-16 place-items-center rounded-full border text-xl font-black"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
          >
            VS
          </div>
          <div className="flex items-center justify-end gap-3 text-right">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black uppercase">{awayTeam.name}</h2>
              <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                {awayTeam.city || 'City TBA'}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.14em]">Houma</p>
              <p className="text-sm muted">{awayTeam.houma || 'TBA'}</p>
            </div>
            <TeamBadge team={awayTeam} />
          </div>
        </section>

        <section className="mt-5 border-y py-4 text-center" style={{ borderColor: '#604f2b' }}>
          <div className="section-kicker">Date and time</div>
          <div className="mt-1 text-lg font-semibold">{scheduledLabel || 'Scheduling TBA'}</div>
        </section>

        <div
          className="mt-4 rounded-xl border py-3 text-center text-2xl font-black uppercase tracking-[0.08em]"
          style={{
            color: 'var(--gold)',
            borderColor: '#604f2b',
            background: 'linear-gradient(90deg, transparent, rgba(242,201,76,0.12), transparent)',
          }}
        >
          {statusLabel}
        </div>

        <section className="mt-5">
          <div
            className="mb-3 text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--gold)' }}
          >
            Lineups
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniPitch team={homeTeam} />
            <MiniPitch team={awayTeam} />
          </div>
        </section>

        <section className="mt-5">
          <div
            className="mb-3 text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: 'var(--gold)' }}
          >
            Team leaders
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamLeader team={homeTeam} />
            <TeamLeader team={awayTeam} />
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {[homeMessage, awayMessage].map((message, index) => (
            <div
              key={index === 0 ? 'home-message' : 'away-message'}
              className="rounded-2xl border p-4 text-sm font-semibold leading-5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              {message || 'Leader message preview appears after acceptance.'}
            </div>
          ))}
        </section>

        <section
          className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3"
          style={{ borderColor: '#604f2b' }}
        >
          <span className="flex gap-3 text-sm">
            <Shield size={20} className="shrink-0 muted" />
            <span>
              <span
                className="block text-xs font-black uppercase"
                style={{ color: 'var(--accent)' }}
              >
                Rules
              </span>
              {rulesLabel || 'Standard HOOMA rules'}
            </span>
          </span>
          <span className="flex gap-3 text-sm">
            <MapPin size={20} className="shrink-0 muted" />
            <span>
              <span
                className="block text-xs font-black uppercase"
                style={{ color: 'var(--accent)' }}
              >
                Venue
              </span>
              {venueLabel || 'TBA'}
            </span>
          </span>
          <span className="flex gap-3 text-sm">
            <Trophy size={20} className="shrink-0 muted" />
            <span>
              <span
                className="block text-xs font-black uppercase"
                style={{ color: 'var(--accent)' }}
              >
                Match type
              </span>
              {matchTypeLabel || 'Community Challenge'}
            </span>
          </span>
        </section>

        <button
          className="accent-button mt-5 w-full text-base"
          onClick={onOpenMatch}
          disabled={!onOpenMatch}
        >
          <Shirt size={22} /> Match Page
        </button>
      </div>
    </article>
  );
}
