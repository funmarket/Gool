import { Bell, Moon, Sun } from 'lucide-react';
import { CommunitySwitcher } from './CommunitySwitcher';
import { useTheme } from '../providers/ThemeProvider';

export function AppHeader() {
  const { resolved, toggle } = useTheme();
  return (
    <header
      className="sticky top-0 layer-chrome mx-auto flex w-full max-w-[760px] items-center justify-between gap-3 px-4 py-3 backdrop-blur-xl vintage-header"
      style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <img src="/brand/hooma-wordmark.svg" alt="HOOMA" className="h-auto w-[118px] shrink-0 object-contain sm:w-[146px]" />
        <CommunitySwitcher />
      </div>
      <div className="flex items-center gap-2">
        <button aria-label="Theme" onClick={toggle} className="vintage-header-button">
          {resolved === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button aria-label="Notifications" className="vintage-header-button vintage-notification"><Bell size={21} /></button>
      </div>
    </header>
  );
}
