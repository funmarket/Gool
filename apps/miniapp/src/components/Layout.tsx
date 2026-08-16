import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { useTelegramBackButton } from '../hooks/useTelegramBackButton';
export function Layout() {
  useTelegramBackButton();
  return (
    <>
      <AppHeader />
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
