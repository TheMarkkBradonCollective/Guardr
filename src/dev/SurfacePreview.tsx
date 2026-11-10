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
import { Bell, Briefcase, CreditCard, Map, MessagesSquare, Monitor, Smartphone, Tablet, UserCheck } from 'lucide-react';
import { useSurface } from '../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../surfaces/SurfaceAppShell';
import { SURFACE_KINDS, surfaceLabel, type SurfaceKind } from '../surfaces/surfaceKind';
import { GUARD_DESTINATIONS, STAFF_DESTINATIONS } from './surfacePreviewData';
import type { SurfaceDestination } from '../surfaces/surfaceNavigation';
import { MobileShiftsScreen } from './surfaces/MobileShiftsScreen';
import { TabletShiftsScreen } from './surfaces/TabletShiftsScreen';
import { DesktopOperationsScreen } from './surfaces/DesktopOperationsScreen';
import { StaffProfilePreviewScreen } from './surfaces/StaffProfilePreviewScreen';
import { JobPreviewScreen } from './surfaces/JobPreviewScreen';
import { PaymentsPreviewScreen } from './surfaces/PaymentsPreviewScreen';
import { MapPreviewScreen } from './surfaces/MapPreviewScreen';
import { MessagesPreviewScreen } from './surfaces/MessagesPreviewScreen';
import { InvoicePreviewScreen } from './surfaces/InvoicePreviewScreen';
import { FoundationKitScreen } from './FoundationKitScreen';
import { AccountMenu } from '../components/layouts/AccountMenu';
import { applyThemeToDocument, type ThemeMode } from '../lib/platform/theme';
import './surfacePreview.css';

const PROFILE_DEST: SurfaceDestination = {
  id: 'profiles',
  label: 'Profiles',
  icon: UserCheck,
  section: 'Operations',
  mobileRank: 0,
  tabletQuick: true,
};

const JOB_DEST: SurfaceDestination = {
  id: 'job-detail',
  label: 'Job',
  icon: Briefcase,
  section: 'Operations',
  mobileRank: 0,
  tabletQuick: true,
};

const PAYMENTS_DEST: SurfaceDestination = {
  id: 'payments-preview',
  label: 'Payments',
  icon: CreditCard,
  section: 'Management',
  mobileRank: 0,
};

const MAP_DEST: SurfaceDestination = {
  id: 'map-preview',
  label: 'Map',
  icon: Map,
  section: 'Operations',
  mobileRank: 0,
  tabletQuick: true,
};

const MESSAGES_DEST: SurfaceDestination = {
  id: 'messages-preview',
  label: 'Messages',
  icon: MessagesSquare,
  section: 'Operations',
  mobileRank: 0,
  tabletQuick: true,
};

function previewPageId(page: string | null, surface: SurfaceKind | null): string {
  if (page === 'profiles') return 'profiles';
  if (page === 'jobs') return 'job-detail';
  if (page === 'payments') return 'payments-preview';
  if (page === 'map') return 'map-preview';
  if (page === 'messages') return 'messages-preview';
  if (page === 'invoices') return 'invoices-preview';
  if (page === 'kit') return 'kit';
  return surface === 'desktop' ? 'jobs' : 'myJobs';
}

function initialPreviewSurface(): SurfaceKind {
  if (typeof window === 'undefined') return 'mobile';
  const ui = new URLSearchParams(window.location.search).get('ui');
  if (ui === 'mobile' || ui === 'tablet' || ui === 'desktop') return ui;
  if (window.innerWidth >= 1180) return 'desktop';
  if (window.innerWidth >= 744) return 'tablet';
  return 'mobile';
}

const SURFACE_ICON: Record<SurfaceKind, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export default function SurfacePreview() {
  const { setSurface } = useSurface();
  const [surface, setLocalSurface] = useState<SurfaceKind>(initialPreviewSurface);

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
  const desktopSurface = surface === 'desktop';
  const tabletSurface = surface === 'tablet';
  const previewPage =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('page') : null;
  const [activeId, setActiveId] = useState(previewPageId(previewPage, desktopSurface ? 'desktop' : null));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    return new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light';
  });
  const staffWorkspace =
    desktopSurface ||
    activeId === 'profiles' ||
    activeId === 'job-detail' ||
    activeId === 'payments-preview' ||
    activeId === 'map-preview' ||
    activeId === 'messages-preview' ||
    activeId === 'invoices-preview';
  const destinations = [
    PROFILE_DEST,
    JOB_DEST,
    MAP_DEST,
    MESSAGES_DEST,
    PAYMENTS_DEST,
    ...(staffWorkspace ? STAFF_DESTINATIONS : GUARD_DESTINATIONS),
  ];

  useEffect(() => {
    applyThemeToDocument(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const page =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('page') : null;
    setActiveId(previewPageId(page, surface));
  }, [surface]);

  return (
    <SurfaceAppShell
      title={
        activeId === 'profiles'
          ? 'Staff'
          :         activeId === 'job-detail'
            ? 'Jobs'
            : activeId === 'payments-preview'
              ? 'Payments'
              : activeId === 'map-preview'
                ? 'Map'
                : activeId === 'messages-preview'
                  ? 'Messages'
                  : activeId === 'invoices-preview'
                    ? 'Billing'
          : activeId === 'kit'
          ? 'Kit'
          : staffWorkspace
                    ? 'Jobs'
                    : 'Shifts'
      }
      breadcrumb={staffWorkspace ? 'Operations' : undefined}
      workspaceLabel={staffWorkspace ? 'Staff operations' : 'Guard workspace'}
      destinations={destinations}
      activeId={activeId}
      onNavigate={setActiveId}
      notifications={
        <button
          type="button"
          className={desktopSurface ? 'sfd-icon-btn' : tabletSurface ? 'sft-icon-btn' : 'sfm-icon-btn'}
          aria-label="Notifications"
        >
          <Bell size={desktopSurface ? 16 : 20} strokeWidth={2} aria-hidden />
        </button>
      }
      accountMenu={
        surface === 'mobile' || tabletSurface || desktopSurface ? (
          <AccountMenu
            userName="Marcus Trent"
            userSubtitle={staffWorkspace ? 'Staff operations' : 'Guard · independent contractor'}
            onOpenProfile={() => setActiveId('profiles')}
            onOpenSettings={() => setActiveId('profiles')}
            onSignOut={() => undefined}
            themeMode={themeMode}
            onChangeTheme={setThemeMode}
            triggerVariant={desktopSurface ? 'uber-direct' : tabletSurface ? 'tablet' : 'default'}
          />
        ) : (
          <div className="sfp-account">MT</div>
        )
      }
      identity={
        <span className="sfp-identity">
          <span className="sfp-avatar">MT</span>
          <span className="sfp-identity-name">Marcus Trent</span>
        </span>
      }
      primaryAction={{ label: staffWorkspace ? 'Create job' : 'Post availability', onClick: () => undefined }}
      navFooter={<p className="sfp-nav-footer">Guardr preview build</p>}
      hideChrome={false}
    >
      {activeId === 'kit' ? (
        <FoundationKitScreen />
      ) : activeId === 'profiles' ? (
        <StaffProfilePreviewScreen />
      ) : activeId === 'job-detail' ? (
        <JobPreviewScreen />
      ) : activeId === 'payments-preview' ? (
        <PaymentsPreviewScreen />
      ) : activeId === 'map-preview' ? (
        <MapPreviewScreen />
      ) : activeId === 'messages-preview' ? (
        <MessagesPreviewScreen />
      ) : activeId === 'invoices-preview' ? (
        <InvoicePreviewScreen />
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
