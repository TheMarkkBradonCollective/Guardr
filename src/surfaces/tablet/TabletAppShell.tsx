import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Circle, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMediaQuery } from '../../lib/platform';
import { triggerHaptic } from '../../lib/platform/nativeHaptics';
import { buildTabletNavigation, type SurfaceDestination } from '../surfaceNavigation';
import { Logo } from '../../components/Logo';
import type { SurfaceShellProps } from '../surfaceShellTypes';

/**
 * The tablet application shell.
 *
 * Persistent labelled rail on the leading edge. In portrait the rail starts
 * collapsed so the canvas is not squeezed into a third column. There is no
 * quick-switch strip — those icons duplicated the rail and ate width. The
 * header shows the current page title, not a second copy of the workspace name.
 *
 * The rail never becomes a drawer: collapse is icons, not a hamburger.
 */
export function TabletAppShell({
  title,
  workspaceLabel,
  destinations,
  activeId,
  onNavigate,
  children,
  notifications,
  accountMenu,
  navFooter,
  headerOverride,
  headerExtension,
  pageActions,
  hideChrome = false,
  hidePrimaryNav = false,
  bleed = false,
  onBack,
}: SurfaceShellProps) {
  const portrait = useMediaQuery('(orientation: portrait)');
  const [railExpanded, setRailExpanded] = useState(() => !portrait);
  const navigation = useMemo(() => buildTabletNavigation(destinations), [destinations]);

  useEffect(() => {
    setRailExpanded(!portrait);
  }, [portrait]);

  return (
    <div
      className="sf-shell sft-shell"
      data-surface="tablet"
      data-rail={railExpanded ? 'expanded' : 'collapsed'}
      data-orientation={portrait ? 'portrait' : 'landscape'}
      data-bleed={bleed ? 'true' : undefined}
    >
      {!hidePrimaryNav ? (
        <nav className="sft-rail" aria-label="Main navigation">
          <div className="sft-rail-brand">
            <Logo size={28} />
            {railExpanded ? (
              <span className="sft-rail-brand-text">
                <span className="sft-rail-wordmark">Guardr</span>
                {workspaceLabel ? <span className="sft-rail-workspace">{workspaceLabel}</span> : null}
              </span>
            ) : null}
          </div>

          <div className="sft-rail-scroll">
            {navigation.sections.map((section) => (
              <div className="sft-rail-section" key={section.title}>
                {railExpanded ? <p className="sft-rail-section-title">{section.title}</p> : <span className="sft-rail-divider" aria-hidden />}
                {section.items.map((item) => (
                  <RailItem
                    key={item.id}
                    item={item}
                    active={item.id === activeId}
                    expanded={railExpanded}
                    onSelect={() => {
                      void triggerHaptic('light');
                      onNavigate(item.id);
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="sft-rail-foot">
            {railExpanded && navFooter ? <div className="sft-rail-links">{navFooter}</div> : null}
            <button
              type="button"
              className="sft-rail-toggle"
              onClick={() => {
                void triggerHaptic('light');
                setRailExpanded((value) => !value);
              }}
              aria-expanded={railExpanded}
              aria-label={railExpanded ? 'Collapse navigation' : 'Expand navigation'}
            >
              {railExpanded ? (
                <PanelLeftClose size={20} strokeWidth={2} aria-hidden />
              ) : (
                <PanelLeftOpen size={20} strokeWidth={2} aria-hidden />
              )}
              {railExpanded ? <span>Collapse</span> : null}
            </button>
          </div>
        </nav>
      ) : null}

      <div className="sft-shell-main">
        {!hideChrome ? (
          headerOverride ? (
            <div className="sft-shell-header sft-shell-header--custom">{headerOverride}</div>
          ) : (
            <header className="sft-shell-header" aria-label={title}>
              <div className="sft-shell-header-lead">
                {onBack ? (
                  <button
                    type="button"
                    className="sft-icon-btn"
                    onClick={() => {
                      void triggerHaptic('light');
                      onBack();
                    }}
                    aria-label="Back"
                  >
                    <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
                  </button>
                ) : null}
                <span className="sft-shell-context">{title}</span>
              </div>
              <div className="sft-shell-header-trail">
                {pageActions}
                {notifications}
                {accountMenu}
              </div>
            </header>
          )
        ) : null}

        {headerExtension && !hideChrome ? (
          <div className="sft-shell-extension">{headerExtension}</div>
        ) : null}

        <main className="sft-shell-canvas" data-bleed={bleed ? 'true' : undefined}>
          {children}
        </main>
      </div>
    </div>
  );
}

function RailItem({
  item,
  active,
  expanded,
  onSelect,
}: {
  item: SurfaceDestination;
  active: boolean;
  expanded: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon ?? Circle;
  return (
    <button
      type="button"
      className="sft-rail-item"
      data-active={active ? 'true' : undefined}
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      title={expanded ? undefined : item.label}
    >
      <span className="sft-rail-item-icon">
        <Icon size={22} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
      </span>
      {expanded ? <span className="sft-rail-item-label">{item.label}</span> : null}
      {item.notification ? (
        <span className={`staff-nav-notify-dot staff-nav-notify-dot--${item.notification}`} aria-hidden />
      ) : item.badge != null && item.badge > 0 ? (
        <span className="sft-rail-item-badge">{item.badge > 99 ? '99+' : item.badge}</span>
      ) : null}
    </button>
  );
}
