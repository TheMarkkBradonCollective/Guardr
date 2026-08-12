/** Dump E2E Guard credential panel + activation support text. */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.guardr.co';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOT, { recursive: true });

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
}
async function dismiss(page) {
  for (const name of [/Do it later/i, /End tutorial/i, /Skip/i, /Got it/i, /Not now/i, /Later/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 300 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
await waitReady(page);
await page.locator('input[type="email"]').fill('m.white@signaturesecurityspecialist.com');
await page.locator('input[type="password"]').fill('#FuckinDstorm11');
await page.getByRole('button', { name: 'Sign in', exact: true }).click();
await page.waitForTimeout(3500);
await waitReady(page);

await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(900);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(1000);

await page.getByText(/^Credentials$/).first().click({ force: true });
await page.waitForTimeout(800);

// Scroll the right detail pane
const detail = page.locator('main, [class*="detail"], body').last();
for (let i = 0; i < 12; i++) {
  await page.evaluate(() => {
    const panes = [...document.querySelectorAll('*')].filter(
      (el) => el.scrollHeight > el.clientHeight + 40 && el.clientHeight > 200
    );
    for (const p of panes.slice(-3)) p.scrollTop = Math.min(p.scrollTop + 500, p.scrollHeight);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SHOT, `1200-creds-${i}.png`), fullPage: false });
}

const text = await page.locator('body').innerText();
fs.writeFileSync(path.join(OUT, 'creds-dump.txt'), text);
console.log('---CREDS DUMP---');
console.log(text);

// Guard-side activation page text for comparison
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
await page.locator('input[type="email"]').fill('e2e.guard.e2e0811@guardr.test');
await page.locator('input[type="password"]').fill('#Qwerty12345');
await page.getByRole('button', { name: 'Sign in', exact: true }).click();
await page.waitForTimeout(3500);
await waitReady(page);
await dismiss(page);
await page.screenshot({ path: path.join(SHOT, '1201-guard-activation.png'), fullPage: true });
const gtext = await page.locator('body').innerText();
fs.writeFileSync(path.join(OUT, 'guard-activation-dump.txt'), gtext);
console.log('---GUARD DUMP---');
console.log(gtext);

await browser.close();
