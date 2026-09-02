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
import { Bell, Monitor, Smartphone, Tablet, UserCheck } from 'lucide-react';
import { useSurface } from '../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../surfaces/SurfaceAppShell';
import { SURFACE_KINDS, surfaceLabel, type SurfaceKind } from '../surfaces/surfaceKind';
import { GUARD_DESTINATIONS, STAFF_DESTINATIONS } from './surfacePreviewData';
import type { SurfaceDestination } from '../surfaces/surfaceNavigation';
import { MobileShiftsScreen } from './surfaces/MobileShiftsScreen';
import { TabletShiftsScreen } from './surfaces/TabletShiftsScreen';
import { DesktopOperationsScreen } from './surfaces/DesktopOperationsScreen';
import { StaffProfilePreviewScreen } from './surfaces/StaffProfilePreviewScreen';
import './surfacePreview.css';

const PROFILE_DEST: SurfaceDestination = {
  id: 'profiles',
  label: 'Profiles',
  icon: UserCheck,
  section: 'Operations',
  mobileRank: 0,
  tabletQuick: true,
};

const SURFACE_ICON: Record<SurfaceKind, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export default function SurfacePreview() {
  const { setSurface } = useSurface();
  const [surface, setLocalSurface] = useState<SurfaceKind>('mobile');

  useEffect(() => {
    setSurface(surface);
    return () => setSurface(null);
  }, [surface, setSurface]);

  return (
    <>
      <div className="sfp-stage" data-surface={surface}>
        <PreviewApp />
      </div>
      <div className="sfp-switcher" role="group" aria-label="Preview surface">
        {SURFACE_KINDS.map((kind) => {
          const Icon = SURFACE_ICON[kind];
          return (
            <button
              key={kind}
              type="button"
              data-active={kind === surface ? 'true' : undefined}
              onClick={() => setLocalSurface(kind)}
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
  const wantsProfiles =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('page') === 'profiles';
  const [activeId, setActiveId] = useState(
    wantsProfiles ? 'profiles' : staff ? 'jobs' : 'myJobs'
  );
  const destinations = [PROFILE_DEST, ...(staff ? STAFF_DESTINATIONS : GUARD_DESTINATIONS)];

  useEffect(() => {
    const showProfiles =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('page') === 'profiles';
    setActiveId(showProfiles ? 'profiles' : surface === 'desktop' ? 'jobs' : 'myJobs');
  }, [surface]);

  return (
    <SurfaceAppShell
      title={activeId === 'profiles' ? 'Staff' : staff ? 'Jobs' : 'Shifts'}
      breadcrumb={staff ? 'Operations' : undefined}
      workspaceLabel={staff ? 'Staff operations' : 'Guard workspace'}
      destinations={destinations}
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
      {activeId === 'profiles' ? (
        <StaffProfilePreviewScreen />
      ) : surface === 'mobile' ? (
        <MobileShiftsScreen />
      ) : surface === 'tablet' ? (
        <TabletShiftsScreen />
      ) : (
        <DesktopOperationsScreen />
      )}
    </SurfaceAppShell>
  );
}
