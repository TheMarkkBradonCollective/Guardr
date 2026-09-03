import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mobileCss = readFileSync(join(here, 'surface-mobile.css'), 'utf8');
const lookCss = readFileSync(join(here, 'surface-look.css'), 'utf8');

describe('mobile CSS independence', () => {
  it('scopes the mobile look to data-surface, not form-factor', () => {
    assert.equal(
      mobileCss.includes('data-form-factor="mobile"'),
      false,
      'surface-mobile.css must not key look off form-factor',
    );
    assert.ok(mobileCss.includes("data-surface='mobile'"));
  });

  it('owns a stacked sheet, tab/drawer chrome, and restacked tables', () => {
    assert.ok(mobileCss.includes('.sfm-tabbar') || mobileCss.includes('.sfm-drawer'));
    assert.ok(mobileCss.includes('.sfm-sheet'));
    assert.match(mobileCss, /table\.uber-workbench-table thead[\s\S]{0,40}display: none/);
    assert.match(mobileCss, /staff-detail-actions[\s\S]{0,80}flex-direction: column/);
  });

  it('treats every signed-in page as a full-width phone sheet', () => {
    assert.match(mobileCss, /\.staff-detail-pane/);
    assert.match(mobileCss, /\.payments-page-header/);
    assert.match(mobileCss, /app-form-section \.grid[\s\S]{0,280}minmax\(0, 1fr\)/);
    assert.match(lookCss, /body\[data-surface='mobile'\][\s\S]{0,80}\.tablet-split-panel/);
    assert.match(lookCss, /flex-direction: column !important/);
  });

  it('keeps the hamburger drawer inside the letterboxed phone column', () => {
    assert.match(
      mobileCss,
      /min-width: 744px[\s\S]+?\.sfm-drawer,\s*\n\s*body\[data-surface='mobile'\] \.sfm-drawer-backdrop \{\s*\n\s*position: absolute;/,
    );
    assert.match(mobileCss, /width: min\(304px, 88%\)/);
  });

  it('neutralizes viewport Tailwind grids so the phone column stays stacked', () => {
    assert.match(mobileCss, /\[class\*="sm:grid-cols-"\]/);
    assert.match(mobileCss, /\[class\*="sm:flex-row"\]/);
    assert.match(mobileCss, /\.grid-cols-2[\s\S]{0,80}repeat\(2, minmax\(0, 1fr\)\)/);
  });
});
