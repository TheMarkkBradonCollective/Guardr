import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/End tutorial/i, /Skip/i, /Got it/i, /Close/i, /Not now/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
  const boxes = page.locator('input[type="checkbox"]:visible');
  for (let j = 0; j < (await boxes.count()); j++) {
    const b = boxes.nth(j);
    if (!(await b.isChecked().catch(() => true))) await b.check({ force: true }).catch(() => {});
  }
  const cont = page.getByRole('button', { name: /^(Continue|Accept|I agree|Agree)$/i }).first();
  if (await cont.isVisible({ timeout: 400 }).catch(() => false)) await cont.click({ force: true }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
}
async function reset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
}
async function login(page, role, email, password) {
  await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (!(await page.locator('input[type="email"]').count())) {
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
    await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(3000);
  await waitReady(page);
  await dismiss(page);
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();
const report = { accounts: {}, flows: {} };

// Client jobs detail
await reset(page, context);
await login(page, 'client', 'e2e.client.e2e0811@guardr.test', '#Qwerty12345');
await dismiss(page);
await page.goto(`${BASE}/client/jobs`);
await waitReady(page);
await dismiss(page);
await page.screenshot({ path: `${OUT}/screenshots/70-client-jobs.png`, fullPage: true });
let body = await page.locator('body').innerText();
report.flows.clientJobs = body.replace(/\s+/g, ' ').slice(0, 800);

// Click first job row if present
const jobTitle = page.getByText(/Corporate Event Security|E2E|Hollywood|Patrol|Security/i).first();
if (await jobTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
  await jobTitle.click({ force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/screenshots/71-client-job-detail.png`, fullPage: true });
  report.flows.clientJobDetail = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 800);
}

// Staff jobs / applications
await reset(page, context);
await login(page, 'staff', 'm.white@signaturesecurityspecialist.com', '#FuckinDstorm11');
await dismiss(page);
await page.goto(`${BASE}/staff/jobs`);
await waitReady(page);
await dismiss(page);
await page.screenshot({ path: `${OUT}/screenshots/72-staff-jobs.png`, fullPage: true });
report.flows.staffJobs = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 800);

// Try open the job
const staffJob = page.getByText(/Corporate Event Security|E2E|Hollywood/i).first();
if (await staffJob.isVisible({ timeout: 2000 }).catch(() => false)) {
  await staffJob.click({ force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/screenshots/73-staff-job-detail.png`, fullPage: true });
  report.flows.staffJobDetail = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 800);
  // Approve / publish if available
  for (const name of [/Approve/i, /Publish/i, /Open marketplace/i, /Release/i, /Mark open/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 600 }).catch(() => false)) {
      await b.click({ force: true });
      await page.waitForTimeout(800);
      await page.getByRole('button', { name: /^Confirm$|^Yes$|^Approve$/i }).first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(800);
      report.flows.staffJobAction = name.toString();
      break;
    }
  }
  await page.screenshot({ path: `${OUT}/screenshots/74-staff-job-after.png`, fullPage: true });
}

// Account matrix re-check
for (const [role, email, key] of [
  ['client', 'e2e.client.e2e0811@guardr.test', 'e2eClient'],
  ['guard', 'e2e.guard.e2e0811@guardr.test', 'e2eGuard'],
  ['staff', 'e2e.staff.e2e0811@guardr.test', 'e2eStaff'],
  ['staff', 'm.white@signaturesecurityspecialist.com', 'founder'],
]) {
  await reset(page, context);
  await login(page, role, email, role === 'staff' && email.startsWith('m.') ? '#FuckinDstorm11' : '#Qwerty12345');
  await dismiss(page);
  body = await page.locator('body').innerText();
  const ok = !(await page.locator('input[type="email"]').count()) || !/sign in/i.test(body.slice(0, 200));
  report.accounts[key] = {
    email,
    ok,
    url: page.url(),
    hint: body.match(/Application under review|Welcome|Overview|Pending|Active|Home/i)?.[0] || body.slice(0, 80),
  };
  await page.screenshot({ path: `${OUT}/screenshots/75-${key}.png` });
}

await browser.close();
fs.writeFileSync(`${OUT}/verify-report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
