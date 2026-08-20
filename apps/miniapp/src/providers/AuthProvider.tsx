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

type AuthState = {
  method: AuthMethod;
  session: WebSession | null;
  error: string | null;
};

type AuthValue = AuthState & {
  isLoading: boolean;
  isAuthenticated: boolean;
  canWebLogout: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function currentLaunchMethod(): AuthMethod | null {
  if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') return 'dev';
  return hasTelegramLaunchData() ? 'telegram' : null;
}

function launchState(method: AuthMethod): AuthState {
  return { method, session: null, error: null };
}

async function resolveWebState(): Promise<AuthState> {
  try {
    const session = await getWebSession();
    return { method: session ? 'session' : 'guest', session, error: null };
  } catch (cause) {
    return {
      method: 'error',
      session: null,
      error: cause instanceof Error ? cause.message : 'Unable to verify the HOOMA session.',
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const launchMethod = currentLaunchMethod();
  const [state, setState] = useState<AuthState>(() =>
    launchMethod ? launchState(launchMethod) : launchState('loading'),
  );

  const refresh = useCallback(async () => {
    const directMethod = currentLaunchMethod();
    if (directMethod) {
      setState(launchState(directMethod));
      return;
    }
    setState(await resolveWebState());
  }, []);

  useEffect(() => {
    if (launchMethod) return;

    let active = true;
    void resolveWebState().then((nextState) => {
      if (active) setState(nextState);
    });
    return () => {
      active = false;
    };
  }, [launchMethod]);

  const logout = useCallback(async () => {
    if (state.method !== 'session') return;
    await signOutWeb();
    setState(launchState('guest'));
  }, [state.method]);

  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      isLoading: state.method === 'loading',
      isAuthenticated: ['telegram', 'session', 'dev'].includes(state.method),
      canWebLogout: state.method === 'session',
      refresh,
      logout,
    }),
    [state, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
