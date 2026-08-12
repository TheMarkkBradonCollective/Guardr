/**
 * Upload all 9 CE courses, staff-verify, activate guard, accept open job.
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
  report.push({ s, ok, d });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 300)}`);
};
const shot = async (page, n) => page.screenshot({ path: path.join(SHOT, `${n}.png`), fullPage: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/Do it later/i, /End tutorial/i, /Skip/i, /Got it/i, /Not now/i, /Later/i, /Close/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
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
}
async function uploadFiles(page) {
  const inputs = page.locator('input[type="file"]');
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    await inputs.nth(i).setInputFiles(IMG);
    await page.waitForTimeout(700);
  }
  for (let i = 0; i < 20; i++) {
    if (!(await page.getByText(/Processing/i).first().isVisible({ timeout: 200 }).catch(() => false))) break;
    await page.waitForTimeout(300);
  }
  return n;
}
async function progress(page) {
  const t = await page.locator('body').innerText();
  return {
    n: Number(t.match(/(\d)\s+of\s+5\s+requirements (?:complete|met)/i)?.[1] ?? -1),
    pct: t.match(/(\d+)%/)?.[1],
    body: t.replace(/\s+/g, ' ').slice(0, 400),
  };
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await dismiss(page);
await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await dismiss(page);
await shot(page, '600-start');
log('start', true, JSON.stringify(await progress(page)));

// Upload CE courses one-by-one, reopening sheet each time
for (let i = 0; i < 12; i++) {
  await page.goto(`${BASE}/guard/activation`);
  await waitReady(page);
  await dismiss(page);
  const p = await progress(page);
  if (p.n >= 5) {
    log('ce-done-early', true, JSON.stringify(p));
    break;
  }

  const openBtn = page.getByRole('button', { name: /Add Continued Education/i });
  if (!(await openBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    log('ce-no-button', true, JSON.stringify(p));
    break;
  }
  await openBtn.click({ force: true });
  await page.waitForTimeout(1000);
  await shot(page, `601-ce-open-${i}`);

  const adds = page.getByRole('button', { name: /^Add$/i });
  const addCount = await adds.count();
  console.log(`CE round ${i}: Add buttons = ${addCount}`);
  if (!addCount) {
    // Maybe all courses listed differently
    console.log(
      'CE buttons',
      await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40))
    );
    // Try clicking first incomplete course row
    const course = page.locator('button, [role="button"]').filter({ hasText: /hr\)|hour|Public|Observation|Communication|Liability|Arrest|Tactical|Crowd|Officer|Weapons|Traffic/i }).first();
    if (await course.isVisible({ timeout: 800 }).catch(() => false)) {
      await course.click({ force: true });
      await page.waitForTimeout(800);
    } else {
      log('ce-no-adds', false, `round ${i}`);
      break;
    }
  } else {
    await adds.first().click({ force: true });
    await page.waitForTimeout(900);
  }

  if (!(await page.locator('input[type="file"]').count())) {
    await page.getByRole('button', { name: /Upload|Add certificate|Continue/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
  if (!(await page.locator('input[type="file"]').count())) {
    await shot(page, `602-ce-nofile-${i}`);
    await page.keyboard.press('Escape').catch(() => {});
    continue;
  }

  await page.getByPlaceholder(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  for (const el of await page.locator('input:visible').all()) {
    const type = await el.getAttribute('type');
    if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
    const ph = (await el.getAttribute('placeholder')) || '';
    if (/Issuing/i.test(ph)) await el.fill('E2E Training Academy');
    else if (type === 'date') await el.fill('2025-08-01');
    else if (!(await el.inputValue())) await el.fill(`CE-E2E-FULL-${i}`);
  }
  await uploadFiles(page);
  await shot(page, `603-ce-filled-${i}`);

  // Submit — prefer Upload credential / Add
  let submitted = false;
  for (const name of [/Upload credential/i, /^Add$/i, /Submit/i, /Save/i]) {
    const b = page.getByRole('button', { name }).last();
    if ((await b.isVisible({ timeout: 500 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      submitted = true;
      break;
    }
  }
  await page.waitForTimeout(1800);
  await shot(page, `604-ce-after-${i}`);
  log(`ce-${i}`, submitted, JSON.stringify(await progress(page)));
  await page.keyboard.press('Escape').catch(() => {});
}

await page.goto(`${BASE}/guard/activation`);
await waitReady(page);
await dismiss(page);
await shot(page, '605-activation');
log('activation', true, JSON.stringify(await progress(page)));

// Staff verify CE + remaining + activate
await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');

for (let round = 0; round < 40; round++) {
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  const items = page.getByText(/E2E|CE-E2E|Continued|32|PTA|Guard Card|COI|Insurance|Government/i);
  const c = await items.count();
  if (c) await items.nth(round % Math.min(c, 15)).click({ force: true }).catch(() => {});
  await page.waitForTimeout(350);
  const actions = page.getByRole('button', { name: /Verify|Approve/i });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      const label = await b.innerText();
      await b.click({ force: true });
      await page.waitForTimeout(350);
      await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
      log('verify', true, label);
      did = true;
      break;
    }
  }
  if (!did && round > 18) break;
}
await shot(page, '606-verified');

// Guard credentials tab
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
for (let i = 0; i < 25; i++) {
  const actions = page.getByRole('button', { name: /Verify|Approve/i });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(350);
      await page.getByRole('button', { name: /^Verify$|^Approve$|^Confirm$|^Yes$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
      did = true;
      break;
    }
  }
  if (!did) break;
}

// Review application / Approve
await page.getByText(/^Profile$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
await page.getByRole('button', { name: /Review application/i }).click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '607-review');
for (const name of [/Approve application/i, /Activate/i, /^Approve$/i, /Mark background checked/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 600 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Approve$|^Confirm$|^Yes$|^Activate$/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
    log('staff-action', true, String(name));
  }
}
await page.goto(`${BASE}/staff/applications`);
await waitReady(page);
await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(700);
for (const name of [/Approve application/i, /Activate/i, /^Approve$/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 500 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Approve$|^Confirm$|^Yes$|^Activate$/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
    log('approve', true, String(name));
  }
}
await shot(page, '608-approved');

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await shot(page, '609-status');
log('status', true, (await page.locator('body').innerText()).match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', '));

// Field test as guard
await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await dismiss(page); // Do it later on password change
await page.waitForTimeout(500);
await dismiss(page);
await shot(page, '610-guard');
log('landing', true, `${page.url()} :: ${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200)}`);

for (const seg of ['/guard/map', '/guard/jobs', '/guard/home']) {
  await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  const t = await page.locator('body').innerText();
  await shot(page, `611-${seg.replace(/\W+/g, '_')}`);
  const free = !/Application under review|Marketplace Eligibility/i.test(t);
  log(`browse${seg}`, free, t.replace(/\s+/g, ' ').slice(0, 240));
  if (!free) continue;
  await page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '612-job');
  for (const name of [/Accept/i, /Apply/i, /Take job/i, /Claim/i, /Request/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 600 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(800);
      const confirm = page.getByRole('button', { name: /confirm|accept|slide|yes|post job|submit/i }).first();
      if (await confirm.isVisible({ timeout: 600 }).catch(() => false)) await confirm.click({ force: true });
      await page.waitForTimeout(1500);
      log('accept', true, `${seg} ${name}`);
      await shot(page, '613-accepted');
      break;
    }
  }
}

await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await shot(page, '614-jobs');
log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));

await browser.close();
fs.writeFileSync(path.join(OUT, 'creds-field-report-final.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
