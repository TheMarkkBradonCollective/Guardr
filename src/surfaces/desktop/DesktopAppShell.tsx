import React, { useCallback, useMemo, useState } from 'react';
import {
  ChevronRight,
  Circle,
  Command,
  Keyboard,
  PanelLeftClose,
  PanelLeftOpen,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { buildDesktopNavigation, desktopShortcutMap, type SurfaceCommand, type SurfaceDestination } from '../surfaceNavigation';
import { DesktopCommandPalette } from './kit/DesktopCommandPalette';
import { DesktopDialog, DesktopStatusBar } from './kit/DesktopPanels';
import { formatCombo, useIsMacPlatform, useKeyboardShortcuts, type KeyboardShortcut } from './kit/useKeyboardShortcuts';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import type { SurfaceShellProps } from '../surfaceShellTypes';

/**
 * The desktop operations centre shell.
 *
 * Structure: a permanent grouped sidebar, a global top bar carrying the
 * breadcrumb and page actions, the work canvas, and a persistent status bar.
 * Layered on top: a command palette (`Cmd/Ctrl+K`), numbered destination
 * shortcuts (`Alt+1..9`), and a shortcut reference (`?`).
 *
 * Nothing here exists on the touch surfaces — no bottom tabs, no bottom sheets,
 * no collapsing hero. The sidebar collapses to icons but never becomes a drawer,
 * because on a desktop the navigation should always be one glance away.
 */
export function DesktopAppShell({
  title,
  workspaceLabel,
  destinations,
  activeId,
  onNavigate,
  children,
  notifications,
  accountMenu,
  navFooter,
  breadcrumb,
  pageActions,
  primaryAction,
  headerOverride,
  headerExtension,
  hideChrome = false,
  bleed = false,
  commands = [],
}: SurfaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const isMac = useIsMacPlatform();
  const online = useOnlineStatus();

  const navigation = useMemo(
    () => buildDesktopNavigation(destinations, commands),
    [destinations, commands],
  );
  const shortcutTargets = useMemo(() => desktopShortcutMap(destinations), [destinations]);

  const runCommand = useCallback(
    (command: SurfaceCommand) => {
      if (command.kind === 'navigate') onNavigate(command.id);
      else command.run?.();
    },
    [onNavigate],
  );

  const shortcuts = useMemo<KeyboardShortcut[]>(() => {
    const list: KeyboardShortcut[] = [
      {
        combo: 'mod+k',
        description: 'Open the command palette',
        group: 'Global',
        allowInInput: true,
        handler: () => setPaletteOpen((open) => !open),
      },
      {
        combo: 'shift+?',
        description: 'Show keyboard shortcuts',
        group: 'Global',
        handler: () => setShortcutsOpen(true),
      },
      {
        combo: 'mod+b',
        description: 'Collapse or expand the sidebar',
        group: 'Global',
        handler: () => setSidebarOpen((open) => !open),
      },
    ];

    for (const [combo, destinationId] of Object.entries(shortcutTargets)) {
      const destination = destinations.find((item) => item.id === destinationId);
      list.push({
        combo,
        description: `Go to ${destination?.label ?? destinationId}`,
        group: 'Navigate',
        handler: () => onNavigate(destinationId),
      });
    }

    return list;
  }, [shortcutTargets, destinations, onNavigate]);

  useKeyboardShortcuts(shortcuts);

  const shortcutGroups = useMemo(() => {
    const groups = new Map<string, KeyboardShortcut[]>();
    for (const shortcut of shortcuts) {
      const key = shortcut.group ?? 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(shortcut);
    }
    return [...groups.entries()];
  }, [shortcuts]);

  return (
    <div
      className="sf-shell sfd-shell"
      data-surface="desktop"
      data-sidebar={sidebarOpen ? 'open' : 'collapsed'}
      data-bleed={bleed ? 'true' : undefined}
    >
      <nav className="sfd-sidebar" aria-label="Main navigation">
        <div className="sfd-sidebar-brand">
          <Logo size={24} />
          {sidebarOpen ? (
            <span className="sfd-sidebar-brand-text">
              <span className="sfd-sidebar-wordmark">Guardr</span>
              {workspaceLabel ? <span className="sfd-sidebar-workspace">{workspaceLabel}</span> : null}
            </span>
          ) : null}
        </div>

        {primaryAction ? (
          <button type="button" className="sfd-sidebar-cta" onClick={primaryAction.onClick} title={primaryAction.label}>
            {primaryAction.icon}
            {sidebarOpen ? <span>{primaryAction.label}</span> : null}
          </button>
        ) : null}

        <button
          type="button"
          className="sfd-sidebar-search"
          onClick={() => setPaletteOpen(true)}
          title="Open command palette"
        >
          <Command size={14} strokeWidth={2} aria-hidden />
          {sidebarOpen ? (
            <>
              <span>Search…</span>
              <kbd className="sfd-kbd">{formatCombo('mod+k', isMac)}</kbd>
            </>
          ) : null}
        </button>

        <div className="sfd-sidebar-scroll">
          {navigation.groups.map((group) => (
            <div className="sfd-sidebar-group" key={group.title}>
              {sidebarOpen ? (
                <p className="sfd-sidebar-group-title">{group.title}</p>
              ) : (
                <span className="sfd-sidebar-divider" aria-hidden />
              )}
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  expanded={sidebarOpen}
                  onSelect={() => onNavigate(item.id)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="sfd-sidebar-foot">
          {sidebarOpen && navFooter ? <div className="sfd-sidebar-links">{navFooter}</div> : null}
          <button
            type="button"
            className="sfd-sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={`${sidebarOpen ? 'Collapse' : 'Expand'} sidebar · ${formatCombo('mod+b', isMac)}`}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={16} strokeWidth={2} aria-hidden />
            ) : (
              <PanelLeftOpen size={16} strokeWidth={2} aria-hidden />
            )}
            {sidebarOpen ? <span>Collapse</span> : null}
          </button>
        </div>
      </nav>

      <div className="sfd-shell-main">
        {!hideChrome ? (
          headerOverride ? (
            <div className="sfd-topbar sfd-topbar--custom">{headerOverride}</div>
          ) : (
            <header className="sfd-topbar">
              <div className="sfd-topbar-lead">
                <nav className="sfd-crumbs" aria-label="Breadcrumb">
                  {breadcrumb ? (
                    <>
                      <span className="sfd-crumb">{breadcrumb}</span>
                      <ChevronRight size={13} strokeWidth={2.5} aria-hidden className="sfd-crumb-sep" />
                    </>
                  ) : null}
                  <h1 className="sfd-crumb sfd-crumb--current">{title}</h1>
                </nav>
              </div>
              <div className="sfd-topbar-trail">
                {pageActions}
                <button
                  type="button"
                  className="sfd-icon-btn"
                  onClick={() => setShortcutsOpen(true)}
                  aria-label="Keyboard shortcuts"
                  title={`Keyboard shortcuts · ${formatCombo('shift+?', isMac)}`}
                >
                  <Keyboard size={16} strokeWidth={2} aria-hidden />
                </button>
                {notifications}
                {accountMenu}
              </div>
            </header>
          )
        ) : null}

        {headerExtension && !hideChrome ? (
          <div className="sfd-shell-extension">{headerExtension}</div>
        ) : null}

        <main className="sfd-shell-canvas" data-bleed={bleed ? 'true' : undefined}>
          {children}
        </main>

        <DesktopStatusBar
          items={[
            {
              id: 'connection',
              label: online ? 'Connected' : 'Offline',
              tone: online ? 'positive' : 'critical',
              icon: online ? Wifi : WifiOff,
            },
            {
              id: 'workspace',
              label: workspaceLabel ?? 'Workspace',
              value: title,
            },
          ]}
          trailing={
            <button type="button" className="sfd-statusbar-item" onClick={() => setPaletteOpen(true)}>
              <Command size={12} strokeWidth={2.25} aria-hidden />
              <span className="sfd-statusbar-label">{formatCombo('mod+k', isMac)}</span>
            </button>
          }
        />
      </div>

      <DesktopCommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={navigation.commands}
        onRun={runCommand}
      />

      <DesktopDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="Keyboard shortcuts"
        subtitle="Available anywhere in the operations centre"
        width={560}
      >
        <div className="sfd-shortcut-sheet">
          {shortcutGroups.map(([group, entries]) => (
            <section className="sfd-shortcut-group" key={group}>
              <h3 className="sfd-shortcut-group-title">{group}</h3>
              <dl className="sfd-shortcut-list">
                {entries.map((entry) => (
                  <div className="sfd-shortcut-row" key={entry.combo}>
                    <dt>{entry.description}</dt>
                    <dd>
                      <kbd className="sfd-kbd">{formatCombo(entry.combo, isMac)}</kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DesktopDialog>
    </div>
  );
}

function SidebarItem({
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
      className="sfd-sidebar-item"
      data-active={active ? 'true' : undefined}
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      title={expanded ? undefined : item.label}
    >
      <Icon size={16} strokeWidth={active ? 2.3 : 1.9} aria-hidden className="sfd-sidebar-item-icon" />
      {expanded ? <span className="sfd-sidebar-item-label">{item.label}</span> : null}
      {item.badge != null && item.badge > 0 ? (
        <span className="sfd-sidebar-item-badge">{item.badge > 99 ? '99+' : item.badge}</span>
      ) : null}
    </button>
  );
}
