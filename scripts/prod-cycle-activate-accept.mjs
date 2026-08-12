/**
 * All creds verified but status stuck Approved after suspension.
 * Cycle: Deactivate account → Restore account (resolveGuardRestoreUserStatus → active)
 * Then guard applies to open E2E job.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOT, { recursive: true });

const STAFF = { email: 'm.white@signaturesecurityspecialist.com', password: '#FuckinDstorm11' };
const GUARD = { email: 'e2e.guard.e2e0811@guardr.test', password: '#Qwerty12345' };

const report = [];
const log = (s, ok, d = '') => {
  report.push({ s, ok, d: String(d).slice(0, 600) });
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
async function confirmExact(page, label) {
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  const scope = (await dialog.isVisible().catch(() => false)) ? dialog : page;
  const b = scope.getByRole('button', { name: label, exact: true });
  if (!(await b.isVisible({ timeout: 3000 }).catch(() => false))) {
    const btns = await page.locator('button:visible').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 30)
    );
    console.log('visible buttons', btns);
    return null;
  }
  await b.click({ force: true });
  await page.waitForTimeout(1800);
  return label;
}
function accessStatus(text) {
  const m = text.match(/Account access\s*\n?\s*(Approved|Active|Suspended|Blocked|Pending approval)/i);
  if (m) return m[1];
  // badge near list
  if (/Account access[\s\S]{0,80}\bActive\b/.test(text)) return 'Active';
  if (/Account access[\s\S]{0,80}\bSuspended\b/.test(text)) return 'Suspended';
  if (/Account access[\s\S]{0,80}\bApproved\b/.test(text)) return 'Approved';
  return 'unknown';
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await openGuard(page);
  await shot(page, '1500-before');
  let body = await page.locator('body').innerText();
  let status = accessStatus(body);
  log('before', true, status);

  if (status === 'Active') {
    log('cycle', true, 'already active');
  } else {
    if (status === 'Approved' || status === 'Active') {
      // Deactivate
      await page.getByRole('button', { name: 'Deactivate', exact: true }).click({ force: true });
      await page.waitForTimeout(600);
      await shot(page, '1501-deactivate-dialog');
      const d = await confirmExact(page, 'Deactivate account');
      log('deactivate', Boolean(d), d || 'missing');
      await page.waitForTimeout(1500);
      await openGuard(page);
      body = await page.locator('body').innerText();
      status = accessStatus(body);
      log('after-deactivate', status === 'Suspended', status);
    }

    if (status === 'Suspended' || status === 'Blocked' || /Restore access/i.test(body)) {
      await page.getByRole('button', { name: 'Restore access', exact: true }).click({ force: true });
      await page.waitForTimeout(600);
      await shot(page, '1502-restore-dialog');
      const r = await confirmExact(page, 'Restore account');
      log('restore', Boolean(r), r || 'missing');
      await page.waitForTimeout(2000);
      await openGuard(page);
      body = await page.locator('body').innerText();
      status = accessStatus(body);
      log('after-restore', status === 'Active', status);
      await shot(page, '1503-after-restore');
    }
  }

  // Capture toast / qualification
  log('profile-snippet', true, body.match(/Account access[\s\S]{0,250}|Qualification[\s\S]{0,200}/)?.[0]?.replace(/\s+/g, ' '));

  // Guard side
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(700);
  await dismiss(page);
  await shot(page, '1504-guard');
  const land = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const free = !/Upload activation credentials|Application under review|Account Suspended|Account Blocked/i.test(land);
  log('guard-free', free, `${page.url()} :: ${land.slice(0, 260)}`);

  let accepted = false;
  if (free) {
    for (const seg of ['/guard/jobs', '/guard/map', '/guard/home']) {
      await page.goto(`${BASE}${seg}`);
      await waitReady(page);
      await dismiss(page);
      await shot(page, `1505-${seg.replace(/\W+/g, '_')}`);
      const job = page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood Blvd/i).first();
      if (await job.isVisible({ timeout: 2500 }).catch(() => false)) {
        await job.click({ force: true });
        await page.waitForTimeout(1100);
        await shot(page, '1506-job');
      }
      // List all buttons for debug
      console.log(
        'job buttons',
        await page.locator('button:visible').evaluateAll((els) =>
          els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40)
        )
      );
      for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i, /^Apply$/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
          await b.click({ force: true });
          await page.waitForTimeout(1800);
          accepted = true;
          log('accept', true, `${seg} ${name}`);
          await shot(page, '1507-accepted');
          break;
        }
      }
      if (accepted) break;
    }
  } else {
    // Still gated — dump activation checklist details
    log('still-gated', false, land.slice(0, 400));
  }
  log('accepted', accepted, accepted ? 'applied' : 'not applied');

  // Staff jobs
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  await dismiss(page);
  await shot(page, '1508-jobs');
  const jobs = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('jobs', true, jobs.slice(0, 500));
  // Open Corporate Event if present
  await page.getByText(/Corporate Event Security|Standing Guard Post/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '1509-job-detail');
  log('job-detail', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));

  await openGuard(page);
  await shot(page, '1510-final-guard');
  log('final-guard', true, accessStatus(await page.locator('body').innerText()));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1599-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'cycle-activate.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
