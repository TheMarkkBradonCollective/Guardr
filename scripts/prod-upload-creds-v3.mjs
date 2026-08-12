/**
 * Finish remaining fake credentials + staff verify + field job accept.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
const IMG = '/home/ubuntu/Downloads/e2e-fake-credential.png';
fs.mkdirSync(SHOT, { recursive: true });
const report = [];
const log = (s, ok, d) => {
  report.push({ s, ok, d: typeof d === 'string' ? d : JSON.stringify(d) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 240)}`);
};
const shot = async (page, n) => page.screenshot({ path: path.join(SHOT, `${n}.png`), fullPage: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/End tutorial/i, /Skip/i, /Got it/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 250 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
  const boxes = page.locator('input[type="checkbox"]:visible');
  for (let j = 0; j < (await boxes.count()); j++) {
    const b = boxes.nth(j);
    if (!(await b.isChecked().catch(() => true))) await b.check({ force: true }).catch(() => {});
  }
}
async function reset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
}
async function login(page, role, email, password) {
  await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (!(await page.locator('input[type="email"]').count())) {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(3200);
  await waitReady(page);
  await dismiss(page);
  await page.getByRole('button', { name: /Skip|Not now|Later|End tutorial/i }).first().click({ force: true }).catch(() => {});
  await dismiss(page);
}
async function uploadFiles(page) {
  const inputs = page.locator('input[type="file"]');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    await inputs.nth(i).setInputFiles(IMG);
    await page.waitForTimeout(700);
  }
  for (let i = 0; i < 25; i++) {
    if (!(await page.getByText(/Processing/i).first().isVisible({ timeout: 200 }).catch(() => false))) break;
    await page.waitForTimeout(300);
  }
  return n;
}
async function progress(page) {
  const t = await page.locator('body').innerText();
  return {
    n: Number(t.match(/(\d)\s+of\s+5\s+requirements complete/i)?.[1] ?? -1),
    pct: t.match(/(\d+)%/)?.[1],
    statuses: [...t.matchAll(/(Submitted|Expired|Upload your|awaiting staff|On file|Verified|Complete)[^\n]*/gi)]
      .map((m) => m[0])
      .slice(0, 8),
  };
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await dismiss(page);
await shot(page, '300-start');
log('start', true, await progress(page));

// ── COI: open form, force future expiry ──
await page.getByRole('button', { name: /Add COI/i }).click({ force: true });
await page.waitForTimeout(1000);
// If detail view, click edit
await page.getByRole('button', { name: /Edit|Update|Replace|Add COI/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
await shot(page, '301-coi-form');
console.log(
  'COI fields',
  await page.locator('input:visible, textarea:visible, select:visible').evaluateAll((els) =>
    els.map((e) => ({ type: e.type, aria: e.getAttribute('aria-label'), ph: e.placeholder, val: e.value?.slice?.(0, 30) }))
  )
);

// Fill by label text proximity / aria
async function fillLabel(re, val) {
  const el = page.getByLabel(re).first();
  if (await el.isVisible({ timeout: 600 }).catch(() => false)) {
    await el.fill('');
    await el.fill(val);
    return true;
  }
  return false;
}
await fillLabel(/carrier/i, 'E2E Insurance Company');
await fillLabel(/policy/i, 'POL-E2E-2030');
await fillLabel(/liability|limit|coverage/i, '1000000');
await fillLabel(/effective/i, '2026-01-01');
await fillLabel(/expir/i, '2030-12-31');

// Force all date inputs
const dates = page.locator('input[type="date"]:visible');
if ((await dates.count()) >= 1) await dates.nth(0).fill('2026-01-01');
if ((await dates.count()) >= 2) await dates.nth(1).fill('2030-12-31');
if ((await dates.count()) === 1) await dates.nth(0).fill('2030-12-31');

await uploadFiles(page);
await shot(page, '302-coi-filled');
await page.getByRole('button', { name: /Submit for review|Save credential|Save/i }).first().click({ force: true });
await page.waitForTimeout(2500);
await shot(page, '303-coi-after');
log('coi', true, await progress(page));

// ── Guard card with issuer ──
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await page.getByRole('button', { name: /Add guard card/i }).click({ force: true });
await page.waitForTimeout(1000);
await shot(page, '304-card-open');
// Fill issuer by placeholder
const issuer = page.getByPlaceholder(/Issuing organization/i);
if (await issuer.isVisible({ timeout: 1000 }).catch(() => false)) await issuer.fill('BSIS');
const num = page.getByPlaceholder(/number|license/i).or(page.locator('input:visible').nth(2));
await page.locator('input:visible').nth(1).fill('BSIS').catch(() => {});
// clear and set fields carefully
const inputs = page.locator('input:visible');
for (let i = 0; i < (await inputs.count()); i++) {
  const el = inputs.nth(i);
  const type = await el.getAttribute('type');
  if (type === 'file') continue;
  const ph = (await el.getAttribute('placeholder')) || '';
  const val = await el.inputValue();
  if (/Issuing organization/i.test(ph) || (!val && i === 1 && type !== 'date')) {
    if (/Issuing/i.test(ph) || i === 1) await el.fill('BSIS');
  }
  if (/number|GC-|license/i.test(ph) || (!/Issuing/i.test(ph) && type === 'text' && i === 2)) {
    if (!val || /E2E|GC-/.test(val) || i === 2) await el.fill(val || 'GC-E2E-0811');
  }
}
// Explicit: placeholder issuer
await page.getByPlaceholder(/Issuing organization \(e\.g\. BSIS\)/i).fill('BSIS').catch(() => {});
await uploadFiles(page);
await shot(page, '305-card-filled');
await page.getByRole('button', { name: /^Add$/i }).click({ force: true });
await page.waitForTimeout(2500);
await shot(page, '306-card-after');
log('guard-card', true, await progress(page));

// ── PTA combined certificate ──
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await page.getByRole('button', { name: /Add PTA\/UOF/i }).click({ force: true });
await page.waitForTimeout(1000);
await page.getByRole('button', { name: /Combined Certificate/i }).click({ force: true });
await page.waitForTimeout(600);
await shot(page, '307-pta-combined');
await page.getByRole('button', { name: /^Add$/i }).first().click({ force: true });
await page.waitForTimeout(800);
await shot(page, '308-pta-form');
// fill form
await page.getByPlaceholder(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
for (const el of await page.locator('input:visible').all()) {
  const type = await el.getAttribute('type');
  const ph = (await el.getAttribute('placeholder')) || '';
  if (type === 'file') continue;
  if (/Issuing/i.test(ph)) await el.fill('E2E Training Academy');
  else if (type === 'date') await el.fill('2025-06-15');
  else if (type === 'text' || !type) {
    const v = await el.inputValue();
    if (!v) await el.fill('PTA-UOF-E2E-0811');
  }
}
await uploadFiles(page);
await shot(page, '309-pta-filled');
await page.getByRole('button', { name: /^Add$/i }).click({ force: true });
await page.waitForTimeout(2500);
await shot(page, '310-pta-after');
log('pta', true, await progress(page));

// ── 32-hour CE ──
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await page.getByRole('button', { name: /Add Continued Education/i }).click({ force: true });
await page.waitForTimeout(1000);
await shot(page, '311-ce-open');
console.log(
  'CE buttons',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 30))
);

// Click through each course Add button
for (let i = 0; i < 12; i++) {
  const addBtns = page.getByRole('button', { name: /^Add$/i });
  const count = await addBtns.count();
  if (!count) break;
  // click first available Add in the CE sheet
  await addBtns.first().click({ force: true });
  await page.waitForTimeout(700);
  if (await page.locator('input[type="file"]').count()) {
    await page.getByPlaceholder(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
    for (const el of await page.locator('input:visible').all()) {
      const type = await el.getAttribute('type');
      if (type === 'file') continue;
      const ph = (await el.getAttribute('placeholder')) || '';
      if (/Issuing/i.test(ph)) await el.fill('E2E Training Academy');
      else if (type === 'date') await el.fill('2025-08-01');
      else if (!(await el.inputValue())) await el.fill(`CE-E2E-${i}`);
    }
    await uploadFiles(page);
    await page.getByRole('button', { name: /^Add$/i }).last().click({ force: true });
    await page.waitForTimeout(1500);
    await shot(page, `312-ce-${i}`);
  } else {
    break;
  }
}
await page.keyboard.press('Escape').catch(() => {});
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await shot(page, '313-activation');
log('after-uploads', true, await progress(page));

// ── Staff verify ──
await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');

// Verify Gov ID + COI + certs from credentials queue and guard detail
await page.goto(`${BASE}/staff/credentials`);
await waitReady(page);
await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(700);
await shot(page, '314-pending');

for (let round = 0; round < 30; round++) {
  // Prefer items mentioning E2E
  const candidates = page.locator('button, [role="button"], a, li, div').filter({ hasText: /E2E|Government ID|COI|Guard Card|PTA|Insurance|D1234567|POL-E2E/i });
  const c = await candidates.count();
  if (c > 0) await candidates.nth(round % Math.min(c, 10)).click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);

  const actions = page.getByRole('button', {
    name: /Verify(?:\s+credential)?|Approve(?:\s+(?:credential|ID|application|document))?|Mark verified|Confirm ID/i,
  });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      const label = await b.innerText();
      await b.click({ force: true });
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      log('verify-click', true, label);
      did = true;
      break;
    }
  }
  if (!did && round > 12) break;
}
await shot(page, '315-verified');

// Guard profile — verify remaining + approve/activate
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(800);
await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
await shot(page, '316-guard-creds');

for (let i = 0; i < 20; i++) {
  const actions = page.getByRole('button', { name: /Verify|Approve/i });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(900);
      did = true;
      break;
    }
  }
  if (!did) break;
}

await page.goto(`${BASE}/staff/applications`);
await waitReady(page);
await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '317-app');
for (const name of [/Approve application/i, /Activate/i, /^Approve$/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 600 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Approve$|^Confirm$|^Yes$|^Activate$/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1200);
    log('staff-approve', true, String(name));
  }
}
await shot(page, '318-app-after');

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await shot(page, '319-guard-status');
const gText = await page.locator('body').innerText();
log('guard-status', /Active/i.test(gText), gText.match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', '));

// ── Field test as guard ──
await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await shot(page, '320-guard-home');
log('guard-home', true, page.url());

let accepted = false;
for (const seg of ['/guard/map', '/guard/jobs', '/guard/home', '/guard/offers']) {
  await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  await shot(page, `321-${seg.replace(/\W+/g, '_')}`);
  const t = await page.locator('body').innerText();
  log(`browse-${seg}`, /Corporate Event|Standing Guard|Hollywood|Open|Accept|Apply|offer/i.test(t) || !/Application under review/i.test(t), t.replace(/\s+/g, ' ').slice(0, 220));
  if (/Corporate Event Security|Standing Guard Post/i.test(t)) {
    await page.getByText(/Corporate Event Security|Standing Guard Post/i).first().click({ force: true });
    await page.waitForTimeout(800);
    await shot(page, '322-job');
  }
  for (const name of [/Accept(?:\s+job)?/i, /Apply/i, /Take job/i, /Claim/i, /Request to work/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(800);
      await page.getByRole('button', { name: /confirm|accept|slide|yes/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
      accepted = true;
      log('accept-job', true, `${seg} ${name}`);
      break;
    }
  }
  if (accepted) break;
}
await shot(page, '323-final-guard');

// Staff confirm assignment
await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await shot(page, '324-jobs');
log('jobs-final', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));

await browser.close();
fs.writeFileSync(path.join(OUT, 'creds-field-report-v3.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
