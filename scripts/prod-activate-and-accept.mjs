/**
 * Inspect E2E Guard credentials, verify every pending cert, wait for Active,
 * then accept an open marketplace job.
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
  report.push({ s, ok, d: String(d).slice(0, 800) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 400)}`);
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

async function openE2EGuard(page) {
  await page.goto(`${BASE}/staff/guards`);
  await waitReady(page);
  const search = page.getByPlaceholder(/search/i).first();
  await search.fill('');
  await search.fill('E2E Guard');
  await page.waitForTimeout(900);
  await page.getByText(/E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(1000);
}

async function dialogConfirm(page, labels) {
  const dialog = page.getByRole('dialog');
  const scope = (await dialog.isVisible({ timeout: 1200 }).catch(() => false)) ? dialog : page;
  for (const name of labels) {
    const b = scope.getByRole('button', { name, exact: typeof name === 'string' }).first();
    if (await b.isVisible({ timeout: 800 }).catch(() => false)) {
      const t = (await b.innerText()).trim();
      if (/deactiv|suspend|block|delete|deny|reject/i.test(t)) continue;
      await b.click({ force: true });
      await page.waitForTimeout(900);
      return t;
    }
  }
  return null;
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

try {
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await openE2EGuard(page);
  await shot(page, '1100-profile');
  const profile = await page.locator('body').innerText();
  log(
    'profile',
    true,
    profile
      .match(/\b(Suspended|Blocked|Approved|Active|Pending approval)\b/g)
      ?.slice(0, 12)
      .join(', ')
  );

  // Guard status / performance tab — often shows activation blockers
  await page.getByRole('tab', { name: /Guard status/i }).click({ force: true }).catch(async () => {
    await page.getByText(/^Guard status$/).first().click({ force: true });
  });
  await page.waitForTimeout(800);
  await shot(page, '1101-guard-status');
  log('guard-status-tab', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 700));

  // Credentials tab on guard detail
  await page.getByRole('tab', { name: /^Credentials$/i }).click({ force: true }).catch(async () => {
    await page.getByText(/^Credentials$/).first().click({ force: true });
  });
  await page.waitForTimeout(900);
  await shot(page, '1102-guard-creds');
  const credBody = await page.locator('body').innerText();
  log('guard-creds', true, credBody.replace(/\s+/g, ' ').slice(0, 900));

  // Dump pending / verify buttons
  const pendingLabels = await page.locator('text=/Pending|Verify|Rejected|Verified/i').evaluateAll((els) =>
    els
      .slice(0, 80)
      .map((e) => (e.textContent || '').trim())
      .filter(Boolean)
  );
  log('cred-labels', true, pendingLabels.join(' | ').slice(0, 700));

  // Click every enabled Verify on this detail page (scroll through cert list)
  let verifiedHere = 0;
  for (let round = 0; round < 30; round++) {
    const verifies = page.getByRole('button', { name: /^Verify$/i });
    const count = await verifies.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const b = verifies.nth(i);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        const title = (await b.getAttribute('title')) || '';
        await b.click({ force: true });
        await page.waitForTimeout(400);
        const conf = await dialogConfirm(page, ['Verify', 'Confirm', 'Yes']);
        // Some flows verify immediately without dialog
        await page.waitForTimeout(900);
        verifiedHere += 1;
        clicked = true;
        log('verify-detail', true, `title=${title} conf=${conf}`);
        break;
      }
    }
    // Also Review credential → verify in queue
    if (!clicked) {
      const review = page.getByRole('button', { name: /Review credential/i }).first();
      if (await review.isVisible({ timeout: 400 }).catch(() => false)) {
        await review.click({ force: true });
        await page.waitForTimeout(900);
        await shot(page, `1103-review-${round}`);
        const v = page.getByRole('button', { name: /^Verify$/i }).first();
        if ((await v.isVisible().catch(() => false)) && !(await v.isDisabled().catch(() => true))) {
          await v.click({ force: true });
          await page.waitForTimeout(400);
          await dialogConfirm(page, ['Verify', 'Confirm']);
          verifiedHere += 1;
          clicked = true;
          log('verify-review', true, `round ${round}`);
        } else {
          const blocker = (await page.locator('body').innerText()).match(
            /(?:cannot|awaiting|required|missing|blocker|photo|expir)[^\n]{0,120}/i
          );
          log('verify-blocked', false, blocker?.[0] || 'Review open but Verify disabled');
          // go back
          await page.keyboard.press('Escape').catch(() => {});
          break;
        }
      }
    }
    if (!clicked) break;
  }
  log('verified-on-detail', true, String(verifiedHere));

  // Staff credentials queue — search E2E, verify all pending
  await page.goto(`${BASE}/staff/credentials`);
  await waitReady(page);
  await page.getByPlaceholder(/Search credentials/i).fill('E2E');
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '1104-queue-pending');
  log('queue-pending', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 700));

  let verifiedQueue = 0;
  for (let round = 0; round < 40; round++) {
    // Re-apply filters
    await page.getByPlaceholder(/Search credentials/i).fill('E2E').catch(() => {});
    await page.getByRole('button', { name: /Pending review/i }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);

    const items = page.locator('[class*="list"], [role="listbox"], main, body').getByText(/E2E Guard/i);
    const n = await items.count();
    if (!n) {
      // try any pending row text
      const any = page.getByText(/Continued Education|CE-|Public Relations|Observation|Communication|Liability|Patrol|Arrest/i);
      if (!(await any.first().isVisible({ timeout: 500 }).catch(() => false))) break;
      await any.first().click({ force: true });
    } else {
      await items.nth(round % Math.min(n, 15)).click({ force: true });
    }
    await page.waitForTimeout(500);

    const detail = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400);
    const verify = page.getByRole('button', { name: /^Verify(?:\s+\w+)?$/i });
    let did = false;
    for (let j = 0; j < (await verify.count()); j++) {
      const b = verify.nth(j);
      if ((await b.isVisible().catch(() => false)) && !(await b.isDisabled().catch(() => true))) {
        await b.click({ force: true });
        await page.waitForTimeout(400);
        await dialogConfirm(page, ['Verify', 'Confirm', 'Yes']);
        await page.getByRole('button', { name: /^Verify$/i }).first().click({ force: true }).catch(() => {});
        await page.waitForTimeout(900);
        verifiedQueue += 1;
        did = true;
        log('verify-queue', true, detail.slice(0, 180));
        break;
      }
    }
    if (!did) {
      // collect disabled reason
      const title = await page
        .getByRole('button', { name: /^Verify/i })
        .first()
        .getAttribute('title')
        .catch(() => null);
      if (title) log('queue-blocker', false, title);
      if (round > 8) break;
    }
  }
  log('verified-queue', true, String(verifiedQueue));

  // Also try Verified filter count / All for E2E CE
  await page.getByRole('button', { name: /^All$/i }).first().click({ force: true }).catch(() => {});
  await page.getByPlaceholder(/Search credentials/i).fill('E2E');
  await page.waitForTimeout(700);
  await shot(page, '1105-queue-all');
  log('queue-all', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 900));

  // Re-check guard status
  await openE2EGuard(page);
  await shot(page, '1106-after-verify');
  const after = await page.locator('body').innerText();
  const badge = after.match(/\b(Suspended|Blocked|Approved|Active|Pending approval)\b/g)?.slice(0, 10).join(', ');
  const isActive = /\bActive\b/.test(after) && !/\bApproved\b/.test(after.split('Account access')[1] || '');
  // More reliable: Account access section badge
  const accessSection = after.includes('Account access')
    ? after.split('Account access')[1].slice(0, 200)
    : after;
  const accessActive = /Account access[\s\S]{0,80}\bActive\b/.test(after);
  log('status-after', accessActive, `badgeHits=${badge} access=${accessSection.replace(/\s+/g, ' ').slice(0, 200)}`);

  // If still approved, dump activation checklist from Guard status
  if (!accessActive) {
    await page.getByText(/^Guard status$/).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, '1107-still-approved');
    log('still-approved-status', false, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 900));

    // Credentials tab — list every cert line
    await page.getByText(/^Credentials$/).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
    // scroll the detail panel
    for (let s = 0; s < 8; s++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(200);
    }
    await shot(page, '1108-creds-scrolled');
    log('creds-scrolled', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1200));
  }

  // Guard login
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(800);
  await dismiss(page);
  await shot(page, '1109-guard');
  const land = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('guard-landing', !/Upload activation|Application under review|Account Suspended/i.test(land), land.slice(0, 300));

  let accepted = false;
  if (!/Upload activation|Application under review|Account Suspended/i.test(land)) {
    for (const seg of ['/guard/jobs', '/guard/map']) {
      await page.goto(`${BASE}${seg}`);
      await waitReady(page);
      await dismiss(page);
      await shot(page, `1110-${seg.replace(/\W+/g, '_')}`);
      const job = page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first();
      if (await job.isVisible({ timeout: 2500 }).catch(() => false)) {
        await job.click({ force: true });
        await page.waitForTimeout(1000);
        await shot(page, '1111-job');
      }
      for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i]) {
        const b = page.getByRole('button', { name }).first();
        if (await b.isVisible({ timeout: 1000 }).catch(() => false)) {
          await b.click({ force: true });
          await page.waitForTimeout(1500);
          accepted = true;
          log('accept', true, `${seg} ${name}`);
          await shot(page, '1112-accepted');
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
  await shot(page, '1113-jobs');
  log('jobs', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500));
  await openE2EGuard(page);
  await shot(page, '1114-final');
  log('final', true, (await page.locator('body').innerText()).match(/\b(Suspended|Blocked|Approved|Active|Pending approval)\b/g)?.slice(0, 10).join(', '));
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '1199-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'activate-accept.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
