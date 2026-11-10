import React, { useState } from 'react';
import {
  CrashState,
  EmptyState,
  ErrorState,
  LoadingState,
  NotFoundState,
  RestrictedState,
  SessionExpiredState,
} from '../components/states/StateViews';
import '../components/states/states.css';

const STATES = ['empty', 'loading', 'error', 'restricted', 'session', 'missing', 'crash'] as const;
type KitState = (typeof STATES)[number];

/**
 * Shared kit. Each control performs the action it names.
 * Open with `?ui-preview=1&page=kit`.
 */
export function FoundationKitScreen() {
  const [lastAction, setLastAction] = useState('No action yet.');
  const [state, setState] = useState<KitState>('empty');
  const note = (label: string) => setLastAction(label);

  return (
    <div className="gr-kit">
      <div className="gr-kit-switch" role="tablist" aria-label="State">
        {STATES.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={state === id}
            onClick={() => setState(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <p className="gr-kit-result" role="status">
        {lastAction}
      </p>
      {state === 'empty' ? (
        <EmptyState
          title="No shifts today"
          message="When a shift is assigned it shows up here."
          action={{ label: 'Refresh', onClick: () => note('Refreshed empty state') }}
        />
      ) : null}
      {state === 'loading' ? <LoadingState title="Loading shifts" message="Fetching today's assignments." /> : null}
      {state === 'error' ? (
        <ErrorState
          title="Shifts did not load"
          message="Guardr could not reach the schedule."
          action={{ label: 'Try again', onClick: () => note('Retried the load') }}
        />
      ) : null}
      {state === 'restricted' ? (
        <RestrictedState
          title="Management"
          message="This section stays closed for your role."
          audience={['Managers', 'Directors', 'Founders']}
        />
      ) : null}
      {state === 'session' ? (
        <SessionExpiredState
          title="Sign in again"
          message="This session ended. Your saved work is still on this device."
          action={{ label: 'Sign in', onClick: () => note('Opened sign-in') }}
        />
      ) : null}
      {state === 'missing' ? (
        <NotFoundState
          title="Page not found"
          message="That address is not a Guardr page."
          action={{ label: 'Go home', onClick: () => note('Went home') }}
        />
      ) : null}
      {state === 'crash' ? (
        <CrashState
          title="This screen crashed"
          message="Reload Guardr. If it happens again, the report is already queued."
          action={{ label: 'Reload', onClick: () => note('Reload requested') }}
        />
      ) : null}
    </div>
  );
}
