/**
 * Render Guardr promo posts for Instagram, Stories, Facebook, and LinkedIn.
 * Black / white brand · Inter · shield mark · exact marketing copy.
 *
 * Usage: node scripts/render-promo-posts.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile, copyFile, rm, access } from 'node:fs/promises';
import { constants as fsConstants, statSync } from 'node:fs';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/marketing/posts');
const SOURCE = path.join(OUT, 'source');
const FONTS = path.join(ROOT, 'assets/marketing/fonts');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';

const TAGLINE = 'Anytime. Anywhere. Security, When You Need It.';
const SITE = 'www.guardr.co';

const fileUrl = (p) => pathToFileURL(p).href;
const photoUrl = (name) => fileUrl(path.join(SOURCE, name));
const screenUrl = (name) => fileUrl(path.join(SOURCE, 'screens', name));
const logoUrl = fileUrl(path.join(SOURCE, 'logo-shield.png'));
const logoBlackUrl = fileUrl(path.join(SOURCE, 'logo-shield-black.png'));

function fontFaceCss() {
  return [500, 600, 700, 800, 900]
    .map(
      (w) => `@font-face {
  font-family: Inter;
  font-style: normal;
  font-weight: ${w};
  src: url('${fileUrl(path.join(FONTS, `Inter-${w}.woff2`))}') format('woff2');
}`,
    )
    .join('\n');
}

const RESET = `
${fontFaceCss()}
:root {
  --ink: #000000;
  --paper: #ffffff;
  --muted: #c4c4c4;
  --grey: #7a7a7a;
  --grey-dark: #3a3a3a;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  overflow: hidden;
  background: var(--ink);
  font-family: Inter, system-ui, sans-serif;
  color: var(--paper);
  -webkit-font-smoothing: antialiased;
}
`;

function lockup(size = 56) {
  return `
  <div class="lockup">
    <img src="${logoUrl}" alt="" width="${size}" height="${size}" />
    <span>Guardr</span>
  </div>`;
}

function photoCss(w, h) {
  return `
${RESET}
html, body, .frame { width: ${w}px; height: ${h}px; }
.frame {
  position: relative;
  overflow: hidden;
  background: #000;
}
.photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}
.dim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 28%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.88) 100%);
}
.lockup {
  position: absolute;
  top: 36px;
  left: 40px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12px;
}
.lockup img {
  width: 52px;
  height: 52px;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.55));
}
.lockup span {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.copy {
  position: absolute;
  left: 40px;
  right: 40px;
  bottom: 40px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.eyebrow {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}
.headline {
  line-height: 0.92;
  margin-bottom: 16px;
}
.line1, .line2 {
  display: block;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.line1 { font-size: 64px; }
.line2 { font-size: 54px; color: #e8e8e8; }
.sub {
  max-width: 640px;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.35;
  color: #e6e6e6;
  margin-bottom: 22px;
}
.cta {
  display: inline-flex;
  align-items: center;
  background: #fff;
  color: #000;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 14px 28px;
  border-radius: 4px;
  margin-bottom: 16px;
}
.site {
  font-size: 16px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.04em;
}
`;
}

function photoHtml(post) {
  const { w, h, photo, objectPosition } = post;
  const pos = objectPosition || 'center 20%';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${photoCss(w, h)}
.photo { object-position: ${pos}; }
${post.extraCss || ''}
</style></head>
<body>
<article class="frame">
  <img class="photo" src="${photoUrl(photo)}" alt="" />
  <div class="dim"></div>
  ${lockup()}
  <div class="copy">
    <p class="eyebrow">${esc(post.eyebrow)}</p>
    <h1 class="headline">
      <span class="line1">${esc(post.line1)}</span>
      <span class="line2">${esc(post.line2)}</span>
    </h1>
    <p class="sub">${esc(post.sub)}</p>
    <div class="cta">${esc(post.cta)}</div>
    <p class="site">${esc(post.site || SITE)}</p>
  </div>
</article>
</body></html>`;
}

function bwCss(w, h) {
  return `
${RESET}
html, body, .frame { width: ${w}px; height: ${h}px; }
.frame {
  position: relative;
  overflow: hidden;
  background: #000;
  display: grid;
  color: #fff;
  background-image:
    linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px);
  background-size: 54px 54px;
}
.frame.invert {
  background: #fff;
  color: #000;
  background-image:
    linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 44px;
  border-bottom: 1px solid rgba(255,255,255,0.22);
  min-height: 88px;
  background: #000;
}
.invert .bar { background: #fff; border-color: rgba(0,0,0,0.16); }
.invert .brand img { filter: invert(1); }
.bar.foot {
  border-bottom: 0;
  border-top: 1px solid rgba(255,255,255,0.22);
  background: #fff;
  color: #000;
  min-height: 108px;
}
.invert .bar.foot {
  background: #000;
  color: #fff;
  border-top-color: rgba(0,0,0,0.16);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.brand img { width: 44px; height: 44px; object-fit: contain; }
.bar-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9a9a9a;
}
.invert .bar-label { color: #555; }
.hero {
  padding: 28px 44px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.hero h1 {
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 0.86;
  text-transform: uppercase;
}
.hero .line { display: block; }
.cols {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-top: 1px solid rgba(255,255,255,0.22);
  border-bottom: 1px solid rgba(255,255,255,0.22);
}
.invert .cols { border-color: rgba(0,0,0,0.16); }
.cols article {
  padding: 32px 36px 36px;
  border-right: 1px solid rgba(255,255,255,0.22);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}
.invert .cols article { border-color: rgba(0,0,0,0.16); }
.cols article:last-child { border-right: 0; }
.kicker {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9a9a9a;
}
.invert .kicker { color: #555; }
.cols h2 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.cols p {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.35;
  color: #d4d4d4;
}
.invert .cols p { color: #333; }
.cta {
  display: inline-flex;
  align-items: center;
  background: #000;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 16px 28px;
}
.invert .bar.foot .cta, .bar.foot .cta { background: #000; color: #fff; }
.invert .bar.foot .cta { background: #fff; color: #000; }
.site {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.steps-rows {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  min-height: 0;
}
.step {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  padding: 0 44px;
  border-top: 1px solid rgba(255,255,255,0.22);
  gap: 12px;
}
.invert .step { border-color: rgba(0,0,0,0.16); }
.step:nth-child(even) { background: rgba(255,255,255,0.04); }
.invert .step:nth-child(even) { background: rgba(0,0,0,0.04); }
.step .num {
  font-size: 92px;
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 1;
}
.step h2 {
  font-size: 42px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  line-height: 0.95;
}
.step p {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 500;
  color: #cfcfcf;
}
.invert .step p { color: #333; }
.cells {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  min-height: 0;
}
.cell {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 28px 36px;
  border-top: 1px solid rgba(255,255,255,0.22);
  border-right: 1px solid rgba(255,255,255,0.22);
}
.invert .cell { border-color: rgba(0,0,0,0.16); }
.cell:nth-child(even) { border-right: 0; }
.cell:nth-child(odd) { background: rgba(255,255,255,0.03); }
.invert .cell:nth-child(odd) { background: rgba(0,0,0,0.03); }
.cell .idx {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #8a8a8a;
  margin-bottom: 8px;
}
.cell h2 {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.lede {
  padding: 0 44px 8px;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
  max-width: 980px;
}
.lede em { font-style: normal; font-weight: 800; }
.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid rgba(255,255,255,0.22);
  min-height: 0;
}
.invert .split { border-color: rgba(0,0,0,0.16); }
.split > div {
  padding: 28px 44px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}
.split > div:first-child { border-right: 1px solid rgba(255,255,255,0.22); }
.invert .split > div:first-child { border-color: rgba(0,0,0,0.16); }
.split h2 {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}
.split p {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
  color: #d0d0d0;
}
.invert .split p { color: #333; }
`;
}

function barTop(label) {
  return `<header class="bar">
    <div class="brand"><img src="${logoUrl}" alt="" /><span>Guardr</span></div>
    <span class="bar-label">${esc(label)}</span>
  </header>`;
}

function barFoot(cta, site = SITE) {
  return `<footer class="bar foot">
    <div class="cta">${esc(cta)}</div>
    <span class="site">${esc(site)}</span>
  </footer>`;
}

function bwPage(w, h, inner, extraClass = '') {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}</style></head>
<body>
<article class="frame ${extraClass}" style="grid-template-rows: auto 1fr auto;">
  ${inner}
</article>
</body></html>`;
}

function graphicHtml(post) {
  const { w, h, layout } = post;
  const invert = post.invert ? 'invert' : '';

  if (layout === 'poster') {
    const cols = (post.cols || [])
      .map(
        (c) => `<article><p class="kicker">${esc(c.kicker)}</p><h2>${esc(c.title)}</h2><p>${esc(c.body)}</p></article>`,
      )
      .join('');
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.hero h1 { font-size: ${post.heroSize || 128}px; }
.frame { grid-template-rows: 88px minmax(280px, 1fr) minmax(220px, auto) 108px; }
</style></head>
<body>
<article class="frame ${invert}">
  ${barTop(post.eyebrow)}
  <section class="hero">
    <h1><span class="line">${esc(post.line1)}</span><span class="line">${esc(post.line2)}</span></h1>
  </section>
  <section class="cols">${cols}</section>
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  if (layout === 'steps') {
    const rows = (post.steps || [])
      .map(
        (s, i) => `<div class="step"><div class="num">${String(i + 1).padStart(2, '0')}</div>
      <div><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p></div></div>`,
      )
      .join('');
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.frame { grid-template-rows: 88px 1fr 108px; }
</style></head>
<body>
<article class="frame ${invert}">
  ${barTop(post.eyebrow)}
  <section class="steps-rows">${rows}</section>
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  if (layout === 'grid') {
    const cells = (post.cells || [])
      .map(
        (c, i) => `<div class="cell"><span class="idx">${String(i + 1).padStart(2, '0')}</span><h2>${esc(c)}</h2></div>`,
      )
      .join('');
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.frame { grid-template-rows: 88px 1fr 108px; }
</style></head>
<body>
<article class="frame ${invert}">
  ${barTop(post.eyebrow)}
  <section class="cells">${cells}</section>
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  if (layout === 'devices') {
    const phones = (post.phones || [])
      .map((p, i) => `<div class="phone p${i}"><img src="${screenUrl(p)}" alt="" /></div>`)
      .join('');
    const bullets = (post.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('');
    const facts = (post.facts || [])
      .map((f) => `<article><p class="kicker">${esc(f.kicker)}</p><h2>${esc(f.title)}</h2><p>${esc(f.body)}</p></article>`)
      .join('');
    const isStory = h > 1200;
    const isWide = w > h;
    const twoCol = !isStory;
    const rows = isStory ? '110px auto 1fr auto 120px' : '72px 1fr auto 96px';
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.frame { grid-template-rows: ${rows}; ${twoCol ? 'grid-template-columns: 1.05fr 0.95fr;' : ''} }
.bar { grid-column: 1 / -1; min-height: ${isStory ? 110 : 72}px; padding: 0 ${isStory ? 48 : 32}px; }
.bar.foot { min-height: ${isStory ? 120 : 92}px; grid-column: 1 / -1; }
.copy { padding: ${isStory ? '24px 48px 8px' : isWide ? '16px 20px 12px 32px' : '16px 14px 12px 32px'}; display: flex; flex-direction: column; justify-content: center; gap: 10px; min-height: 0; ${twoCol ? 'grid-row: 2; grid-column: 1;' : ''} }
.copy h1 { font-size: ${isStory ? 62 : isWide ? 40 : 40}px; font-weight: 900; letter-spacing: -0.04em; line-height: 0.9; text-transform: uppercase; }
.copy .lede { font-size: ${isStory ? 24 : 16}px; font-weight: 600; line-height: 1.3; }
.copy .lede em { font-style: normal; font-weight: 800; }
.copy ul { list-style: none; display: grid; gap: 6px; }
.copy li { font-size: ${isStory ? 22 : 14}px; font-weight: 600; line-height: 1.3; padding-left: 16px; position: relative; }
.copy li::before { content: ''; position: absolute; left: 0; top: 0.55em; width: 6px; height: 6px; background: #fff; }
.stage { position: relative; overflow: hidden; min-height: ${isStory ? 820 : 1}px; ${twoCol ? 'grid-row: 2; grid-column: 2;' : ''} }
.phone { position: absolute; width: ${isStory ? 300 : isWide ? 210 : 248}px; }
.phone img { width: 100%; display: block; border-radius: 34px; border: 9px solid #111; background: #000; box-shadow: 0 22px 50px rgba(0,0,0,0.55); }
.phone.p0 { ${isStory ? 'left: 10%; top: 4px; transform: rotate(-6deg); z-index: 2;' : isWide ? 'right: 28px; top: 10px; transform: rotate(-8deg); z-index: 2;' : 'right: 16px; top: 14px; transform: rotate(-8deg); z-index: 2;'} }
.phone.p1 { ${isStory ? 'right: 4%; bottom: 8px; width: 270px; transform: rotate(8deg); z-index: 1;' : isWide ? 'right: 158px; bottom: 4px; transform: rotate(7deg); z-index: 1;' : 'left: 4px; bottom: 10px; transform: rotate(9deg); z-index: 1;'} }
.facts { display: grid; grid-template-columns: 1fr 1fr 1fr; border-top: 1px solid rgba(255,255,255,0.22); grid-column: 1 / -1; }
.facts article { padding: ${isStory ? '20px 32px' : '14px 16px'}; border-right: 1px solid rgba(255,255,255,0.22); }
.facts article:last-child { border-right: 0; }
.facts h2 { font-size: ${isStory ? 22 : 15}px; font-weight: 800; letter-spacing: -0.03em; margin: 4px 0 4px; }
.facts p { font-size: ${isStory ? 16 : 12}px; font-weight: 500; color: #cfcfcf; line-height: 1.3; }
</style></head>
<body>
<article class="frame">
  ${barTop(post.eyebrow)}
  <div class="copy">
    <h1><span class="line">${esc(post.line1)}</span>${post.line2 ? `<span class="line">${esc(post.line2)}</span>` : ''}</h1>
    <p class="lede">${post.ledeHtml}</p>
    ${bullets ? `<ul>${bullets}</ul>` : ''}
  </div>
  <div class="stage">${phones}</div>
  ${facts ? `<section class="facts">${facts}</section>` : ''}
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  if (layout === 'platform') {
    const heroSize = post.heroSize || 92;
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.hero h1 { font-size: ${heroSize}px; }
.frame { grid-template-rows: 88px auto auto 1fr 108px; }
.lede { padding-top: 8px; padding-bottom: 28px; }
</style></head>
<body>
<article class="frame ${invert}">
  ${barTop(post.eyebrow || 'The platform')}
  <section class="hero">
    <h1><span class="line">${esc(post.line1)}</span><span class="line">${esc(post.line2)}</span></h1>
  </section>
  <p class="lede">${post.ledeHtml}</p>
  <section class="split">
    <div><h2>${esc(post.leftTitle)}</h2><p>${esc(post.leftBody)}</p></div>
    <div><h2>${esc(post.rightTitle)}</h2><p>${esc(post.rightBody)}</p></div>
  </section>
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  if (layout === 'story-fill') {
    const blocks = (post.blocks || [])
      .map(
        (b, i) => `<div class="step" style="grid-template-columns: 120px 1fr;">
      <div class="num">${b.num || String(i + 1).padStart(2, '0')}</div>
      <div><h2>${esc(b.title)}</h2><p>${esc(b.body)}</p></div></div>`,
      )
      .join('');
    const rows = ['110px'];
    if (post.line1) rows.push(post.blocks?.length ? 'auto' : '1fr');
    if (post.ledeHtml) rows.push('auto');
    if (post.blocks?.length) rows.push('1fr');
    rows.push('120px');
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.frame { grid-template-rows: ${rows.join(' ')}; }
.bar { min-height: 110px; padding: 0 48px; }
.bar.foot { min-height: 120px; }
.brand { font-size: 28px; }
.brand img { width: 56px; height: 56px; }
.hero { padding: 36px 48px 12px; }
.hero h1 { font-size: ${post.heroSize || 96}px; }
.lede { font-size: 30px; padding: 0 48px 28px; }
.step { padding: 0 48px; }
.step h2 { font-size: 48px; }
.step p { font-size: 26px; }
.step .num { font-size: 88px; }
.cta { font-size: 18px; padding: 18px 32px; }
.site { font-size: 18px; }
</style></head>
<body>
<article class="frame ${invert}">
  ${barTop(post.eyebrow)}
  ${
    post.line1
      ? `<section class="hero"><h1><span class="line">${esc(post.line1)}</span><span class="line">${esc(post.line2 || '')}</span></h1></section>`
      : ''
  }
  ${post.ledeHtml ? `<p class="lede">${post.ledeHtml}</p>` : ''}
  ${blocks ? `<section class="steps-rows">${blocks}</section>` : ''}
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  if (layout === 'story-platform') {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.frame { grid-template-rows: 110px auto auto 1fr 120px; }
.bar { min-height: 110px; padding: 0 48px; }
.bar.foot { min-height: 120px; }
.brand { font-size: 28px; }
.brand img { width: 56px; height: 56px; }
.hero { padding: 40px 48px 12px; }
.hero h1 { font-size: 92px; }
.lede { font-size: 32px; padding: 12px 48px 36px; }
.split { grid-template-rows: 1fr 1fr; grid-template-columns: 1fr; }
.split > div { padding: 36px 48px; border-right: 0; border-top: 1px solid rgba(255,255,255,0.22); }
.split > div:first-child { border-right: 0; }
.split h2 { font-size: 34px; }
.split p { font-size: 24px; }
.cta { font-size: 18px; padding: 18px 32px; }
.site { font-size: 18px; }
</style></head>
<body>
<article class="frame">
  ${barTop(post.eyebrow || 'The platform')}
  <section class="hero">
    <h1><span class="line">${esc(post.line1)}</span><span class="line">${esc(post.line2)}</span></h1>
  </section>
  <p class="lede">${post.ledeHtml}</p>
  <section class="split">
    <div><h2>${esc(post.leftTitle)}</h2><p>${esc(post.leftBody)}</p></div>
    <div><h2>${esc(post.rightTitle)}</h2><p>${esc(post.rightBody)}</p></div>
  </section>
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  if (layout === 'wide-platform' || layout === 'wide-poster') {
    const isPlatform = layout === 'wide-platform';
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${bwCss(w, h)}
.frame { grid-template-columns: 1.15fr 0.85fr; grid-template-rows: 72px 1fr 88px; }
.bar { grid-column: 1 / -1; min-height: 72px; padding: 0 36px; }
.bar.foot { min-height: 88px; }
.hero { padding: 24px 36px 16px; }
.hero h1 { font-size: ${isPlatform ? 58 : 72}px; }
.lede { font-size: 22px; padding: 0 36px 16px; }
.side {
  border-left: 1px solid rgba(255,255,255,0.22);
  display: grid;
  grid-template-rows: 1fr 1fr;
}
.side > div { padding: 22px 32px; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.side > div:first-child { border-bottom: 1px solid rgba(255,255,255,0.22); }
.side h2 { font-size: 22px; font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; }
.side p { font-size: 16px; font-weight: 500; line-height: 1.35; color: #d0d0d0; }
.cols { grid-column: 1 / -1; }
.main { display: flex; flex-direction: column; min-height: 0; }
</style></head>
<body>
<article class="frame">
  ${barTop(post.eyebrow)}
  <div class="main">
    <section class="hero">
      <h1><span class="line">${esc(post.line1)}</span><span class="line">${esc(post.line2)}</span></h1>
    </section>
    ${post.ledeHtml ? `<p class="lede">${post.ledeHtml}</p>` : ''}
  </div>
  <aside class="side">
    <div><h2>${esc(post.leftTitle)}</h2><p>${esc(post.leftBody)}</p></div>
    <div><h2>${esc(post.rightTitle)}</h2><p>${esc(post.rightBody)}</p></div>
  </aside>
  ${barFoot(post.cta)}
</article>
</body></html>`;
  }

  return bwPage(w, h, `${barTop(post.eyebrow)}<section class="hero"><h1>${esc(post.line1)}</h1></section>${barFoot(post.cta)}`);
}

function storyCss(w, h) {
  return `
${RESET}
html, body, .frame { width: ${w}px; height: ${h}px; }
.frame { position: relative; overflow: hidden; background: #000; }
.photo {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
.dim {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 30%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.92) 100%);
}
.lockup {
  position: absolute;
  top: 72px; left: 48px; right: 48px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 14px;
}
.lockup img { width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.55)); }
.lockup span { font-size: 28px; font-weight: 700; letter-spacing: 0.04em; }
.copy {
  position: absolute;
  left: 48px; right: 48px; bottom: 80px;
  z-index: 3;
}
.eyebrow {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 18px;
}
.headline { line-height: 0.92; margin-bottom: 20px; }
.line1 { display: block; font-size: 72px; font-weight: 900; }
.line2 { display: block; font-size: 58px; font-weight: 800; color: #e8e8e8; }
.sub {
  font-size: 26px;
  font-weight: 500;
  line-height: 1.35;
  color: #e6e6e6;
  margin-bottom: 28px;
  max-width: 920px;
}
.cta {
  display: inline-flex;
  background: #fff; color: #000;
  font-size: 18px; font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 16px 32px;
  border-radius: 4px;
  margin-bottom: 18px;
}
.site { font-size: 18px; font-weight: 600; color: var(--muted); letter-spacing: 0.04em; }
`;
}

function storyHtml(post) {
  const { w, h, photo } = post;
  const bg = photo
    ? `<img class="photo" src="${photoUrl(photo)}" alt="" />`
    : '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${storyCss(w, h)}${post.extraCss || ''}</style></head>
<body>
<article class="frame">
  ${bg}
  <div class="dim"></div>
  ${lockup(64)}
  <div class="copy">
    <p class="eyebrow">${esc(post.eyebrow)}</p>
    <h1 class="headline">
      <span class="line1">${esc(post.line1)}</span>
      <span class="line2">${esc(post.line2)}</span>
    </h1>
    <p class="sub">${esc(post.sub)}</p>
    <div class="cta">${esc(post.cta)}</div>
    <p class="site">${esc(post.site || SITE)}</p>
  </div>
</article>
</body></html>`;
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const SQ = { w: 1080, h: 1080 };
const ST = { w: 1080, h: 1920 };
const WD = { w: 1200, h: 630 };

const POSTS = [
  {
    file: 'instagram/ig-post-a-job.png',
    kind: 'photo',
    ...SQ,
    photo: 'source-event-night-square.png',
    objectPosition: 'center 18%',
    eyebrow: 'I need security',
    line1: 'POST A JOB.',
    line2: 'PICK YOUR GUARD.',
    sub: 'Licensed California guards apply on the map. You approve who works your site.',
    cta: 'Book now',
  },
  {
    file: 'instagram/ig-site-coverage.png',
    kind: 'photo',
    ...SQ,
    photo: 'source-construction-square.png',
    objectPosition: 'center 30%',
    eyebrow: 'Jobsites & retail',
    line1: 'SITE COVERAGE.',
    line2: 'WHEN YOU NEED IT.',
    sub: 'Post a shift for construction, retail, or a private event — then pick your licensed guard.',
    cta: 'Get started',
    extraCss: `.dim { background: linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 32%, rgba(0,0,0,0.82) 100%); }`,
  },
  {
    file: 'instagram/ig-nightlife.png',
    kind: 'photo',
    ...SQ,
    photo: 'source-nightlife-square.png',
    objectPosition: 'center 15%',
    eyebrow: 'Venues & events',
    line1: 'NIGHTLIFE',
    line2: '& VENUE SECURITY',
    sub: 'Door coverage, guest flow, and on-site check-in — booked in the app.',
    cta: 'Post coverage',
  },
  {
    file: 'instagram/ig-open-shifts.png',
    kind: 'photo',
    ...SQ,
    photo: 'source-phone-map-square.png',
    objectPosition: 'center 40%',
    eyebrow: "I'm a guard",
    line1: 'OPEN SHIFTS',
    line2: 'ON THE MAP.',
    sub: 'Licensed CA guards browse jobs, apply to what fits, and get paid through the platform.',
    cta: 'Sign up free',
    extraCss: `.dim { background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.9) 100%); }`,
  },
  {
    file: 'instagram/ig-your-shifts.png',
    kind: 'photo',
    ...SQ,
    photo: 'source-guard-portrait-square.png',
    objectPosition: 'center 20%',
    eyebrow: 'Licensed CA guards',
    line1: 'YOUR CARD.',
    line2: 'YOUR SHIFTS.',
    sub: 'Upload credentials. Get verified. Choose the work — no forced dispatch.',
    cta: "I'm a guard",
  },
  {
    file: 'instagram/ig-campus.png',
    kind: 'photo',
    ...SQ,
    photo: 'source-corporate-campus-square.png',
    objectPosition: 'center 25%',
    eyebrow: 'Corporate campuses',
    line1: 'COVERAGE ON',
    line2: 'YOUR CAMPUS.',
    sub: 'Post the site, schedule, and requirements. Track the shift — including check-in photos.',
    cta: 'Book now',
  },
  {
    file: 'instagram/ig-platform.png',
    kind: 'graphic',
    layout: 'devices',
    ...SQ,
    eyebrow: 'Read this first',
    line1: 'GUARDR IS',
    line2: 'THE PLATFORM.',
    ledeHtml:
      'Guards and businesses use it to find each other and <em>contract directly per job</em>.',
    bullets: [
      'Starting focused — growing guard supply first.',
      'Get verified, then both sides run independently.',
      'Not a staffing agency. Not dispatch.',
    ],
    phones: ['screen-map.png', 'screen-post.png'],
    facts: [
      { kicker: 'Businesses', title: 'Post the job', body: 'Site, hours, rate, requirements.' },
      { kicker: 'Guards', title: 'Apply on the map', body: 'Licensed. You choose the shift.' },
      { kicker: 'Together', title: 'Contract direct', body: 'Pay and track in the app.' },
    ],
    cta: 'Get started',
  },
  {
    file: 'instagram/ig-marketplace.png',
    kind: 'graphic',
    layout: 'devices',
    ...SQ,
    eyebrow: 'California',
    line1: 'SECURITY',
    line2: 'MARKETPLACE',
    ledeHtml: 'Post coverage. Hire licensed guards. Or browse open shifts and apply.',
    bullets: [
      'Map-first — see who’s nearby.',
      'Credentials checked before anyone goes live.',
      'In-app pay, check-in photos, shift tracking.',
    ],
    phones: ['screen-home.png', 'screen-map.png'],
    facts: [
      { kicker: 'Clients', title: 'I need security', body: 'Post a job. Pick your guard.' },
      { kicker: 'Guards', title: "I'm a guard", body: 'Open shifts on your schedule.' },
      { kicker: 'Live', title: 'www.guardr.co', body: 'Free to sign up.' },
    ],
    cta: 'Book now',
  },
  {
    file: 'instagram/ig-how-it-works.png',
    kind: 'graphic',
    layout: 'devices',
    ...SQ,
    eyebrow: 'How it works',
    line1: 'POST. PICK.',
    line2: 'PAY.',
    ledeHtml: 'Three steps. You stay in control of who works the site.',
    bullets: [
      'Post site, time, rate, and requirements.',
      'Review licensed applicants — you approve.',
      'Pay in the app. Track the shift live.',
    ],
    phones: ['screen-post.png', 'screen-map.png'],
    facts: [
      { kicker: '01', title: 'Post', body: 'Coverage you need tonight or later.' },
      { kicker: '02', title: 'Pick', body: 'Credentials on the profile.' },
      { kicker: '03', title: 'Pay', body: 'Clock-in photos + reports.' },
    ],
    cta: 'Get started',
  },
  {
    file: 'instagram/ig-coverage-types.png',
    kind: 'graphic',
    layout: 'devices',
    ...SQ,
    eyebrow: 'Coverage you can post',
    line1: 'EVENTS TO',
    line2: 'JOB SITES.',
    ledeHtml: 'One marketplace for licensed California coverage — per shift, not a contract with an agency.',
    bullets: [
      'Event · nightlife · venues',
      'Construction · retail · campus',
      'Executive protection · site patrol',
    ],
    phones: ['screen-shifts.png', 'screen-post.png'],
    facts: [
      { kicker: 'Required', title: 'BSIS card', body: 'ID, COI, 32-hr training on file.' },
      { kicker: 'Region', title: 'California', body: 'Credential checks before go-live.' },
      { kicker: 'Model', title: 'Per job', body: 'Independent contractors.' },
    ],
    cta: 'Post a job',
  },
  {
    file: 'stories/story-event.png',
    kind: 'story',
    ...ST,
    photo: 'source-event-story.png',
    extraCss: `.photo { object-position: center 15%; }`,
    eyebrow: 'I need security',
    line1: 'POST A JOB.',
    line2: 'PICK YOUR GUARD.',
    sub: 'Licensed California guards apply. You approve who works your site.',
    cta: 'guardr.co',
  },
  {
    file: 'stories/story-guards.png',
    kind: 'story',
    ...ST,
    photo: 'source-guard-city-story.png',
    extraCss: `.photo { object-position: center 20%; }`,
    eyebrow: "I'm a guard",
    line1: 'OPEN SHIFTS',
    line2: 'NEAR YOU.',
    sub: 'Browse the map. Apply to what fits. Get paid through the platform.',
    cta: 'Sign up free',
  },
  {
    file: 'stories/story-platform.png',
    kind: 'graphic',
    layout: 'devices',
    ...ST,
    eyebrow: 'Read this first',
    line1: 'THE',
    line2: 'PLATFORM.',
    ledeHtml:
      'Guards and businesses find each other here and <em>contract directly per job</em>.',
    bullets: [
      'Starting focused — growing guard supply.',
      'Verified, then both sides operate independently.',
      'Not an agency. Not forced dispatch.',
    ],
    phones: ['screen-map.png', 'screen-post.png'],
    facts: [
      { kicker: 'Post', title: 'The job', body: 'Site, hours, rate.' },
      { kicker: 'Pick', title: 'Your guard', body: 'Licensed profiles.' },
      { kicker: 'Pay', title: 'In the app', body: 'Track the shift.' },
    ],
    cta: 'Get started',
  },
  {
    file: 'stories/story-tagline.png',
    kind: 'graphic',
    layout: 'devices',
    ...ST,
    eyebrow: 'Guardr',
    line1: 'ANYTIME.',
    line2: 'ANYWHERE.',
    ledeHtml: 'Security when you need it — post coverage or pick up a shift.',
    bullets: [
      'Businesses post the job.',
      'Licensed guards apply on the map.',
      'You contract direct, per job.',
    ],
    phones: ['screen-home.png', 'screen-map.png'],
    facts: [
      { kicker: 'Clients', title: 'Post a job', body: 'Pick who works.' },
      { kicker: 'Guards', title: 'Find work', body: 'Your schedule.' },
      { kicker: 'CA', title: 'Verified', body: 'Then go live.' },
    ],
    cta: 'Book now',
  },
  {
    file: 'stories/story-how-it-works.png',
    kind: 'graphic',
    layout: 'devices',
    ...ST,
    eyebrow: 'How it works',
    line1: 'POST.',
    line2: 'PICK. PAY.',
    ledeHtml: 'You approve who works your site. Guards choose which shifts to take.',
    bullets: [
      'Post coverage with site and rate.',
      'Review licensed applicants.',
      'Pay and track — check-in photos included.',
    ],
    phones: ['screen-post.png', 'screen-shifts.png'],
    facts: [
      { kicker: '01', title: 'Post', body: 'The coverage.' },
      { kicker: '02', title: 'Pick', body: 'The guard.' },
      { kicker: '03', title: 'Pay', body: 'The shift.' },
    ],
    cta: 'Get started',
  },
  {
    file: 'landscape/wide-event.png',
    kind: 'photo',
    ...WD,
    photo: 'source-event-wide.png',
    objectPosition: 'center 40%',
    extraCss: `
      .lockup { top: 28px; left: 36px; }
      .lockup img { width: 44px; height: 44px; }
      .lockup span { font-size: 18px; }
      .copy { left: 36px; right: 36px; bottom: 28px; }
      .eyebrow { font-size: 13px; margin-bottom: 8px; }
      .line1 { font-size: 42px; }
      .line2 { font-size: 34px; }
      .sub { font-size: 16px; max-width: 640px; margin-bottom: 14px; }
      .cta { font-size: 13px; padding: 10px 20px; margin-bottom: 10px; }
      .site { font-size: 13px; }
      .headline { margin-bottom: 10px; }
    `,
    eyebrow: 'Event security',
    line1: 'POST A JOB.',
    line2: 'PICK YOUR GUARD.',
    sub: 'Licensed California guards apply on the map. You approve who works your site.',
    cta: 'Book now',
  },
  {
    file: 'landscape/wide-retail.png',
    kind: 'photo',
    ...WD,
    photo: 'source-retail-wide.png',
    objectPosition: 'center 35%',
    extraCss: `
      .lockup { top: 28px; left: 36px; }
      .lockup img { width: 44px; height: 44px; }
      .lockup span { font-size: 18px; }
      .copy { left: 36px; right: 40%; bottom: 28px; }
      .eyebrow { font-size: 13px; margin-bottom: 8px; }
      .line1 { font-size: 38px; }
      .line2 { font-size: 32px; }
      .sub { font-size: 16px; max-width: 520px; margin-bottom: 14px; }
      .cta { font-size: 13px; padding: 10px 20px; margin-bottom: 10px; }
      .site { font-size: 13px; }
      .headline { margin-bottom: 10px; }
      .dim { background: linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.12) 100%); }
    `,
    eyebrow: 'Retail & storefronts',
    line1: 'LICENSED',
    line2: 'SECURITY, NEARBY.',
    sub: 'Post coverage for your shop, venue, or site. Verified guards apply — you pick.',
    cta: 'Get started',
  },
  {
    file: 'landscape/wide-platform.png',
    kind: 'graphic',
    layout: 'devices',
    ...WD,
    eyebrow: 'Read this first',
    line1: 'GUARDR IS',
    line2: 'THE PLATFORM.',
    ledeHtml:
      'Guards and businesses find each other and <em>contract directly per job</em>. Starting focused. Growing supply. Independent once verified.',
    bullets: [
      'Not a staffing agency or PPO dispatch.',
      'Both sides operate on their own after go-live.',
    ],
    phones: ['screen-map.png', 'screen-post.png'],
    facts: [
      { kicker: 'Clients', title: 'Post + pick', body: 'You approve who works the site.' },
      { kicker: 'Guards', title: 'Apply + get paid', body: 'Choose shifts. No forced dispatch.' },
      { kicker: 'Guardr', title: 'The rails', body: 'Credentials, chat, pay, tracking.' },
    ],
    cta: 'Get started',
  },
  {
    file: 'landscape/wide-marketplace.png',
    kind: 'graphic',
    layout: 'devices',
    ...WD,
    eyebrow: 'California',
    line1: 'SECURITY',
    line2: 'MARKETPLACE',
    ledeHtml: 'Post coverage. Hire licensed guards. Maps, messaging, and payments in one place.',
    bullets: [
      'Event, venue, retail, construction, campus.',
      'BSIS card, ID, COI, training — then live.',
    ],
    phones: ['screen-home.png', 'screen-map.png'],
    facts: [
      { kicker: 'Post a job', title: 'Clients', body: 'Site, hours, rate, requirements.' },
      { kicker: 'Find work', title: 'Guards', body: 'Open shifts on the map.' },
      { kicker: 'Contract', title: 'Direct', body: 'Per job, in the app.' },
    ],
    cta: 'Book now',
  },
  {
    file: 'landscape/wide-guards.png',
    kind: 'graphic',
    layout: 'devices',
    ...WD,
    eyebrow: "I'm a guard",
    line1: 'OPEN SHIFTS',
    line2: 'ON THE MAP.',
    ledeHtml: 'Licensed CA guards browse jobs, apply to what fits, get paid through Guardr.',
    bullets: [
      'No forced dispatch — you pick the shift.',
      'Upload card, ID, COI, training. Staff verifies.',
    ],
    phones: ['screen-shifts.png', 'screen-map.png'],
    facts: [
      { kicker: 'Need', title: 'Guard card', body: 'CA BSIS + COI on file.' },
      { kicker: 'Do', title: 'Apply', body: 'Jobs that fit your night.' },
      { kicker: 'Get', title: 'Paid', body: 'Stripe payouts in the app.' },
    ],
    cta: 'Sign up free',
  },
];

async function waitForFile(filePath, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(filePath, fsConstants.R_OK);
      const size = statSync(filePath).size;
      if (size > 20_000) {
        await new Promise((r) => setTimeout(r, 300));
        return;
      }
    } catch {
      // not ready
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

function htmlFor(post) {
  if (post.kind === 'photo') return photoHtml(post);
  if (post.kind === 'story') return storyHtml(post);
  return graphicHtml(post);
}

async function screenshot(html, outPng, w, h, index) {
  const tmpDir = path.join(os.tmpdir(), 'guardr-promo-posts');
  await mkdir(tmpDir, { recursive: true });
  const htmlPath = path.join(tmpDir, `frame-${index}.html`);
  const profileDir = path.join(tmpDir, `chrome-profile-${index}`);
  const shotPath = path.join(tmpDir, `shot-${index}.png`);
  await writeFile(htmlPath, html, 'utf8');
  await rm(shotPath, { force: true });
  await rm(profileDir, { recursive: true, force: true });
  await mkdir(profileDir, { recursive: true });

  const child = spawn(
    CHROME,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--force-device-scale-factor=1',
      `--user-data-dir=${profileDir}`,
      `--window-size=${w},${h}`,
      `--screenshot=${shotPath}`,
      '--virtual-time-budget=4000',
      '--run-all-compositor-stages-before-draw',
      '--default-background-color=000000',
      pathToFileURL(htmlPath).href,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  let stderr = '';
  child.stderr?.on('data', (d) => {
    stderr += d.toString();
  });

  try {
    await Promise.race([
      waitForFile(shotPath),
      new Promise((_, reject) =>
        child.on('error', (err) => reject(new Error(`${err.message}\n${stderr}`))),
      ),
    ]);
  } finally {
    if (!child.killed) child.kill('SIGKILL');
  }

  await mkdir(path.dirname(outPng), { recursive: true });
  await copyFile(shotPath, outPng);
  console.log('wrote', path.relative(ROOT, outPng), `(${statSync(outPng).size} bytes)`);
}

async function main() {
  await mkdir(path.join(OUT, 'instagram'), { recursive: true });
  await mkdir(path.join(OUT, 'stories'), { recursive: true });
  await mkdir(path.join(OUT, 'landscape'), { recursive: true });
  const bwOnly = process.argv.includes('--bw');
  const list = bwOnly ? POSTS.filter((p) => p.kind === 'graphic') : POSTS;
  for (let i = 0; i < list.length; i += 1) {
    const post = list[i];
    await screenshot(htmlFor(post), path.join(OUT, post.file), post.w, post.h, i);
  }
  console.log('done — posts in', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
