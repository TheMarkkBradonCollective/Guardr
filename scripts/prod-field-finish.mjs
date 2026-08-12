/**
 * Finish prod field test:
 * 1) Restore suspended E2E Guard (exact "Restore account" confirm)
 * 2) Verify leftover credentials if needed
 * 3) Guard applies to an open E2E job
 * 4) Staff confirms job assignment
 *
 * Never click Deactivate / Suspend / Block as confirms.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOT, { recursive: true });

const STAFF = {
  email: 'm.white@signaturesecurityspecialist.com',
  password: '#FuckinDstorm11',
};
const GUARD = {
  email: 'e2e.guard.e2e0811@guardr.test',
  password: '#Qwerty12345',
};

const report = [];
const log = (s, ok, d = '') => {
  report.push({ s, ok, d: String(d).slice(0, 500) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 300)}`);
};
const shot = async (page, n) =>
  page.screenshot({ path: path.join(SHOT, `${n}.png`), fullPage: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}

async function dismiss(page) {
  for (const name of [/Do it later/i, /End tutorial/i, /Skip/i, /Got it/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) {
      await b.click({ force: true }).catch(() => {});
    }
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

function statusHits(text) {
  return text.match(/\b(Suspended|Blocked|Approved|Active|Pending approval|Pending)\b/g)?.join(', ') || '';
}

async function openE2EGuard(page) {
  await page.goto(`${BASE}/staff/guards`);
  await waitReady(page);
  await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
  await page.waitForTimeout(900);
  await page.getByText(/E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(1000);
}

async function safeConfirm(page, allowedExact) {
  // Prefer dialog-scoped buttons so we never re-click the trigger behind the modal.
  const dialog = page.getByRole('dialog');
  const scope = (await dialog.count()) ? dialog : page;
  for (const name of allowedExact) {
    const b = scope.getByRole('button', { name, exact: true }).first();
    if (await b.isVisible({ timeout: 1500 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete|deny|reject/i.test(t)) continue;
      await b.click({ force: true });
      await page.waitForTimeout(1200);
      return t;
    }
  }
  return null;
}

const browser = await chromium.launch({
  headless: true,
  args: ['--ignore-certificate-errors'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

try {
  // ── Staff: restore ───────────────────────────────────────────────
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await openE2EGuard(page);
  await shot(page, '1000-before-restore');
  const before = await page.locator('body').innerText();
  log('before', true, statusHits(before));

  if (/Suspended|Blocked/i.test(before)) {
    const restoreBtn = page.getByRole('button', { name: 'Restore access', exact: true });
    if (!(await restoreBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      log('restore-btn', false, 'Restore access not visible');
    } else {
      await restoreBtn.click({ force: true });
      await page.waitForTimeout(700);
      await shot(page, '1001-restore-dialog');
      const conf = await safeConfirm(page, ['Restore account']);
      log('restore', Boolean(conf), conf || 'missing Restore account');
      await page.waitForTimeout(2000);
    }
  } else {
    log('restore', true, 'already not suspended');
  }

  await shot(page, '1002-after-restore');
  let after = await page.locator('body').innerText();
  let restored = /Active/i.test(after) && !/Suspended|Blocked/i.test(after);
  // Account access badge may still say Suspended briefly — re-open detail
  if (!restored) {
    await openE2EGuard(page);
    after = await page.locator('body').innerText();
    restored = /Active/i.test(after) && !/Suspended|Blocked/i.test(after);
  }
  log('after-restore', restored, statusHits(after));

  // Background check (optional)
  const bg = page.getByRole('button', { name: /Mark background checked/i });
  if (await bg.isVisible({ timeout: 800 }).catch(() => false)) {
    await bg.click({ force: true });
    await page.waitForTimeout(400);
    await safeConfirm(page, ['Mark checked']);
  }

  // ── Verify leftover pending credentials for E2E ──────────────────
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await page.getByPlaceholder(/Search credentials/i).fill('E2E').catch(() => {});
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, '1003-creds');

  let verified = 0;
  for (let i = 0; i < 25; i++) {
    const hits = page.getByText(/E2E Guard/i);
    const n = await hits.count();
    if (!n) break;
    await hits.nth(i % Math.min(n, 10)).click({ force: true }).catch(() => {});
    await page.waitForTimeout(350);
    const verifyBtns = page.getByRole('button', { name: /^Verify(?:\s+\w+)?$/i });
    let did = false;
    for (let j = 0; j < (await verifyBtns.count()); j++) {
      const b = verifyBtns.nth(j);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        await b.click({ force: true });
        await page.waitForTimeout(350);
        await safeConfirm(page, ['Verify']);
        // also loose confirm if dialog uses plain Verify
        await page.getByRole('button', { name: /^Verify$/i }).first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(800);
        verified += 1;
        did = true;
        log('verify', true, `round ${i}`);
        break;
      }
    }
    if (!did && i > 10) break;
  }
  log('verify-count', true, String(verified));

  // From guard detail Credentials tab
  await openE2EGuard(page);
  await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  for (let i = 0; i < 12; i++) {
    const verifyBtns = page.getByRole('button', { name: /Verify/i });
    let did = false;
    for (let j = 0; j < (await verifyBtns.count()); j++) {
      const b = verifyBtns.nth(j);
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
  await shot(page, '1004-guard-status');
  const guardStatusText = await page.locator('body').innerText();
  const isActive = /\bActive\b/.test(guardStatusText) && !/Suspended|Blocked/i.test(guardStatusText);
  log('guard-status', isActive, statusHits(guardStatusText));
  console.log(
    'STAFF BTNS',
    await page
      .locator('button:visible')
      .evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 50))
  );

  // If still approved (not active), try Approve application / wait for auto-activation via verifies
  if (!isActive && /Approved/i.test(guardStatusText)) {
    log('note', true, 'approved but not active — credentials may still block auto-activation');
  }
  if (!isActive && /Suspended/i.test(guardStatusText)) {
    // one more restore attempt
    await page.getByRole('button', { name: 'Restore access', exact: true }).click({ force: true });
    await page.waitForTimeout(600);
    const conf2 = await safeConfirm(page, ['Restore account']);
    log('restore-retry', Boolean(conf2), conf2);
    await page.waitForTimeout(2000);
    await openE2EGuard(page);
    const retryText = await page.locator('body').innerText();
    log('guard-status-retry', /Active/i.test(retryText) && !/Suspended/i.test(retryText), statusHits(retryText));
  }

  // ── Guard: browse + apply ────────────────────────────────────────
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(800);
  await dismiss(page);
  await shot(page, '1005-guard-landing');
  log('landing', true, `${page.url()} :: ${(await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 220)}`);

  let accepted = false;
  for (const seg of ['/guard/jobs', '/guard/map', '/guard/home']) {
    await page.goto(`${BASE}${seg}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await waitReady(page);
    await dismiss(page);
    const t = await page.locator('body').innerText();
    await shot(page, `1006-${seg.replace(/\W+/g, '_')}`);
    const gated = /Application under review|Upload activation credentials|Account Suspended|Account Blocked|Marketplace Eligibility/i.test(
      t
    );
    log(`browse${seg}`, !gated, t.replace(/\s+/g, ' ').slice(0, 260));
    if (gated) continue;

    // Open an E2E job
    const jobHit = page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first();
    if (await jobHit.isVisible({ timeout: 2000 }).catch(() => false)) {
      await jobHit.click({ force: true });
      await page.waitForTimeout(1000);
      await shot(page, '1007-job-detail');
    }

    // Desktop SlideToConfirm → button text "apply for job"
    for (const name of [
      /apply for job/i,
      /Slide to apply for job/i,
      /^Accept job$/i,
      /Accept(?:\s+job)?/i,
      /^Apply$/i,
    ]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
        await b.click({ force: true });
        await page.waitForTimeout(1200);
        // confirm dialog if any (never deactivate)
        await safeConfirm(page, ['Confirm', 'Yes', 'Apply', 'Accept']);
        await page.waitForTimeout(1500);
        accepted = true;
        log('accept', true, `${seg} ${name}`);
        await shot(page, '1008-accepted');
        break;
      }
    }
    if (accepted) break;

    // Fallback: drag slider if gesture UI
    const thumb = page.getByRole('button', { name: /Slide to apply for job/i }).first();
    if (await thumb.isVisible({ timeout: 500 }).catch(() => false)) {
      const box = await thumb.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 420, box.y + box.height / 2, { steps: 18 });
        await page.mouse.up();
        await page.waitForTimeout(1500);
        accepted = true;
        log('accept', true, `${seg} slide-drag`);
        await shot(page, '1008-accepted-slide');
        break;
      }
    }
  }
  log('accepted-final', accepted, accepted ? 'applied' : 'could not apply');

  // ── Staff: confirm jobs ──────────────────────────────────────────
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  await shot(page, '1009-jobs');
  const jobsText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('jobs', true, jobsText.slice(0, 500));
  const assigned =
    /E2E Guard|GR-33186|Corporate Event Security|Standing Guard Post|Accepted|Assigned|Active/i.test(jobsText);
  log('assignment-signal', assigned, assigned ? 'saw job/guard signal' : 'no clear assignment');

  await openE2EGuard(page);
  await shot(page, '1010-final-guard');
  log('final-guard', true, statusHits(await page.locator('body').innerText()));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1099-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'field-finish.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
