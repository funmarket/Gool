import matchdayArtwork from '../../assets/hero/matchday.png';
import { PlusIcon } from '../../icons/PlusIcon';
import './MatchDayHero.css';

export type MatchDayHeroProps = {
  onCreateMatch: () => void;
};

export function MatchDayHero({ onCreateMatch }: MatchDayHeroProps) {
  return (
    <button
      type="button"
      className="matchday-hero-pro"
      aria-label="Create a Match"
      onClick={onCreateMatch}
    >
      <img className="matchday-hero-artwork" src={matchdayArtwork} alt="" aria-hidden="true" />
      <span className="matchday-hero-cta" aria-hidden="true">
        <PlusIcon size={20} />
        <span>Create a Match</span>
      </span>
    </button>
  );
}
