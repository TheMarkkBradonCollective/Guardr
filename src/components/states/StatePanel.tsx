import React from 'react';
import { useSurfaceKind } from '../../surfaces/SurfaceProvider';
import type { SurfaceKind } from '../../surfaces/surfaceKind';

export type StateAction = {
  label: string;
  onClick: () => void;
};

export type StateTone = 'neutral' | 'danger' | 'warn';

type StatePanelProps = {
  surface?: SurfaceKind;
  tone?: StateTone;
  kicker: string;
  title: string;
  message?: string;
  action?: StateAction;
  secondaryAction?: StateAction;
  audience?: string[];
  busy?: boolean;
  children?: React.ReactNode;
};

function composition(surface: SurfaceKind): 'sheet' | 'rail-card' | 'workbench' {
  if (surface === 'tablet') return 'rail-card';
  if (surface === 'desktop') return 'workbench';
  return 'sheet';
}

function Actions({ action, secondaryAction }: { action?: StateAction; secondaryAction?: StateAction }) {
  if (!action && !secondaryAction) return null;
  return (
    <div className="gr-state-actions">
      {action ? (
        <button type="button" className="gr-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
      {secondaryAction ? (
        <button type="button" className="gr-state-action gr-state-action--quiet" onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </button>
      ) : null}
    </div>
  );
}

export function StatePanel({
  surface: surfaceProp,
  tone = 'neutral',
  kicker,
  title,
  message,
  action,
  secondaryAction,
  audience,
  busy = false,
  children,
}: StatePanelProps) {
  const live = useSurfaceKind();
  const surface = surfaceProp ?? live;
  const layout = composition(surface);

  const copy = (
    <div className="gr-state-copy">
      <div>
        <p className="gr-state-kicker">{kicker}</p>
        <h2 className="gr-state-title">{title}</h2>
      </div>
      {message ? <p className="gr-state-message">{message}</p> : null}
      {audience && audience.length > 0 ? (
        <ul className="gr-state-audience">
          {audience.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </div>
  );

  return (
    <section
      className={`gr-state gr-state--${surface} gr-state--${tone}`}
      data-composition={layout}
      data-surface={surface}
      aria-busy={busy || undefined}
    >
      <div className="gr-state-mark" aria-hidden>
        {busy ? <span className="gr-state-spinner" /> : null}
      </div>
      {copy}
      <Actions action={action} secondaryAction={secondaryAction} />
    </section>
  );
}
