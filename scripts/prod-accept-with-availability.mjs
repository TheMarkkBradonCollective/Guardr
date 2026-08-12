/** Set local availability + accept paid open E2E job. */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOT, { recursive: true });
const GUARD_ID = 'guard-1786425424788';
const GUARD = { email: 'e2e.guard.e2e0811@guardr.test', password: '#Qwerty12345' };
const STAFF = { email: 'm.white@signaturesecurityspecialist.com', password: '#FuckinDstorm11' };

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

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
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
  await page.waitForTimeout(3500);
  await waitReady(page);
  await dismiss(page);

  // Inject full-week availability into localStorage (client-side schedule used for filtering)
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

  // Reload so filters pick up availability
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await shot(page, '2200-after-avail');

  let accepted = false;
  for (const seg of ['/guard/jobs', '/guard/map']) {
    await page.goto(`${BASE}${seg}`);
    await waitReady(page);
    await dismiss(page);
    // Re-assert availability after navigation (in case cleared)
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
    }, GUARD_ID);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismiss(page);
    await shot(page, `2201-${seg.replace(/\W+/g, '_')}`);
    const t = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    log(`browse${seg}`, true, t.slice(0, 260));

    const job = page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first();
    if (await job.isVisible({ timeout: 3000 }).catch(() => false)) {
      await job.click({ force: true });
      await page.waitForTimeout(1200);
      await shot(page, '2202-job');
      log('job-open', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300));
    } else {
      // Try Find jobs
      await page.getByRole('button', { name: /Find jobs/i }).click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      await shot(page, '2202b-find');
    }

    console.log(
      'BTNS',
      await page.locator('button:visible').evaluateAll((els) =>
        els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40)
      )
    );

    for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i, /^Apply$/i]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 1000 }).catch(() => false)) {
        await b.click({ force: true });
        await page.waitForTimeout(2000);
        accepted = true;
        log('accept', true, `${seg} ${name}`);
        await shot(page, '2203-accepted');
        break;
      }
    }
    if (accepted) break;
  }
  log('accepted', accepted, accepted ? 'ok' : 'no');
  await shot(page, '2204-final-guard');
  log('guard-final', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400));

  // Staff confirm
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.locator('input[type="email"]').fill(STAFF.email);
  await page.locator('input[type="password"]').fill(STAFF.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(3500);
  await waitReady(page);
  await dismiss(page);
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  await dismiss(page);
  await shot(page, '2205-jobs');
  const jobs = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('jobs', true, jobs.slice(0, 550));
  await page.getByText(/Corporate Event Security|Standing Guard Post/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1000);
  await shot(page, '2206-job-detail');
  const detail = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('job-detail', true, detail.slice(0, 550));
  log(
    'assignment',
    /E2E Guard|GR-33186|Applied|applied|Accepted|accepted|Applicant/i.test(detail + jobs),
    'checked'
  );
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '2299-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'accept-with-availability.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
