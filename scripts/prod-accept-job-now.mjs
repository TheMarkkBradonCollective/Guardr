/** Guard is Active — accept an open E2E job and confirm in staff Jobs. */
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

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

try {
  // Staff confirm Active
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/guards`);
  await waitReady(page);
  await dismiss(page);
  await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
  await page.waitForTimeout(900);
  await page.getByText(/E2E Guard/i).first().click({ force: true });
  await page.waitForTimeout(1000);
  await dismiss(page);
  await shot(page, '2100-staff-active');
  const staffBody = await page.locator('body').innerText();
  const active = /Account access[\s\S]{0,100}\bActive\b/.test(staffBody);
  log('staff-active', active, staffBody.match(/Account access[\s\S]{0,200}/)?.[0]?.replace(/\s+/g, ' '));

  // Guard browse + accept
  await reset(page, context);
  await login(page, 'guard', GUARD.email, GUARD.password);
  await dismiss(page);
  await page.waitForTimeout(800);
  await dismiss(page);
  await shot(page, '2101-guard-home');
  const land = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const free = !/Upload activation credentials|Application under review|Account Suspended|Account Blocked/i.test(land);
  log('guard-free', free, `${page.url()} :: ${land.slice(0, 300)}`);

  let accepted = false;
  for (const seg of ['/guard/jobs', '/guard/map', '/guard/home']) {
    await page.goto(`${BASE}${seg}`);
    await waitReady(page);
    await dismiss(page);
    await shot(page, `2102-${seg.replace(/\W+/g, '_')}`);
    const t = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    log(`browse${seg}`, !/Upload activation|Application under review/i.test(t), t.slice(0, 220));

    const job = page.getByText(/Corporate Event Security|Standing Guard Post|Hollywood/i).first();
    if (await job.isVisible({ timeout: 2500 }).catch(() => false)) {
      await job.click({ force: true });
      await page.waitForTimeout(1200);
      await shot(page, '2103-job');
    }
    console.log(
      'BTNS',
      await page.locator('button:visible').evaluateAll((els) =>
        els.map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40)
      )
    );
    for (const name of [/apply for job/i, /Slide to apply for job/i, /^Accept job$/i, /^Apply$/i]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 900 }).catch(() => false)) {
        await b.click({ force: true });
        await page.waitForTimeout(2000);
        accepted = true;
        log('accept', true, `${seg} ${name}`);
        await shot(page, '2104-accepted');
        break;
      }
    }
    if (accepted) break;
  }
  log('accepted', accepted, accepted ? 'ok' : 'no');
  await shot(page, '2105-after-accept');
  log('after-accept', true, (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 400));

  // Staff jobs
  await reset(page, context);
  await login(page, 'staff', STAFF.email, STAFF.password);
  await page.goto(`${BASE}/staff/jobs`);
  await waitReady(page);
  await dismiss(page);
  await shot(page, '2106-jobs');
  const jobs = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('jobs', true, jobs.slice(0, 550));
  await page.getByText(/Corporate Event Security|Standing Guard Post/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(1000);
  await shot(page, '2107-job-detail');
  const detail = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  log('job-detail', true, detail.slice(0, 550));
  const assigned = /E2E Guard|GR-33186|applied|Applied|accepted|Accepted|assigned/i.test(detail + jobs);
  log('assignment', assigned, assigned ? 'signal found' : 'no signal');
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await shot(page, '2199-fatal').catch(() => {});
} finally {
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'accept-job-now.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
