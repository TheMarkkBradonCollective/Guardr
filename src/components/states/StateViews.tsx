import React from 'react';
import { useSurfaceKind } from '../../surfaces/SurfaceProvider';
import type { SurfaceKind } from '../../surfaces/surfaceKind';
import { StatePanel, type StateAction } from './StatePanel';

type ViewProps = {
  surface?: SurfaceKind;
  title: string;
  message: string;
  action?: StateAction;
  secondaryAction?: StateAction;
};

export function EmptyState(props: ViewProps) {
  return <StatePanel {...props} kicker="Nothing here" tone="neutral" />;
}

export function LoadingState({
  surface: surfaceProp,
  title = 'Loading',
  message = 'Guardr is fetching this view.',
  action,
}: {
  surface?: SurfaceKind;
  title?: string;
  message?: string;
  action?: StateAction;
}) {
  const live = useSurfaceKind();
  const surface = surfaceProp ?? live;
  const rows = surface === 'desktop' ? 6 : surface === 'tablet' ? 3 : 2;
  return (
    <StatePanel surface={surface} kicker="Loading" title={title} message={message} busy action={action}>
      <div className="gr-state-skeleton" aria-hidden>
        {Array.from({ length: rows }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </StatePanel>
  );
}

export function ErrorState(props: ViewProps) {
  return <StatePanel {...props} kicker="Could not load" tone="danger" />;
}

export function RestrictedState({
  audience,
  ...props
}: ViewProps & { audience?: string[] }) {
  return <StatePanel {...props} audience={audience} kicker="Restricted" tone="warn" />;
}

export function SessionExpiredState(props: ViewProps) {
  return <StatePanel {...props} kicker="Session ended" tone="warn" />;
}

export function NotFoundState(props: ViewProps) {
  return <StatePanel {...props} kicker="Not found" tone="neutral" />;
}

export function CrashState(props: ViewProps) {
  return <StatePanel {...props} kicker="Something broke" tone="danger" />;
}
