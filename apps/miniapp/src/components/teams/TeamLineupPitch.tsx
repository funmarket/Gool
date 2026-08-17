import type { TeamLineupItem } from '../../types/domain';
import './TeamLineupPitch.css';

type TeamLineupPitchProps = {
  lineup?: TeamLineupItem | null;
  teamName: string;
};

export function TeamLineupPitch({ lineup, teamName }: TeamLineupPitchProps) {
  const starters = lineup?.slots.filter((slot) => slot.isStarter) ?? [];

  return (
    <section className="team-lineup-pitch" aria-label={`${teamName} lineup`}>
      <header>
        <strong>{teamName}</strong>
        <span>{lineup?.formation ?? 'Unpublished lineup'}</span>
      </header>
      <div className="team-lineup-field">
        {starters.map((slot) => (
          <span
            key={slot.id}
            className="team-lineup-player"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            title={slot.player?.displayName ?? slot.role}
          >
            <b>{slot.player?.shirtNumber ?? slot.sortOrder + 1}</b>
            <small>{slot.player?.displayName ?? slot.role}</small>
          </span>
        ))}
        {!starters.length && (
          <div className="team-lineup-empty">
            <strong>Lineup not published.</strong>
            <small>The Coach can publish starters from the Coach Control Room.</small>
          </div>
        )}
      </div>
    </section>
  );
}
