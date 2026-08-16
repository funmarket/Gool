import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { backButton } from '../lib/telegram';

export function useTelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    try {
      if (!backButton.show.isAvailable() || !backButton.hide.isAvailable()) return;
      const isRoot = ['/', '/play', '/watch', '/community', '/more'].includes(location.pathname);
      if (isRoot) backButton.hide();
      else backButton.show();
      const off = backButton.onClick(() => navigate(-1));
      return () => off();
    } catch {
      return undefined;
    }
  }, [location.pathname, navigate]);
}
