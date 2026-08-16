import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GOOL render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-shell grid min-h-screen place-items-center">
          <section className="surface-card w-full max-w-md p-6 text-center">
            <h1 className="text-xl font-black">GOOL hit a display error</h1>
            <p className="mt-2 text-sm muted">
              Reload the Mini App. Your server-side data is safe.
            </p>
            <button className="accent-button mt-5 w-full" onClick={() => window.location.reload()}>
              Reload GOOL
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
