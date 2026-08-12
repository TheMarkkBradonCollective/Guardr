/**
 * Three independent navigation models built from one destination list.
 *
 * The destination list is the only thing the surfaces share. What each surface
 * does with it is completely different:
 *
 *   mobile   — at most five thumb-reachable tabs; everything else moves into a
 *              bottom "More" sheet grouped by section.
 *   tablet   — a persistent icon+label rail with every section expanded, plus a
 *              compact quick-switch row for the destinations used mid-shift.
 *   desktop  — a permanent grouped sidebar showing every destination at once,
 *              a command palette entry per destination, and numbered keyboard
 *              shortcuts for the first nine.
 */

import type { LucideIcon } from 'lucide-react';
import type { SurfaceKind } from './surfaceKind';
import { surfacePrimaryNavCapacity } from './surfaceDesign';

import type { StaffNavNotificationKind } from '../lib/staffOpsNavNotifications';

export interface SurfaceDestination {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** @deprecated Use notification dot — numeric badges removed from staff nav */
  badge?: number;
  /** Staff nav notification dot (unread / handled-by-other) */
  notification?: StaffNavNotificationKind;
  disabled?: boolean;
  /** Section this destination belongs to. Drives desktop groups + mobile sheet sections. */
  section?: string;
  /**
   * Lower numbers win a mobile tab slot. Destinations without a rank fall back
   * to their position in the source list.
   */
  mobileRank?: number;
  /** Pinned to the tablet quick-switch row (live operational destinations). */
  tabletQuick?: boolean;
  /** Extra words matched by the desktop command palette. */
  keywords?: string[];
}

export interface MobileTabsNavigation {
  kind: 'bottom-tabs';
  /** Tabs rendered in the bar, in thumb order. */
  tabs: SurfaceDestination[];
  /** Destinations behind the "More" tab, grouped by section. */
  overflow: { title: string; items: SurfaceDestination[] }[];
  /** Total badge count rolled up onto the "More" tab. */
  overflowBadge: number;
  hasOverflow: boolean;
}

export interface TabletRailNavigation {
  kind: 'side-rail';
  sections: { title: string; items: SurfaceDestination[] }[];
  /** Pinned destinations for the rail's quick-switch row. */
  quick: SurfaceDestination[];
}

export interface DesktopSidebarNavigation {
  kind: 'sidebar-topbar';
  groups: { title: string; items: SurfaceDestination[] }[];
  /** One command per destination, plus caller-supplied actions. */
  commands: SurfaceCommand[];
}

export type SurfaceNavigation =
  | MobileTabsNavigation
  | TabletRailNavigation
  | DesktopSidebarNavigation;

export interface SurfaceCommand {
  id: string;
  label: string;
  /** Group heading inside the palette. */
  group: string;
  icon?: LucideIcon;
  /** Human-readable shortcut hint, e.g. "Alt 3". */
  shortcut?: string;
  keywords?: string[];
  kind: 'navigate' | 'action';
  /** Required for `action` commands. `navigate` commands route by `id` instead. */
  run?: () => void;
}

const DEFAULT_SECTION = 'General';

function sectionOf(destination: SurfaceDestination): string {
  return destination.section?.trim() || DEFAULT_SECTION;
}

function groupBySection(
  destinations: SurfaceDestination[],
): { title: string; items: SurfaceDestination[] }[] {
  const order: string[] = [];
  const buckets = new Map<string, SurfaceDestination[]>();

  for (const destination of destinations) {
    const title = sectionOf(destination);
    if (!buckets.has(title)) {
      buckets.set(title, []);
      order.push(title);
    }
    buckets.get(title)!.push(destination);
  }

  return order.map((title) => ({ title, items: buckets.get(title)! }));
}

/** Mobile: pick the tab bar, push the rest into the More sheet. */
export function buildMobileNavigation(
  destinations: SurfaceDestination[],
): MobileTabsNavigation {
  const enabled = destinations.filter((item) => !item.disabled);
  const capacity = surfacePrimaryNavCapacity('mobile');

  const ranked = enabled
    .map((item, index) => ({ item, rank: item.mobileRank ?? index + 1000, index }))
    .sort((a, b) => (a.rank === b.rank ? a.index - b.index : a.rank - b.rank));

  // The last slot becomes "More" whenever anything would be left out, so the bar
  // never silently drops a destination.
  const willOverflow = ranked.length > capacity;
  const tabSlots = willOverflow ? capacity - 1 : capacity;

  const tabIds = new Set(ranked.slice(0, tabSlots).map((entry) => entry.item.id));
  const tabs = enabled.filter((item) => tabIds.has(item.id));
  const rest = enabled.filter((item) => !tabIds.has(item.id));

  return {
    kind: 'bottom-tabs',
    tabs,
    overflow: groupBySection(rest),
    overflowBadge: rest.reduce((sum, item) => {
      if (item.notification) return sum + 1;
      return sum + Math.max(0, item.badge ?? 0);
    }, 0),
    hasOverflow: rest.length > 0,
  };
}

/** Tablet: every destination on the rail, grouped, with a pinned quick row. */
export function buildTabletNavigation(
  destinations: SurfaceDestination[],
): TabletRailNavigation {
  const enabled = destinations.filter((item) => !item.disabled);
  const quick = enabled.filter((item) => item.tabletQuick);

  return {
    kind: 'side-rail',
    sections: groupBySection(enabled),
    // Falling back to the first few destinations keeps the row from collapsing
    // for roles that have not pinned anything.
    quick: quick.length > 0 ? quick : enabled.slice(0, 3),
  };
}

/** Desktop: full sidebar plus command palette entries and numbered shortcuts. */
export function buildDesktopNavigation(
  destinations: SurfaceDestination[],
  extraCommands: SurfaceCommand[] = [],
): DesktopSidebarNavigation {
  const enabled = destinations.filter((item) => !item.disabled);
  const groups = groupBySection(enabled);

  const commands: SurfaceCommand[] = enabled.map((item, index) => ({
    id: item.id,
    label: item.label,
    group: sectionOf(item),
    icon: item.icon,
    shortcut: index < 9 ? `Alt ${index + 1}` : undefined,
    keywords: item.keywords,
    kind: 'navigate',
  }));

  return {
    kind: 'sidebar-topbar',
    groups,
    commands: [...commands, ...extraCommands],
  };
}

/** Maps `Alt+1..9` to a destination id, mirroring the palette's shortcut hints. */
export function desktopShortcutMap(
  destinations: SurfaceDestination[],
): Record<string, string> {
  const enabled = destinations.filter((item) => !item.disabled);
  const map: Record<string, string> = {};
  enabled.slice(0, 9).forEach((item, index) => {
    map[`alt+${index + 1}`] = item.id;
  });
  return map;
}

export function buildSurfaceNavigation(
  surface: SurfaceKind,
  destinations: SurfaceDestination[],
  extraCommands: SurfaceCommand[] = [],
): SurfaceNavigation {
  if (surface === 'mobile') return buildMobileNavigation(destinations);
  if (surface === 'tablet') return buildTabletNavigation(destinations);
  return buildDesktopNavigation(destinations, extraCommands);
}

/** Every destination reachable from the built navigation, for assertions and tests. */
export function navigationDestinationIds(navigation: SurfaceNavigation): string[] {
  if (navigation.kind === 'bottom-tabs') {
    return [
      ...navigation.tabs.map((item) => item.id),
      ...navigation.overflow.flatMap((group) => group.items.map((item) => item.id)),
    ];
  }
  if (navigation.kind === 'side-rail') {
    return navigation.sections.flatMap((group) => group.items.map((item) => item.id));
  }
  return navigation.groups.flatMap((group) => group.items.map((item) => item.id));
}
