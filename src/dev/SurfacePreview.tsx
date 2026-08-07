/**
 * Dev-only harness for the three surface applications.
 *
 * Loaded with `?ui-preview=1` on the dev server. Renders each surface's real
 * shell and kit against static data so the three designs can be reviewed side by
 * side without a live session, and so it is obvious when one has drifted toward
 * another.
 *
 * The switcher pins the surface independently of the viewport, which is the only
 * way to inspect the desktop operations centre on a laptop-sized window or the
 * mobile app on a large display.
 */

import React, { useEffect, useState } from 'react';
import { Bell, Monitor, Smartphone, Tablet } from 'lucide-react';
import { SurfaceProvider, useSurface } from '../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../surfaces/SurfaceAppShell';
import { SURFACE_KINDS, surfaceLabel, type SurfaceKind } from '../surfaces/surfaceKind';
import { GUARD_DESTINATIONS, STAFF_DESTINATIONS } from './surfacePreviewData';
import { MobileShiftsScreen } from './surfaces/MobileShiftsScreen';
import { TabletShiftsScreen } from './surfaces/TabletShiftsScreen';
import { DesktopOperationsScreen } from './surfaces/DesktopOperationsScreen';
import './surfacePreview.css';

const SURFACE_ICON: Record<SurfaceKind, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export default function SurfacePreview() {
  const [surface, setSurface] = useState<SurfaceKind>('mobile');

  return (
    <>
      <div className="sfp-stage" data-surface={surface}>
        <SurfaceProvider forceSurface={surface}>
          <PreviewApp />
        </SurfaceProvider>
      </div>
      <div className="sfp-switcher" role="group" aria-label="Preview surface">
        {SURFACE_KINDS.map((kind) => {
          const Icon = SURFACE_ICON[kind];
          return (
            <button
              key={kind}
              type="button"
              data-active={kind === surface ? 'true' : undefined}
              onClick={() => setSurface(kind)}
            >
              <Icon size={14} strokeWidth={2.25} aria-hidden />
              <span>{surfaceLabel(kind)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function PreviewApp() {
  const { surface } = useSurface();
  const staff = surface === 'desktop';
  const [activeId, setActiveId] = useState(staff ? 'jobs' : 'myJobs');

  // Guards live on mobile, staff live on the desktop operations centre, so the
  // harness swaps the destination set with the surface rather than pretending one
  // role uses all three identically.
  useEffect(() => {
    setActiveId(surface === 'desktop' ? 'jobs' : 'myJobs');
  }, [surface]);

  return (
    <SurfaceAppShell
      title={staff ? 'Jobs' : 'Shifts'}
      breadcrumb={staff ? 'Operations' : undefined}
      workspaceLabel={staff ? 'Staff operations' : 'Guard workspace'}
      destinations={staff ? STAFF_DESTINATIONS : GUARD_DESTINATIONS}
      activeId={activeId}
      onNavigate={setActiveId}
      notifications={
        <button type="button" className={staff ? 'sfd-icon-btn' : 'sfm-icon-btn'} aria-label="Notifications">
          <Bell size={staff ? 16 : 20} strokeWidth={2} aria-hidden />
        </button>
      }
      accountMenu={<div className="sfp-account">MT</div>}
      identity={
        <span className="sfp-identity">
          <span className="sfp-avatar">MT</span>
          <span className="sfp-identity-name">Marcus Trent</span>
        </span>
      }
      primaryAction={{ label: staff ? 'Create job' : 'Post availability', onClick: () => undefined }}
      navFooter={<p className="sfp-nav-footer">Guardr preview build</p>}
      hideChrome={surface === 'mobile'}
    >
      {surface === 'mobile' ? (
        <MobileShiftsScreen />
      ) : surface === 'tablet' ? (
        <TabletShiftsScreen />
      ) : (
        <DesktopOperationsScreen />
      )}
    </SurfaceAppShell>
  );
}
