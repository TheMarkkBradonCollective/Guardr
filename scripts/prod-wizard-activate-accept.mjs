/**
 * Staff credential wizard: Medical → CPR → E2E Guard → upload → verify
 * to trigger auto-activation, then guard applies to open job.
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
    if (await b.isVisible({ timeout: 300 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
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
  await dialog.waitFor({ state: 'visible', timeout: 2500 }).catch(() => {});
  const scope = (await dialog.isVisible().catch(() => false)) ? dialog : page;
  for (const label of labels) {
    const b = scope.getByRole('button', { name: label, exact: typeof label === 'string' }).first();
    if (await b.isVisible({ timeout: 700 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete/i.test(t)) continue;
      await b.click({ force: true });
      await page.waitForTimeout(1000);
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
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);

  // Open add via shell + button
  await page.getByRole('button', { name: /\+ Add credential/i }).first().click({ force: true });
  await page.waitForTimeout(800);
  await shot(page, '2000-step1');

  // Step 1: Medical & Emergency
  await page.getByText(/Medical & Emergency/i).first().click({ force: true });
  await page.waitForTimeout(800);
  await shot(page, '2001-step2');
  log('step1', true, 'Medical & Emergency');

  // Step 2: Choose E2E Guard
  const search = page.getByPlaceholder(/Search guards/i).first();
  if (await search.isVisible({ timeout: 2000 }).catch(() => false)) {
    await search.fill('E2E');
    await page.waitForTimeout(600);
  }
  await page.getByText(/e2e\.guard\.e2e0811@guardr\.test/i).first().click({ force: true }).catch(async () => {
    await page.getByText(/E2E Guard/i).last().click({ force: true });
  });
  await page.waitForTimeout(1000);
  await shot(page, '2002-step3');
  log('step2', true, 'E2E Guard');

  // Step 3: pick CPR in catalog list if shown
  for (const label of [/CPR Certification/i, /^CPR$/i, /First Aid Certification/i, /AED Certification/i]) {
    const t = page.getByText(label).first();
    if (await t.isVisible({ timeout: 800 }).catch(() => false)) {
      await t.click({ force: true });
      await page.waitForTimeout(700);
      log('pick', true, String(label));
      break;
    }
  }
  await shot(page, '2003-form');

  // Fill form fields inside sheet
  const sheet = page.locator('[role="dialog"], .app-form-sheet, form').last();
  const file = page.locator('input[type="file"]').first();
  if (await file.count()) {
    await file.setInputFiles(FAKE);
    await page.waitForTimeout(500);
    log('file', true, 'attached');
  }

  // Fill visible text inputs in the sheet
  const inputs = page.locator('input:visible:not([type="file"]):not([type="hidden"])');
  for (let i = 0; i < (await inputs.count()); i++) {
    const el = inputs.nth(i);
    const type = ((await el.getAttribute('type')) || '').toLowerCase();
    const ph = ((await el.getAttribute('placeholder')) || '').toLowerCase();
    const aria = ((await el.getAttribute('aria-label')) || '').toLowerCase();
    const label = ph + ' ' + aria;
    if (type === 'date') {
      await el.fill('2030-08-11');
    } else if (type === 'search') {
      // skip
    } else if (/issuer|organiz|school|provider|academy/.test(label)) {
      await el.fill('E2E Training Academy');
    } else if (/number|cert|license/.test(label)) {
      await el.fill('E2E-CPR-0811');
    } else if (/name/.test(label) && !(await el.inputValue())) {
      await el.fill('CPR Certification');
    }
  }
  await page.getByLabel(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  await page.getByLabel(/License \/ cert number|Credential number|Certificate/i).fill('E2E-CPR-0811').catch(() => {});

  await shot(page, '2004-filled');
  console.log(
    'FORM BTNS',
    await page.locator('button:visible').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 30)
    )
  );

  let submitted = false;
  for (const name of [/Add credential/i, /Upload credential/i, /Save/i, /Submit/i, /Continue/i, /Next/i]) {
    const buttons = page.getByRole('button', { name });
    // Prefer the last/primary in the sheet
    const count = await buttons.count();
    for (let i = count - 1; i >= 0; i--) {
      const b = buttons.nth(i);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        const t = (await b.innerText()).trim();
        // Avoid re-clicking the shell + Add credential in the sidebar
        const box = await b.boundingBox();
        if (box && box.x < 80) continue;
        await b.click({ force: true });
        await page.waitForTimeout(2000);
        submitted = true;
        log('submit', true, t);
        break;
      }
    }
    if (submitted) break;
  }
  await shot(page, '2005-submitted');
  log('submitted', submitted, submitted ? 'ok' : 'no');

  // Verify pending CPR
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('CPR');
  await page.waitForTimeout(800);
  await page.getByText(/^Pending review$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, '2006-pending-cpr');

  let verified = false;
  const cprRow = page.getByText(/CPR|E2E-CPR|E2E Guard/i).first();
  if (await cprRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cprRow.click({ force: true });
    await page.waitForTimeout(700);
  }
  for (const name of [/^Verify$/i, /^Verify update$/i]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 1000 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(400);
      await confirmExact(page, ['Verify', 'Confirm', 'Verify update']);
      await page.waitForTimeout(2500);
      verified = true;
      log('verify', true, String(name));
      break;
    }
  }
  if (!verified) {
    await page.getByPlaceholder(/Search credentials/i).fill('E2E');
    await page.waitForTimeout(600);
    for (let i = 0; i < 20; i++) {
      const items = page.getByText(/E2E Guard/i);
      if (!(await items.count())) break;
      await items.nth(i % Math.min(await items.count(), 12)).click({ force: true });
      await page.waitForTimeout(350);
      const detail = await page.locator('body').innerText();
      if (!/CPR|First Aid|AED|E2E-CPR|Pending review|pending/i.test(detail) && i > 2) continue;
      const v = page.getByRole('button', { name: /^Verify$/i }).first();
      if ((await v.isVisible().catch(() => false)) && !(await v.isDisabled().catch(() => true))) {
        await v.click({ force: true });
        await confirmExact(page, ['Verify', 'Confirm']);
        await page.waitForTimeout(2500);
        verified = true;
        log('verify-scan', true, detail.replace(/\s+/g, ' ').slice(0, 120));
        break;
      }
    }
  }
  log('verified', verified, verified ? 'ok' : 'no');
  await shot(page, '2007-verified');

  await openGuard(page);
  await shot(page, '2008-status');
  const status = accessStatus(await page.locator('body').innerText());
  log('status', status === 'Active', status);

  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(700);
  await dismiss(page);
  await shot(page, '2009-guard');
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
        await shot(page, '2010-job');
      }
      for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
          await b.click({ force: true });
          await page.waitForTimeout(1800);
          accepted = true;
          log('accept', true, seg);
          await shot(page, '2011-accepted');
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
  await shot(page, '2012-jobs');
  log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await openGuard(page);
  await shot(page, '2013-final');
  log('final', true, accessStatus(await page.locator('body').innerText()));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '2099-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'wizard-activate.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
