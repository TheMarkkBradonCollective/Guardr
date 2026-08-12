/** List all E2E Guard credentials from staff Verified + All filters. */
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
  for (const name of [/Skip for now/i, /Do it later/i, /Skip/i, /Got it/i]) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout: 400 }).catch(() => false)) await b.click({ force: true }).catch(() => {});
  }
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });

await page.goto(`${BASE}/?auth=sign-in&ar=staff`, { waitUntil: 'domcontentloaded' });
await waitReady(page);
await page.locator('input[type="email"]').fill('m.white@signaturesecurityspecialist.com');
await page.locator('input[type="password"]').fill('#FuckinDstorm11');
await page.getByRole('button', { name: 'Sign in', exact: true }).click();
await page.waitForTimeout(3500);
await waitReady(page);
await dismiss(page);

await page.goto(`${BASE}/staff/credentials`);
await waitReady(page);
await dismiss(page);
await page.getByPlaceholder(/Search credentials/i).fill('E2E');
await page.waitForTimeout(1000);

// Click Verified filter via text if role fails
await page.getByText(/^Verified$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(SHOT, '1400-verified.png'), fullPage: true });

// Scroll list and collect unique credential lines mentioning E2E
const collected = new Set();
for (let i = 0; i < 25; i++) {
  const lines = await page.evaluate(() => {
    const t = document.body.innerText;
    return t
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && (l.includes('E2E') || /\(\d+\s*hr\)/i.test(l) || /Guard Card|Insurance|Government|Power to Arrest|Public|Observation|Communication|Liability|Arrest|Tactical|Crowd|Officer|Weapon|Traffic|CE-/i.test(l)));
  });
  for (const l of lines) collected.add(l);
  await page.evaluate(() => {
    const panes = [...document.querySelectorAll('div')].filter(
      (el) => el.scrollHeight > el.clientHeight + 40 && el.clientWidth < 520 && el.clientHeight > 200
    );
    const pane = panes[0] || document.scrollingElement;
    if (pane) pane.scrollTop += 350;
  });
  await page.waitForTimeout(200);
}

// Also All filter
await page.getByText(/^All$/).first().click({ force: true }).catch(() => {});
await page.waitForTimeout(600);
await page.getByPlaceholder(/Search credentials/i).fill('E2E Guard');
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(SHOT, '1401-all-e2e.png'), fullPage: true });
for (let i = 0; i < 30; i++) {
  const lines = await page.evaluate(() =>
    document.body.innerText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  );
  for (const l of lines) {
    if (/E2E|hr\)|Guard Card|Insurance|Government|Power|Public|Observation|Communication|Liability|Arrest|Tactical|Crowd|Officer|Weapon|Traffic|Verified|Pending/i.test(l)) {
      collected.add(l);
    }
  }
  // click successive list items
  const items = page.getByText(/E2E Guard/i);
  const n = await items.count();
  if (n) await items.nth(i % Math.min(n, 20)).click({ force: true }).catch(() => {});
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const panes = [...document.querySelectorAll('div')].filter(
      (el) => el.scrollHeight > el.clientHeight + 40 && el.clientWidth < 520 && el.clientHeight > 200
    );
    if (panes[0]) panes[0].scrollTop += 280;
  });
}

const out = [...collected];
fs.writeFileSync(path.join(OUT, 'e2e-cred-lines.json'), JSON.stringify(out, null, 2));
console.log(out.join('\n'));

// Open guard credentials tab properly
await page.goto(`${BASE}/staff/guards`);
await waitReady(page);
await dismiss(page);
await page.getByPlaceholder(/search/i).first().fill('E2E Guard');
await page.waitForTimeout(800);
await page.getByText(/E2E Guard/i).first().click({ force: true });
await page.waitForTimeout(800);
await dismiss(page);
await page.getByRole('tab', { name: /Credentials/i }).click({ force: true }).catch(async () => {
  await page.locator('button, a, [role="tab"]').filter({ hasText: /^Credentials$/ }).first().click({ force: true });
});
await page.waitForTimeout(1000);
await dismiss(page);
await page.screenshot({ path: path.join(SHOT, '1402-guard-creds.png'), fullPage: true });

// Scroll and dump
let full = '';
for (let i = 0; i < 15; i++) {
  await page.evaluate((step) => {
    const panes = [...document.querySelectorAll('div')].filter(
      (el) => el.scrollHeight > el.clientHeight + 80 && el.clientWidth > 300 && el.clientHeight > 300
    );
    const pane = panes.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    if (pane) pane.scrollTop = step * 400;
  }, i);
  await page.waitForTimeout(200);
  full = await page.locator('body').innerText();
  await page.screenshot({ path: path.join(SHOT, `1403-scroll-${i}.png`) });
}
fs.writeFileSync(path.join(OUT, 'guard-creds-panel.txt'), full);
console.log('\n---PANEL---\n');
console.log(full);

await browser.close();
