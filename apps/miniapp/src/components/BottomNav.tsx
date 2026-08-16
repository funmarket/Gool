import { Home, Radio, Shield, Stadium } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { BallIcon } from './icons/SoccerIcons';

// Product contract: do not reorder or substitute these five destinations.
const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/play', label: 'Play', icon: BallIcon, end: false },
  { to: '/watch', label: 'Watch', icon: Radio, end: false },
  { to: '/community', label: 'HOOMA', icon: Shield, end: false },
  { to: '/pitch', label: 'Pitch', icon: Stadium, end: false },
];

export function BottomNav() {
  return (
    <nav
      className="vintage-bottom-nav fixed inset-x-0 bottom-0 layer-chrome mx-auto flex max-w-[760px] items-center justify-around px-2 pt-2 backdrop-blur-xl"
      style={{ paddingBottom: 'calc(var(--safe-bottom) + 8px)' }}
      aria-label="Primary navigation"
    >
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'relative flex min-w-14 flex-col items-center gap-1 px-3 py-2 text-[10px] font-extrabold transition',
              isActive && 'is-active after:absolute after:bottom-0 after:h-[2px] after:w-8 after:bg-[#b7e31d]',
            )
          }
        >
          <Icon className="h-[22px] w-[22px]" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
