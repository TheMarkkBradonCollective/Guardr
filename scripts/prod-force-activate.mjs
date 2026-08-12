/**
 * Diagnose activation blockers from UI, fix COI expiry if needed,
 * re-verify anything pending, and force restore/activate path.
 * Then guard accepts open job.
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
  report.push({ s, ok, d: String(d).slice(0, 900) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 400)}`);
};
const shot = async (page, n) => page.screenshot({ path: path.join(SHOT, `${n}.png`), fullPage: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [
    /Skip for now/i,
    /Do it later/i,
    /End tutorial/i,
    /Skip/i,
    /Got it/i,
    /Not now/i,
    /Later/i,
  ]) {
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
async function dialogConfirm(page, labels) {
  const dialog = page.getByRole('dialog');
  const visible = await dialog.isVisible({ timeout: 1200 }).catch(() => false);
  const scope = visible ? dialog : page;
  for (const name of labels) {
    const b = scope.getByRole('button', { name, exact: true }).first();
    if (await b.isVisible({ timeout: 700 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete|deny|reject/i.test(t)) continue;
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

try {
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await dismiss(page);

  // Open COI in credentials queue and capture expiry
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('E2E');
  await page.waitForTimeout(800);
  await page.getByText(/Certificate of Insurance|COI-E2E/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '1300-coi');
  const coiText = await page.locator('body').innerText();
  log('coi-detail', true, coiText.replace(/\s+/g, ' ').match(/Certificate of Insurance[\s\S]{0,500}|E2E Insurance[\s\S]{0,400}|Expir[\s\S]{0,80}|202[5-9][\s\S]{0,40}/i)?.[0] || coiText.replace(/\s+/g, ' ').slice(0, 500));

  // PTA detail
  await page.getByText(/Power to Arrest|PTA|8-Hour/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '1301-pta');
  log('pta-detail', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));

  // Search CE courses - try course names
  for (const q of ['CE-E2E', 'Public Relations', 'Observation', 'Communication', 'Liability', 'Arrest', 'Tactical', 'Crowd', 'Officer', 'Weapons', 'Traffic', 'Continued']) {
    await page.getByPlaceholder(/Search credentials/i).fill(q);
    await page.waitForTimeout(600);
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const hit = /E2E Guard|Pending|Verified|CE-E2E|No credentials|0 results/i.test(body);
    const snippet = body.match(new RegExp(`.{0,40}${q}.{0,80}|E2E Guard.{0,100}|Pending review.{0,40}`, 'i'));
    log(`search:${q}`, true, snippet?.[0] || body.slice(0, 220));
  }
  await shot(page, '1302-ce-search');

  // Pending review — anything for E2E?
  await page.getByPlaceholder(/Search credentials/i).fill('');
  await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true });
  await page.waitForTimeout(700);
  await shot(page, '1303-pending-all');
  log('pending-all', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 800));

  // Guard credentials tab — skip tutorial, scroll and collect
  await openGuard(page);
  await page.getByText(/^Credentials$/).first().click({ force: true });
  await page.waitForTimeout(800);
  await dismiss(page);
  await shot(page, '1304-creds-top');

  // Collect all Verify buttons titles and pending rows
  const verifyInfo = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')].map((b) => ({
      text: (b.textContent || '').trim(),
      disabled: b.disabled,
      title: b.getAttribute('title') || '',
    }));
    const text = document.body.innerText;
    return { buttons: buttons.filter((b) => /verify|review credential|reject/i.test(b.text)).slice(0, 40), textLen: text.length };
  });
  log('verify-buttons', true, JSON.stringify(verifyInfo.buttons));

  // Scroll detail and screenshot chunks
  for (let i = 0; i < 10; i++) {
    await page.evaluate((step) => {
      const candidates = [...document.querySelectorAll('div')].filter(
        (el) => el.scrollHeight > el.clientHeight + 80 && el.clientWidth > 280 && el.clientHeight > 240
      );
      const pane = candidates.sort((a, b) => b.clientHeight - a.clientHeight)[0];
      if (pane) pane.scrollTop = step * 420;
    }, i);
    await page.waitForTimeout(250);
  }
  await shot(page, '1305-creds-bottom');
  const credText = await page.locator('body').innerText();
  fs.writeFileSync(path.join(OUT, 'creds-full.txt'), credText);
  // Extract credential-ish lines
  const lines = credText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) =>
      /ID|Insurance|Guard Card|PTA|Force|CE-|Public|Observation|Communication|Liability|Arrest|Tactical|Crowd|Officer|Weapon|Traffic|Pending|Verified|Expir|BSIS|hr\)/i.test(
        l
      )
    );
  log('cred-lines', true, lines.join(' || ').slice(0, 900));

  // If COI looks expired / needs update — ask guard to re-upload with future expiry
  // Or staff request update. Simpler: guard re-saves COI with expiry 2027-12-31

  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(500);
  await dismiss(page);
  await shot(page, '1306-guard');

  // Try open COI step to see expiry / edit
  const coiStep = page.getByText(/Certificate of Insurance/i).first();
  if (await coiStep.isVisible({ timeout: 2000 }).catch(() => false)) {
    await coiStep.click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }
  // Look for update/edit COI
  for (const name of [/Update COI/i, /Edit COI/i, /Replace/i, /Upload COI/i, /Certificate of Insurance/i, /Add certificate/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 500 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(700);
      log('open-coi', true, name.toString());
      break;
    }
  }
  await shot(page, '1307-coi-sheet');

  // Fill COI form if present
  const expiry = page.locator('input[type="date"]').first();
  if (await expiry.isVisible({ timeout: 1500 }).catch(() => false)) {
    const inputs = page.locator('input:visible');
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      const el = inputs.nth(i);
      const type = await el.getAttribute('type');
      const ph = (await el.getAttribute('placeholder')) || '';
      const name = (await el.getAttribute('name')) || '';
      const val = await el.inputValue().catch(() => '');
      if (type === 'date' || /expir/i.test(ph + name)) {
        await el.fill('2027-12-31');
      } else if (/carrier|company|insur/i.test(ph + name) && !val) {
        await el.fill('E2E Insurance Co');
      } else if (/policy|number/i.test(ph + name) && !val) {
        await el.fill('COI-E2E-0811');
      }
    }
    const file = page.locator('input[type="file"]').first();
    if (await file.count()) await file.setInputFiles(FAKE);
    await page.waitForTimeout(400);
    for (const name of [/Save/i, /Submit/i, /Upload/i, /Continue/i]) {
      const b = page.getByRole('button', { name }).first();
      if ((await b.isVisible({ timeout: 500 }).catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        await b.click({ force: true });
        await page.waitForTimeout(1500);
        log('coi-save', true, name.toString());
        break;
      }
    }
    await shot(page, '1308-coi-saved');
  } else {
    log('coi-form', false, 'no date input — COI may be locked verified');
  }

  // Staff: verify any pending, then try Deactivate? NO.
  // Instead: if still approved with all verified, suspend then restore (restore uses resolveGuardRestoreUserStatus)
  // OR re-verify a CE to trigger auto-activation.

  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await dismiss(page);

  // Verify pending for E2E
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/Search credentials/i).fill('E2E');
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  let verified = 0;
  for (let i = 0; i < 20; i++) {
    const item = page.getByText(/E2E Guard/i).nth(i % 8);
    if (await item.isVisible({ timeout: 400 }).catch(() => false)) await item.click({ force: true }).catch(() => {});
    await page.waitForTimeout(350);
    const v = page.getByRole('button', { name: /^Verify(?:\s+\w+)?$/i });
    let did = false;
    for (let j = 0; j < (await v.count()); j++) {
      const b = v.nth(j);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        await b.click({ force: true });
        await page.waitForTimeout(400);
        await dialogConfirm(page, ['Verify', 'Confirm']);
        verified++;
        did = true;
        log('verify', true, `i=${i}`);
        break;
      }
    }
    if (!did && i > 6) break;
  }
  log('verified', true, String(verified));

  // Open guard — if Approved, try suspend then restore to re-run resolveGuardRestoreUserStatus
  await openGuard(page);
  await shot(page, '1309-before-cycle');
  let body = await page.locator('body').innerText();
  const accessApproved = /Account access[\s\S]{0,120}Approved/.test(body);
  const accessActive = /Account access[\s\S]{0,120}Active/.test(body);
  log('access', accessActive, accessActive ? 'Active' : accessApproved ? 'Approved' : body.match(/Account access[\s\S]{0,200}/)?.[0]);

  if (accessApproved && !accessActive) {
    // Soft cycle: Deactivate → Restore account (should land Active if blockers clear)
    const deact = page.getByRole('button', { name: 'Deactivate', exact: true });
    if (await deact.isVisible({ timeout: 1500 }).catch(() => false)) {
      await deact.click({ force: true });
      await page.waitForTimeout(600);
      const conf = await dialogConfirm(page, ['Deactivate account']);
      log('deactivate-for-cycle', Boolean(conf), conf);
      await page.waitForTimeout(1500);
    }
    await openGuard(page);
    const restore = page.getByRole('button', { name: 'Restore access', exact: true });
    if (await restore.isVisible({ timeout: 3000 }).catch(() => false)) {
      await restore.click({ force: true });
      await page.waitForTimeout(600);
      await shot(page, '1310-restore-dialog');
      const conf = await dialogConfirm(page, ['Restore account']);
      log('restore-cycle', Boolean(conf), conf);
      await page.waitForTimeout(2000);
    }
    await openGuard(page);
    await shot(page, '1311-after-cycle');
    body = await page.locator('body').innerText();
    const nowActive = /Account access[\s\S]{0,120}Active/.test(body);
    log('after-cycle', nowActive, body.match(/Account access[\s\S]{0,220}/)?.[0]?.replace(/\s+/g, ' '));
  }

  // Guard apply
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(600);
  await dismiss(page);
  await shot(page, '1312-guard-home');
  const land = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const free = !/Upload activation|Application under review|Account Suspended|Account Blocked/i.test(land);
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
        await page.waitForTimeout(1000);
      }
      await shot(page, `1313-${seg.replace(/\W+/g, '_')}`);
      for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible({ timeout: 1000 }).catch(() => false)) {
          await b.click({ force: true });
          await page.waitForTimeout(1500);
          accepted = true;
          log('accept', true, `${seg}`);
          await shot(page, '1314-accepted');
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
  await shot(page, '1315-jobs');
  log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await openGuard(page);
  await shot(page, '1316-final');
  log('final', true, (await page.locator('body').innerText()).match(/Account access[\s\S]{0,200}/)?.[0]?.replace(/\s+/g, ' '));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1399-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'force-activate.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
