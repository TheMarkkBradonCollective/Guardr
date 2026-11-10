import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, 'surface-look.css'), 'utf8');

describe('surface look layer', () => {
  it('scopes every rule to data-surface, not form-factor', () => {
    assert.equal(
      css.includes('data-form-factor'),
      false,
      'look layer must not key off form-factor (Tailwind md/lg)',
    );
    assert.equal(
      css.includes('data-view-surface'),
      false,
      'look layer must not key off view-surface',
    );
    assert.ok(css.includes("data-surface='mobile'"));
    assert.ok(css.includes("data-surface='tablet'"));
    assert.ok(css.includes("data-surface='desktop'"));
  });

  it('gives each surface its own canvas, radius, and paper language', () => {
    for (const surface of ['mobile', 'tablet', 'desktop']) {
      assert.match(css, new RegExp(`body\\[data-surface='${surface}'\\][\\s\\S]{0,400}--look-canvas: var\\(--gr-canvas\\)`));
      assert.match(css, new RegExp(`body\\[data-surface='${surface}'\\][\\s\\S]{0,800}--look-card-radius: var\\(--gr-radius-card\\)`));
    }
    assert.match(css, /body\[data-surface='mobile'\][\s\S]{0,1200}--look-card-border: none/);
    assert.match(css, /body\[data-surface='tablet'\][\s\S]{0,1200}--look-card-border: 1px solid/);
    assert.match(css, /body\[data-surface='desktop'\][\s\S]{0,1400}--look-input-radius: var\(--gr-radius-control\)/);

    const authored = readFileSync(join(here, 'redesign/tokens.css'), 'utf8');
    assert.match(authored, /body\[data-surface='mobile'\][\s\S]{0,500}--gr-canvas: #ffffff/);
    assert.match(authored, /body\[data-surface='tablet'\][\s\S]{0,500}--gr-canvas: #f0f0f0/);
    assert.match(authored, /body\[data-surface='desktop'\][\s\S]{0,500}--gr-canvas: #e8e8e8/);
    assert.match(authored, /theme-dark body\[data-surface='mobile'\][\s\S]{0,200}--gr-canvas: #0a0a0a/);
    assert.match(authored, /theme-dark body\[data-surface='tablet'\][\s\S]{0,200}--gr-canvas: #111111/);
    assert.match(authored, /theme-dark body\[data-surface='desktop'\][\s\S]{0,200}--gr-canvas: #000000/);
  });

  it('does not introduce filled traffic-light action colours', () => {
    assert.equal(css.includes('#0e7a4a'), false);
    assert.equal(css.includes('#b3261e'), false);
    assert.equal(css.includes('#9a5b00'), false);
    assert.equal(css.toLowerCase().includes('#22c55e'), false);
    assert.equal(css.toLowerCase().includes('#ef4444'), false);
  });

  it('does not paint the desktop sidebar paper (white labels need ink)', () => {
    assert.equal(
      /body\[data-surface='desktop'\] \.sfd-sidebar\s*\{[^}]*background:\s*var\(--look-paper\)/.test(css),
      false,
      'desktop sidebar must stay dark so inverse labels remain readable',
    );
    assert.equal(
      /body\[data-surface='desktop'\] \.sfd-sidebar-item\[data-active='true'\][\s\S]{0,80}--look-tile-strong/.test(css),
      false,
      'active desktop nav items must not use the light tile fill',
    );
  });

  it('unboxes signed-in desktop pages so they fill the canvas', () => {
    assert.match(css, /\.adm-form-page/);
    assert.match(css, /\.client-form-shell/);
    assert.match(
      css,
      /body\[data-surface='desktop'\][\s\S]{0,80}\.app-screen[\s\S]{0,500}max-width: none !important/,
    );
  });
});
