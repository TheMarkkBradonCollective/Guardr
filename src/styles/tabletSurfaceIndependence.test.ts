import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, 'tablet-app.css'), 'utf8');
const surfaceCss = readFileSync(join(here, 'surface-tablet.css'), 'utf8');

describe('tablet CSS independence', () => {
  it('scopes the tablet look to the tablet surface, not a width breakpoint', () => {
    assert.equal(
      css.includes('data-form-factor="tablet"'),
      false,
      'tablet-app.css must not key look off form-factor (Tailwind md/lg)',
    );
    assert.ok(
      css.includes('body.sf-tablet') || css.includes("data-surface=\"tablet\""),
      'tablet-app.css should scope rules to the tablet surface',
    );
  });

  it('owns a rail, split view, and side panel rather than a phone tab bar', () => {
    assert.ok(surfaceCss.includes('.sft-rail'));
    assert.ok(surfaceCss.includes('.sft-split'));
    assert.ok(surfaceCss.includes('.sft-panel'));
    assert.ok(css.includes('display: none !important'));
    assert.match(css, /\.uber-bottom-nav/);
  });

  it('docks map details beside the canvas instead of a bottom sheet', () => {
    assert.ok(css.includes('.sft-map-inspector'));
    assert.ok(css.includes('grid-template-columns: minmax(0, 1fr) minmax(20rem, 26rem)'));
  });

  it('uses two-column forms and profile on the tablet canvas', () => {
    assert.ok(css.includes('.sft-form-page-body'));
    assert.ok(css.includes('.sft-profile-page'));
    assert.ok(css.includes('.sft-settings-grid'));
  });
});
