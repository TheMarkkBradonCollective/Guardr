/**
 * Render Guardr promo banners — unified layout (matches banner-clients).
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

/** Single layout shell — every banner uses the same chrome as banner-clients. */
const SHARED_CSS = `
  :root {
    --brand: #000000;
    --ink: #000000;
    --paper: #ffffff;
    --grey: #7a7a7a;
    --grey-dark: #4a4a4a;
    --muted: #b8b8b8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: var(--ink);
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
    position: absolute;
    top: 0;
    left: 0;
    width: 82px;
    height: 82px;
    background: linear-gradient(135deg, var(--grey) 0%, var(--grey) 50%, transparent 50%);
    z-index: 4;
  }
  .corner-tl img {
    position: absolute;
    top: 12px;
    left: 12px;
    width: 26px;
    height: 26px;
    filter: brightness(0);
  }
  .corner-br {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 58%;
    height: 72%;
    background: linear-gradient(155deg, transparent 42%, var(--grey-dark) 42%, var(--grey) 100%);
    z-index: 1;
  }
  .divider {
    position: absolute;
    top: -10%;
    left: 54%;
    width: 5.5%;
    height: 120%;
    background: var(--brand);
    transform: rotate(17deg);
    z-index: 3;
  }
  .left {
    position: relative;
    z-index: 2;
    width: 56%;
    height: 100%;
    padding: 48px 36px 36px 56px;
    display: flex;
    flex-direction: column;
  }
  .right {
    position: absolute;
    top: 0;
    right: 0;
    width: 44%;
    height: 100%;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .logo-large {
    width: 156px;
    height: 156px;
    margin-bottom: 14px;
    filter: brightness(0);
  }
  .brand-name {
    font-size: 58px;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1;
    color: var(--ink);
  }
  .eyebrow {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 14px;
  }
  .headline {
    line-height: 0.95;
    margin-bottom: 18px;
  }
  .headline-primary {
    display: block;
    font-size: 64px;
    font-weight: 900;
    letter-spacing: 0.02em;
  }
  .headline-secondary {
    display: block;
    margin-top: 4px;
    font-size: 52px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .subhead {
    max-width: 480px;
    margin-bottom: 20px;
    font-size: 20px;
    line-height: 1.45;
    font-weight: 500;
    color: #e8e8e8;
  }
  .services-intro {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .services {
    list-style: none;
    display: grid;
    gap: 8px;
    margin-bottom: 0;
  }
  .services li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 19px;
    font-weight: 600;
  }
  .services li::before {
    content: '';
    width: 7px;
    height: 7px;
    background: var(--paper);
    flex-shrink: 0;
  }
  .website {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .website-icon {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    background: var(--paper);
    color: var(--ink);
    font-size: 11px;
    font-weight: 800;
    flex-shrink: 0;
  }
`;

const CHROME_SHELL = `
  <div class="corner-tl" aria-hidden="true"><img src="${LOGO64}" alt="" /></div>
  <div class="corner-br" aria-hidden="true"></div>
  <div class="divider" aria-hidden="true"></div>
`;

const RIGHT_PANEL = `
  <div class="right">
    <img class="logo-large" src="${LOGO256}" alt="" />
    <div class="brand-name">Guardr</div>
  </div>
`;

const WEBSITE = `
  <div class="website">
    <span class="website-icon" aria-hidden="true">W</span>
    <span>www.guardr.co</span>
  </div>
`;

const WEBSITE_CA = `
  <div class="website">
    <span class="website-icon" aria-hidden="true">W</span>
    <span>www.guardr.co · California</span>
  </div>
`;

function servicesBlock(intro, items) {
  const lis = items.map((t) => `<li>${t}</li>`).join('');
  return `<p class="services-intro">${intro}</p><ul class="services">${lis}</ul>`;
}

function page(leftInner) {
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
<article class="banner">
  ${CHROME_SHELL}
  <div class="left">${leftInner}</div>
  ${RIGHT_PANEL}
</article>
</body>
</html>`;
}

const BANNERS = [
  {
    file: 'banner-brand-og.png',
    html: page(`
      <p class="eyebrow">Guardr</p>
      <h1 class="headline">
        <span class="headline-primary">SECURITY</span>
        <span class="headline-secondary">MARKETPLACE</span>
      </h1>
      <p class="subhead">Clients post jobs. Licensed guards choose assignments. Maps, messaging, and payments — all in one place.</p>
      ${servicesBlock('Post coverage for:', ['Event security', 'Executive protection', 'Nightlife &amp; venues'])}
      ${WEBSITE}
    `),
  },
  {
    file: 'banner-clients.png',
    html: page(`
      <p class="eyebrow">I need security</p>
      <h1 class="headline">
        <span class="headline-primary">POST A JOB.</span>
        <span class="headline-secondary">PICK YOUR GUARD.</span>
      </h1>
      <p class="subhead">Licensed California guards apply on the map. You approve who works your site — then pay and track the shift in the app.</p>
      ${servicesBlock('Post coverage for:', ['Event security', 'Executive protection', 'Nightlife &amp; venues'])}
      ${WEBSITE}
    `),
  },
  {
    file: 'banner-guards.png',
    html: page(`
      <p class="eyebrow">I'm a guard</p>
      <h1 class="headline">
        <span class="headline-primary">OPEN SHIFTS</span>
        <span class="headline-secondary">ON THE MAP.</span>
      </h1>
      <p class="subhead">Licensed CA guards browse jobs, apply to what fits, and get paid through the platform. You choose the shift — no forced dispatch.</p>
      ${servicesBlock('How it works:', ['Browse open jobs near you', 'Apply to shifts you want', 'Get paid through the app'])}
      ${WEBSITE}
    `),
  },
  {
    file: 'banner-nextdoor.png',
    html: page(`
      <p class="eyebrow">For local businesses</p>
      <h1 class="headline">
        <span class="headline-primary">LICENSED</span>
        <span class="headline-secondary">SECURITY, NEARBY.</span>
      </h1>
      <p class="subhead">Post coverage for your shop, venue, site, or private event. Verified guards apply — you pick who works your property.</p>
      ${servicesBlock('Good for:', ['Shops &amp; retail', 'Venues &amp; events', 'Job sites &amp; offices'])}
      ${WEBSITE_CA}
    `),
  },
];

async function waitForFile(filePath, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(filePath, fsConstants.R_OK);
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
      '--virtual-time-budget=5000',
      '--run-all-compositor-stages-before-draw',
      pathToFileURL(htmlPath).href,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  try {
    await Promise.race([
      waitForFile(shotPath),
      new Promise((_, reject) => child.on('error', reject)),
    ]);
  } finally {
    if (!child.killed) child.kill('SIGKILL');
  }

  await copyFile(shotPath, outPng);
  const { statSync } = await import('node:fs');
  console.log('wrote', path.basename(outPng), `(${statSync(outPng).size} bytes)`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
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
