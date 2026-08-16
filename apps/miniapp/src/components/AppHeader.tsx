import { Bell, Moon, Sun } from 'lucide-react';
import { CommunitySwitcher } from './CommunitySwitcher';
import { useTheme } from '../providers/ThemeProvider';

export function AppHeader() {
  const { resolved, toggle } = useTheme();
  return (
    <header
      className="sticky top-0 layer-chrome mx-auto flex w-full max-w-[760px] items-center justify-between gap-3 px-4 py-3 backdrop-blur-xl"
      style={{
        paddingTop: 'calc(var(--safe-top) + 10px)',
        background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src="/brand/gool-wordmark.png"
          alt="GOOL"
          className="h-auto w-14 shrink-0 object-contain sm:w-20"
        />
        <CommunitySwitcher />
      </div>
      <div className="flex items-center gap-1">
        <button
          aria-label="Theme"
          onClick={toggle}
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          {resolved === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          aria-label="Notifications"
          className="grid h-11 w-11 place-items-center rounded-2xl"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
