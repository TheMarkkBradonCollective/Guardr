import React from 'react';
import { useSurface } from './SurfaceProvider';
import { MobileScreen } from './mobile/kit/MobileScreen';
import { MobileSheet } from './mobile/kit/MobileSheet';
import { MobileSegmented } from './mobile/kit/MobileControls';
import { MobileSkeletonRows, MobileSkeletonScreen } from './mobile/kit/MobileSkeleton';
import { TabletScreen, TabletSidePanel, TabletSplitView, TabletTabs } from './tablet/kit/TabletLayout';
import { TabletSkeletonDetail, TabletSkeletonMaster } from './tablet/kit/TabletSkeleton';
import { DesktopDialog, DesktopPanelGroup } from './desktop/kit/DesktopPanels';
import { DesktopTabs, DesktopWorkspace } from './desktop/kit/DesktopWorkspace';
import { DesktopSkeletonTable } from './desktop/kit/DesktopSkeleton';

/**
 * Per-surface page composition.
 *
 * A feature declares *what* a page contains — a title, a toolbar, a list, a
 * detail, a primary action — and each surface decides the structure:
 *
 *   `SurfacePage`       mobile: collapsing header title + single scroll column
 *                       tablet: large page-owned title + toolbar band
 *                       desktop: toolbar band only (title lives in the top bar)
 *
 *   `SurfaceListDetail` mobile: pushes the detail over the list
 *                       tablet: fixed two-column split
 *                       desktop: resizable panels with an optional third column
 *
 *   `SurfaceOverlay`    mobile: draggable bottom sheet
 *                       tablet: docked side panel
 *                       desktop: centred modal dialog
 *
 * Using these instead of hand-written breakpoint branches is what keeps the three
 * page structures genuinely different rather than one layout with media queries.
 */

export interface SurfacePageProps {
  title: string;
  subtitle?: string;
  /** Filters, search, view switches. Placed differently on each surface. */
  toolbar?: React.ReactNode;
  /** Icon actions. Mobile puts these in the header band, others inline. */
  actions?: React.ReactNode;
  /** Sticky mobile CTA. Wide surfaces render it inline with the title instead. */
  primaryAction?: React.ReactNode;
  onBack?: () => void;
  bleed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SurfacePage({
  title,
  subtitle,
  toolbar,
  actions,
  primaryAction,
  onBack,
  bleed = false,
  children,
  className,
}: SurfacePageProps) {
  const { surface } = useSurface();

  if (surface === 'mobile') {
    return (
      <MobileScreen
        title={title}
        subtitle={subtitle}
        toolbar={toolbar}
        actions={actions}
        actionBar={primaryAction}
        onBack={onBack}
        bleed={bleed}
        className={className}
      >
        {children}
      </MobileScreen>
    );
  }

  if (surface === 'tablet') {
    return (
      <TabletScreen
        title={title}
        subtitle={subtitle}
        toolbar={toolbar}
        actions={
          actions || primaryAction ? (
            <>
              {actions}
              {primaryAction}
            </>
          ) : undefined
        }
        bleed={bleed}
        className={className}
      >
        {children}
      </TabletScreen>
    );
  }

  return (
    <DesktopWorkspace
      toolbar={
        toolbar || actions || primaryAction ? (
          <>
            {toolbar}
            <span className="sfd-workspace-toolbar-spacer" />
            {actions}
            {primaryAction}
          </>
        ) : undefined
      }
      bleed={bleed}
      className={className}
    >
      {children}
    </DesktopWorkspace>
  );
}

/* ── List / detail ───────────────────────────────────────────────────────── */

export interface SurfaceListDetailProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  /** Shown by wide surfaces when nothing is selected. */
  placeholder?: React.ReactNode;
  hasSelection: boolean;
  /** Clears the selection. Drives the mobile back button. */
  onClearSelection?: () => void;
  detailTitle?: string;
  /** Third column, desktop only. Ignored on the touch surfaces. */
  inspector?: React.ReactNode;
  /** Persists the desktop splitter position. */
  storageKey?: string;
  listWidth?: number;
}

export function SurfaceListDetail({
  list,
  detail,
  placeholder,
  hasSelection,
  onClearSelection,
  detailTitle,
  inspector,
  storageKey,
  listWidth,
}: SurfaceListDetailProps) {
  const { surface } = useSurface();

  // Mobile has no room for two columns: the detail replaces the list entirely and
  // the back affordance returns to it, matching a native push transition.
  if (surface === 'mobile') {
    return <div className="sfm-listdetail">{hasSelection ? detail : list}</div>;
  }

  if (surface === 'tablet') {
    return (
      <TabletSplitView
        list={list}
        detail={detail}
        placeholder={placeholder}
        hasSelection={hasSelection}
        onCloseDetail={onClearSelection}
        detailTitle={detailTitle}
        listWidth={listWidth ?? 360}
      />
    );
  }

  return (
    <DesktopPanelGroup
      primary={list}
      secondary={hasSelection ? detail : <div className="sfd-panel-placeholder">{placeholder}</div>}
      tertiary={inspector}
      initialPrimaryWidth={listWidth ?? 400}
      storageKey={storageKey}
    />
  );
}

/* ── Overlay ─────────────────────────────────────────────────────────────── */

export interface SurfaceOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Desktop dialog width / tablet panel width. Ignored on mobile. */
  width?: number;
  /** Blocks dismissal until the flow resolves. */
  dismissible?: boolean;
}

export function SurfaceOverlay({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  width = 520,
  dismissible = true,
}: SurfaceOverlayProps) {
  const { surface } = useSurface();

  if (surface === 'mobile') {
    return (
      <MobileSheet
        open={open}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        footer={footer}
        dismissible={dismissible}
      >
        {children}
      </MobileSheet>
    );
  }

  if (surface === 'tablet') {
    return (
      <TabletSidePanel
        open={open}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        footer={footer}
        width={width}
      >
        {children}
      </TabletSidePanel>
    );
  }

  return (
    <DesktopDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={footer}
      width={width}
    >
      {children}
    </DesktopDialog>
  );
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */

/**
 * Section switcher.
 *
 * Mobile gets a pill segmented control sized for thumbs; tablet and desktop get
 * underlined tab strips at their own densities.
 */
export function SurfaceTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel = 'Sections',
}: {
  tabs: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  const { surface } = useSurface();

  if (surface === 'mobile') {
    return (
      <MobileSegmented
        options={tabs.map((tab) => ({ value: tab.value, label: tab.label, badge: tab.badge }))}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
      />
    );
  }

  if (surface === 'tablet') return <TabletTabs tabs={tabs} value={value} onChange={onChange} />;
  return <DesktopTabs tabs={tabs} value={value} onChange={onChange} />;
}

/* ── Loading ─────────────────────────────────────────────────────────────── */

/**
 * Skeleton matching the active surface's silhouette.
 *
 * `variant` describes what is loading, not how it looks: each surface renders its
 * own shape for the same variant so content lands without a layout shift.
 */
export function SurfaceSkeleton({
  variant = 'list',
  rows = 8,
}: {
  variant?: 'list' | 'detail' | 'page';
  rows?: number;
}) {
  const { surface } = useSurface();

  if (surface === 'mobile') {
    if (variant === 'page') return <MobileSkeletonScreen />;
    return <MobileSkeletonRows rows={rows} avatar={variant === 'list'} />;
  }

  if (surface === 'tablet') {
    if (variant === 'detail') return <TabletSkeletonDetail />;
    return <TabletSkeletonMaster rows={rows} />;
  }

  return <DesktopSkeletonTable rows={rows} columns={variant === 'detail' ? 3 : 6} />;
}
