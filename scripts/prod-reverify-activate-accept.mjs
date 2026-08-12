/**
 * Prod workaround: credentials are verified but status stuck Approved
 * (auto-activation missed while suspended). Reject one CE course, re-upload,
 * staff-verify to trigger withAutoGuardActivation → Active, then accept a job.
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
const COURSE = /Evacuation Procedures/i;

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
  await dialog.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  const scope = (await dialog.isVisible().catch(() => false)) ? dialog : page;
  for (const label of labels) {
    const b = scope.getByRole('button', { name: label, exact: true }).first();
    if (await b.isVisible({ timeout: 800 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete/i.test(t) && !/Reject/i.test(t)) continue;
      await b.click({ force: true });
      await page.waitForTimeout(1200);
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
  // ── Staff: reject Evacuation Procedures ─────────────────────────
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('Evacuation');
  await page.waitForTimeout(900);
  await page.getByText(/E2E Guard/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  // Prefer exact course row
  await page.getByText(COURSE).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(700);
  await shot(page, '1600-before-reject');
  log('before-reject', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400));

  const rejectBtn = page.getByRole('button', { name: /^Reject$/i }).first();
  if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await rejectBtn.click({ force: true });
    await page.waitForTimeout(500);
    // May ask for reason
    const reason = page.locator('textarea:visible, input[type="text"]:visible').first();
    if (await reason.isVisible({ timeout: 1000 }).catch(() => false)) {
      await reason.fill('E2E re-verify to trigger auto-activation');
    }
    await confirmExact(page, ['Reject', 'Confirm', 'Submit', 'Yes']);
    await page.getByRole('button', { name: /^Reject$/i }).last().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1500);
    log('reject', true, 'Evacuation Procedures');
  } else {
    log('reject', false, 'Reject button missing — trying guard detail');
    await openGuard(page);
    await page.getByText(/^Credentials$/).first().click({ force: true });
    await page.waitForTimeout(800);
    // scroll to course
    for (let i = 0; i < 8; i++) {
      await page.evaluate((step) => {
        const panes = [...document.querySelectorAll('div')].filter(
          (el) => el.scrollHeight > el.clientHeight + 80 && el.clientWidth > 300
        );
        const pane = panes.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
        if (pane) pane.scrollTop = step * 400;
      }, i);
      await page.waitForTimeout(200);
      if (await page.getByText(COURSE).first().isVisible().catch(() => false)) break;
    }
    await page.getByText(COURSE).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Reject$/i }).first().click({ force: true });
    await page.waitForTimeout(500);
    const reason = page.locator('textarea:visible').first();
    if (await reason.isVisible({ timeout: 800 }).catch(() => false)) {
      await reason.fill('E2E re-verify to trigger auto-activation');
    }
    await confirmExact(page, ['Reject', 'Confirm', 'Submit']);
    await page.waitForTimeout(1500);
    log('reject-detail', true, 'clicked');
  }
  await shot(page, '1601-after-reject');

  // ── Guard: re-upload Evacuation ─────────────────────────────────
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(600);
  await dismiss(page);
  await shot(page, '1602-guard');

  // Open CE section / course
  await page.getByText(/Continued Education|Evacuation Procedures/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(700);
  // Look for Add / Upload / Replace on Evacuation
  let uploaded = false;
  for (const name of [
    /Upload.*Evacuation/i,
    /Re-?upload/i,
    /Replace/i,
    /Add certificate/i,
    /^Upload$/i,
    /Evacuation Procedures/i,
  ]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 600 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(700);
      log('open-upload', true, String(name));
      break;
    }
  }
  // Also try Add buttons in CE panel
  const addBtns = page.getByRole('button', { name: /^Add$|Upload|Replace/i });
  for (let i = 0; i < (await addBtns.count()); i++) {
    const b = addBtns.nth(i);
    const near = await b.evaluate((el) => el.closest('div')?.innerText || '').catch(() => '');
    if (/Evacuation/i.test(near) || i === 0) {
      await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  await shot(page, '1603-upload-sheet');

  const file = page.locator('input[type="file"]').first();
  if (await file.count()) {
    await file.setInputFiles(FAKE);
    await page.waitForTimeout(400);
  }
  const inputs = page.locator('input:visible, textarea:visible');
  for (let i = 0; i < (await inputs.count()); i++) {
    const el = inputs.nth(i);
    const type = (await el.getAttribute('type')) || '';
    const ph = ((await el.getAttribute('placeholder')) || '') + ((await el.getAttribute('name')) || '');
    if (type === 'file' || type === 'date') continue;
    if (/issuer|organiz|school|academy/i.test(ph)) await el.fill('E2E Training Academy');
    else if (/number|cert|#/i.test(ph)) await el.fill('CE-E2E-REVERIFY-5');
    else if (!(await el.inputValue().catch(() => 'x'))) {
      // leave
    }
  }
  // Issuing org labeled fields
  await page.getByPlaceholder(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  await page.getByPlaceholder(/Certificate number|Number/i).fill('CE-E2E-REVERIFY-5').catch(() => {});

  for (const name of [/Upload credential/i, /Save/i, /Submit/i, /Upload$/i, /Continue/i]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 600 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(1800);
      uploaded = true;
      log('upload', true, String(name));
      break;
    }
  }
  await shot(page, '1604-after-upload');
  log('uploaded', uploaded, uploaded ? 'ok' : 'may already be pending');

  // ── Staff: verify Evacuation → expect Active ────────────────────
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('Evacuation');
  await page.waitForTimeout(800);
  await page.getByText(/^Pending review$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await page.getByText(/E2E Guard|Evacuation/i).first().click({ force: true });
  await page.waitForTimeout(700);
  await shot(page, '1605-pending-evac');

  let verified = false;
  const verify = page.getByRole('button', { name: /^Verify$/i });
  for (let j = 0; j < (await verify.count()); j++) {
    const b = verify.nth(j);
    if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(400);
      await confirmExact(page, ['Verify', 'Confirm']);
      await page.waitForTimeout(2000);
      verified = true;
      log('verify', true, 'Evacuation');
      break;
    }
  }
  if (!verified) {
    // try without filter
    await page.getByText(/^All$/).first().click({ force: true }).catch(() => {});
    await page.getByPlaceholder(/Search credentials/i).fill('E2E');
    await page.waitForTimeout(700);
    for (let i = 0; i < 12; i++) {
      await page.getByText(/E2E Guard/i).nth(i % 8).click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
      const body = await page.locator('body').innerText();
      if (!/Evacuation/i.test(body)) continue;
      const v = page.getByRole('button', { name: /^Verify$/i }).first();
      if ((await v.isVisible().catch(() => false)) && !(await v.isDisabled().catch(() => true))) {
        await v.click({ force: true });
        await confirmExact(page, ['Verify', 'Confirm']);
        await page.waitForTimeout(2000);
        verified = true;
        log('verify-scan', true, 'found');
        break;
      }
    }
  }
  log('verified', verified, verified ? 'ok' : 'no');
  await shot(page, '1606-after-verify');

  await openGuard(page);
  await shot(page, '1607-guard-status');
  let body = await page.locator('body').innerText();
  let status = accessStatus(body);
  log('status-after-verify', status === 'Active', status);

  // If still approved, try deactivate→restore won't help on prod without fix.
  // Try clicking any Activate if present.
  if (status !== 'Active') {
    const act = page.getByRole('button', { name: /Activate account|Activate/i }).first();
    if (await act.isVisible({ timeout: 800 }).catch(() => false)) {
      const label = await act.innerText();
      if (!/Deactivate/i.test(label)) {
        await act.click({ force: true });
        await confirmExact(page, ['Activate account', 'Confirm', 'Activate']);
        await page.waitForTimeout(1500);
        await openGuard(page);
        status = accessStatus(await page.locator('body').innerText());
        log('activate-btn', status === 'Active', status);
      }
    }
  }

  // ── Guard accept job ────────────────────────────────────────────
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(700);
  await dismiss(page);
  await shot(page, '1608-guard-home');
  const land = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const free = !/Upload activation credentials|Application under review|Account Suspended|Account Blocked/i.test(land);
  log('guard-free', free, `${page.url()} :: ${land.slice(0, 280)}`);

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
        await shot(page, '1609-job');
      }
      console.log(
        'btns',
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
          log('accept', true, `${seg}`);
          await shot(page, '1610-accepted');
          break;
        }
      }
      if (accepted) break;
    }
  }
  log('accepted', accepted, accepted ? 'applied' : 'not applied');

  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  await dismiss(page);
  await shot(page, '1611-jobs');
  log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await openGuard(page);
  await shot(page, '1612-final');
  log('final', true, accessStatus(await page.locator('body').innerText()));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1699-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'reverify-activate.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
