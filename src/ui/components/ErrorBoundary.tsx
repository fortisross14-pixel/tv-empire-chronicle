import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Catches a crash while drawing a screen, so the page never goes blank.
 * The game saves after each successful render, so the last good save is kept.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; onMenu: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="title-screen">
        <div className="title-card">
          <div className="tv">🛠️</div>
          <h1>Technical difficulties</h1>
          <p style={{ opacity: 0.8 }}>Something went wrong drawing this screen. Your last save is safe.</p>
          <p className="panel small" style={{ wordBreak: 'break-word' }}>{this.state.error.message}</p>
          <button className="btn primary block" onClick={() => { this.setState({ error: null }); this.props.onMenu(); }}>Back to the main menu</button>
          <button className="btn ghost block" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      </div>
    );
  }
}
