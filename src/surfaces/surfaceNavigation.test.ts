import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDesktopNavigation,
  buildMobileNavigation,
  buildSurfaceNavigation,
  buildTabletNavigation,
  desktopShortcutMap,
  navigationDestinationIds,
  type SurfaceDestination,
} from './surfaceNavigation.ts';

const GUARD_DESTINATIONS: SurfaceDestination[] = [
  { id: 'map', label: 'Map', section: 'Work', mobileRank: 1, tabletQuick: true },
  { id: 'myJobs', label: 'My jobs', section: 'Work', mobileRank: 2, tabletQuick: true },
  { id: 'earnings', label: 'Payments', section: 'Work', mobileRank: 3 },
  { id: 'messages', label: 'Messages', section: 'Communications', mobileRank: 4, badge: 3 },
  { id: 'support', label: 'Support', section: 'Communications', badge: 2 },
  { id: 'availability', label: 'Availability', section: 'Profile' },
  { id: 'performance', label: 'Performance', section: 'Profile' },
  { id: 'preferences', label: 'Preferences', section: 'Profile' },
  { id: 'vehicle', label: 'Vehicle', section: 'Profile', disabled: true },
  { id: 'guide', label: 'Guide', section: 'Help' },
];

describe('buildMobileNavigation', () => {
  it('fills four tabs and reserves the last slot for More', () => {
    const nav = buildMobileNavigation(GUARD_DESTINATIONS);
    assert.equal(nav.kind, 'bottom-tabs');
    assert.deepEqual(
      nav.tabs.map((item) => item.id),
      ['map', 'myJobs', 'earnings', 'messages'],
    );
    assert.equal(nav.hasOverflow, true);
  });

  it('groups the overflow sheet by section and never drops a destination', () => {
    const nav = buildMobileNavigation(GUARD_DESTINATIONS);
    assert.deepEqual(
      nav.overflow.map((group) => group.title),
      ['Communications', 'Profile', 'Help'],
    );
    const reachable = navigationDestinationIds(nav);
    const expected = GUARD_DESTINATIONS.filter((item) => !item.disabled).map((item) => item.id);
    assert.deepEqual([...reachable].sort(), [...expected].sort());
  });

  it('rolls overflow badges up onto the More tab', () => {
    const nav = buildMobileNavigation(GUARD_DESTINATIONS);
    // Support (2) is the only badged destination behind More; Messages keeps its own tab.
    assert.equal(nav.overflowBadge, 2);
  });

  it('uses all five slots when nothing would overflow', () => {
    const nav = buildMobileNavigation(GUARD_DESTINATIONS.slice(0, 5));
    assert.equal(nav.tabs.length, 5);
    assert.equal(nav.hasOverflow, false);
    assert.equal(nav.overflow.length, 0);
  });

  it('orders tabs by rank rather than source order', () => {
    const nav = buildMobileNavigation([
      { id: 'c', label: 'C', mobileRank: 3 },
      { id: 'a', label: 'A', mobileRank: 1 },
      { id: 'b', label: 'B', mobileRank: 2 },
    ]);
    assert.deepEqual(
      nav.tabs.map((item) => item.id),
      ['c', 'a', 'b'],
    );
  });

  it('excludes disabled destinations entirely', () => {
    const nav = buildMobileNavigation(GUARD_DESTINATIONS);
    assert.ok(!navigationDestinationIds(nav).includes('vehicle'));
  });
});

describe('buildTabletNavigation', () => {
  it('keeps every section expanded on the rail with no overflow menu', () => {
    const nav = buildTabletNavigation(GUARD_DESTINATIONS);
    assert.equal(nav.kind, 'side-rail');
    assert.deepEqual(
      nav.sections.map((group) => group.title),
      ['Work', 'Communications', 'Profile', 'Help'],
    );
    assert.equal(navigationDestinationIds(nav).length, 9);
  });

  it('pins the quick-switch row to the flagged destinations', () => {
    const nav = buildTabletNavigation(GUARD_DESTINATIONS);
    assert.deepEqual(
      nav.quick.map((item) => item.id),
      ['map', 'myJobs'],
    );
  });

  it('falls back to the first destinations when nothing is pinned', () => {
    const nav = buildTabletNavigation([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
      { id: 'd', label: 'D' },
    ]);
    assert.deepEqual(
      nav.quick.map((item) => item.id),
      ['a', 'b', 'c'],
    );
  });
});

describe('buildDesktopNavigation', () => {
  it('shows every destination in a grouped sidebar', () => {
    const nav = buildDesktopNavigation(GUARD_DESTINATIONS);
    assert.equal(nav.kind, 'sidebar-topbar');
    assert.deepEqual(
      nav.groups.map((group) => group.title),
      ['Work', 'Communications', 'Profile', 'Help'],
    );
    assert.equal(navigationDestinationIds(nav).length, 9);
  });

  it('creates one palette command per destination and appends extra actions', () => {
    const nav = buildDesktopNavigation(GUARD_DESTINATIONS, [
      { id: 'clock-in', label: 'Clock in', group: 'Actions', kind: 'action' },
    ]);
    assert.equal(nav.commands.length, 10);
    assert.equal(nav.commands.at(-1)?.kind, 'action');
    assert.equal(nav.commands[0].kind, 'navigate');
  });

  it('hints numbered shortcuts for the first nine destinations only', () => {
    const nav = buildDesktopNavigation(GUARD_DESTINATIONS);
    assert.equal(nav.commands[0].shortcut, 'Alt 1');
    assert.equal(nav.commands[8].shortcut, 'Alt 9');
    assert.equal(nav.commands[9]?.shortcut, undefined);
  });

  it('maps the same shortcuts for the key handler', () => {
    const map = desktopShortcutMap(GUARD_DESTINATIONS);
    assert.equal(map['alt+1'], 'map');
    assert.equal(map['alt+4'], 'messages');
    assert.equal(Object.keys(map).length, 9);
  });
});

describe('buildSurfaceNavigation', () => {
  it('returns a structurally different model per surface', () => {
    assert.equal(buildSurfaceNavigation('mobile', GUARD_DESTINATIONS).kind, 'bottom-tabs');
    assert.equal(buildSurfaceNavigation('tablet', GUARD_DESTINATIONS).kind, 'side-rail');
    assert.equal(buildSurfaceNavigation('desktop', GUARD_DESTINATIONS).kind, 'sidebar-topbar');
  });

  it('keeps every enabled destination reachable on all three surfaces', () => {
    const expected = GUARD_DESTINATIONS.filter((item) => !item.disabled)
      .map((item) => item.id)
      .sort();
    for (const surface of ['mobile', 'tablet', 'desktop'] as const) {
      const ids = navigationDestinationIds(
        buildSurfaceNavigation(surface, GUARD_DESTINATIONS),
      ).sort();
      assert.deepEqual(ids, expected, `${surface} must reach every destination`);
    }
  });

  it('handles an empty destination list', () => {
    const nav = buildSurfaceNavigation('mobile', []);
    assert.equal(navigationDestinationIds(nav).length, 0);
  });
});
