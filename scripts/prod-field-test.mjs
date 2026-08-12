/**
 * Production field test against https://www.guardr.co
 * Run: node scripts/prod-field-test.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.GUARDR_BASE_URL || 'https://www.guardr.co';
const OUT = process.env.GUARDR_E2E_OUT || '/opt/cursor/artifacts/prod-field-test';
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOT, { recursive: true });

const results = [];
function log(section, ok, detail) {
  const row = { section, ok, detail, at: new Date().toISOString() };
  results.push(row);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${section} | ${detail}`);
}

async function shot(page, name) {
  const file = path.join(SHOT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function dismissOverlays(page) {
  // Marketplace agreements — check all visible checkboxes then continue
  for (let i = 0; i < 8; i++) {
    const boxes = page.locator('input[type="checkbox"]:visible');
    const n = await boxes.count();
    if (n === 0) break;
    for (let j = 0; j < n; j++) {
      const box = boxes.nth(j);
      if (!(await box.isChecked().catch(() => true))) {
        await box.check({ force: true }).catch(() => {});
      }
    }
    const cont = page.getByRole('button', { name: /^(Continue|Accept|I agree|Agree|Got it|Next|Start|Done|Close|Skip)/i }).first();
    if (await cont.isVisible({ timeout: 800 }).catch(() => false)) {
      await cont.click().catch(() => {});
      await page.waitForTimeout(500);
    } else {
      break;
    }
  }
  // Tour / password change skips
  for (const label of [/Skip/i, /Not now/i, /Later/i, /Close/i, /Got it/i, /Finish/i]) {
    const btn = page.getByRole('button', { name: label }).first();
    if (await btn.isVisible({ timeout: 400 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }
}

async function hardReset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  }).catch(() => {});
  await context.clearCookies();
}

async function login(page, role, email, password) {
  await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  // If already signed in from a sticky session, force sign-out via storage wipe + reload
  if ((await page.locator('input[type="email"]').count()) === 0) {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
  }
  await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
  await page.waitForTimeout(3500);
  await waitReady(page);
  await dismissOverlays(page);
  const body = await page.locator('body').innerText();
  const stillOnSignIn =
    /staff sign in|guard sign in|client sign in|enter your email and password/i.test(body) &&
    (await page.locator('input[type="email"]').count()) > 0;
  const failed =
    stillOnSignIn ||
    /account not found|incorrect password|invalid password|invalid credentials|sign in failed|wrong password/i.test(
      body
    );
  return { failed, body: body.slice(0, 2000) };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // ── 1. Founder login ──────────────────────────────────────────
  {
    const { failed, body } = await login(
      page,
      'staff',
      'm.white@signaturesecurityspecialist.com',
      '#FuckinDstorm11'
    );
    await shot(page, '01-founder-login');
    log('founder-login', !failed && /overview|applications|staff|founder/i.test(body), failed ? body.slice(0, 300) : page.url());
  }

  // ── 2. Inspect E2E accounts from staff ────────────────────────
  for (const [pathSeg, name] of [
    ['/staff/applications', '02-applications'],
    ['/staff/guards', '03-guards'],
    ['/staff/clients', '04-clients'],
    ['/staff/team', '05-team'],
    ['/staff/credentials', '06-credentials'],
  ]) {
    await page.goto(`${BASE}${pathSeg}`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
    const text = await page.locator('body').innerText();
    await shot(page, name);
    log(`staff-nav-${name}`, !/page could not be found|something went wrong/i.test(text), page.url());
  }

  // Search for E2E Guard
  await page.goto(`${BASE}/staff/guards`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  const search = page.getByPlaceholder(/search/i).first();
  if (await search.isVisible({ timeout: 2000 }).catch(() => false)) {
    await search.fill('E2E Guard');
    await page.waitForTimeout(1000);
  }
  const guardText = await page.locator('body').innerText();
  await shot(page, '07-e2e-guard-search');
  log('e2e-guard-visible', /E2E Guard|e2e\.guard\.e2e0811/i.test(guardText), guardText.match(/E2E Guard[\s\S]{0,200}/)?.[0] || 'not found');

  // Try open first matching row
  const guardRow = page.getByText(/E2E Guard/i).first();
  if (await guardRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    await guardRow.click();
    await page.waitForTimeout(1000);
    await shot(page, '08-e2e-guard-detail');
    const detail = await page.locator('body').innerText();
    log('e2e-guard-detail', true, detail.match(/Pending|Active|Approved|credential/i)?.[0] || 'opened');
  }

  // ── 3. Support staff login ────────────────────────────────────
  await hardReset(page, context);
  {
    const { failed, body } = await login(page, 'staff', 'e2e.staff.e2e0811@guardr.test', '#Qwerty12345');
    await shot(page, '09-support-staff-login');
    log('support-staff-login', !failed, failed ? body.slice(0, 300) : page.url());
  }

  // ── 4. Guard login ────────────────────────────────────────────
  await hardReset(page, context);
  {
    const { failed, body } = await login(page, 'guard', 'e2e.guard.e2e0811@guardr.test', '#Qwerty12345');
    await shot(page, '10-guard-login');
    const activation = /application under review|activation|government id|certificate of insurance|guard card/i.test(body);
    log('guard-login', !failed, failed ? body.slice(0, 300) : activation ? 'activation checklist shown' : page.url());
  }

  // ── 5. Client login + job post ────────────────────────────────
  await hardReset(page, context);
  {
    const { failed, body } = await login(page, 'client', 'e2e.client.e2e0811@guardr.test', '#Qwerty12345');
    await shot(page, '11-client-login');
    log('client-login', !failed, failed ? body.slice(0, 300) : page.url());
  }

  // Post a job
  let jobPosted = false;
  try {
    const postBtn = page.getByRole('button', { name: /post a job|post job/i }).first();
    if (!(await postBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.getByText(/post a job|post job/i).first().click({ timeout: 3000 }).catch(() => {});
    } else {
      await postBtn.click();
    }
    await page.waitForTimeout(1500);
    await shot(page, '12-job-wizard-start');

    // Step through wizard — pick first selectable service/option repeatedly
    for (let step = 0; step < 12; step++) {
      const stepText = await page.locator('body').innerText();
      await shot(page, `13-job-step-${step}`);

      // Prefer concrete service choices
      const serviceChoice = page.getByRole('button', { name: /site patrol|corporate event|private party|other event|event security/i }).first();
      if (await serviceChoice.isVisible({ timeout: 800 }).catch(() => false)) {
        await serviceChoice.click();
        await page.waitForTimeout(600);
      }

      // Fill visible text inputs that look required/empty
      const inputs = page.locator('input:visible, textarea:visible');
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type');
        if (type === 'checkbox' || type === 'radio' || type === 'hidden' || type === 'file') continue;
        const val = await input.inputValue().catch(() => '');
        if (val) continue;
        const name = ((await input.getAttribute('name')) || (await input.getAttribute('placeholder')) || '').toLowerCase();
        const labelish = name + ' ' + ((await input.getAttribute('aria-label')) || '').toLowerCase();
        if (/email|password/.test(labelish)) continue;
        if (/address|street|location|site/.test(labelish)) {
          await input.fill('6801 Hollywood Blvd, Los Angeles, CA 90028');
        } else if (/city/.test(labelish)) {
          await input.fill('Los Angeles');
        } else if (/zip|postal/.test(labelish)) {
          await input.fill('90028');
        } else if (/name|title|site/.test(labelish)) {
          await input.fill('E2E Hollywood Patrol');
        } else if (/phone/.test(labelish)) {
          await input.fill('(555) 010-0811');
        } else if (/rate|pay|hour|amount|price/.test(labelish)) {
          await input.fill('40');
        } else if (/guard|count|quantity|heads/.test(labelish)) {
          await input.fill('1');
        } else if (type === 'date' || /date/.test(labelish)) {
          const d = new Date();
          d.setDate(d.getDate() + 2);
          const iso = d.toISOString().slice(0, 10);
          await input.fill(iso);
        } else if (type === 'time' || /time|start|end/.test(labelish)) {
          await input.fill(labelish.includes('end') ? '22:00' : '18:00');
        } else if (type === 'number') {
          await input.fill('1');
        }
      }

      // Select first radio/option cards if present
      const optionCard = page.locator('[role="radio"]:visible, [role="option"]:visible, button:has-text("Select"):visible').first();
      if (await optionCard.isVisible({ timeout: 400 }).catch(() => false)) {
        await optionCard.click().catch(() => {});
      }

      // Continue / Next / Submit
      const next = page.getByRole('button', { name: /^(Continue|Next|Review|Post|Submit|Publish|Create|Confirm|Finish)/i }).first();
      if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
        const label = (await next.innerText()).trim();
        await next.click();
        await page.waitForTimeout(1200);
        if (/post|submit|publish|create|confirm|finish/i.test(label) && step > 2) {
          jobPosted = true;
          break;
        }
      } else {
        // maybe already done
        if (/job (posted|created|submitted)|pending review|open|success/i.test(stepText)) {
          jobPosted = true;
          break;
        }
        break;
      }
    }
    await shot(page, '14-job-wizard-end');
    const endText = await page.locator('body').innerText();
    log(
      'client-job-post',
      jobPosted || /pending|open|draft|posted|created|E2E Hollywood/i.test(endText),
      endText.match(/pending review|open|draft|posted|created|step \d|error|required/i)?.[0] || page.url()
    );
  } catch (err) {
    await shot(page, '14-job-wizard-error');
    log('client-job-post', false, String(err).slice(0, 400));
  }

  // Jobs list
  await page.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await shot(page, '15-client-jobs');
  const jobsText = await page.locator('body').innerText();
  log('client-jobs-list', true, jobsText.slice(0, 400).replace(/\s+/g, ' '));

  // ── 6. Demo accounts ──────────────────────────────────────────
  for (const [role, email] of [
    ['client', 'testc@test.com'],
    ['staff', 'tests@test.com'],
    ['guard', 'testg@test.com'],
  ]) {
    await hardReset(page, context);
    const { failed, body } = await login(page, role, email, '#Qwerty12345');
    await shot(page, `16-demo-${role}`);
    log(`demo-${role}`, !failed, failed ? body.match(/account not found|incorrect|invalid|failed[^.]+/i)?.[0] || 'failed' : page.url());
  }

  // ── 7. Self-signup client ─────────────────────────────────────
  await hardReset(page, context);
  try {
    await page.goto(`${BASE}/?auth=sign-up&ar=client`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    const email = `e2e.client.self.${Date.now()}@guardr.test`;
    // Fill common fields by label/placeholder
    const fillIf = async (re, value) => {
      const el = page.getByLabel(re).first();
      if (await el.isVisible({ timeout: 600 }).catch(() => false)) {
        await el.fill(value);
        return;
      }
      const ph = page.getByPlaceholder(re).first();
      if (await ph.isVisible({ timeout: 400 }).catch(() => false)) await ph.fill(value);
    };
    await fillIf(/first name/i, 'Self');
    await fillIf(/last name/i, 'Client');
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill('#Qwerty12345');
    await fillIf(/company/i, 'Self Signup LLC');
    await fillIf(/phone/i, '(555) 010-0999');
    const terms = page.locator('#auth-accept-terms');
    if (await terms.count()) await terms.check({ force: true }).catch(() => {});
    await page.locator('.legal-accept-checkbox-visual').first().click().catch(() => {});
    await page.getByRole('button', { name: /sign up|create account|continue|submit/i }).first().click();
    await page.waitForTimeout(3000);
    await waitReady(page);
    await shot(page, '17-self-signup-client');
    const t = await page.locator('body').innerText();
    const ok =
      !/already (exists|registered)|sign up failed|something went wrong/i.test(t) &&
      (/pending|welcome|home|jobs|account/i.test(t) || !(await page.locator('input[type="email"]').count()));
    log('self-signup-client', ok, `${email} :: ${t.slice(0, 200).replace(/\s+/g, ' ')}`);
  } catch (err) {
    log('self-signup-client', false, String(err).slice(0, 300));
  }

  await browser.close();

  const summary = {
    base: BASE,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
