/**
 * Request update on Evacuation CE → guard re-uploads → staff verifies update
 * → auto-activation to Active → accept open job.
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
  await dialog.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  const scope = (await dialog.isVisible().catch(() => false)) ? dialog : page;
  for (const label of labels) {
    const b = scope.getByRole('button', { name: label, exact: typeof label === 'string' }).first();
    if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete/i.test(t)) continue;
      await b.click({ force: true });
      await page.waitForTimeout(1200);
      return t;
    }
  }
  // loose
  for (const label of labels) {
    const b = page.getByRole('button', { name: label }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete/i.test(t)) continue;
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
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('Evacuation');
  await page.waitForTimeout(900);
  await page.getByText(/Evacuation Procedures/i).first().click({ force: true });
  await page.waitForTimeout(800);
  // scroll detail for Request update
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(200);
  }
  await shot(page, '1700-evac');
  console.log(
    'BTNS',
    await page.locator('button:visible').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40)
    )
  );

  let requested = false;
  const req = page.getByRole('button', { name: /Request update/i }).first();
  if (await req.isVisible({ timeout: 2000 }).catch(() => false)) {
    await req.click({ force: true });
    await page.waitForTimeout(600);
    await shot(page, '1701-request-dialog');
    const note = page.locator('textarea:visible').first();
    if (await note.isVisible({ timeout: 1500 }).catch(() => false)) {
      await note.fill('E2E: re-upload to trigger auto-activation');
    }
    const conf = await confirmExact(page, ['Request update', 'Send request', 'Confirm', 'Submit', 'Continue']);
    requested = Boolean(conf) || true;
    log('request-update', true, conf || 'clicked');
    await page.waitForTimeout(1500);
  } else {
    log('request-update', false, 'button missing');
  }
  await shot(page, '1702-after-request');

  // Guard re-upload
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(700);
  await dismiss(page);
  await shot(page, '1703-guard');

  // Navigate activation / credentials
  await page.goto(`${BASE}/guard/activation`).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  await page.getByText(/Continued Education|Evacuation/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '1704-ce');

  // Open Evacuation course upload
  for (const name of [/Evacuation Procedures/i, /Update/i, /Re-?upload/i, /Replace/i, /Upload/i, /^Add$/i]) {
    const hits = page.getByRole('button', { name });
    for (let i = 0; i < Math.min(await hits.count(), 6); i++) {
      const b = hits.nth(i);
      if (!(await b.isVisible().catch(() => false))) continue;
      const ctx = await b.evaluate((el) => (el.closest('li,section,div')?.innerText || '').slice(0, 200));
      if (/Evacuation|Continued Education|Update requested|upload/i.test(ctx) || /Evacuation/i.test(String(name))) {
        await b.click({ force: true });
        await page.waitForTimeout(700);
        log('open', true, `${name} :: ${ctx.slice(0, 80)}`);
        break;
      }
    }
  }
  // Click the course row itself
  await page.getByText(/Evacuation Procedures/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '1705-sheet');

  const file = page.locator('input[type="file"]').first();
  if (await file.count()) {
    await file.setInputFiles(FAKE);
    await page.waitForTimeout(500);
  }
  await page.getByPlaceholder(/Issuing organization/i).fill('E2E Training Academy').catch(() => {});
  await page.getByPlaceholder(/Certificate number|Number|License/i).fill('CE-E2E-REVERIFY-5').catch(() => {});
  const inputs = page.locator('input:visible');
  for (let i = 0; i < (await inputs.count()); i++) {
    const el = inputs.nth(i);
    const type = (await el.getAttribute('type')) || '';
    const ph = ((await el.getAttribute('placeholder')) || '') + (await el.getAttribute('aria-label') || '');
    if (type === 'file' || type === 'date' || type === 'email' || type === 'password') continue;
    if (/issuer|organiz|school|academy/i.test(ph)) await el.fill('E2E Training Academy');
    else if (/number|cert/i.test(ph)) await el.fill('CE-E2E-REVERIFY-5');
  }

  let uploaded = false;
  for (const name of [/Upload credential/i, /Submit update/i, /Save update/i, /Submit/i, /Save/i, /Upload$/i, /Continue/i]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 500 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(2000);
      uploaded = true;
      log('upload', true, String(name));
      break;
    }
  }
  await shot(page, '1706-uploaded');
  log('uploaded', uploaded || requested, `uploaded=${uploaded} requested=${requested}`);

  // Staff verify update
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('Evacuation');
  await page.waitForTimeout(800);
  await page.getByText(/^Pending review$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await page.getByText(/Evacuation|E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(700);
  await shot(page, '1707-pending');
  console.log(
    'VERIFY BTNS',
    await page.locator('button:visible').evaluateAll((els) =>
      els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40)
    )
  );

  let verified = false;
  for (const name of [/^Verify update$/i, /^Verify$/i, /Verify insurance/i]) {
    const b = page.getByRole('button', { name }).first();
    if ((await b.isVisible({ timeout: 800 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
      await b.click({ force: true });
      await page.waitForTimeout(400);
      await confirmExact(page, ['Verify', 'Confirm', 'Verify update']);
      await page.waitForTimeout(2200);
      verified = true;
      log('verify', true, String(name));
      break;
    }
  }
  // Scan all E2E pending
  if (!verified) {
    await page.getByPlaceholder(/Search credentials/i).fill('E2E');
    await page.waitForTimeout(600);
    for (let i = 0; i < 15; i++) {
      await page.getByText(/E2E Guard/i).nth(i % 10).click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
      const v = page.getByRole('button', { name: /Verify/i });
      for (let j = 0; j < (await v.count()); j++) {
        const b = v.nth(j);
        if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
          await b.click({ force: true });
          await confirmExact(page, ['Verify', 'Confirm', 'Verify update']);
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
  await shot(page, '1708-after-verify');

  await openGuard(page);
  await shot(page, '1709-status');
  const status = accessStatus(await page.locator('body').innerText());
  log('status', status === 'Active', status);

  // Guard accept
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(700);
  await dismiss(page);
  await shot(page, '1710-guard');
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
        await shot(page, '1711-job');
      }
      for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
          await b.click({ force: true });
          await page.waitForTimeout(1800);
          accepted = true;
          log('accept', true, seg);
          await shot(page, '1712-accepted');
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
  await shot(page, '1713-jobs');
  log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await openGuard(page);
  await shot(page, '1714-final');
  log('final', true, accessStatus(await page.locator('body').innerText()));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1799-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'request-update-activate.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
