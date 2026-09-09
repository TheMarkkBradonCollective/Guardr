import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isSurfaceKind,
  readSurfaceOverrideFromQuery,
  resolveSurfaceKind,
  surfaceDataset,
  surfaceLabel,
  SURFACE_BOUNDS,
  SURFACE_KINDS,
} from './surfaceKind.ts';

describe('resolveSurfaceKind', () => {
  it('loads the mobile app below the tablet floor', () => {
    for (const width of [320, 390, 430, SURFACE_BOUNDS.tabletMin - 1]) {
      assert.equal(
        resolveSurfaceKind({ viewportWidth: width, shellKind: 'browser' }),
        'mobile',
        `${width}px should load the mobile app`,
      );
    }
  });

  it('loads the tablet app between the two floors', () => {
    for (const width of [SURFACE_BOUNDS.tabletMin, 834, 1024, SURFACE_BOUNDS.desktopMin - 1]) {
      assert.equal(
        resolveSurfaceKind({ viewportWidth: width, shellKind: 'browser' }),
        'tablet',
        `${width}px should load the tablet app`,
      );
    }
  });

  it('keeps iPad landscape (Tailwind desktop) on the tablet application', () => {
    // device.ts treats ≥1024 as desktop form-factor. Layout must still follow
    // the surface, or the tablet app would render the desktop workbench.
    assert.equal(
      resolveSurfaceKind({ viewportWidth: 1024, shellKind: 'browser' }),
      'tablet',
    );
    assert.equal(
      resolveSurfaceKind({ viewportWidth: 1179, shellKind: 'browser' }),
      'tablet',
    );
  });

  it('loads the desktop operations center only on a wide pointer browser', () => {
    assert.equal(
      resolveSurfaceKind({ viewportWidth: SURFACE_BOUNDS.desktopMin, shellKind: 'browser' }),
      'desktop',
    );
    assert.equal(resolveSurfaceKind({ viewportWidth: 2560, shellKind: 'browser' }), 'desktop');
  });

  it('keeps large phones in landscape on the one-handed mobile app', () => {
    // 932x430 iPhone Pro Max landscape — wider than the Tailwind md breakpoint
    // but still a phone, so it must not jump into split view mid-shift.
    assert.equal(resolveSurfaceKind({ viewportWidth: 740, shellKind: 'native' }), 'mobile');
  });

  it('never loads the desktop UI inside an installed Android shell', () => {
    assert.equal(
      resolveSurfaceKind({ viewportWidth: 1600, shellKind: 'native' }),
      'tablet',
      'native at 1600px should stay on the touch tablet app',
    );
    assert.equal(resolveSurfaceKind({ viewportWidth: 1600, shellKind: 'browser' }), 'desktop');
  });

  it('keeps touch-only wide screens on the tablet app', () => {
    assert.equal(
      resolveSurfaceKind({ viewportWidth: 1440, shellKind: 'browser', touch: true }),
      'tablet',
    );
    assert.equal(
      resolveSurfaceKind({ viewportWidth: 1440, shellKind: 'browser', touch: false }),
      'desktop',
    );
  });

  it('honours an explicit override over every other signal', () => {
    assert.equal(
      resolveSurfaceKind({ viewportWidth: 320, shellKind: 'native', override: 'desktop' }),
      'desktop',
    );
    assert.equal(
      resolveSurfaceKind({ viewportWidth: 2560, shellKind: 'browser', override: 'mobile' }),
      'mobile',
    );
  });

  it('ignores a malformed viewport width instead of throwing', () => {
    assert.equal(resolveSurfaceKind({ viewportWidth: Number.NaN, shellKind: 'browser' }), 'mobile');
  });
});

describe('surface override parsing', () => {
  it('reads a valid ?ui= override', () => {
    assert.equal(readSurfaceOverrideFromQuery('?ui=tablet'), 'tablet');
    assert.equal(readSurfaceOverrideFromQuery('?foo=1&ui=desktop'), 'desktop');
  });

  it('rejects unknown values', () => {
    assert.equal(readSurfaceOverrideFromQuery('?ui=watch'), null);
    assert.equal(readSurfaceOverrideFromQuery(''), null);
  });
});

describe('surface metadata', () => {
  it('exposes exactly three surfaces', () => {
    assert.deepEqual([...SURFACE_KINDS], ['mobile', 'tablet', 'desktop']);
    for (const kind of SURFACE_KINDS) assert.ok(isSurfaceKind(kind));
    assert.equal(isSurfaceKind('phone'), false);
  });

  it('marks forced surfaces in the dataset so CSS and QA can see the override', () => {
    assert.deepEqual(surfaceDataset('desktop', false), {
      surface: 'desktop',
      surfaceMode: 'auto',
    });
    assert.deepEqual(surfaceDataset('mobile', true), {
      surface: 'mobile',
      surfaceMode: 'forced',
    });
  });

  it('labels each surface for the settings switcher', () => {
    assert.equal(surfaceLabel('mobile'), 'Mobile app');
    assert.equal(surfaceLabel('tablet'), 'Tablet app');
    assert.equal(surfaceLabel('desktop'), 'Desktop operations');
  });
});
