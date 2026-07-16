import React from 'react';
import { useDevice } from '../../lib/platform';

interface MapDesktopInspectorProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Map overlay shell: side inspector on desktop, bottom sheet on mobile. */
export function MapDesktopInspector({ label, children, className = '' }: MapDesktopInspectorProps) {
  const { formFactor } = useDevice();

  if (formFactor === 'desktop') {
    return (
      <aside
        className={`dsk-map-inspector desktop-map-inspector ${className}`.trim()}
        aria-label={label}
      >
        <div className="desktop-map-inspector-header">
          <p className="desktop-map-inspector-header-label">{label}</p>
        </div>
        <div className="desktop-map-inspector-body guard-scroll-panel">{children}</div>
      </aside>
    );
  }

  return <>{children}</>;
}

export function MapMobileBottomSheet({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { formFactor } = useDevice();
  if (formFactor === 'desktop') return <>{children}</>;
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-[1001] guardr-bottom-sheet guardr-active-shift rounded-t-2xl flex flex-col overflow-hidden ${className}`.trim()}
    >
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-3" />
      {children}
    </div>
  );
}
