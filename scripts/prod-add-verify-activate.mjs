/**
 * Staff adds + verifies an optional credential for E2E Guard to trigger
 * withAutoGuardActivation (approved + all five already verified → Active),
 * then guard accepts an open job.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
const FAKE = fs.existsSync('/tmp/e2e-fake-credential.png')
  ? '/tmp/e2e-fake-credential.png'
  : '/home/ubuntu/Downloads/e2e-fake-credential.png';
fs.mkdirSync(SHOT, { recursive: true });

const STAFF = { email: 'm.white@signaturesecurityspecialist.com', password: '#FuckinDstorm11' };
const GUARD = { email: 'e2e.guard.e2e0811@guardr.test', password: '#Qwerty12345' };

const report = [];
const log = (s, ok, d = '') => {
  report.push({ s, ok, d: String(d).slice(0, 700) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 350)}`);
};
const shot = async (page, n) => page.screenshot({ path: path.join(SHOT, `${n}.png`), fullPage: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/Skip for now/i, /Do it later/i, /End tutorial/i, /Skip/i, /Got it/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 350 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
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
  await page.waitForTimeout(3500);
  await waitReady(page);
  await dismiss(page);
}
async function openGuard(page) {
  await page.goto(`${BASE}/staff/guards`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
  await page.waitForTimeout(900);
  await page.getByText(/E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(1000);
  await dismiss(page);
}
async function confirmExact(page, labels) {
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  const scope = (await dialog.isVisible().catch(() => false)) ? dialog : page;
  for (const label of labels) {
    const b = scope.getByRole('button', { name: label, exact: typeof label === 'string' }).first();
    if (await b.isVisible({ timeout: 700 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete/i.test(t)) continue;
      await b.click({ force: true });
      await page.waitForTimeout(1100);
      return t;
    }
  }
  return null;
}
function accessStatus(text) {
  if (/Account access[\s\S]{0,100}\bActive\b/.test(text)) return 'Active';
  if (/Account access[\s\S]{0,100}\bSuspended\b/.test(text)) return 'Suspended';
  if (/Account access[\s\S]{0,100}\bApproved\b/.test(text)) return 'Approved';
  return 'unknown';
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);

  // Path A: Guards → Credentials → + Add credential
  await openGuard(page);
  await page.getByText(/^Credentials$/).first().click({ force: true });
  await page.waitForTimeout(800);
  await dismiss(page);
  await shot(page, '1900-creds');

  let added = false;
  for (const name of [/\+ Add credential/i, /Add credential/i, /\+ Add/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 800 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(800);
      log('open-add', true, String(name));
      break;
    }
  }
  // Also from credentials page global add
  if (!(await page.locator('input[type="file"], select, [role="dialog"]').count())) {
    await page.goto(`${BASE}/staff/credentials`);
    await waitReady(page);
    await dismiss(page);
    await page.getByRole('button', { name: /\+ Add credential|Add credential/i }).first().click({ force: true });
    await page.waitForTimeout(800);
  }
  await shot(page, '1901-add-sheet');
  console.log(
    'ADD BTNS',
    await page.locator('button:visible, [role="option"]').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 50)
    )
  );

  // Select guard if prompted
  const guardSelect = page.getByPlaceholder(/guard|search/i).first();
  if (await guardSelect.isVisible({ timeout: 800 }).catch(() => false)) {
    await guardSelect.fill('E2E Guard');
    await page.waitForTimeout(500);
    await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
  }
  // Pick CPR or 8-hour refresher / First Aid
  for (const label of [
    /CPR Certification/i,
    /First Aid/i,
    /8-Hour Refresher|8-hr refresher|BSIS.*Refresher/i,
    /Other license/i,
  ]) {
    const opt = page.getByText(label).first();
    if (await opt.isVisible({ timeout: 600 }).catch(() => false)) {
      await opt.click({ force: true });
      await page.waitForTimeout(500);
      log('pick-cert', true, String(label));
      break;
    }
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(500);
      log('pick-cert-btn', true, String(label));
      break;
    }
  }

  // Fill form
  const file = page.locator('input[type="file"]').first();
  if (await file.count()) {
    await file.setInputFiles(FAKE);
    await page.waitForTimeout(400);
  }
  await page.getByPlaceholder(/Issuing organization|organization|provider/i).fill('E2E Training Academy').catch(() => {});
  await page.getByPlaceholder(/number|Certificate/i).fill('E2E-OPT-0811').catch(() => {});
  await page.getByLabel(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  await page.getByLabel(/number/i).fill('E2E-OPT-0811').catch(() => {});
  // date if any
  const dates = page.locator('input[type="date"]');
  if (await dates.count()) await dates.first().fill('2030-08-11');

  for (const name of [/Upload credential/i, /Add credential/i, /Save/i, /Submit/i, /Upload$/i, /Continue/i, /Create/i]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 500 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(2000);
      added = true;
      log('add-submit', true, String(name));
      break;
    }
  }
  await shot(page, '1902-after-add');
  log('added', added, added ? 'ok' : 'no');

  // Verify the new pending credential
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('E2E');
  await page.waitForTimeout(700);
  await page.getByText(/^Pending review$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '1903-pending');

  let verified = false;
  for (let i = 0; i < 15; i++) {
    const items = page.getByText(/E2E Guard/i);
    const n = await items.count();
    if (!n) break;
    await items.nth(i % Math.min(n, 10)).click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    const body = await page.locator('body').innerText();
    if (!/CPR|First Aid|Refresher|E2E-OPT|Pending/i.test(body) && i < 3) {
      // still try verify any pending E2E
    }
    const v = page.getByRole('button', { name: /^Verify$/i });
    for (let j = 0; j < (await v.count()); j++) {
      const b = v.nth(j);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        await b.click({ force: true });
        await page.waitForTimeout(400);
        await confirmExact(page, ['Verify', 'Confirm']);
        await page.waitForTimeout(2200);
        verified = true;
        log('verify', true, body.replace(/\s+/g, ' ').slice(0, 160));
        break;
      }
    }
    if (verified) break;
  }
  // Also Verify update if present from earlier request
  if (!verified) {
    const vu = page.getByRole('button', { name: /Verify update/i }).first();
    if ((await vu.isVisible({ timeout: 500 }).catch(() => false)) && !(await vu.isDisabled().catch(() => true))) {
      await vu.click({ force: true });
      await confirmExact(page, ['Verify', 'Verify update', 'Confirm']);
      await page.waitForTimeout(2200);
      verified = true;
      log('verify-update', true, 'ok');
    }
  }
  log('verified', verified, verified ? 'ok' : 'no');
  await shot(page, '1904-after-verify');

  await openGuard(page);
  await shot(page, '1905-status');
  let status = accessStatus(await page.locator('body').innerText());
  log('status', status === 'Active', status);

  // Guard accept
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(700);
  await dismiss(page);
  await shot(page, '1906-guard');
  const land = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const free = !/Upload activation credentials|Application under review|Account Suspended|Account Blocked/i.test(land);
  log('guard-free', free, land.slice(0, 280));

  let accepted = false;
  if (free) {
    for (const seg of ['/guard/jobs', '/guard/map']) {
      await page.goto(`${BASE}${seg}`);
      await waitReady(page);
      await dismiss(page);
      const job = page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first();
      if (await job.isVisible({ timeout: 2500 }).catch(() => false)) {
        await job.click({ force: true });
        await page.waitForTimeout(1100);
        await shot(page, '1907-job');
      }
      console.log(
        'JOB BTNS',
        await page.locator('button:visible').evaluateAll((els) =>
          els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 30)
        )
      );
      for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
          await b.click({ force: true });
          await page.waitForTimeout(1800);
          accepted = true;
          log('accept', true, seg);
          await shot(page, '1908-accepted');
          break;
        }
      }
      if (accepted) break;
    }
  }
  log('accepted', accepted, accepted ? 'ok' : 'no');

  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  await dismiss(page);
  await shot(page, '1909-jobs');
  const jobsText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('jobs', true, jobsText.slice(0, 500));
  await page.getByText(/Corporate Event Security|Standing Guard Post/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '1910-job-detail');
  log('job-detail', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await openGuard(page);
  await shot(page, '1911-final');
  log('final', true, accessStatus(await page.locator('body').innerText()));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1999-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'add-verify-activate.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
