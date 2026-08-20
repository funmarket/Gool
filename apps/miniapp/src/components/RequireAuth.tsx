import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { method, isLoading, isAuthenticated, error, refresh } = useAuth();

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="surface-card p-6 text-sm muted" role="status" aria-live="polite">
          Loading account…
        </div>
      </div>
    );
  }

  if (method === 'error') {
    return (
      <div className="page-shell">
        <section className="surface-card mx-auto max-w-xl p-6 text-center">
          <div className="section-kicker">Account unavailable</div>
          <h1 className="section-title mt-2">Could not verify your HOOMA session</h1>
          <p className="mt-3 text-sm muted">
            {error || 'The authentication service is unavailable.'}
          </p>
          <button className="accent-button mt-5" type="button" onClick={() => void refresh()}>
            Try again
          </button>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return children;
}
