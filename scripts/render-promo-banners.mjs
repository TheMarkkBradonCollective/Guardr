/**
 * Render Guardr promo banners with Chrome headless (no npm deps).
 * Usage: node scripts/render-promo-banners.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile, copyFile, rm, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/marketing/banners');
const LOGO64 = pathToFileURL(path.join(ROOT, 'public/logo-64.png')).href;
const LOGO256 = pathToFileURL(path.join(ROOT, 'public/logo-256.png')).href;
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';

const SHARED_CSS = `
  :root {
    --ink: #000000;
    --paper: #ffffff;
    --grey: #7a7a7a;
    --grey-dark: #3a3a3a;
    --muted: #b8b8b8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #000;
    font-family: Inter, system-ui, -apple-system, sans-serif;
  }
  .banner {
    position: relative;
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: var(--ink);
    color: var(--paper);
  }
  .corner-tl {
    position: absolute; top: 0; left: 0; width: 96px; height: 96px;
    background: linear-gradient(135deg, var(--grey) 0%, var(--grey) 50%, transparent 50%);
    z-index: 4;
  }
  .corner-tl img {
    position: absolute; top: 14px; left: 14px; width: 28px; height: 28px;
    filter: brightness(0);
  }
  .corner-br {
    position: absolute; right: 0; bottom: 0; width: 52%; height: 78%;
    background: linear-gradient(155deg, transparent 40%, var(--grey-dark) 40%, var(--grey) 100%);
    z-index: 1;
  }
  .divider {
    position: absolute; top: -12%; left: 56%; width: 56px; height: 124%;
    background: var(--ink); transform: rotate(17deg); z-index: 3;
  }
  .left {
    position: relative; z-index: 2; width: 58%; height: 100%;
    padding: 64px 40px 48px 72px; display: flex; flex-direction: column;
  }
  .right {
    position: absolute; right: 0; top: 0; width: 42%; height: 100%;
    z-index: 2; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 18px;
  }
  .logo-large { width: 168px; height: 168px; filter: brightness(0); }
  .brand-name {
    font-size: 64px; font-weight: 900; letter-spacing: -0.04em;
    color: var(--ink); line-height: 1;
  }
  .eyebrow {
    font-size: 14px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 16px;
  }
  .headline { display: flex; flex-direction: column; margin-bottom: 20px; }
  .headline-primary {
    font-size: 68px; font-weight: 900; letter-spacing: -0.045em; line-height: 0.95;
  }
  .headline-secondary {
    font-size: 48px; font-weight: 800; letter-spacing: -0.03em;
    line-height: 1.05; color: var(--muted);
  }
  .subhead {
    font-size: 22px; font-weight: 500; line-height: 1.35;
    color: #e8e8e8; max-width: 520px; margin-bottom: 24px;
  }
  .services-intro {
    font-size: 15px; font-weight: 600; color: var(--muted);
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
  }
  .services { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px; }
  .services li {
    font-size: 20px; font-weight: 600; padding-left: 18px; position: relative;
  }
  .services li::before {
    content: ''; position: absolute; left: 0; top: 0.55em;
    width: 8px; height: 8px; background: var(--paper);
  }
  .cta {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--paper); color: var(--ink); font-size: 18px; font-weight: 800;
    letter-spacing: 0.02em; text-transform: uppercase; padding: 16px 32px;
    margin-bottom: 18px; width: fit-content;
  }
  .website {
    margin-top: auto; display: flex; align-items: center; gap: 10px;
    font-size: 20px; font-weight: 600; color: var(--muted);
  }
  .website-dot { width: 10px; height: 10px; background: var(--paper); }
  .tagline {
    font-size: 18px; font-weight: 500; color: var(--muted);
    margin-bottom: 16px; max-width: 480px; line-height: 1.4;
  }
  .variant-guards .corner-br, .variant-guards .divider, .variant-guards .right { display: none; }
  .variant-guards .left { width: 62%; padding-right: 40px; }
  .map-mark {
    position: absolute; right: 72px; top: 50%; transform: translateY(-50%);
    z-index: 2; width: 280px; height: 280px; border: 3px solid var(--grey);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
  }
  .map-mark::before {
    content: ''; position: absolute; inset: 28px;
    border: 2px solid var(--grey-dark); border-radius: 50%;
  }
  .map-mark img {
    width: 120px; height: 120px; filter: brightness(0) invert(1); position: relative; z-index: 1;
  }
  .pin {
    position: absolute; width: 14px; height: 14px; background: var(--paper);
    border-radius: 50%; z-index: 2;
  }
  .pin.a { top: 56px; left: 120px; }
  .pin.b { bottom: 72px; right: 64px; }
  .pin.c { top: 140px; right: 48px; }
  .accent-bar {
    position: absolute; left: 0; bottom: 0; width: 100%; height: 12px;
    background: var(--paper); z-index: 5;
  }
`;

function page(bodyInner, extraClass = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
<style>${SHARED_CSS}</style>
</head>
<body>
<article class="banner ${extraClass}">${bodyInner}</article>
</body>
</html>`;
}

const corner = `
  <div class="corner-tl" aria-hidden="true"><img src="${LOGO64}" alt="" /></div>
  <div class="corner-br" aria-hidden="true"></div>
  <div class="divider" aria-hidden="true"></div>`;

const rightPanel = `
  <div class="right">
    <img class="logo-large" src="${LOGO256}" alt="" />
    <div class="brand-name">Guardr</div>
  </div>`;

const BANNERS = [
  {
    file: 'banner-brand-og.png',
    html: page(`
      ${corner}
      <div class="left">
        <p class="eyebrow">Guardr</p>
        <h1 class="headline">
          <span class="headline-primary">SECURITY</span>
          <span class="headline-secondary">MARKETPLACE</span>
        </h1>
        <p class="subhead">Clients post jobs. Licensed guards choose assignments. Maps, messaging, and payments — all in one place.</p>
        <div class="cta">Book now</div>
        <div class="website"><span class="website-dot"></span><span>www.guardr.co</span></div>
      </div>
      ${rightPanel}
    `),
  },
  {
    file: 'banner-clients.png',
    html: page(`
      ${corner}
      <div class="left">
        <p class="eyebrow">I need security</p>
        <h1 class="headline">
          <span class="headline-primary">POST A JOB.</span>
          <span class="headline-secondary">PICK YOUR GUARD.</span>
        </h1>
        <p class="subhead">Licensed California guards apply on the map. You approve who works your site — then pay and track the shift in the app.</p>
        <p class="services-intro">Post coverage for:</p>
        <ul class="services">
          <li>Event security</li>
          <li>Executive protection</li>
          <li>Nightlife &amp; venues</li>
        </ul>
        <div class="website"><span class="website-dot"></span><span>www.guardr.co</span></div>
      </div>
      ${rightPanel}
    `),
  },
  {
    file: 'banner-guards.png',
    html: page(
      `
      <div class="corner-tl" aria-hidden="true"><img src="${LOGO64}" alt="" /></div>
      <div class="left">
        <p class="eyebrow">I'm a guard</p>
        <h1 class="headline">
          <span class="headline-primary">OPEN SHIFTS</span>
          <span class="headline-secondary">ON THE MAP.</span>
        </h1>
        <p class="subhead">Licensed CA guards browse jobs, apply to what fits, and get paid through the platform. You choose the shift — no forced dispatch.</p>
        <div class="cta">Sign up free</div>
        <p class="tagline">Anytime. Anywhere. Security, When You Need It.</p>
        <div class="website"><span class="website-dot"></span><span>www.guardr.co</span></div>
      </div>
      <div class="map-mark" aria-hidden="true">
        <span class="pin a"></span>
        <span class="pin b"></span>
        <span class="pin c"></span>
        <img src="${LOGO256}" alt="" />
      </div>
    `,
      'variant-guards',
    ),
  },
  {
    file: 'banner-nextdoor.png',
    html: page(`
      ${corner}
      <div class="accent-bar" aria-hidden="true"></div>
      <div class="left">
        <p class="eyebrow">For local businesses</p>
        <h1 class="headline">
          <span class="headline-primary">LICENSED</span>
          <span class="headline-secondary">SECURITY, NEARBY.</span>
        </h1>
        <p class="subhead">Post coverage for your shop, venue, site, or private event. Verified guards apply — you pick who works your property.</p>
        <div class="cta">Get started</div>
        <div class="website"><span class="website-dot"></span><span>www.guardr.co · California</span></div>
      </div>
      ${rightPanel}
    `),
  },
];

async function waitForFile(filePath, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(filePath, fsConstants.R_OK);
      // Give Chrome a moment to finish writing
      await new Promise((r) => setTimeout(r, 400));
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

async function screenshotHtml(html, outPng, index) {
  const tmpDir = path.join(os.tmpdir(), 'guardr-banners');
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
      '--force-device-scale-factor=2',
      `--user-data-dir=${profileDir}`,
      '--window-size=1200,630',
      `--screenshot=${shotPath}`,
      // Don't wait forever for network fonts — virtual time helps exit
      '--virtual-time-budget=5000',
      '--run-all-compositor-stages-before-draw',
      pathToFileURL(htmlPath).href,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  let stderr = '';
  child.stderr.on('data', (d) => {
    stderr += d.toString();
  });

  try {
    await Promise.race([
      waitForFile(shotPath, 25000),
      new Promise((_, reject) =>
        child.on('error', reject),
      ),
    ]);
  } finally {
    if (!child.killed) {
      child.kill('SIGKILL');
      // Also kill any leftover chrome for this profile
      try {
        spawn('pkill', ['-f', profileDir], { stdio: 'ignore' });
      } catch {
        /* ignore */
      }
    }
  }

  await copyFile(shotPath, outPng);
  const { statSync } = await import('node:fs');
  console.log('wrote', path.basename(outPng), `(${statSync(outPng).size} bytes)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  // Copy the first successful screenshot we already have if present
  for (let i = 0; i < BANNERS.length; i += 1) {
    const b = BANNERS[i];
    await screenshotHtml(b.html, path.join(OUT, b.file), i);
  }
  console.log('done — banners in', OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
