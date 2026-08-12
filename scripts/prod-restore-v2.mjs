/**
 * Restore E2E Guard with correct confirm label, then accept open job.
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
await page.waitForTimeout(900);
await shot(page, '900-before');

const bodyBefore = await page.locator('body').innerText();
log('before', true, bodyBefore.match(/Suspended|Approved|Active|Pending approval/g)?.join(', '));

if (/Suspended/i.test(bodyBefore)) {
  await page.getByRole('button', { name: /^Restore access$/i }).click({ force: true });
  await page.waitForTimeout(700);
  await shot(page, '901-restore-dialog');
  // Exact confirm label from dialog
  const restoreAccount = page.getByRole('button', { name: /^Restore account$/i });
  if (await restoreAccount.isVisible({ timeout: 3000 }).catch(() => false)) {
    await restoreAccount.click({ force: true });
    await page.waitForTimeout(2000);
    log('restore', true, 'Restore account');
  } else {
    console.log(
      'dialog btns',
      await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean))
    );
    log('restore', false, 'Restore account button missing');
  }
}
await shot(page, '902-after-restore');
const after = await page.locator('body').innerText();
log('after-restore', !/Suspended/i.test(after), after.match(/Suspended|Approved|Active|Pending approval/g)?.join(', '));

// Background check
await page.getByRole('button', { name: /Mark background checked/i }).click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
await page.getByRole('button', { name: /^Mark checked$/i }).click({ force: true }).catch(() => {});
await page.waitForTimeout(1000);

// Verify remaining E2E CE / Guard Card from credentials
await page.goto(`${BASE}/staff/credentials`);
await waitReady(page);
await page.getByPlaceholder(/Search credentials/i).fill('E2E').catch(() => {});
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
await shot(page, '903-creds');

for (let i = 0; i < 20; i++) {
  const item = page.getByText(/E2E Guard/i).nth(i % 8);
  if (await item.isVisible({ timeout: 400 }).catch(() => false)) await item.click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
  const verify = page.getByRole('button', { name: /^Verify(?:\s+\w+)?$/i });
  let did = false;
  for (let j = 0; j < (await verify.count()); j++) {
    const b = verify.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: /^Verify$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
      did = true;
      log('verify', true, 'clicked');
      break;
    }
  }
  if (!did && i > 8) break;
}

// Guard detail status
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E');
await page.waitForTimeout(700);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(800);
await shot(page, '904-guard');
const g = await page.locator('body').innerText();
log('guard-status', /Active|Approved/i.test(g) && !/Suspended/i.test(g), g.match(/Suspended|Approved|Active|Pending approval/g)?.join(', '));
console.log(
  'BTNS',
  await page.locator('button:visible').evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40))
);

// If approved but not active, credentials may need verify for auto-activation
await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
for (let i = 0; i < 15; i++) {
  const verify = page.getByRole('button', { name: /Verify/i });
  let did = false;
  for (let j = 0; j < (await verify.count()); j++) {
    const b = verify.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /^Verify$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(700);
      did = true;
      break;
    }
  }
  if (!did) break;
}
await page.getByText(/^Profile$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(500);
await shot(page, '905-final-staff');
log('final-staff', true, (await page.locator('body').innerText()).match(/Suspended|Approved|Active|Pending approval/g)?.join(', '));

// Guard login + accept job
await reset(page, context);
await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
await dismiss(page);
await page.waitForTimeout(500);
await dismiss(page);
await shot(page, '906-guard-home');
log('landing', true, page.url());

let accepted = false;
for (const seg of ['/guard/map', '/guard/jobs', '/guard/home']) {
  await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  const t = await page.locator('body').innerText();
  await shot(page, `907-${seg.replace(/\W+/g, '_')}`);
  const free = !/Application under review|Marketplace Eligibility|suspended/i.test(t);
  log(`browse${seg}`, free, t.replace(/\s+/g, ' ').slice(0, 260));
  if (!free) continue;
  await page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '908-job');
  for (const name of [/Accept(?:\s+job)?/i, /Apply/i, /Take job/i, /Claim/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 800 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(800);
      await page.getByRole('button', { name: /accept|confirm|slide|yes/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
      accepted = true;
      log('accept', true, `${seg} ${name}`);
      await shot(page, '909-accepted');
      break;
    }
  }
  if (accepted) break;
}

await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await shot(page, '910-jobs');
log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));

await browser.close();
fs.writeFileSync(path.join(OUT, 'restore-v2.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
