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
  const isStory = h > 1200;
  const isWide = w > h;

  if (layout === 'punch-photo') {
    const pos = post.objectPosition || 'center 20%';
    const titleSize = isStory ? 108 : isWide ? 56 : 88;
    const subSize = isStory ? 32 : isWide ? 20 : 26;
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>
${fontFaceCss()}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, .frame { width: ${w}px; height: ${h}px; overflow: hidden; }
.frame { position: relative; background: #000; color: #fff; font-family: Inter, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.photo {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; object-position: ${pos};
  filter: grayscale(1) contrast(1.12) brightness(0.82);
}
.dim {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 38%, rgba(0,0,0,0.55) 100%);
}
.copy {
  position: absolute; z-index: 3;
  left: ${isWide ? 40 : 48}px; right: ${isWide ? 40 : 48}px;
  bottom: ${isStory ? 80 : isWide ? 32 : 48}px;
  display: flex; flex-direction: column; align-items: flex-start; gap: ${isStory ? 18 : 12}px;
}
.lock { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.34em; }
.lock img { width: 22px; height: 22px; object-fit: contain; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6)); }
h1 {
  font-size: ${titleSize}px; font-weight: 900; letter-spacing: -0.06em;
  line-height: 0.84; text-transform: uppercase;
  text-shadow: 0 10px 28px rgba(0,0,0,0.75);
}
.lede {
  font-size: ${subSize}px; font-weight: 600; line-height: 1.25;
  color: #e8e8e8; max-width: 16ch;
  text-shadow: 0 6px 16px rgba(0,0,0,0.8);
}
</style></head>
<body>
<article class="frame">
  <img class="photo" src="${photoUrl(post.photo)}" alt="" />
  <div class="dim"></div>
  <div class="copy">
    <div class="lock"><img src="${logoUrl}" alt="" /><span>GUARDR</span></div>
    <h1>${esc(post.line1)}${post.line2 ? `<br/>${esc(post.line2)}` : ''}</h1>
    <p class="lede">${esc(post.lede)}</p>
  </div>
</article>
</body></html>`;
  }

  if (layout === 'punch-type') {
    const titleSize = isStory ? 140 : isWide ? 72 : 118;
    const subSize = isStory ? 36 : isWide ? 22 : 28;
    const mark = isStory ? 620 : isWide ? 340 : 520;
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>
${fontFaceCss()}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, .frame { width: ${w}px; height: ${h}px; overflow: hidden; }
.frame {
  position: relative; background: #000; color: #fff;
  font-family: Inter, system-ui, sans-serif; -webkit-font-smoothing: antialiased;
}
.mark {
  position: absolute; left: 50%; top: 42%;
  width: ${mark}px; height: ${mark}px;
  transform: translate(-50%, -50%);
  opacity: 0.09;
  object-fit: contain;
  pointer-events: none;
}
.copy {
  position: absolute; left: ${isWide ? 48 : 52}px; right: ${isWide ? 48 : 52}px;
  top: 0; bottom: 0;
  display: flex; flex-direction: column; justify-content: center;
  align-items: flex-start; gap: ${isStory ? 22 : 14}px;
  padding: ${isStory ? '0 0 40px' : isWide ? '0' : '0 0 24px'};
}
.lock { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.34em; }
.lock img { width: 22px; height: 22px; object-fit: contain; }
h1 {
  font-size: ${titleSize}px; font-weight: 900; letter-spacing: -0.07em;
  line-height: 0.8; text-transform: uppercase;
}
.lede { font-size: ${subSize}px; font-weight: 500; color: #b8b8b8; max-width: 14ch; line-height: 1.2; }
</style></head>
<body>
<article class="frame">
  <img class="mark" src="${logoUrl}" alt="" />
  <div class="copy">
    <div class="lock"><img src="${logoUrl}" alt="" /><span>GUARDR</span></div>
    <h1>${esc(post.line1)}${post.line2 ? `<br/>${esc(post.line2)}` : ''}</h1>
    <p class="lede">${esc(post.lede)}</p>
  </div>
</article>
</body></html>`;
  }

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
    const shot = post.shot || 'hero';
    const srcs = post.phones || [];
    const isStory = h > 1200;
    const isWide = w > h;
    const fmt = isStory ? 'story' : isWide ? 'wide' : 'sq';
    const device = (src, cls = '') =>
      `<div class="device ${cls}"><i class="island"></i><i class="vol"></i><i class="pwr"></i><img src="${screenUrl(src)}" alt="" /></div>`;
    const lock = `<div class="lock"><img src="${logoUrl}" alt="" /><span>GUARDR</span></div>`;
    const headline = `<h1>${esc(post.line1)}${post.line2 ? `<br/>${esc(post.line2)}` : ''}</h1>`;
    const lede = post.ledeHtml ? `<p class="lede">${post.ledeHtml}</p>` : '';
    const note = post.note ? `<p class="note">${esc(post.note)}</p>` : '';
    const ladder = (post.steps || [])
      .map(
        (s) =>
          `<li><span class="n">${esc(s.n)}</span><div><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p></div></li>`,
      )
      .join('');
    const menu = (post.items || []).map((it) => `<li>${esc(it)}</li>`).join('');
    const copyInner =
      shot === 'steps'
        ? `${lock}`
        : shot === 'menu'
          ? `${lock}${lede}${note}`
          : `${lock}${headline}${lede}${note}`;
    const extra =
      shot === 'steps'
        ? `<ol class="ladder">${ladder}</ol>`
        : shot === 'menu'
          ? `<ul class="menu-list">${menu}</ul>`
          : '';
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>
${fontFaceCss()}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, .frame { width: ${w}px; height: ${h}px; overflow: hidden; }
.frame {
  position: relative;
  background: #050505;
  color: #fff;
  font-family: Inter, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.glow {
  position: absolute;
  inset: 8% -30% 10% 10%;
  background: radial-gradient(ellipse at 70% 35%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 58%);
  pointer-events: none;
  z-index: 0;
}
.stage { position: absolute; inset: 0; z-index: 1; }
.device {
  position: absolute;
  background: linear-gradient(165deg, #3a3a3a 0%, #141414 42%, #050505 100%);
  border-radius: 62px;
  padding: 11px;
  box-shadow:
    inset 0 1px 1px rgba(255,255,255,0.22),
    inset 0 -2px 3px rgba(0,0,0,0.65),
    0 0 0 1px #2a2a2a,
    0 40px 90px rgba(0,0,0,0.62);
}
.device img {
  display: block;
  width: 100%;
  border-radius: 51px;
}
.device::after {
  content: '';
  position: absolute;
  inset: 11px;
  border-radius: 51px;
  pointer-events: none;
  background: linear-gradient(125deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 28%);
  z-index: 3;
}
.island {
  position: absolute;
  top: 18px; left: 50%; transform: translateX(-50%);
  width: 92px; height: 26px;
  background: #000;
  border-radius: 20px;
  z-index: 4;
}
.vol, .pwr { position: absolute; background: #2a2a2a; }
.vol { left: -3px; top: 118px; width: 4px; height: 90px; border-radius: 2px 0 0 2px; }
.pwr { right: -3px; top: 168px; width: 4px; height: 64px; border-radius: 0 2px 2px 0; }
.veil {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 34%;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(0deg, #050505 0%, rgba(5,5,5,0.88) 42%, rgba(5,5,5,0) 100%);
}
.copy {
  position: absolute;
  z-index: 5;
  left: 48px; right: 48px; bottom: 44px;
  display: flex; flex-direction: column; align-items: flex-start; gap: 12px;
}
.lock {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 800; letter-spacing: 0.34em;
}
.lock img { width: 22px; height: 22px; object-fit: contain; }
.copy h1 {
  font-size: 72px; font-weight: 900;
  letter-spacing: -0.06em; line-height: 0.82;
  text-transform: uppercase;
  max-width: 12ch;
  text-shadow: 0 12px 32px rgba(0,0,0,0.85);
}
.lede {
  font-size: 24px; font-weight: 500; line-height: 1.22;
  color: #d4d4d4; max-width: 20ch;
  text-shadow: 0 6px 18px rgba(0,0,0,0.9);
}
.lede em { font-style: normal; color: #fff; font-weight: 800; }
.note { font-size: 15px; font-weight: 600; color: #8a8a8a; max-width: 26ch; line-height: 1.3; }
.ladder {
  position: absolute; z-index: 5;
  left: 48px; top: 140px; right: 42%;
  display: flex; flex-direction: column; gap: 28px;
  list-style: none;
}
.ladder li { display: grid; grid-template-columns: 72px 1fr; gap: 8px; align-items: start; }
.ladder .n { font-size: 22px; font-weight: 800; letter-spacing: 0.12em; color: #5a5a5a; padding-top: 10px; }
.ladder h2 { font-size: 64px; font-weight: 900; letter-spacing: -0.06em; line-height: 0.86; }
.ladder p { margin-top: 8px; font-size: 20px; font-weight: 500; color: #b0b0b0; max-width: 16ch; }
.menu-list {
  position: absolute; z-index: 5;
  left: 48px; top: 160px;
  list-style: none;
}
.menu-list li {
  font-size: 78px; font-weight: 900;
  letter-spacing: -0.06em; line-height: 0.9;
  text-transform: uppercase;
}
.grain {
  position: absolute; inset: 0; z-index: 8; pointer-events: none; opacity: 0.05;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

/* HERO — one giant phone, type in the open black */
.shot-hero .device { width: 560px; left: 46%; top: -10px; transform: rotate(8deg); }
.shot-hero .copy { max-width: 520px; }
.shot-hero .copy h1 { font-size: 78px; }
.shot-hero .veil { width: 58%; right: auto; height: 48%; }
.shot-hero.flip .device { left: auto; right: 46%; transform: rotate(-8deg); }
.shot-hero.flip .copy { left: auto; right: 48px; align-items: flex-end; text-align: right; }
.shot-hero.flip .lede { text-align: right; }
.shot-hero.flip .veil { left: auto; right: 0; }

/* BILLBOARD — type is the graphic, phone supports */
.shot-billboard .veil {
  top: 0; bottom: auto; height: 48%;
  background: linear-gradient(180deg, #050505 0%, rgba(5,5,5,0.72) 58%, rgba(5,5,5,0) 100%);
}
.shot-billboard .copy { top: 48px; bottom: auto; gap: 16px; max-width: 640px; }
.shot-billboard .copy h1 { font-size: 96px; max-width: 9ch; }
.shot-billboard .lede { font-size: 26px; max-width: 16ch; }
.shot-billboard .device { width: 540px; left: auto; right: -90px; top: 300px; transform: rotate(-9deg); }

/* STEPS — editorial ladder + phone */
.shot-steps .veil { display: none; }
.shot-steps .copy { top: 48px; bottom: auto; }
.shot-steps .ladder { right: 38%; gap: 36px; }
.shot-steps .ladder h2 { font-size: 72px; }
.shot-steps .device { width: 480px; left: auto; right: -110px; top: 120px; transform: rotate(11deg); }

/* MENU — giant coverage names + phone */
.shot-menu .veil { display: none; }
.shot-menu .copy {
  top: 48px; bottom: 44px; right: auto;
  height: auto; justify-content: space-between;
}
.shot-menu .copy .lede { max-width: 16ch; }
.shot-menu .note { display: none; }
.shot-menu .menu-list li { font-size: 70px; }
.shot-menu .device { width: 500px; left: auto; right: -120px; top: 70px; transform: rotate(-8deg); }

/* Stories */
.story .copy { left: 56px; right: 56px; }
.story .lock { font-size: 15px; }
.story .lock img { width: 28px; height: 28px; }
.story.shot-hero .device { width: 780px; left: 16%; top: -20px; }
.story.shot-hero .copy { bottom: 80px; }
.story.shot-hero .copy h1 { font-size: 96px; }
.story.shot-hero .lede { font-size: 30px; }
.story.shot-hero .veil { height: 38%; }
.story.shot-hero.flip .device { left: auto; right: 16%; transform: rotate(-8deg); }
.story.shot-billboard .copy { top: 96px; }
.story.shot-billboard .copy h1 { font-size: 110px; }
.story.shot-billboard .lede { font-size: 32px; }
.story.shot-billboard .device { width: 620px; right: -90px; top: 720px; }
.story.shot-steps .copy { top: 88px; }
.story.shot-steps .ladder { top: 220px; left: 56px; right: 8%; gap: 48px; }
.story.shot-steps .ladder h2 { font-size: 92px; }
.story.shot-steps .ladder p { font-size: 26px; }
.story.shot-steps .ladder .n { font-size: 24px; padding-top: 22px; }
.story.shot-steps .device { width: 520px; right: -110px; top: 620px; }

/* Landscape */
.wide .copy { left: 48px; }
.wide.shot-hero .veil {
  height: 100%; width: 58%; right: auto;
  background: linear-gradient(90deg, #050505 0%, rgba(5,5,5,0.78) 52%, rgba(5,5,5,0) 100%);
}
.wide.shot-hero .copy { top: 50%; bottom: auto; transform: translateY(-50%); max-width: 46%; }
.wide.shot-hero .copy h1 { font-size: 64px; }
.wide.shot-hero .lede { font-size: 22px; }
.wide.shot-hero .device { width: 460px; left: auto; right: -90px; top: -90px; transform: rotate(8deg); }
.wide.shot-hero.flip .copy { left: auto; right: 48px; align-items: flex-end; text-align: right; }
.wide.shot-hero.flip .lede { text-align: right; }
.wide.shot-hero.flip .veil {
  left: auto; right: 0;
  background: linear-gradient(270deg, #050505 0%, rgba(5,5,5,0.78) 52%, rgba(5,5,5,0) 100%);
}
.wide.shot-hero.flip .device { right: auto; left: -90px; transform: rotate(-8deg); }
.wide.shot-billboard .veil {
  height: 100%; width: 52%; right: auto;
  background: linear-gradient(90deg, #050505 0%, rgba(5,5,5,0.7) 60%, rgba(5,5,5,0) 100%);
}
.wide.shot-billboard .copy { top: 50%; bottom: auto; transform: translateY(-50%); }
.wide.shot-billboard .copy h1 { font-size: 58px; }
.wide.shot-billboard .lede { font-size: 20px; }
.wide.shot-billboard .device { width: 420px; right: -80px; top: -70px; transform: rotate(-7deg); }
.wide.shot-steps .copy { top: 36px; }
.wide.shot-steps .ladder { top: 110px; left: 48px; right: 46%; gap: 18px; }
.wide.shot-steps .ladder h2 { font-size: 48px; }
.wide.shot-steps .ladder p { font-size: 16px; margin-top: 2px; }
.wide.shot-steps .ladder .n { font-size: 16px; padding-top: 8px; }
.wide.shot-steps .device { width: 340px; right: -50px; top: -40px; transform: rotate(8deg); }
.wide.shot-menu .copy { top: 36px; }
.wide.shot-menu .menu-list { top: 100px; left: 48px; }
.wide.shot-menu .menu-list li { font-size: 52px; }
.wide.shot-menu .copy .lede { left: 48px; bottom: 32px; font-size: 18px; }
.wide.shot-menu .device { width: 380px; right: -70px; top: -50px; transform: rotate(-6deg); }
</style></head>
<body>
<article class="frame ${fmt} shot-${shot}${post.flip ? ' flip' : ''}">
  <div class="glow"></div>
  <div class="stage">${srcs.map((s, i) => device(s, `d${i}`)).join('')}</div>
  <div class="veil"></div>
  ${extra}
  <div class="copy">${copyInner}</div>
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

function phoneAd(file, dims, { line1, line2, lede, screen, flip }) {
  return {
    file,
    kind: 'graphic',
    layout: 'devices',
    shot: 'hero',
    ...dims,
    line1,
    line2,
    ledeHtml: lede,
    phones: [screen],
    flip: Boolean(flip),
  };
}

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
    layout: 'punch-photo',
    ...SQ,
    photo: 'source-event-night-square.png',
    objectPosition: 'center 18%',
    line1: 'NEED A GUARD',
    line2: 'TONIGHT?',
    lede: 'See who’s nearby. You pick.',
  },
  {
    file: 'instagram/ig-marketplace.png',
    kind: 'graphic',
    layout: 'devices',
    shot: 'hero',
    ...SQ,
    line1: 'YOU PICK',
    line2: 'WHO WORKS.',
    ledeHtml: 'Licensed. On the map. Your call.',
    phones: ['screen-map.png'],
  },
  {
    file: 'instagram/ig-how-it-works.png',
    kind: 'graphic',
    layout: 'punch-photo',
    ...SQ,
    photo: 'source-guard-portrait-square.png',
    objectPosition: 'center 18%',
    line1: 'OPEN SHIFTS.',
    line2: 'YOUR CALL.',
    lede: 'Apply to what fits. No dispatcher.',
  },
  {
    file: 'instagram/ig-coverage-types.png',
    kind: 'graphic',
    layout: 'punch-type',
    ...SQ,
    line1: 'ANYTIME.',
    line2: 'ANYWHERE.',
    lede: 'Security, when you need it.',
  },
  phoneAd('instagram/ig-tonight-map.png', SQ, {
    line1: 'NEED A GUARD',
    line2: 'TONIGHT?',
    lede: 'See who’s nearby. You pick.',
    screen: 'screen-map.png',
  }),
  phoneAd('instagram/ig-see-nearby.png', SQ, {
    line1: 'SEE WHO’S',
    line2: 'NEARBY.',
    lede: '2 live. You choose.',
    screen: 'screen-map.png',
    flip: true,
  }),
  phoneAd('instagram/ig-no-dispatcher.png', SQ, {
    line1: 'NO',
    line2: 'DISPATCHER.',
    lede: 'You approve who works.',
    screen: 'screen-map.png',
  }),
  phoneAd('instagram/ig-post-pick.png', SQ, {
    line1: 'POST A JOB.',
    line2: 'PICK A GUARD.',
    lede: 'Tonight. Your site.',
    screen: 'screen-post.png',
    flip: true,
  }),
  phoneAd('instagram/ig-your-site.png', SQ, {
    line1: 'TONIGHT.',
    line2: 'YOUR SITE.',
    lede: 'Post coverage in the app.',
    screen: 'screen-post.png',
  }),
  phoneAd('instagram/ig-open-call.png', SQ, {
    line1: 'OPEN SHIFTS.',
    line2: 'YOUR CALL.',
    lede: 'Apply to what fits.',
    screen: 'screen-shifts.png',
    flip: true,
  }),
  phoneAd('instagram/ig-apply.png', SQ, {
    line1: 'APPLY TO',
    line2: 'WHAT FITS.',
    lede: 'No dispatcher. Your map.',
    screen: 'screen-shifts.png',
  }),
  phoneAd('instagram/ig-two-live.png', SQ, {
    line1: '2 LIVE',
    line2: 'NEAR YOU.',
    lede: 'Licensed. On the map.',
    screen: 'screen-map.png',
    flip: true,
  }),
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
    layout: 'punch-photo',
    ...ST,
    photo: 'source-event-story.png',
    objectPosition: 'center 15%',
    line1: 'NEED A GUARD',
    line2: 'TONIGHT?',
    lede: 'See who’s nearby. You pick.',
  },
  {
    file: 'stories/story-tagline.png',
    kind: 'graphic',
    layout: 'punch-type',
    ...ST,
    line1: 'ANYTIME.',
    line2: 'ANYWHERE.',
    lede: 'Security, when you need it.',
  },
  {
    file: 'stories/story-how-it-works.png',
    kind: 'graphic',
    layout: 'devices',
    shot: 'hero',
    ...ST,
    line1: 'YOU PICK',
    line2: 'WHO WORKS.',
    ledeHtml: 'Licensed. On the map. Your call.',
    phones: ['screen-map.png'],
  },
  phoneAd('stories/story-tonight-map.png', ST, {
    line1: 'NEED A GUARD',
    line2: 'TONIGHT?',
    lede: 'See who’s nearby. You pick.',
    screen: 'screen-map.png',
  }),
  phoneAd('stories/story-no-dispatcher.png', ST, {
    line1: 'NO',
    line2: 'DISPATCHER.',
    lede: 'You approve who works.',
    screen: 'screen-map.png',
    flip: true,
  }),
  phoneAd('stories/story-post-pick.png', ST, {
    line1: 'POST A JOB.',
    line2: 'PICK A GUARD.',
    lede: 'Tonight. Your site.',
    screen: 'screen-post.png',
  }),
  phoneAd('stories/story-open-call.png', ST, {
    line1: 'OPEN SHIFTS.',
    line2: 'YOUR CALL.',
    lede: 'Apply to what fits.',
    screen: 'screen-shifts.png',
    flip: true,
  }),
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
    layout: 'punch-photo',
    ...WD,
    photo: 'source-event-wide.png',
    objectPosition: 'center 40%',
    line1: 'NEED A GUARD',
    line2: 'TONIGHT?',
    lede: 'See who’s nearby. You pick.',
  },
  {
    file: 'landscape/wide-marketplace.png',
    kind: 'graphic',
    layout: 'devices',
    shot: 'hero',
    ...WD,
    line1: 'YOU PICK',
    line2: 'WHO WORKS.',
    ledeHtml: 'Licensed. On the map. Your call.',
    phones: ['screen-map.png'],
  },
  {
    file: 'landscape/wide-guards.png',
    kind: 'graphic',
    layout: 'punch-type',
    ...WD,
    line1: 'ANYTIME.',
    line2: 'ANYWHERE.',
    lede: 'Security, when you need it.',
  },
  phoneAd('landscape/wide-tonight-map.png', WD, {
    line1: 'NEED A GUARD',
    line2: 'TONIGHT?',
    lede: 'See who’s nearby. You pick.',
    screen: 'screen-map.png',
  }),
  phoneAd('landscape/wide-no-dispatcher.png', WD, {
    line1: 'NO',
    line2: 'DISPATCHER.',
    lede: 'You approve who works.',
    screen: 'screen-map.png',
    flip: true,
  }),
  phoneAd('landscape/wide-post-pick.png', WD, {
    line1: 'POST A JOB.',
    line2: 'PICK A GUARD.',
    lede: 'Tonight. Your site.',
    screen: 'screen-post.png',
  }),
  phoneAd('landscape/wide-open-call.png', WD, {
    line1: 'OPEN SHIFTS.',
    line2: 'YOUR CALL.',
    lede: 'Apply to what fits.',
    screen: 'screen-shifts.png',
    flip: true,
  }),
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
