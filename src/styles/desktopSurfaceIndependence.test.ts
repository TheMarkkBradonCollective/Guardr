import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const DESKTOP_STYLE_FILES = [
  'desktop-app.css',
  'desktop-auth.css',
  'desktop-workspace.css',
  'desktop-command.css',
  'gr-direct-desktop.css',
];

describe('desktop CSS independence', () => {
  it('scopes dedicated desktop stylesheets to data-surface=desktop, not form-factor', () => {
    for (const file of DESKTOP_STYLE_FILES) {
      const css = readFileSync(join(here, file), 'utf8');
      assert.equal(
        css.includes('data-form-factor="desktop"'),
        false,
        `${file} must not key desktop look off form-factor (1024px Tailwind lg)`,
      );
      assert.equal(
        css.includes('data-view-surface="browser-desktop"'),
        false,
        `${file} must not key desktop look off view-surface (PWA can be wide and still tablet)`,
      );
      assert.ok(
        css.includes('data-surface="desktop"') || css.includes("data-surface='desktop'"),
        `${file} should scope rules to the desktop surface`,
      );
    }
  });

  it('does not apply tablet-split-panel layout to the desktop surface', () => {
    const indexCss = readFileSync(join(here, '../index.css'), 'utf8');
    assert.equal(
      /body\[data-surface=["']desktop["']\][^{]*tablet-split-panel/.test(indexCss),
      false,
      'desktop must not inherit the tablet split-panel layout',
    );
  });
});
