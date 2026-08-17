import { PlusIcon } from '../../icons/PlusIcon';
import './PitchHero.css';

export type PitchHeroProps = {
  onAddPlace: () => void;
};

export function PitchHero({ onAddPlace }: PitchHeroProps) {
  return (
    <section className="pitch-hero-pro">
      <div>
        <h1>PITCH</h1>
        <p>Find your pitch. Bring the game.</p>
      </div>
      <button type="button" onClick={onAddPlace}>
        <PlusIcon size={26} />
        Add your place
      </button>
    </section>
  );
}
