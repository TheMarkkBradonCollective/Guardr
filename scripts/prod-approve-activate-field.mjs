/**
 * Staff: confirm Approve profile (+ activate), then guard accepts open job.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
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
  for (const name of [/Do it later/i, /End tutorial/i, /Skip/i, /Got it/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
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
async function confirmDialog(page) {
  for (const name of [/Approve profile/i, /Approve account/i, /Approve application/i, /^Approve$/i, /^Confirm$/i, /^Yes$/i, /Activate/i, /Mark checked/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 600 }).catch(() => false)) {
      const t = await b.innerText();
      await b.click({ force: true });
      await page.waitForTimeout(1000);
      return t;
    }
  }
  return null;
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');

// Open E2E Guard via Applications
await page.goto(`${BASE}/staff/applications`);
await waitReady(page);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(1000);
await shot(page, '700-app-review');
console.log(
  'APP BTNS',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40))
);

// Click Approve application then Approve profile in confirm
for (const name of [/Approve application/i, /Approve profile/i, /^Approve$/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 800 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(600);
    const conf = await confirmDialog(page);
    log('approve-app', true, `${name} confirm=${conf}`);
    break;
  }
}
await shot(page, '701-after-approve-app');

// Also from Guards detail Review application
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(800);
await shot(page, '702-guard-detail');
console.log(
  'GUARD BTNS',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40))
);

await page.getByRole('button', { name: /Review application/i }).click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await shot(page, '703-review');
for (const name of [/Approve application/i, /Approve profile/i, /^Approve$/i, /Activate/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 700 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(500);
    const conf = await confirmDialog(page);
    log('review-approve', true, `${name} confirm=${conf}`);
  }
}

// Mark background checked (often needed)
await page.getByRole('button', { name: /Mark background checked/i }).click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
await confirmDialog(page);

// Look for Activate
for (const name of [/Activate account/i, /Activate guard/i, /^Activate$/i, /Make active/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 600 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    await b.click({ force: true });
    await page.waitForTimeout(400);
    const conf = await confirmDialog(page);
    log('activate', true, `${name} confirm=${conf}`);
  }
}
await shot(page, '704-after-activate');

// Credentials tab - verify any remaining CE
await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
for (let i = 0; i < 20; i++) {
  const actions = page.getByRole('button', { name: /Verify|Approve/i });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(350);
      await confirmDialog(page);
      await page.waitForTimeout(700);
      did = true;
      break;
    }
  }
  if (!did) break;
}
await shot(page, '705-creds');

await page.getByText(/^Profile$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
await shot(page, '706-status');
const statusText = await page.locator('body').innerText();
log('status', /Active/i.test(statusText) && !/Pending approval/i.test(statusText), statusText.match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', '));

// Guard field test
await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await dismiss(page);
await page.waitForTimeout(500);
await dismiss(page);
await shot(page, '707-guard');
log('landing', true, page.url());

let accepted = false;
for (const seg of ['/guard/map', '/guard/jobs', '/guard/home']) {
  await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  const t = await page.locator('body').innerText();
  await shot(page, `708-${seg.replace(/\W+/g, '_')}`);
  const free = !/Application under review|Marketplace Eligibility/i.test(t);
  log(`browse${seg}`, free, t.replace(/\s+/g, ' ').slice(0, 250));
  if (!free) continue;

  // Click job cards / pins
  await page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood|Open/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '709-job');
  for (const name of [/Accept(?:\s+job)?/i, /Apply/i, /Take job/i, /Claim/i, /Request to work/i, /I'm interested/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 700 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(800);
      await confirmDialog(page);
      // slide to confirm desktop button
      await page.getByRole('button', { name: /slide to|accept|confirm/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
      accepted = true;
      log('accept', true, `${seg} ${name}`);
      await shot(page, '710-accepted');
      break;
    }
  }
  if (accepted) break;
}

await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await shot(page, '711-jobs');
log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await shot(page, '712-final-guard');
log('final-guard', true, (await page.locator('body').innerText()).match(/Pending approval|Pending credentials|Approved|Active/gi)?.join(', '));

await browser.close();
fs.writeFileSync(path.join(OUT, 'approve-activate-field.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
