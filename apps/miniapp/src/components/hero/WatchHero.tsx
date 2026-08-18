import './WatchHero.css';
export type WatchHeroProps = { title?: string; subtitle?: string };
export function WatchHero({
  title = 'Watch',
  subtitle = 'Watch together. Find the match. Find the crowd.',
}: WatchHeroProps) {
  return (
    <section className="watch-hero-pro">
      <div className="watch-hero-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="watch-hero-crowd" aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </section>
  );
}
