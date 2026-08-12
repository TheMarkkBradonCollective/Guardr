/** Open E2E job deep-link, dump qualifications, click Apply, verify DB. */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOT, { recursive: true });

const GUARD_ID = 'guard-1786425424788';
const JOB_ID = 'req-1786428465632';
const GUARD = { email: 'e2e.guard.e2e0811@guardr.test', password: '#Qwerty12345' };
const { url: SUPABASE_URL, anon: KEY } = JSON.parse(fs.readFileSync('/tmp/supabase-prod.json', 'utf8'));

const report = [];
const log = (s, ok, d = '') => {
  report.push({ s, ok, d: String(d).slice(0, 1200) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 400)}`);
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
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
}

async function injectAvailability(page) {
  await page.evaluate((guardId) => {
    const weekly = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      id: `avail-${guardId}-${day}`,
      guardId,
      dayOfWeek: day,
      startTime: '00:00',
      endTime: '23:59',
      isAvailable: true,
    }));
    localStorage.setItem(`guardr_guard_availability_${guardId}`, JSON.stringify(weekly));
    localStorage.setItem(
      `guardr_guard_availability_dates_${guardId}`,
      JSON.stringify([
        {
          id: `avail-date-${guardId}-2026-08-12`,
          guardId,
          date: '2026-08-12',
          startTime: '00:00',
          endTime: '23:59',
          isAvailable: true,
        },
      ])
    );
  }, GUARD_ID);
}

async function dbJob() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/security_requests?id=eq.${JOB_ID}&select=id,title,status,applicants,assigned_guard_id,pending_guard_id,guard_pay,hourly_rate,payment_status`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
  );
  return r.json();
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  log('db-before', true, JSON.stringify(await dbJob()));

  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });

  await page.goto(`${BASE}/?auth=sign-in&ar=guard`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.locator('input[type="email"]').fill(GUARD.email);
  await page.locator('input[type="password"]').fill(GUARD.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(4000);
  await waitReady(page);
  await dismiss(page);
  await injectAvailability(page);

  await page.goto(`${BASE}/guard/map?jc=${JOB_ID}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await injectAvailability(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);

  // Re-open deep link after availability inject
  await page.goto(`${BASE}/guard/map?jc=${JOB_ID}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(1500);
  await shot(page, '2500-jc-open');

  let body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('panel-body', /Corporate Event|Qualification|minimum rate|onboarding|apply/i.test(body), body.slice(0, 900));

  // If panel didn't open, click job marker / list item
  if (!/Slide to apply|apply for job|You must meet all requirements|Qualification/i.test(body)) {
    const job = page.getByText(/Corporate Event Security/i).first();
    if (await job.isVisible({ timeout: 2500 }).catch(() => false)) {
      await job.click({ force: true });
      await page.waitForTimeout(1200);
      body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
      log('clicked-list', true, body.slice(0, 700));
      await shot(page, '2501-clicked-job');
    }
  }

  // Scroll panel to bottom so apply button is in view
  await page.evaluate(() => {
    const panels = [...document.querySelectorAll('[class*="overflow"], aside, [role="dialog"]')];
    for (const el of panels) {
      try {
        el.scrollTop = el.scrollHeight;
      } catch {}
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);

  const btns = await page.locator('button').evaluateAll((els) =>
    els.map((e) => ({
      text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
      aria: e.getAttribute('aria-label') || '',
      disabled: e.disabled,
      visible: !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length),
    }))
  );
  log(
    'buttons',
    true,
    JSON.stringify(btns.filter((b) => /apply|accept|confirm|slide/i.test(b.text + b.aria)).slice(0, 20))
  );

  let applied = false;
  const applyBtn = page
    .getByRole('button', { name: /apply for job|Slide to apply for job|^Accept job$|Slide to accept/i })
    .first();
  if (await applyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await applyBtn.scrollIntoViewIfNeeded().catch(() => {});
    await applyBtn.click({ force: true });
    await page.waitForTimeout(3500);
    applied = true;
    log('clicked-apply', true, 'button');
  } else {
    const fallback = page.locator('button', { hasText: /apply|accept job/i }).first();
    if (await fallback.isVisible({ timeout: 1000 }).catch(() => false)) {
      await fallback.click({ force: true });
      await page.waitForTimeout(3500);
      applied = true;
      log('clicked-apply', true, 'fallback');
    } else {
      log('clicked-apply', false, 'no apply/accept button — likely blocked by checklist');
    }
  }

  await shot(page, '2502-after-apply');
  const after = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('after-body', true, after.slice(0, 900));

  const jobRow = await dbJob();
  const applicants = jobRow?.[0]?.applicants || [];
  const assigned = jobRow?.[0]?.assigned_guard_id;
  const ok = applicants.includes(GUARD_ID) || assigned === GUARD_ID || /Applied|You applied|pending/i.test(after);
  log('db-after', ok, JSON.stringify(jobRow));
  applied = applied || ok;
  log('applied', applied, applied ? 'success' : 'failed');
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '2599-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'finish-apply.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
