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
    assert.ok(css.includes('.sft-request-fields'));
    assert.ok(css.includes('.sft-request-flow-actions'));
    assert.ok(css.includes('.client-home-tablet-command'));
    assert.ok(css.includes('.sft-directory'));
    assert.ok(css.includes('.sft-guard-profile'));
    assert.ok(css.includes('.sft-reports'));
    assert.ok(css.includes('.staff-analytics-tablet-canvas'));
    assert.ok(css.includes('.sft-dev-notes-grid'));
  });

  it('styles staff/application profiles as a tablet inspector between phone and desktop', () => {
    assert.ok(css.includes('.staff-account-access'));
    assert.ok(css.includes('.staff-detail-actions'));
    assert.ok(css.includes('.staff-detail-metrics'));
    assert.match(css, /body\.sf-tablet \.staff-account-access/);
    assert.match(css, /body\.sf-tablet \.staff-detail-actions/);
    assert.match(css, /body\.sf-tablet \.staff-detail-identity[\s\S]{0,200}flex-direction: row/);
    assert.match(
      css,
      /html body\.sf-tablet \.staff-detail-actions[\s\S]{0,400}grid-template-columns: repeat\(2/,
    );
    assert.match(
      css,
      /staff-detail-pane:has\(> \.staff-detail-header\)[\s\S]{0,240}grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/,
    );
    assert.match(css, /body\.sf-tablet \.staff-account-access[\s\S]{0,400}sf-paper/);
    assert.match(css, /body\.sf-tablet \.staff-detail-metric[\s\S]{0,280}border-radius: 12px/);
    assert.equal(
      /html body\.sf-tablet \.staff-detail-actions[\s\S]{0,180}grid-template-columns: repeat\(3/.test(css),
      false,
      'tablet profile actions must not use a 3-column desktop workbench grid',
    );
    assert.equal(
      css.includes('piggybacking mobile'),
      false,
      'tablet must not piggyback the mobile stacked sheet',
    );
  });

  it('applies the tablet inspector to payments, forms, and app screens site-wide', () => {
    assert.match(css, /body\.sf-tablet \.payments-page/);
    assert.match(css, /sft-form-page-body \.grid[\s\S]{0,280}repeat\(2/);
    assert.match(css, /\.client-content-shell[\s\S]{0,80}max-width: none/);
  });

  it('owns a tablet auth split and centered dialogs instead of a phone stack', () => {
    assert.ok(css.includes('.sft-auth-split'));
    assert.ok(css.includes('.sft-auth-editorial'));
    assert.ok(css.includes('.sft-auth-form-card'));
    assert.ok(css.includes('.sft-confirm-panel'));
    assert.ok(css.includes('.sft-tutorial-prompt'));
    assert.match(
      css,
      /body\.sf-tablet \.sft-auth-split[\s\S]{0,200}grid-template-columns: minmax\(20rem, 1fr\) minmax\(22rem, 28rem\)/,
    );
    assert.equal(
      css.includes('data-form-factor="tablet"'),
      false,
      'tablet-app.css must not key look off form-factor',
    );
  });
});
