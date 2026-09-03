/**
 * High-fidelity Guardr phone UI screens for promo posts.
 * 390×844 logical, rendered at 3× so they stay sharp in oversized device frames.
 */
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
@font-face { font-family: Inter; font-weight: 900; src: url('${fileUrl(path.join(FONTS, 'Inter-900.woff2'))}') format('woff2'); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 390px; height: 844px; overflow: hidden; font-family: Inter, system-ui, sans-serif; background: #fff; color: #000; -webkit-font-smoothing: antialiased; }
.app { width: 390px; height: 844px; display: flex; flex-direction: column; background: #f2f2f2; position: relative; }
.status {
  height: 54px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 28px 10px;
  font-size: 15px;
  font-weight: 700;
  background: #fff;
  position: relative;
  z-index: 2;
}
.status .right { display: flex; align-items: center; gap: 6px; }
.ico { display: block; }
.top {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  z-index: 2;
}
.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 17px; letter-spacing: -0.04em; }
.brand img { width: 20px; height: 20px; filter: invert(1); object-fit: contain; }
.live {
  display: flex; align-items: center; gap: 6px;
  background: #048848; color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 5px 10px; border-radius: 999px;
}
.live i { width: 6px; height: 6px; border-radius: 50%; background: #fff; display: block; }
.loc { font-size: 13px; font-weight: 600; color: #6b6b6b; display: flex; align-items: center; gap: 4px; }

.map { flex: 1; position: relative; overflow: hidden; background: #d8d8d8; }
.map svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.you {
  position: absolute; top: 46%; left: 48%;
  width: 18px; height: 18px; margin: -9px 0 0 -9px;
  background: #000; border: 3px solid #fff; border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35); z-index: 3;
}
.pin {
  position: absolute; z-index: 4;
  display: flex; flex-direction: column; align-items: center;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.28));
}
.pin .head {
  width: 42px; height: 42px; border-radius: 50%;
  background: #000; color: #fff;
  display: grid; place-items: center;
  border: 2.5px solid #fff;
}
.pin .head img { width: 18px; height: 18px; display: block; object-fit: contain; }
.pin .stem {
  width: 10px; height: 10px; background: #000;
  transform: rotate(45deg) translateY(-7px);
  border-radius: 1px;
}
.pin.sm .head { width: 32px; height: 32px; }
.pulse {
  position: absolute; inset: -10px;
  border: 2px solid rgba(0,0,0,0.22);
  border-radius: 50%;
}
.street {
  position: absolute; font-size: 9px; font-weight: 700;
  letter-spacing: 0.18em; color: #8a8a8a; z-index: 2;
}

.sheet {
  position: absolute; left: 0; right: 0; bottom: 0;
  background: #fff;
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -16px 40px rgba(0,0,0,0.14);
  padding-bottom: 4px;
  z-index: 5;
}
.handle { width: 40px; height: 4px; background: #e4e4e4; border-radius: 99px; margin: 10px auto 8px; }
.sheet-h {
  display: flex; align-items: baseline; justify-content: space-between;
  padding: 0 18px 12px; border-bottom: 1px solid #eee;
}
.sheet-h h2 { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; }
.sheet-h span { font-size: 12px; font-weight: 600; color: #888; }
.row { display: flex; align-items: center; gap: 12px; padding: 12px 18px; }
.row + .row { border-top: 1px solid #f2f2f2; }
.avatar {
  width: 48px; height: 48px; border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 800; font-size: 13px; letter-spacing: -0.04em;
  flex-shrink: 0; color: #fff;
}
.a1 { background: #1a1a1a; }
.a2 { background: #3a3a3a; }
.who { flex: 1; min-width: 0; }
.who strong { display: block; font-size: 15px; font-weight: 800; letter-spacing: -0.03em; }
.meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: 12px; font-weight: 600; color: #666; }
.star { color: #000; font-size: 11px; }
.pill {
  font-size: 10px; font-weight: 800; letter-spacing: 0.04em;
  text-transform: uppercase;
  background: #f1f1f1; color: #111;
  padding: 2px 7px; border-radius: 4px;
}
.rate { font-weight: 800; font-size: 15px; letter-spacing: -0.03em; }

.tabs {
  height: 78px;
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
  border-top: 1px solid #ececec; background: #fff;
  padding-bottom: 16px;
}
.tab { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 10px; font-weight: 700; color: #9a9a9a; }
.tab.on { color: #000; }
.tab svg { display: block; }

.page { flex: 1; overflow: hidden; padding: 8px 16px 12px; display: flex; flex-direction: column; gap: 10px; }
.title { font-size: 28px; font-weight: 900; letter-spacing: -0.045em; padding: 6px 0 4px; }
.hint { font-size: 13px; font-weight: 500; color: #6a6a6a; margin-top: -6px; margin-bottom: 4px; }
.card {
  background: #fff; border-radius: 14px; padding: 13px 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04);
}
.ic {
  width: 36px; height: 36px; border-radius: 10px; background: #f3f3f3;
  display: grid; place-items: center; flex-shrink: 0; color: #111;
}
.card label { display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #8a8a8a; }
.card .val { font-size: 16px; font-weight: 700; letter-spacing: -0.03em; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.chip { font-size: 11px; font-weight: 700; background: #f1f1f1; padding: 4px 8px; border-radius: 6px; }
.cta {
  margin-top: auto; background: #000; color: #fff; text-align: center;
  padding: 17px; border-radius: 12px;
  font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; font-size: 14px;
}
.job {
  background: #fff; border-radius: 14px; padding: 14px 14px 12px;
  display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; align-items: center;
}
.job h3 { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; grid-column: 1; }
.job p { font-size: 12px; color: #666; font-weight: 500; grid-column: 1; }
.job .pay { font-size: 16px; font-weight: 800; letter-spacing: -0.03em; grid-column: 1; margin-top: 6px; }
.apply {
  grid-column: 2; grid-row: 1 / span 3; align-self: center;
  background: #000; color: #fff; font-size: 11px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 10px 12px; border-radius: 8px;
}
.thread {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 2px; border-bottom: 1px solid #ececec;
}
.thread .preview { font-size: 13px; font-weight: 500; color: #666; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 210px; }
.thread .when { margin-left: auto; font-size: 11px; font-weight: 700; color: #999; align-self: flex-start; padding-top: 4px; }
.unread { width: 8px; height: 8px; border-radius: 50%; background: #000; flex-shrink: 0; }
.hero-card {
  background: #fff; border-radius: 16px; padding: 16px;
  display: flex; align-items: center; gap: 14px;
}
.hero-card .avatar { width: 64px; height: 64px; font-size: 18px; }
.hero-card h3 { font-size: 20px; font-weight: 800; letter-spacing: -0.04em; }
.hero-card p { font-size: 13px; font-weight: 600; color: #666; margin-top: 3px; }
.stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.stat { background: #fff; border-radius: 12px; padding: 12px 10px; }
.stat b { display: block; font-size: 18px; font-weight: 800; letter-spacing: -0.04em; }
.stat span { font-size: 11px; font-weight: 600; color: #888; }

.app.auth { background: #fff; }
.auth-head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px 6px;
  font-weight: 800; font-size: 17px; letter-spacing: -0.04em;
}
.auth-head img { width: 22px; height: 22px; filter: invert(1); object-fit: contain; }
.auth-back {
  display: flex; align-items: center; gap: 6px;
  padding: 2px 16px 12px;
  font-size: 14px; font-weight: 600; color: #111;
}
.auth-hero { background: #f6f6f6; padding: 20px 20px 24px; }
.auth-hero h1 {
  font-size: 30px; font-weight: 800;
  letter-spacing: -0.04em; line-height: 1.05;
}
.auth-hero p {
  margin-top: 10px;
  font-size: 14px; font-weight: 500; color: #6a6a6a; line-height: 1.4;
}
.auth-opts { padding: 16px 20px 20px; }
.opt { padding: 2px 0 4px; }
.opt + .opt { margin-top: 18px; }
.opt .icrow { margin-bottom: 8px; color: #111; }
.opt-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 10px; padding-bottom: 14px; border-bottom: 1px solid #eee;
}
.opt h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
.opt p { font-size: 13px; font-weight: 500; color: #666; line-height: 1.4; margin-top: 6px; }
.opt .go { flex-shrink: 0; margin-top: 6px; color: #111; }
`;

const svg = {
  signal: `<svg class="ico" width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="8" width="3" height="4" rx="0.6" fill="#000"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="0.6" fill="#000"/><rect x="9" y="3" width="3" height="9" rx="0.6" fill="#000"/><rect x="13.5" y="0" width="3" height="12" rx="0.6" fill="#000" opacity="0.28"/></svg>`,
  wifi: `<svg class="ico" width="16" height="12" viewBox="0 0 16 12"><path d="M1.4 4.2A10.4 10.4 0 0 1 8 1.6c2.5 0 4.8.9 6.6 2.6" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round"/><path d="M3.6 6.6A6.6 6.6 0 0 1 8 4.8c1.7 0 3.2.6 4.4 1.8" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="10.2" r="1.3" fill="#000"/></svg>`,
  battery: `<svg class="ico" width="25" height="12" viewBox="0 0 25 12"><rect x="0.6" y="1" width="21" height="10" rx="2.2" fill="none" stroke="#000" stroke-width="1.2"/><rect x="2.4" y="2.7" width="16.4" height="6.6" rx="1.1" fill="#000"/><rect x="22.4" y="4" width="1.8" height="4" rx="0.6" fill="#000"/></svg>`,
  map: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.2" fill="currentColor" stroke="none"/></svg>`,
  jobs: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 5V4h8v1M8 10h8M8 14h5"/></svg>`,
  chat: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M5 17.5 3.5 20 8 18.2A8.5 8.5 0 1 0 5 17.5z"/></svg>`,
  you: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="12" cy="8" r="3.2"/><path d="M5.2 19c.8-3.2 3.5-5 6.8-5s6 1.8 6.8 5"/></svg>`,
  pin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2"/></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>`,
  shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z"/></svg>`,
  cash: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 13l4 4L19 7"/></svg>`,
  chev: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>`,
  gmark: `<img src="${LOGO}" width="18" height="18" alt="" />`,
  user: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="8" r="3.2"/><path d="M5.2 19c.8-3.2 3.5-5 6.8-5s6 1.8 6.8 5"/></svg>`,
  briefcase: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M12 12v3"/></svg>`,
  arrowL: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>`,
  arrowR: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  shieldLg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z"/></svg>`,
};

const mapSvg = `
<svg viewBox="0 0 390 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="390" height="520" fill="#d6d6d6"/>
  <rect x="8" y="8" width="118" height="86" fill="#c2c2c2"/>
  <rect x="142" y="8" width="100" height="86" fill="#bcbcbc"/>
  <rect x="258" y="8" width="124" height="86" fill="#c8c8c8"/>
  <rect x="8" y="112" width="90" height="110" fill="#cfcfcf"/>
  <rect x="114" y="112" width="128" height="110" fill="#bdbdbd"/>
  <rect x="258" y="112" width="124" height="70" fill="#c4c4c4"/>
  <rect x="258" y="196" width="124" height="26" fill="#b6b6b6"/>
  <rect x="8" y="240" width="154" height="96" fill="#c9c9c9"/>
  <rect x="178" y="240" width="96" height="96" fill="#b8b8b8"/>
  <rect x="290" y="240" width="92" height="96" fill="#c6c6c6"/>
  <rect x="8" y="354" width="118" height="150" fill="#bebebe"/>
  <rect x="142" y="354" width="130" height="90" fill="#cfcfcf"/>
  <rect x="288" y="354" width="94" height="150" fill="#c3c3c3"/>
  <rect x="142" y="458" width="130" height="46" fill="#b9b9b9"/>
  <g fill="none" stroke="#f4f4f4" stroke-linecap="square">
    <path stroke-width="18" d="M0 100 H390"/>
    <path stroke-width="14" d="M0 228 H390"/>
    <path stroke-width="16" d="M0 342 H390"/>
    <path stroke-width="12" d="M0 456 H390"/>
    <path stroke-width="16" d="M132 0 V520"/>
    <path stroke-width="14" d="M248 0 V520"/>
    <path stroke-width="12" d="M78 100 V342"/>
    <path stroke-width="10" d="M330 0 V342"/>
  </g>
  <rect x="160" y="122" width="70" height="88" fill="#b0b0b0" opacity="0.9"/>
</svg>`;

function authPage(body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${css}</style></head><body>
<div class="app auth">
  <div class="status"><span>9:41</span><span class="right">${svg.signal}${svg.wifi}${svg.battery}</span></div>
  ${body}
</div></body></html>`;
}

function chrome(inner, onTab) {
  const tabs = [
    ['map', svg.map, 'Map'],
    ['jobs', svg.jobs, 'Jobs'],
    ['chat', svg.chat, 'Chat'],
    ['you', svg.you, 'You'],
  ]
    .map(
      ([id, icon, label]) =>
        `<div class="tab ${onTab === id ? 'on' : ''}">${icon}${label}</div>`,
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>${css}</style></head><body>
<div class="app">
  <div class="status"><span>9:41</span><span class="right">${svg.signal}${svg.wifi}${svg.battery}</span></div>
  <div class="top"><div class="brand"><img src="${LOGO}" alt=""/>Guardr</div>${inner.badge}</div>
  ${inner.body}
  <div class="tabs">${tabs}</div>
</div></body></html>`;
}

const SCREENS = [
  {
    file: 'screen-map.png',
    html: chrome(
      {
        badge: `<span class="live"><i></i>2 live</span>`,
        body: `<div class="map">
        ${mapSvg}
        <div class="street" style="top:88px;left:16px">7TH ST</div>
        <div class="street" style="top:216px;left:16px">OLIVE</div>
        <div class="street" style="top:18px;left:138px;writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:0.22em">GRAND AVE</div>
        <div class="you"></div>
        <div class="pin" style="top:22%;left:36%">
          <span class="pulse"></span>
          <span class="head">${svg.gmark}</span>
          <span class="stem"></span>
        </div>
        <div class="pin sm" style="top:40%;left:61%">
          <span class="head">${svg.gmark}</span>
          <span class="stem"></span>
        </div>
        <div class="sheet">
          <div class="handle"></div>
          <div class="sheet-h"><h2>Available guards</h2><span>0.8 mi</span></div>
          <div class="row">
            <div class="avatar a1">MT</div>
            <div class="who"><strong>Marcus T.</strong><div class="meta"><span class="star">★ 4.9</span><span class="pill">Armed</span><span>0.8 mi</span></div></div>
            <div class="rate">$28/hr</div>
          </div>
          <div class="row">
            <div class="avatar a2">JR</div>
            <div class="who"><strong>Janelle R.</strong><div class="meta"><span class="star">★ 5.0</span><span class="pill">Unarmed</span><span>1.2 mi</span></div></div>
            <div class="rate">$24/hr</div>
          </div>
        </div>
      </div>`,
      },
      'map',
    ),
  },
  {
    file: 'screen-post.png',
    html: chrome(
      {
        badge: `<span class="loc">${svg.pin} California</span>`,
        body: `<div class="page">
        <div class="title">Post coverage</div>
        <p class="hint">Tonight · Downtown LA</p>
        <div class="card"><div class="ic">${svg.pin}</div><div style="flex:1"><label>Site</label><div class="val">Grand Ave · Downtown LA</div></div>${svg.chev}</div>
        <div class="card"><div class="ic">${svg.clock}</div><div style="flex:1"><label>When</label><div class="val">8:00pm – 2:00am</div></div>${svg.chev}</div>
        <div class="card"><div class="ic">${svg.shield}</div><div style="flex:1"><label>Type</label><div class="val">Event security</div></div>${svg.chev}</div>
        <div class="card"><div class="ic">${svg.cash}</div><div style="flex:1"><label>Rate</label><div class="val">$35 / hr · 6 hours</div></div></div>
        <div class="card"><div class="ic">${svg.check}</div><div style="flex:1"><label>Required</label><div class="chips"><span class="chip">Guard card</span><span class="chip">COI</span><span class="chip">32-hr</span></div></div></div>
        <div class="cta">Post this job</div>
      </div>`,
      },
      'jobs',
    ),
  },
  {
    file: 'screen-shifts.png',
    html: chrome(
      {
        badge: `<span class="loc">${svg.pin} California</span>`,
        body: `<div class="page">
        <div class="title">Open shifts</div>
        <p class="hint">Near you · tonight</p>
        <div class="job"><h3>Nightclub door</h3><p>DTLA · All black · 8pm–2am</p><div class="pay">$32/hr</div><span class="apply">Apply</span></div>
        <div class="job"><h3>Retail close</h3><p>West Hollywood · 2.4 mi</p><div class="pay">$26/hr</div><span class="apply">Apply</span></div>
        <div class="job"><h3>Site patrol</h3><p>Arts District · Construction</p><div class="pay">$28/hr</div><span class="apply">Apply</span></div>
        <div class="job"><h3>Campus lobby</h3><p>Pasadena · Unarmed</p><div class="pay">$25/hr</div><span class="apply">Apply</span></div>
      </div>`,
      },
      'jobs',
    ),
  },
  {
    file: 'screen-chat.png',
    html: chrome(
      {
        badge: `<span class="live"><i></i>2 live</span>`,
        body: `<div class="page">
        <div class="title">Chat</div>
        <p class="hint">Guards on tonight’s job</p>
        <div class="thread">
          <div class="avatar a1">MT</div>
          <div class="who"><strong>Marcus T.</strong><div class="preview">On site at 8. Armed.</div></div>
          <span class="when">2m</span>
          <i class="unread"></i>
        </div>
        <div class="thread">
          <div class="avatar a2">JR</div>
          <div class="who"><strong>Janelle R.</strong><div class="preview">I can take the lobby.</div></div>
          <span class="when">18m</span>
        </div>
        <div class="thread">
          <div class="avatar a1" style="background:#555">GA</div>
          <div class="who"><strong>Grand Ave event</strong><div class="preview">You: Post is live.</div></div>
          <span class="when">1h</span>
        </div>
      </div>`,
      },
      'chat',
    ),
  },
  {
    file: 'screen-chat-guard.png',
    html: chrome(
      {
        badge: `<span class="loc">${svg.pin} California</span>`,
        body: `<div class="page">
        <div class="title">Chat</div>
        <p class="hint">Jobs you applied to</p>
        <div class="thread">
          <div class="avatar a1" style="background:#111">GA</div>
          <div class="who"><strong>Grand Ave event</strong><div class="preview">You’re confirmed. 8pm.</div></div>
          <span class="when">4m</span>
          <i class="unread"></i>
        </div>
        <div class="thread">
          <div class="avatar a2">WH</div>
          <div class="who"><strong>Retail close</strong><div class="preview">Thanks for applying.</div></div>
          <span class="when">1h</span>
        </div>
        <div class="thread">
          <div class="avatar a1">AD</div>
          <div class="who"><strong>Site patrol</strong><div class="preview">You: I can work it.</div></div>
          <span class="when">Tue</span>
        </div>
      </div>`,
      },
      'chat',
    ),
  },
  {
    file: 'screen-you.png',
    html: chrome(
      {
        badge: `<span class="loc">${svg.pin} California</span>`,
        body: `<div class="page">
        <div class="title">You</div>
        <p class="hint">Client · Downtown LA</p>
        <div class="hero-card">
          <div class="avatar a1">DL</div>
          <div><h3>Downtown Lofts</h3><p>You pick who works.</p></div>
        </div>
        <div class="stats">
          <div class="stat"><b>2</b><span>Live</span></div>
          <div class="stat"><b>6h</b><span>Tonight</span></div>
          <div class="stat"><b>$35</b><span>Rate</span></div>
        </div>
        <div class="card"><div class="ic">${svg.pin}</div><div style="flex:1"><label>Site</label><div class="val">Grand Ave · DTLA</div></div></div>
        <div class="card"><div class="ic">${svg.shield}</div><div style="flex:1"><label>Coverage</label><div class="val">Event security</div></div></div>
      </div>`,
      },
      'you',
    ),
  },
  {
    file: 'screen-you-guard.png',
    html: chrome(
      {
        badge: `<span class="loc">${svg.pin} California</span>`,
        body: `<div class="page">
        <div class="title">You</div>
        <p class="hint">Licensed CA guard</p>
        <div class="hero-card">
          <div class="avatar a1">MT</div>
          <div><h3>Marcus T.</h3><p>Guard card · Armed</p></div>
        </div>
        <div class="stats">
          <div class="stat"><b>4.9</b><span>Rating</span></div>
          <div class="stat"><b>32-hr</b><span>Course</span></div>
          <div class="stat"><b>$28</b><span>/ hr</span></div>
        </div>
        <div class="card"><div class="ic">${svg.shield}</div><div style="flex:1"><label>Credentials</label><div class="val">Verified · California</div></div></div>
        <div class="card"><div class="ic">${svg.cash}</div><div style="flex:1"><label>Payouts</label><div class="val">Paid per job</div></div></div>
      </div>`,
      },
      'you',
    ),
  },
  {
    file: 'screen-signin.png',
    html: authPage(`
      <div class="auth-head"><img src="${LOGO}" alt=""/>Guardr</div>
      <div class="auth-back">${svg.arrowL} Back to Home</div>
      <div class="auth-hero">
        <h1>Log in to your account</h1>
        <p>Choose the workspace that matches how you use Guardr.</p>
      </div>
      <div class="auth-opts">
        <div class="opt">
          <div class="icrow">${svg.shieldLg}</div>
          <div class="opt-row">
            <div>
              <h2>Log in as guard</h2>
              <p>Independent contractor — your marketplace jobs and earnings.</p>
            </div>
            <span class="go">${svg.arrowR}</span>
          </div>
        </div>
        <div class="opt">
          <div class="icrow">${svg.user}</div>
          <div class="opt-row">
            <div>
              <h2>Log in as customer</h2>
              <p>Personal or business — whoever is hiring and paying for coverage.</p>
            </div>
            <span class="go">${svg.arrowR}</span>
          </div>
        </div>
        <div class="opt">
          <div class="icrow">${svg.briefcase}</div>
          <div class="opt-row">
            <div>
              <h2>Log in as staff</h2>
              <p>Guardr platform team — operations and support workspace.</p>
            </div>
            <span class="go">${svg.arrowR}</span>
          </div>
        </div>
      </div>
    `),
  },
];

async function waitForFile(filePath, timeoutMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(filePath, fsConstants.R_OK);
      if (statSync(filePath).size > 8000) {
        await new Promise((r) => setTimeout(r, 250));
        return;
      }
    } catch {
      /* not ready */
    }
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
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--no-first-run',
      '--force-device-scale-factor=3',
      `--user-data-dir=${profile}`,
      '--window-size=390,844',
      `--screenshot=${shotPath}`,
      '--virtual-time-budget=2500',
      '--run-all-compositor-stages-before-draw',
      pathToFileURL(htmlPath).href,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
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

const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const list = only ? SCREENS.filter((s) => s.file.includes(only)) : SCREENS;
for (let i = 0; i < list.length; i += 1) {
  await shot(list[i].html, path.join(OUT, list[i].file), i);
}
console.log('done screens');
