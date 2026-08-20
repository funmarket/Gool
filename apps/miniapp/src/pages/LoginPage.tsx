import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { signInWeb, signUpWeb } from '../shared/auth/web-auth';

type Mode = 'sign-in' | 'register';

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) {
    return '/';
  }
  return value;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAuthenticated, isLoading, refresh } = useAuth();
  const returnTo = useMemo(() => safeReturnTo(params.get('returnTo')), [params]);
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(returnTo, { replace: true });
  }, [isAuthenticated, isLoading, navigate, returnTo]);

  const submit = async () => {
    setPending(true);
    setError('');
    try {
      if (mode === 'register') {
        await signUpWeb(email, username, password);
      } else {
        await signInWeb(identifier, password);
      }
      await refresh();
      navigate(returnTo, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="section-kicker">HOOMA account</div>
      <h1 className="section-title">{mode === 'register' ? 'Create account' : 'Sign in'}</h1>
      <p className="mt-2 max-w-2xl text-sm muted">
        Web credentials are a separate HOOMA login method. Telegram remains available through the
        Telegram Mini App, and both methods can belong to the same canonical account.
      </p>

      <section className="surface-card mx-auto mt-5 grid max-w-xl gap-4 p-5">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={mode === 'sign-in' ? 'accent-button' : 'ghost-button'}
            type="button"
            onClick={() => {
              setMode('sign-in');
              setError('');
            }}
          >
            Sign in
          </button>
          <button
            className={mode === 'register' ? 'accent-button' : 'ghost-button'}
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Create account
          </button>
        </div>

        {mode === 'register' ? (
          <>
            <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
              Email
              <input
                className="hooma-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
              Username
              <input
                className="hooma-input"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
          </>
        ) : (
          <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
            Email or username
            <input
              className="hooma-input"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>
        )}

        <label className="grid gap-1.5 text-sm font-semibold text-[#f4efe2]">
          Password
          <input
            className="hooma-input"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <button
          className="accent-button"
          type="button"
          disabled={
            pending ||
            !password ||
            (mode === 'register' ? !email.trim() || !username.trim() : !identifier.trim())
          }
          onClick={() => void submit()}
        >
          {pending
            ? 'Working…'
            : mode === 'register'
              ? 'Create HOOMA account'
              : 'Sign in to HOOMA'}
        </button>
      </section>
    </div>
  );
}
