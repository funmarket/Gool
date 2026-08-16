import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return (
    <div className="page-shell">
      <div className="surface-card p-8 text-center">
        <div className="text-5xl font-black" style={{ color: 'var(--accent)' }}>
          90+6
        </div>
        <h1 className="mt-2 text-xl font-black">Page went into stoppage time.</h1>
        <Link className="accent-button mt-5" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}
