import React, { useMemo, useState } from 'react';
import { ChevronLeft, Circle, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { buildTabletNavigation, type SurfaceDestination } from '../surfaceNavigation';
import { Logo } from '../../components/Logo';
import type { SurfaceShellProps } from '../surfaceShellTypes';

/**
 * The tablet application shell.
 *
 * Structure: a persistent icon+label rail on the leading edge, a quick-switch
 * strip for the destinations used mid-shift, and a single content canvas that
 * pages fill with split views. The rail collapses to icons to hand the canvas
 * more room in portrait, but it never becomes a drawer — a tablet has the width
 * to keep navigation permanently visible, and hiding it behind a hamburger would
 * be borrowing the phone's constraint.
 *
 * There is no bottom tab bar, no collapsing hero title, and no command palette.
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
  primaryAction,
  pageActions,
  hideChrome = false,
  hidePrimaryNav = false,
  bleed = false,
  onBack,
}: SurfaceShellProps) {
  const [railExpanded, setRailExpanded] = useState(true);
  const navigation = useMemo(() => buildTabletNavigation(destinations), [destinations]);

  return (
    <div
      className="sf-shell sft-shell"
      data-surface="tablet"
      data-rail={railExpanded ? 'expanded' : 'collapsed'}
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

          {navigation.quick.length > 0 ? (
            <div className="sft-rail-quick" role="group" aria-label="Quick switch">
              {navigation.quick.map((item) => (
                <button
                  key={`quick-${item.id}`}
                  type="button"
                  className="sft-rail-quick-btn"
                  data-active={item.id === activeId ? 'true' : undefined}
                  onClick={() => onNavigate(item.id)}
                  title={item.label}
                  aria-label={item.label}
                >
                  {item.icon ? <item.icon size={20} strokeWidth={2.25} aria-hidden /> : <Circle size={20} aria-hidden />}
                </button>
              ))}
            </div>
          ) : null}

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
                    onSelect={() => onNavigate(item.id)}
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
              onClick={() => setRailExpanded((value) => !value)}
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
            <header className="sft-shell-header">
              <div className="sft-shell-header-lead">
                {onBack ? (
                  <button type="button" className="sft-icon-btn" onClick={onBack} aria-label="Back">
                    <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
                  </button>
                ) : null}
                <h1 className="sft-shell-title">{title}</h1>
              </div>
              <div className="sft-shell-header-trail">
                {pageActions}
                {primaryAction ? (
                  <button type="button" className="sft-shell-cta" onClick={primaryAction.onClick}>
                    {primaryAction.icon}
                    <span>{primaryAction.label}</span>
                  </button>
                ) : null}
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
      {item.badge != null && item.badge > 0 ? (
        <span className="sft-rail-item-badge">{item.badge > 99 ? '99+' : item.badge}</span>
      ) : null}
    </button>
  );
}
