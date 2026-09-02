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

function graphicCss(w, h) {
  return `
${RESET}
html, body, .frame { width: ${w}px; height: ${h}px; }
.frame {
  position: relative;
  overflow: hidden;
  background: var(--ink);
}
.corner {
  position: absolute;
  top: 0; left: 0;
  width: 88px; height: 88px;
  background: linear-gradient(135deg, var(--grey) 0%, var(--grey) 50%, transparent 50%);
  z-index: 4;
}
.corner img {
  position: absolute;
  top: 12px; left: 12px;
  width: 32px; height: 32px;
  object-fit: contain;
}
.left {
  position: relative;
  z-index: 2;
  width: 62%;
  height: 100%;
  padding: 72px 28px 48px 64px;
  display: flex;
  flex-direction: column;
}
.eyebrow {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 18px;
}
.headline { line-height: 0.92; margin-bottom: 22px; }
.line1 { display: block; font-size: 62px; font-weight: 900; }
.line2 { display: block; margin-top: 4px; font-size: 48px; font-weight: 800; color: #cfcfcf; }
.sub {
  max-width: 520px;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.4;
  color: #e8e8e8;
  margin-bottom: 28px;
}
.cta {
  display: inline-flex;
  background: #fff;
  color: #000;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 14px 28px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 18px;
}
.tag {
  font-size: 16px;
  font-weight: 500;
  color: var(--muted);
  max-width: 460px;
  line-height: 1.4;
  margin-bottom: 0;
}
.site {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--muted);
}
.dot { width: 10px; height: 10px; background: #fff; flex-shrink: 0; }
.mark {
  position: absolute;
  right: 72px;
  top: 50%;
  transform: translateY(-50%);
  width: 300px; height: 300px;
  border: 3px solid var(--grey);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.mark::before {
  content: '';
  position: absolute;
  inset: 28px;
  border: 2px solid var(--grey-dark);
  border-radius: 50%;
}
.mark img { width: 128px; height: 128px; position: relative; z-index: 1; object-fit: contain; }
.pin {
  position: absolute;
  width: 14px; height: 14px;
  background: #fff;
  border-radius: 50%;
  z-index: 2;
}
.pin.a { top: 54px; left: 128px; }
.pin.b { bottom: 72px; right: 64px; }
.pin.c { top: 150px; right: 48px; }
.steps { list-style: none; display: grid; gap: 16px; margin: 8px 0 28px; }
.steps li {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 22px;
  font-weight: 700;
}
.num {
  width: 36px; height: 36px;
  border: 2px solid #fff;
  display: grid; place-items: center;
  font-size: 16px;
  font-weight: 800;
  flex-shrink: 0;
}
.services { list-style: none; display: grid; gap: 10px; margin: 4px 0 28px; }
.services li {
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}
.services li::before {
  content: '';
  width: 8px; height: 8px;
  background: #fff;
  flex-shrink: 0;
}
`;
}

function graphicHtml(post) {
  const { w, h } = post;
  const extra = post.list
    ? post.listType === 'steps'
      ? `<ol class="steps">${post.list
          .map((item, i) => `<li><span class="num">${i + 1}</span><span>${esc(item)}</span></li>`)
          .join('')}</ol>`
      : `<ul class="services">${post.list.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
    : `<p class="sub">${esc(post.sub)}</p>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<style>${graphicCss(w, h)}${post.extraCss || ''}</style></head>
<body>
<article class="frame">
  <div class="corner"><img src="${logoBlackUrl}" alt="" /></div>
  <div class="left">
    <p class="eyebrow">${esc(post.eyebrow)}</p>
    <h1 class="headline">
      <span class="line1">${esc(post.line1)}</span>
      <span class="line2">${esc(post.line2)}</span>
    </h1>
    ${extra}
    <div class="cta">${esc(post.cta)}</div>
    <p class="tag">${esc(post.tag || TAGLINE)}</p>
    <div class="site"><span class="dot"></span><span>${esc(post.site || SITE)}</span></div>
  </div>
  <div class="mark" aria-hidden="true">
    <span class="pin a"></span><span class="pin b"></span><span class="pin c"></span>
    <img src="${logoUrl}" alt="" />
  </div>
</article>
</body></html>`;
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
    file: 'instagram/ig-marketplace.png',
    kind: 'graphic',
    ...SQ,
    extraCss: `
      .left { width: 58%; padding: 96px 24px 56px 64px; }
      .line1 { font-size: 58px; }
      .line2 { font-size: 46px; }
      .mark { right: 56px; width: 280px; height: 280px; }
    `,
    eyebrow: 'Guardr',
    line1: 'SECURITY',
    line2: 'MARKETPLACE',
    sub: 'Clients post jobs. Licensed guards choose assignments. Maps, messaging, and payments — one platform.',
    cta: 'Book now',
  },
  {
    file: 'instagram/ig-how-it-works.png',
    kind: 'graphic',
    ...SQ,
    extraCss: `
      .left { width: 70%; padding: 88px 24px 48px 64px; }
      .line1 { font-size: 52px; }
      .line2 { font-size: 40px; }
      .mark { right: 36px; width: 240px; height: 240px; }
      .mark img { width: 108px; height: 108px; }
    `,
    eyebrow: 'How it works',
    line1: 'POST.',
    line2: 'PICK. PAY.',
    listType: 'steps',
    list: ['Post the coverage you need', 'Review licensed applicants', 'Pay and track in the app'],
    cta: 'Get started',
  },
  {
    file: 'instagram/ig-coverage-types.png',
    kind: 'graphic',
    ...SQ,
    extraCss: `
      .left { width: 68%; padding: 72px 20px 40px 64px; }
      .line1 { font-size: 44px; }
      .line2 { font-size: 36px; }
      .services { gap: 8px; }
      .services li { font-size: 22px; }
      .mark { right: 40px; width: 240px; height: 240px; }
      .mark img { width: 108px; height: 108px; }
    `,
    eyebrow: 'California',
    line1: 'COVERAGE',
    line2: 'YOU CAN POST',
    listType: 'bullets',
    list: [
      'Event security',
      'Construction sites',
      'Retail protection',
      'Nightlife & venues',
      'Corporate campuses',
      'Executive protection',
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
    file: 'stories/story-tagline.png',
    kind: 'story',
    ...ST,
    extraCss: `
      .dim { background: #000; }
      .copy { bottom: 120px; }
      .line1 { font-size: 70px; }
      .line2 { font-size: 56px; }
    `,
    eyebrow: 'Guardr',
    line1: 'ANYTIME.',
    line2: 'ANYWHERE.',
    sub: 'Security, when you need it. Map-first marketplace for licensed California guards.',
    cta: 'Book now',
  },
  {
    file: 'stories/story-how-it-works.png',
    kind: 'story',
    ...ST,
    extraCss: `
      .dim { background: #000; }
      .line1 { font-size: 64px; }
      .line2 { font-size: 52px; }
      .sub { white-space: pre-line; }
    `,
    eyebrow: 'How it works',
    line1: 'POST. PICK.',
    line2: 'PAY & TRACK.',
    sub: '1. Post the coverage you need\n2. Review licensed applicants\n3. Pay and track in the app',
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
    file: 'landscape/wide-marketplace.png',
    kind: 'graphic',
    ...WD,
    extraCss: `
      .left { padding: 48px 24px 32px 56px; }
      .line1 { font-size: 48px; }
      .line2 { font-size: 38px; }
      .sub { font-size: 18px; margin-bottom: 18px; }
      .cta { font-size: 14px; padding: 12px 22px; margin-bottom: 12px; }
      .tag { font-size: 14px; }
      .mark { right: 56px; width: 240px; height: 240px; }
      .mark img { width: 108px; height: 108px; }
      .eyebrow { margin-bottom: 12px; }
    `,
    eyebrow: 'Guardr',
    line1: 'SECURITY',
    line2: 'MARKETPLACE',
    sub: 'Clients post jobs. Licensed guards choose assignments. Maps, messaging, and payments — all in one place.',
    cta: 'Book now',
  },
  {
    file: 'landscape/wide-guards.png',
    kind: 'graphic',
    ...WD,
    extraCss: `
      .left { padding: 48px 24px 32px 56px; }
      .line1 { font-size: 44px; }
      .line2 { font-size: 36px; }
      .sub { font-size: 18px; margin-bottom: 18px; }
      .cta { font-size: 14px; padding: 12px 22px; margin-bottom: 12px; }
      .tag { font-size: 14px; }
      .mark { right: 56px; width: 240px; height: 240px; }
      .mark img { width: 108px; height: 108px; }
      .eyebrow { margin-bottom: 12px; }
    `,
    eyebrow: "I'm a guard",
    line1: 'OPEN SHIFTS',
    line2: 'ON THE MAP.',
    sub: 'Licensed CA guards browse jobs, apply to what fits, and get paid through the platform. You choose the shift.',
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
  for (let i = 0; i < POSTS.length; i += 1) {
    const post = POSTS[i];
    await screenshot(htmlFor(post), path.join(OUT, post.file), post.w, post.h, i);
  }
  console.log('done — posts in', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
