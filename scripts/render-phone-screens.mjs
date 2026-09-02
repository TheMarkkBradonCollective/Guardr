import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile, copyFile, rm, access } from 'node:fs/promises';
import { constants as fsConstants, statSync } from 'node:fs';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS = path.join(ROOT, 'assets/marketing/fonts');
const LOGO = pathToFileURL(path.join(ROOT, 'assets/marketing/posts/source/logo-shield.png')).href;
const OUT = path.join(ROOT, 'assets/marketing/posts/source/screens');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const fileUrl = (p) => pathToFileURL(p).href;

const css = `
@font-face { font-family: Inter; font-weight: 500; src: url('${fileUrl(path.join(FONTS, 'Inter-500.woff2'))}') format('woff2'); }
@font-face { font-family: Inter; font-weight: 600; src: url('${fileUrl(path.join(FONTS, 'Inter-600.woff2'))}') format('woff2'); }
@font-face { font-family: Inter; font-weight: 700; src: url('${fileUrl(path.join(FONTS, 'Inter-700.woff2'))}') format('woff2'); }
@font-face { font-family: Inter; font-weight: 800; src: url('${fileUrl(path.join(FONTS, 'Inter-800.woff2'))}') format('woff2'); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 390px; height: 844px; overflow: hidden; font-family: Inter, system-ui, sans-serif; background: #fff; color: #000; -webkit-font-smoothing: antialiased; }
.app { width: 390px; height: 844px; display: flex; flex-direction: column; background: #fff; }
.status { height: 48px; display: flex; align-items: flex-end; justify-content: space-between; padding: 0 22px 8px; font-size: 13px; font-weight: 700; }
.top { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #eee; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; letter-spacing: -0.03em; }
.brand img { width: 22px; height: 22px; filter: invert(1); object-fit: contain; }
.live { background: #048848; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 9px; border-radius: 999px; }
.map { flex: 1; position: relative; background: linear-gradient(160deg, #f4f4f4, #e6e6e6 45%, #cfcfcf); overflow: hidden; }
.road-h { position: absolute; left: 0; right: 0; height: 1px; background: rgba(0,0,0,0.09); }
.road-v { position: absolute; top: 0; bottom: 40%; width: 1px; background: rgba(0,0,0,0.08); }
.pin { position: absolute; width: 38px; height: 38px; border-radius: 50%; background: #000; color: #fff; display: grid; place-items: center; font-size: 10px; font-weight: 800; box-shadow: 0 6px 16px rgba(0,0,0,0.28); }
.sheet { position: absolute; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 18px 18px 0 0; box-shadow: 0 -10px 32px rgba(0,0,0,0.12); padding-bottom: 6px; }
.handle { width: 36px; height: 4px; background: #e6e6e6; border-radius: 99px; margin: 12px auto 12px; }
.sheet h2 { font-size: 17px; font-weight: 800; padding: 0 16px 10px; border-bottom: 1px solid #eee; letter-spacing: -0.02em; }
.row { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-bottom: 1px solid #f0f0f0; }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: #f3f3f3; display: grid; place-items: center; font-weight: 800; font-size: 13px; flex-shrink: 0; }
.who { flex: 1; min-width: 0; }
.who strong { display: block; font-size: 14px; }
.who span { font-size: 12px; color: #666; font-weight: 600; }
.rate { font-weight: 800; font-size: 14px; }
.tabs { height: 68px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border-top: 1px solid #eee; background: #fff; }
.tab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; font-size: 11px; font-weight: 700; color: #8a8a8a; }
.tab.on { color: #000; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.page { flex: 1; overflow: hidden; padding: 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 10px; }
.card { background: #fff; border-radius: 12px; padding: 14px 16px; }
.card label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 4px; }
.card .val { font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
.cta { margin-top: auto; background: #000; color: #fff; text-align: center; padding: 16px; border-radius: 8px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; font-size: 14px; }
.job { background: #fff; border-radius: 12px; padding: 14px 16px; }
.job h3 { font-size: 15px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.02em; }
.job p { font-size: 13px; color: #555; font-weight: 500; }
.job .meta { margin-top: 8px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; }
.title { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; padding: 2px 0 6px; }
.apply { background: #000; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; padding: 7px 10px; border-radius: 4px; }
`;

const chrome = (inner, onTab) => `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${css}</style></head><body>
<div class="app">
  <div class="status"><span>9:41</span><span>5G  ██</span></div>
  <div class="top"><div class="brand"><img src="${LOGO}" alt=""/>Guardr</div>${inner.badge || '<span style="font-size:12px;font-weight:700;color:#666">California</span>'}</div>
  ${inner.body}
  <div class="tabs">
    <div class="tab ${onTab === 'map' ? 'on' : ''}"><span class="dot"></span>Map</div>
    <div class="tab ${onTab === 'jobs' ? 'on' : ''}"><span class="dot"></span>Jobs</div>
    <div class="tab ${onTab === 'chat' ? 'on' : ''}"><span class="dot"></span>Chat</div>
    <div class="tab ${onTab === 'you' ? 'on' : ''}"><span class="dot"></span>You</div>
  </div>
</div></body></html>`;

const SCREENS = [
  {
    file: 'screen-map.png',
    html: chrome({
      badge: '<span class="live">2 live</span>',
      body: `<div class="map">
        <div class="road-h" style="top:20%"></div><div class="road-h" style="top:38%"></div>
        <div class="road-h" style="top:56%"></div><div class="road-h" style="top:72%"></div>
        <div class="road-v" style="left:25%"></div><div class="road-v" style="left:50%"></div><div class="road-v" style="left:75%"></div>
        <div class="pin" style="top:26%;left:40%">G</div>
        <div class="pin" style="top:44%;left:62%;width:28px;height:28px;font-size:9px">G</div>
        <div class="sheet">
          <div class="handle"></div>
          <h2>Available guards</h2>
          <div class="row"><div class="avatar">MT</div><div class="who"><strong>Marcus T.</strong><span>4.9 · Armed · 0.8 mi</span></div><div class="rate">$28/hr</div></div>
          <div class="row"><div class="avatar">JR</div><div class="who"><strong>Janelle R.</strong><span>5.0 · Unarmed · 1.2 mi</span></div><div class="rate">$24/hr</div></div>
        </div>
      </div>`,
    }, 'map'),
  },
  {
    file: 'screen-post.png',
    html: chrome({
      body: `<div class="page">
        <div class="title">Post coverage</div>
        <div class="card"><label>Site</label><div class="val">Grand Ave · Downtown LA</div></div>
        <div class="card"><label>When</label><div class="val">Tonight · 8:00pm – 2:00am</div></div>
        <div class="card"><label>Type</label><div class="val">Event security</div></div>
        <div class="card"><label>Rate</label><div class="val">$35 / hr · 6 hours</div></div>
        <div class="card"><label>Required</label><div class="val">Guard card · COI · 32-hr block</div></div>
        <div class="cta">Post this job</div>
      </div>`,
    }, 'jobs'),
  },
  {
    file: 'screen-shifts.png',
    html: chrome({
      body: `<div class="page">
        <div class="title">Open shifts near you</div>
        <div class="job"><h3>Nightclub door</h3><p>DTLA · All black · 8pm–2am</p><div class="meta"><span>$32/hr</span><span class="apply">Apply</span></div></div>
        <div class="job"><h3>Retail close</h3><p>West Hollywood · 2.4 mi</p><div class="meta"><span>$26/hr</span><span class="apply">Apply</span></div></div>
        <div class="job"><h3>Site patrol</h3><p>Arts District · Construction</p><div class="meta"><span>$28/hr</span><span class="apply">Apply</span></div></div>
        <div class="job"><h3>Campus lobby</h3><p>Pasadena · Unarmed</p><div class="meta"><span>$25/hr</span><span class="apply">Apply</span></div></div>
      </div>`,
    }, 'jobs'),
  },
];

async function waitForFile(filePath, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(filePath, fsConstants.R_OK);
      if (statSync(filePath).size > 8000) {
        await new Promise((r) => setTimeout(r, 250));
        return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error(`timeout ${filePath}`);
}

async function shot(html, outPng, i) {
  const tmp = path.join(os.tmpdir(), 'guardr-phone-ui');
  await mkdir(tmp, { recursive: true });
  const htmlPath = path.join(tmp, `ui-${i}.html`);
  const profile = path.join(tmp, `p-${i}`);
  const shotPath = path.join(tmp, `s-${i}.png`);
  await writeFile(htmlPath, html);
  await rm(shotPath, { force: true });
  await rm(profile, { recursive: true, force: true });
  await mkdir(profile, { recursive: true });
  const child = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--hide-scrollbars', '--no-first-run', '--force-device-scale-factor=2',
    `--user-data-dir=${profile}`, '--window-size=390,844', `--screenshot=${shotPath}`,
    '--virtual-time-budget=2500', '--run-all-compositor-stages-before-draw',
    pathToFileURL(htmlPath).href,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  try {
    await Promise.race([
      waitForFile(shotPath),
      new Promise((_, rej) => child.on('error', rej)),
    ]);
  } finally {
    if (!child.killed) child.kill('SIGKILL');
  }
  await mkdir(path.dirname(outPng), { recursive: true });
  await copyFile(shotPath, outPng);
  console.log('screen', path.basename(outPng), statSync(outPng).size);
}

for (let i = 0; i < SCREENS.length; i += 1) {
  await shot(SCREENS[i].html, path.join(OUT, SCREENS[i].file), i);
}
await copyFile('/tmp/guardr-shots/home-mobile.png', path.join(OUT, 'screen-home.png'));
console.log('copied home');
