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

  it('lays out staff/application profiles as a full-width command workbench', () => {
    const commandCss = readFileSync(join(here, 'desktop-command.css'), 'utf8');
    assert.match(commandCss, /body\[data-surface=['"]desktop['"]\] \.staff-detail-actions/);
    assert.match(commandCss, /sfd-shell-canvas:has\(> \.staff-detail-pane\)/);
    assert.ok(commandCss.includes('align-items: stretch'));
    assert.ok(commandCss.includes('width: 100% !important'));
    assert.ok(commandCss.includes('width: 100%'));
    assert.match(commandCss, /\.staff-detail-pane:has\(> \.staff-detail-header\)/);
    assert.match(
      commandCss,
      /\.staff-detail-pane:has\(> \.staff-detail-header\)[\s\S]{0,280}grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/,
    );
    assert.match(
      commandCss,
      /\.staff-detail-pane:has\(> \.staff-detail-header\) > \.staff-account-access[\s\S]{0,80}grid-column: 1 \/ -1/,
    );
    assert.equal(
      /sfd-shell-canvas > \.staff-detail-pane[\s\S]{0,240}max-width: 420px/.test(commandCss),
      false,
      'desktop profile panes must not be a 420px phone card',
    );
    assert.ok(commandCss.includes('background-color: transparent !important'));
  });

  it('applies the desktop workbench to payments, forms, and app screens site-wide', () => {
    const commandCss = readFileSync(join(here, 'desktop-command.css'), 'utf8');
    assert.match(commandCss, /\.payments-page-header/);
    assert.match(commandCss, /\.role-app-shell \.app-screen[\s\S]{0,160}max-width: none/);
    assert.match(commandCss, /\.app-form-section \.grid[\s\S]{0,400}repeat\(2/);
  });

  it('does not letterbox signed-in desktop pages into a phone column', () => {
    const indexCss = readFileSync(join(here, '../index.css'), 'utf8');
    const lookCss = readFileSync(join(here, 'surface-look.css'), 'utf8');

    assert.equal(
      /body\[data-surface=["']desktop["']\][\s\S]{0,180}\.app-screen[\s\S]{0,120}max-width:\s*52rem/.test(indexCss),
      false,
      'desktop app-screen must not be capped at 52rem',
    );
    assert.equal(
      /body\[data-surface=["']desktop["']\][\s\S]{0,180}\.app-screen[\s\S]{0,120}max-width:\s*62rem/.test(indexCss),
      false,
      'desktop app-screen must not be capped at 62rem',
    );
    assert.match(
      lookCss,
      /body\[data-surface='desktop'\][\s\S]{0,80}\.app-screen[\s\S]{0,400}max-width: none !important/,
    );
    assert.match(lookCss, /\.adm-form-page/);
    assert.match(lookCss, /\.client-form-shell/);
  });
});
