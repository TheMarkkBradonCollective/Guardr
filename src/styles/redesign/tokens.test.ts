import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SURFACE_DESIGN } from '../../surfaces/surfaceDesign.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

function block(css: string, selector: string): string {
  const at = css.indexOf(selector);
  assert.ok(at >= 0, selector);
  const open = css.indexOf('{', at);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

const tokens = read('src/styles/redesign/tokens.css');
const roles = [
  'ink',
  'ink-muted',
  'paper',
  'paper-raised',
  'paper-sunken',
  'line',
  'accent',
  'accent-ink',
  'danger',
  'warn',
  'success',
  'info',
];

describe('redesign tokens', () => {
  it('authors one light and one dark role set', () => {
    const light = block(tokens, ':root {');
    const dark = block(tokens, 'html.theme-dark');
    for (const role of roles) {
      assert.match(light, new RegExp(`--gr-${role}:\\s*[^;]+;`));
      assert.match(dark, new RegExp(`--gr-${role}:\\s*[^;]+;`));
    }
    assert.match(light, /--gr-paper:\s*#ffffff/i);
    assert.match(light, /--gr-ink:\s*#000000/i);
    assert.match(dark, /--gr-paper:\s*#141414/i);
    assert.match(dark, /--gr-ink:\s*#f5f5f5/i);
    assert.equal(tokens.includes('Uber Move'), false);
  });

  it('keeps phone, tablet, and desktop scales distinct and aligned with surfaceDesign', () => {
    const scales: Array<['mobile' | 'tablet' | 'desktop', string]> = [
      ['mobile', "body[data-surface='mobile']"],
      ['tablet', "body[data-surface='tablet']"],
      ['desktop', "body[data-surface='desktop']"],
    ];
    const bodies = scales.map(([, selector]) => block(tokens, selector));
    assert.equal(new Set(bodies).size, 3);

    for (const [surface, selector] of scales) {
      const design = SURFACE_DESIGN[surface];
      const css = block(tokens, selector);
      const expectVar = (name: string, value: number, unit: string) => {
        assert.match(css, new RegExp(`--gr-${name}:\\s*${value}${unit}`), `${surface} ${name}`);
      };
      expectVar('type-display', design.type.display, 'px');
      expectVar('type-title', design.type.title, 'px');
      expectVar('type-body', design.type.body, 'px');
      expectVar('type-label', design.type.label, 'px');
      expectVar('type-caption', design.type.caption, 'px');
      expectVar('space-gutter', design.layout.gutter, 'px');
      expectVar('radius-card', design.radius.card, 'px');
      expectVar('radius-control', design.radius.control, 'px');
      expectVar('target-min', design.control.minTarget, 'px');
      expectVar('motion-page', design.motion.page, 'ms');
    }
  });

  it('points the legacy palettes at the authored roles', () => {
    const uber = read('src/styles/gr-tokens.css');
    const foundation = read('src/styles/surface-foundation.css');
    assert.match(uber, /--uber-bg:\s*var\(--gr-paper\)/);
    assert.match(uber, /--uber-text:\s*var\(--gr-ink\)/);
    assert.match(uber, /--uber-accent:\s*var\(--gr-accent\)/);
    assert.match(uber, /--brand-bg:\s*var\(--uber-bg\)/);
    assert.doesNotMatch(uber, /--uber-bg:\s*#/);
    assert.doesNotMatch(uber, /--uber-text:\s*#/);
    assert.match(foundation, /--sf-paper:\s*var\(--gr-paper\)/);
    assert.match(foundation, /--sf-ink:\s*var\(--gr-ink\)/);
    assert.doesNotMatch(foundation, /--sf-paper:\s*#/);
  });

  it('folds visual-refresh into the barrel and loads Inter', () => {
    const barrel = read('src/styles/redesign/index.css');
    const main = read('src/main.tsx');
    const html = read('index.html');
    assert.match(barrel, /@import '\.\/tokens\.css';/);
    assert.match(barrel, /@import '\.\.\/visual-refresh\.css';/);
    assert.match(main, /import '@fontsource-variable\/inter\/wght\.css';/);
    assert.match(main, /import '\.\/styles\/redesign\/index\.css';/);
    assert.equal(main.includes('visual-refresh.css'), false);
    assert.equal(html.includes('fonts.googleapis.com'), false);
    assert.equal(html.includes('fonts.gstatic.com'), false);
  });
});
