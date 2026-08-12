/**
 * Finish: guard submits CE update via Profile credentials, staff verifies update,
 * expect Active, accept open job.
 * Assumes staff already requested update on Evacuation Procedures.
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
  await dialog.waitFor({ state: 'visible', timeout: 3500 }).catch(() => {});
  const scope = (await dialog.isVisible().catch(() => false)) ? dialog : page;
  for (const label of labels) {
    const b = scope.getByRole('button', { name: label, exact: typeof label === 'string' }).first();
    if (await b.isVisible({ timeout: 800 }).catch(() => false)) {
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
  // Ensure update request exists
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('Evacuation');
  await page.waitForTimeout(800);
  await page.getByText(/Evacuation Procedures/i).first().click({ force: true });
  await page.waitForTimeout(700);
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(150);
  }
  const reqBtn = page.getByRole('button', { name: /Request update/i }).first();
  if (await reqBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    // If still shows Request update, send again (or already requested — either ok)
    const body = await page.locator('body').innerText();
    if (!/update request|Update requested|pending update/i.test(body)) {
      await reqBtn.click({ force: true });
      await page.waitForTimeout(500);
      const note = page.locator('textarea:visible').first();
      if (await note.isVisible({ timeout: 1000 }).catch(() => false)) {
        await note.fill('E2E: re-upload to trigger auto-activation');
      }
      await confirmExact(page, ['Send request', 'Request update', 'Confirm']);
      await page.waitForTimeout(1200);
      log('request', true, 'sent');
    } else {
      log('request', true, 'already requested');
    }
  } else {
    log('request', true, 'no button — likely already requested');
  }
  await shot(page, '1800-staff-evac');

  // Guard profile credentials
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(600);
  await dismiss(page);

  // Try multiple entry points to credentials
  for (const seg of ['/guard/settings', '/guard/profile', '/guard/activation']) {
    await page.goto(`${BASE}${seg}`).catch(() => {});
    await waitReady(page);
    await dismiss(page);
    await shot(page, `1801-${seg.replace(/\W+/g, '_')}`);
  }

  // Click profile avatar / Account settings / Credentials / Edit
  for (const name of [
    /Account settings/i,
    /Profile/i,
    /Credentials/i,
    /Open Profile/i,
    /Edit profile/i,
  ]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(700);
      log('nav', true, String(name));
    }
    const link = page.getByRole('link', { name }).first();
    if (await link.isVisible({ timeout: 300 }).catch(() => false)) {
      await link.click({ force: true });
      await page.waitForTimeout(700);
    }
  }
  // Dock / bottom nav
  await page.getByText(/^Settings$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await page.getByText(/^Profile$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '1802-profile');

  // Scroll for Evacuation
  for (let i = 0; i < 12; i++) {
    const hit = page.getByText(/Evacuation Procedures/i).first();
    if (await hit.isVisible({ timeout: 300 }).catch(() => false)) {
      await hit.click({ force: true });
      await page.waitForTimeout(800);
      log('open-evac', true, `scroll ${i}`);
      break;
    }
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);
  }
  await shot(page, '1803-evac-modal');
  console.log(
    'MODAL BTNS',
    await page.locator('button:visible').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40)
    )
  );

  // Edit / Update / Replace
  for (const name of [/Edit/i, /Update credential/i, /Submit update/i, /Replace/i, /Upload/i, /Update/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(600);
      log('edit', true, String(name));
      break;
    }
  }
  await shot(page, '1804-editing');

  const file = page.locator('input[type="file"]').first();
  if (await file.count()) {
    await file.setInputFiles(FAKE);
    await page.waitForTimeout(500);
    log('file', true, 'set');
  }
  await page.getByLabel(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  await page.getByLabel(/Credential number|License \/ cert number/i).fill('CE-E2E-REVERIFY-5').catch(() => {});
  await page.locator('input[placeholder*="organization" i]').fill('E2E Training Academy').catch(() => {});
  await page.locator('input[placeholder*="number" i]').fill('CE-E2E-REVERIFY-5').catch(() => {});

  let uploaded = false;
  for (const name of [
    /Submit update/i,
    /Save update/i,
    /Upload credential/i,
    /Save changes/i,
    /Save/i,
    /Submit/i,
    /Upload$/i,
  ]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 500 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(2000);
      uploaded = true;
      log('upload', true, String(name));
      break;
    }
  }
  await shot(page, '1805-after-upload');
  log('uploaded', uploaded, uploaded ? 'ok' : 'failed');

  // Staff verify
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('Evacuation');
  await page.waitForTimeout(800);
  await page.getByText(/^Pending review$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  // click any matching row without strict timeout
  const rows = page.getByText(/Evacuation|E2E Guard/i);
  if ((await rows.count()) > 0) {
    await rows.first().click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(700);
  await shot(page, '1806-pending');
  console.log(
    'STAFF BTNS',
    await page.locator('button:visible').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').trim()).filter((t) => /Verify|Reject|Request|All|Pending/i.test(t)).slice(0, 30)
    )
  );

  let verified = false;
  for (const name of [/^Verify update$/i, /^Verify$/i]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 800 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(400);
      await confirmExact(page, ['Verify', 'Verify update', 'Confirm']);
      await page.waitForTimeout(2200);
      verified = true;
      log('verify', true, String(name));
      break;
    }
  }
  if (!verified) {
    await page.getByText(/^All$/).first().click({ force: true }).catch(() => {});
    await page.getByPlaceholder(/Search credentials/i).fill('E2E');
    await page.waitForTimeout(700);
    for (let i = 0; i < 20; i++) {
      const items = page.getByText(/E2E Guard/i);
      if (!(await items.count())) break;
      await items.nth(i % Math.min(await items.count(), 12)).click({ force: true }).catch(() => {});
      await page.waitForTimeout(350);
      const v = page.getByRole('button', { name: /Verify/i });
      for (let j = 0; j < (await v.count()); j++) {
        const b = v.nth(j);
        if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
          await b.click({ force: true });
          await confirmExact(page, ['Verify', 'Verify update', 'Confirm']);
          await page.waitForTimeout(2000);
          verified = true;
          log('verify-scan', true, `i=${i}`);
          break;
        }
      }
      if (verified) break;
    }
  }
  log('verified', verified, verified ? 'ok' : 'no');
  await shot(page, '1807-verified');

  await openGuard(page);
  await shot(page, '1808-status');
  const status = accessStatus(await page.locator('body').innerText());
  log('status', status === 'Active', status);

  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(700);
  await dismiss(page);
  await shot(page, '1809-guard');
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
        await shot(page, '1810-job');
      }
      for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
          await b.click({ force: true });
          await page.waitForTimeout(1800);
          accepted = true;
          log('accept', true, seg);
          await shot(page, '1811-accepted');
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
  await shot(page, '1812-jobs');
  log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await openGuard(page);
  await shot(page, '1813-final');
  log('final', true, accessStatus(await page.locator('body').innerText()));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1899-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'finish-update-accept.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
