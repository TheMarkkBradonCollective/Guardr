import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SURFACE_DESIGN,
  surfaceCssVars,
  surfaceDesign,
  surfacePrimaryNavCapacity,
  surfaceShowsDetailBeside,
} from './surfaceDesign.ts';
import { SURFACE_KINDS } from './surfaceKind.ts';

describe('surface design scales', () => {
  it('gives each surface its own navigation, overlay, and detail model', () => {
    const navigation = SURFACE_KINDS.map((kind) => surfaceDesign(kind).navigation);
    const overlay = SURFACE_KINDS.map((kind) => surfaceDesign(kind).overlay);
    const detail = SURFACE_KINDS.map((kind) => surfaceDesign(kind).detail);

    assert.deepEqual(navigation, ['bottom-tabs', 'side-rail', 'sidebar-topbar']);
    assert.deepEqual(overlay, ['sheet', 'side-panel', 'dialog']);
    assert.deepEqual(detail, ['push', 'split', 'multi-panel']);
  });

  it('is not a scaled copy of one base scale', () => {
    const { mobile, tablet, desktop } = SURFACE_DESIGN;

    // A single multiplier would make every ratio between two surfaces identical.
    const bodyRatio = tablet.type.body / mobile.type.body;
    const rowRatio = tablet.control.rowHeight / mobile.control.rowHeight;
    assert.notEqual(bodyRatio.toFixed(3), rowRatio.toFixed(3));

    const gutterRatio = desktop.layout.gutter / mobile.layout.gutter;
    const targetRatio = desktop.control.minTarget / mobile.control.minTarget;
    assert.notEqual(gutterRatio.toFixed(3), targetRatio.toFixed(3));
  });

  it('sizes controls for the input device of each surface', () => {
    // Touch surfaces must clear the 44px accessibility floor; pointer surfaces
    // trade hit area for information density.
    assert.ok(SURFACE_DESIGN.mobile.control.minTarget >= 48);
    assert.ok(SURFACE_DESIGN.tablet.control.minTarget >= 44);
    assert.ok(SURFACE_DESIGN.desktop.control.minTarget < 44);
    assert.ok(
      SURFACE_DESIGN.desktop.control.rowHeight < SURFACE_DESIGN.mobile.control.rowHeight,
    );
  });

  it('only offers hover, keyboard, and drag-and-drop where they are reachable', () => {
    assert.equal(SURFACE_DESIGN.mobile.hoverCapable, false);
    assert.equal(SURFACE_DESIGN.tablet.hoverCapable, false);
    assert.equal(SURFACE_DESIGN.desktop.hoverCapable, true);

    assert.equal(SURFACE_DESIGN.desktop.keyboardFirst, true);
    assert.equal(SURFACE_DESIGN.mobile.keyboardFirst, false);

    assert.equal(SURFACE_DESIGN.mobile.gestureNavigation, true);
    assert.equal(SURFACE_DESIGN.desktop.gestureNavigation, false);
    assert.equal(SURFACE_DESIGN.desktop.dragAndDrop, true);
    assert.equal(SURFACE_DESIGN.mobile.dragAndDrop, false);
  });

  it('gives only the mobile app a bottom bar and edge-to-edge content', () => {
    assert.ok(SURFACE_DESIGN.mobile.layout.bottomBarHeight > 0);
    assert.equal(SURFACE_DESIGN.tablet.layout.bottomBarHeight, 0);
    assert.equal(SURFACE_DESIGN.mobile.edgeToEdge, true);
    assert.equal(SURFACE_DESIGN.tablet.edgeToEdge, false);
    assert.equal(SURFACE_DESIGN.desktop.edgeToEdge, false);
  });

  it('gives only the wide surfaces a persistent navigation column', () => {
    assert.equal(SURFACE_DESIGN.mobile.layout.navWidth, 0);
    assert.ok(SURFACE_DESIGN.tablet.layout.navWidth > 0);
    assert.ok(SURFACE_DESIGN.desktop.layout.navWidth > 0);
    assert.notEqual(SURFACE_DESIGN.tablet.layout.navWidth, SURFACE_DESIGN.desktop.layout.navWidth);
    assert.equal(SURFACE_DESIGN.tablet.layout.navWidth, 200);
    assert.equal(SURFACE_DESIGN.tablet.layout.navCollapsedWidth, 72);
  });

  it('speeds motion up as the surface gets more pointer-driven', () => {
    assert.ok(SURFACE_DESIGN.mobile.motion.page > SURFACE_DESIGN.tablet.motion.page);
    assert.ok(SURFACE_DESIGN.tablet.motion.page > SURFACE_DESIGN.desktop.motion.page);
    assert.deepEqual(
      SURFACE_KINDS.map((kind) => surfaceDesign(kind).motion.pageTransition),
      ['slide-over', 'panel-fade', 'cross-fade'],
    );
  });

  it('emits a complete CSS variable set per surface with no shared values object', () => {
    const mobile = surfaceCssVars('mobile');
    const desktop = surfaceCssVars('desktop');

    assert.equal(Object.keys(mobile).length, Object.keys(desktop).length);
    assert.equal(mobile['--sf-target'], '48px');
    assert.equal(desktop['--sf-target'], '32px');
    assert.equal(mobile['--sf-content-max'], 'none');
    assert.equal(desktop['--sf-content-max'], '1760px');
    assert.equal(mobile['--sf-nav-w'], '0px');
    assert.equal(desktop['--sf-nav-w'], '248px');

    for (const key of Object.keys(mobile)) {
      assert.ok(key.startsWith('--sf-'), `${key} should be namespaced to the surface layer`);
    }
  });

  it('reports which surfaces show a detail view beside the list', () => {
    assert.equal(surfaceShowsDetailBeside('mobile'), false);
    assert.equal(surfaceShowsDetailBeside('tablet'), true);
    assert.equal(surfaceShowsDetailBeside('desktop'), true);
  });

  it('caps primary navigation by what the surface can physically show', () => {
    assert.equal(surfacePrimaryNavCapacity('mobile'), 5);
    assert.equal(surfacePrimaryNavCapacity('tablet'), 9);
    assert.ok(surfacePrimaryNavCapacity('desktop') > 100);
  });
});
