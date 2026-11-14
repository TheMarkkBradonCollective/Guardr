import React from 'react';
import { CrashState } from './StateViews';
import './states.css';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * Last-resort boundary (inventory ST crash row). A render error used to leave
 * a blank white page; this shows the crash state with reload and home actions.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[guardr] render crash', error, info.componentStack);
    const sentry = (window as unknown as { Sentry?: { captureException?: (e: unknown) => void } }).Sentry;
    sentry?.captureException?.(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="gr-crash-page" role="alert">
        <CrashState
          title="Guardr hit a problem"
          message="This screen could not load. Reload to try again. Your account and jobs are safe."
          action={{ label: 'Reload', onClick: () => window.location.reload() }}
          secondaryAction={{
            label: 'Go to home',
            onClick: () => {
              window.location.assign('/');
            },
          }}
        />
      </div>
    );
  }
}
