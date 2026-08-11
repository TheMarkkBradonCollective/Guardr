import React from 'react';
import { prefersMobileGestureUi, useDevice } from '../../lib/platform';

interface MapDesktopInspectorProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Map overlay shell: side inspector on website desktop; bottom sheet on mobile / PWA / APK. */
export function MapDesktopInspector({ label, children, className = '' }: MapDesktopInspectorProps) {
  const { viewSurface } = useDevice();

  if (!prefersMobileGestureUi(viewSurface)) {
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
  mode = 'sheet',
}: {
  children: React.ReactNode;
  className?: string;
  /** `trip` = Guardr-style full-bleed active job from en route through complete. */
  mode?: 'sheet' | 'trip';
}) {
  const { viewSurface } = useDevice();
  // Website desktop: content is hosted in MapDesktopInspector side panel — no slide-up chrome.
  if (!prefersMobileGestureUi(viewSurface)) return <>{children}</>;
  return (
    <div
      className={[
        'absolute inset-x-0 bottom-0 z-[1001] guardr-bottom-sheet flex flex-col overflow-hidden',
        mode === 'trip' ? 'guardr-active-job-trip' : 'guardr-active-shift rounded-t-2xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-3 shrink-0" />
      {children}
    </div>
  );
}
