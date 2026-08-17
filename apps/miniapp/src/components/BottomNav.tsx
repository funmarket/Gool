import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import homeArtwork from '../assets/nav-home-provided.png';
import playArtwork from '../assets/nav-play-provided.png';
import watchArtwork from '../assets/nav-watch-provided.png';
import pitchArtwork from '../assets/nav-pitch-provided.png';
import hoomaNavArtwork from '../assets/nav-hooma-play-more.png';

type NavArtwork =
  { kind: 'mask'; src: string } | { kind: 'image'; src: string; className?: string };

type Tab = {
  to: string;
  label: string;
  artwork: NavArtwork;
  end: boolean;
};

const tabs: readonly Tab[] = [
  { to: '/', label: 'Home', artwork: { kind: 'mask', src: homeArtwork }, end: true },
  {
    to: '/play',
    label: 'Play',
    artwork: { kind: 'image', src: playArtwork, className: 'app-nav-image-ball' },
    end: false,
  },
  { to: '/watch', label: 'Watch', artwork: { kind: 'mask', src: watchArtwork }, end: false },
  {
    to: '/community',
    label: 'HOOMA',
    artwork: { kind: 'image', src: hoomaNavArtwork, className: 'app-nav-image-hooma' },
    end: false,
  },
  { to: '/pitch', label: 'Pitch', artwork: { kind: 'mask', src: pitchArtwork }, end: false },
];

function NavArtworkView({ artwork, active }: { artwork: NavArtwork; active: boolean }) {
  if (artwork.kind === 'image') {
    return (
      <img
        src={artwork.src}
        alt=""
        aria-hidden="true"
        className={cn('app-nav-image', artwork.className, active && 'app-nav-image-active')}
      />
    );
  }

  const style = {
    '--app-nav-mask': `url(${artwork.src})`,
  } as CSSProperties;

  return <span className="app-nav-mask" style={style} aria-hidden="true" />;
}

export function BottomNav() {
  const [hidden, setHidden] = useState(false);
  const previousY = useRef(0);

  useEffect(() => {
    previousY.current = window.scrollY;
    const onScroll = () => {
      const nextY = window.scrollY;
      const delta = nextY - previousY.current;
      if (nextY <= 12) setHidden(false);
      else if (delta > 5) setHidden(true);
      else if (delta < -5) setHidden(false);
      previousY.current = nextY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={cn('app-bottom-nav', hidden && 'app-bottom-nav-hidden')}
      aria-label="Primary navigation"
    >
      {tabs.map(({ to, label, artwork, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => cn('app-nav-item', isActive && 'app-nav-item-active')}
        >
          {({ isActive }) => (
            <>
              <span className={cn('app-nav-icon-shell', isActive && 'app-nav-icon-shell-active')}>
                <NavArtworkView artwork={artwork} active={isActive} />
              </span>
              <span className="app-nav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
