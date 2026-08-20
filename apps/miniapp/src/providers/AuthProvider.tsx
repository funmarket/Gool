import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { hasTelegramLaunchData } from '../lib/telegram';
import { getWebSession, signOutWeb, type WebSession } from '../shared/auth/web-auth';

export type AuthMethod = 'loading' | 'guest' | 'telegram' | 'session' | 'dev' | 'error';

type AuthValue = {
  method: AuthMethod;
  isLoading: boolean;
  isAuthenticated: boolean;
  canWebLogout: boolean;
  session: WebSession | null;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function currentLaunchMethod(): AuthMethod | null {
  if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') return 'dev';
  return hasTelegramLaunchData() ? 'telegram' : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const launchMethod = currentLaunchMethod();
  const [method, setMethod] = useState<AuthMethod>(launchMethod || 'loading');
  const [session, setSession] = useState<WebSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const directMethod = currentLaunchMethod();
    if (directMethod) {
      setSession(null);
      setError(null);
      setMethod(directMethod);
      return;
    }

    try {
      const nextSession = await getWebSession();
      setSession(nextSession);
      setError(null);
      setMethod(nextSession ? 'session' : 'guest');
    } catch (cause) {
      setSession(null);
      setError(cause instanceof Error ? cause.message : 'Unable to verify the HOOMA session.');
      setMethod('error');
    }
  }, []);

  useEffect(() => {
    if (!launchMethod) void refresh();
  }, [launchMethod, refresh]);

  const logout = useCallback(async () => {
    if (method !== 'session') return;
    await signOutWeb();
    setSession(null);
    setError(null);
    setMethod('guest');
  }, [method]);

  const value = useMemo<AuthValue>(
    () => ({
      method,
      isLoading: method === 'loading',
      isAuthenticated: ['telegram', 'session', 'dev'].includes(method),
      canWebLogout: method === 'session',
      session,
      error,
      refresh,
      logout,
    }),
    [method, session, error, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
