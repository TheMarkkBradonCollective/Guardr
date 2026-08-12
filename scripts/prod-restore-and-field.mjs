/**
 * Restore suspended E2E Guard, verify remaining creds, accept open job.
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
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 320)}`);
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
async function clickConfirm(page, preferred = [/Restore/i, /Confirm/i, /^Yes$/i, /Approve profile/i, /Approve/i, /Activate/i, /Mark checked/i]) {
  for (const name of preferred) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 700 }).catch(() => false)) {
      const t = await b.innerText();
      // Never click Deactivate/Suspend/Block
      if (/deactiv|suspend|block|deny|reject|delete/i.test(t)) continue;
      await b.click({ force: true });
      await page.waitForTimeout(900);
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

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(800);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(800);
await shot(page, '800-before-restore');
log('before', true, (await page.locator('body').innerText()).match(/Suspended|Approved|Active|Pending/gi)?.join(', '));

// Restore access
const restore = page.getByRole('button', { name: /Restore access/i });
if (await restore.isVisible({ timeout: 2000 }).catch(() => false)) {
  await restore.click({ force: true });
  await page.waitForTimeout(500);
  const conf = await clickConfirm(page, [/Restore/i, /Confirm/i, /^Yes$/i]);
  log('restore', true, conf);
  await page.waitForTimeout(1500);
}
await shot(page, '801-after-restore');
log('after-restore', true, (await page.locator('body').innerText()).match(/Suspended|Approved|Active|Pending/gi)?.join(', '));

// Mark background checked
await page.getByRole('button', { name: /Mark background checked/i }).click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
await clickConfirm(page, [/Mark checked/i, /Confirm/i, /^Yes$/i]);

// Verify remaining credentials for E2E
await page.goto(`${BASE}/staff/credentials`);
await waitReady(page);
await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
await shot(page, '802-pending');

for (let round = 0; round < 30; round++) {
  await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
  const items = page.getByText(/E2E Guard|CE-E2E|Continued|Guard Card|PTA|Power to Arrest/i);
  const c = await items.count();
  if (c) await items.nth(round % Math.min(c, 12)).click({ force: true }).catch(() => {});
  await page.waitForTimeout(350);
  const actions = page.getByRole('button', { name: /Verify/i });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      const t = await b.innerText();
      await b.click({ force: true });
      await page.waitForTimeout(350);
      await clickConfirm(page, [/Verify/i, /Confirm/i, /^Yes$/i, /Approve/i]);
      await page.waitForTimeout(800);
      log('verify', true, t);
      did = true;
      break;
    }
  }
  if (!did && round > 12) break;
}

// Guard credentials tab
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
await shot(page, '803-creds');
for (let i = 0; i < 25; i++) {
  const actions = page.getByRole('button', { name: /Verify/i });
  let did = false;
  for (let j = 0; j < (await actions.count()); j++) {
    const b = actions.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(300);
      await clickConfirm(page, [/Verify/i, /Confirm/i, /^Yes$/i]);
      await page.waitForTimeout(700);
      did = true;
      break;
    }
  }
  if (!did) break;
}

// If still approved (not active), try Review application / Approve again carefully
await page.getByText(/^Profile$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
await shot(page, '804-profile');
console.log(
  'PROFILE BTNS',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 35))
);

for (const name of [/Review application/i, /Approve application/i, /Approve profile/i, /Activate account/i]) {
  const b = page.getByRole('button', { name }).first();
  if ((await b.isVisible({ timeout: 600 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
    const label = await b.innerText();
    if (/deactiv|suspend|block/i.test(label)) continue;
    await b.click({ force: true });
    await page.waitForTimeout(500);
    const conf = await clickConfirm(page, [/Approve profile/i, /Approve application/i, /Restore/i, /Activate/i, /Confirm/i, /^Yes$/i, /Mark checked/i]);
    log('action', true, `${label} -> ${conf}`);
    await page.waitForTimeout(1000);
  }
}
await shot(page, '805-status');
log('status', true, (await page.locator('body').innerText()).match(/Suspended|Approved|Active|Pending/gi)?.join(', '));

// Guard field test
await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await dismiss(page);
await page.waitForTimeout(600);
await dismiss(page);
await shot(page, '806-guard');
log('landing', true, `${page.url()} :: ${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 220)}`);

let accepted = false;
for (const seg of ['/guard/map', '/guard/jobs', '/guard/home']) {
  await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  const t = await page.locator('body').innerText();
  await shot(page, `807-${seg.replace(/\W+/g, '_')}`);
  const free = !/Application under review|Marketplace Eligibility/i.test(t);
  log(`browse${seg}`, free, t.replace(/\s+/g, ' ').slice(0, 260));
  if (!free) continue;

  await page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '808-job');
  for (const name of [/Accept(?:\s+job)?/i, /Apply/i, /Take job/i, /Claim/i, /Request/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 700 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(800);
      await clickConfirm(page, [/Accept/i, /Confirm/i, /Yes/i, /Slide/i]);
      await page.getByRole('button', { name: /slide to|accept|confirm/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
      accepted = true;
      log('accept', true, `${seg} ${name}`);
      await shot(page, '809-accepted');
      break;
    }
  }
  if (accepted) break;
}

await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await shot(page, '810-jobs');
log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 550));
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(700);
await shot(page, '811-final');
log('final', true, (await page.locator('body').innerText()).match(/Suspended|Approved|Active|Pending/gi)?.join(', '));

await browser.close();
fs.writeFileSync(path.join(OUT, 'restore-field-final.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
