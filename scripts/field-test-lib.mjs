/**
 * Shared Playwright helpers for site-only field tests.
 * No Supabase REST calls — tests must run entirely through the app UI.
 */
import fs from 'node:fs';
import path from 'node:path';

export const BASE = process.env.GUARDR_BASE_URL || 'https://www.guardr.co';
export const OUT = process.env.GUARDR_FIELD_TEST_OUT || '/opt/cursor/artifacts/field-test';
export const SHOT = path.join(OUT, 'screenshots');
export const FIELD_TEST_PASSWORD = process.env.FIELD_TEST_PASSWORD || '#FieldTest2026';
export const STAFF_EMAIL = process.env.FIELD_TEST_STAFF_EMAIL || 'staff@guardr.co';
export const STAFF_PASSWORD = process.env.FIELD_TEST_STAFF_PASSWORD || '#FieldTestStaff2026';
/** Password assigned when staff@guardr.co provisions accounts in the UI */
export const PROVISIONED_PASSWORD = '#Qwerty12345';
export const STAFF_LADDER_ROLES = ['Support', 'Moderator', 'Administrator', 'Manager', 'Director'];
export const AD = {
  guard: { first: 'John', last: 'Doe', name: 'John Doe' },
  client: { first: 'Jane', last: 'Doe', name: 'Jane Doe', company: 'Jane Doe Properties' },
};
export const FAKE_CRED = [
  path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'fake-credential.png'),
  '/tmp/fieldtest-fake-credential.png',
  '/tmp/e2e-fake-credential.png',
  '/home/ubuntu/Downloads/e2e-fake-credential.png',
].find((p) => fs.existsSync(p));
export const AD_DIR = path.join(OUT, 'ad-screenshots');
for (const d of ['desktop', 'tablet', 'mobile']) {
  fs.mkdirSync(path.join(AD_DIR, d), { recursive: true });
}

fs.mkdirSync(SHOT, { recursive: true });

export function makeRunId() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

export function makeTestEmails(runId) {
  const tag = runId.slice(-8);
  const staff = {};
  for (const role of STAFF_LADDER_ROLES) {
    staff[role] = `fieldtest.staff.${role.toLowerCase()}.${tag}@guardr.test`;
  }
  return {
    client: `jane.doe.${tag}@guardr.test`,
    guard: `john.doe.${tag}@guardr.test`,
    staffSignup: `fieldtest.staff.apply.${tag}@guardr.test`,
    staff,
  };
}

export function attachDiagnostics(page, bag) {
  page.on('pageerror', (err) => bag.pageErrors.push(String(err).slice(0, 500)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') bag.consoleErrors.push(msg.text().slice(0, 400));
  });
}

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};

/** Paths visited on every viewport after the desktop walkthrough. */
export const VIEWPORT_SWEEP_PATHS = {
  public: ['/'],
  staff: [
    '/staff/overview',
    '/staff/jobs',
    '/staff/applications',
    '/staff/violations',
    '/staff/disputes',
    '/staff/incidents',
    '/staff/payments',
    '/staff/team',
  ],
  client: ['/client/home', '/client/jobs', '/client/payments'],
  guard: ['/guard/map', '/guard/activation', '/guard/my-jobs', '/guard/payments'],
};

export async function checkLayout(page, label, findings) {
  const issues = await page.evaluate(() => {
    const out = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const doc = document.documentElement;
    const body = document.body;
    if (doc.scrollWidth > vw + 8) {
      out.push(`horizontal overflow ${doc.scrollWidth}px > ${vw}px`);
    }
    const contentH = Math.max(doc.scrollHeight, body.scrollHeight);
    const htmlY = getComputedStyle(doc).overflowY;
    const bodyY = getComputedStyle(body).overflowY;
    const windowBlocked = htmlY === 'hidden' && bodyY === 'hidden';
    let innerScrollable = false;
    const nodes = document.querySelectorAll('main, [data-scroll], [class*="overflow-y"], [class*="overflow-auto"]');
    for (const el of nodes) {
      const s = getComputedStyle(el);
      const y = s.overflowY;
      if ((y === 'auto' || y === 'scroll' || y === 'overlay') && el.scrollHeight > el.clientHeight + 8) {
        innerScrollable = true;
        break;
      }
    }
    if (contentH > vh + 40 && windowBlocked && !innerScrollable) {
      out.push(`not vertically scrollable (content ${contentH}px vs viewport ${vh}px)`);
    }
    const h1 = document.querySelector('h1, [role="heading"]');
    if (!h1) out.push('no heading');
    return out;
  });
  for (const issue of issues) findings.push({ label, issue, viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}` });
  return issues;
}

export async function tryScroll(page, label, findings) {
  const before = await page.evaluate(() => ({
    y: window.scrollY,
    main: document.querySelector('main')?.scrollTop ?? 0,
    h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    vh: window.innerHeight,
  }));
  await page.mouse.wheel(0, 600).catch(() => {});
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.scrollBy(0, 400);
    const main = document.querySelector('main');
    if (main) main.scrollTop += 400;
  }).catch(() => {});
  const after = await page.evaluate(() => ({
    y: window.scrollY,
    main: document.querySelector('main')?.scrollTop ?? 0,
  }));
  const moved = after.y > before.y || after.main > before.main;
  if (before.h > before.vh + 80 && !moved) {
    findings.push({
      label: `${label}-scroll`,
      issue: `wheel/scroll did not move (content ${before.h}px, viewport ${before.vh}px)`,
    });
  }
  return moved || before.h <= before.vh + 80;
}

export function createLogger(results) {
  return function log(section, ok, detail = '') {
    const row = { section, ok, detail: String(detail).slice(0, 2000), at: new Date().toISOString() };
    results.push(row);
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${section} | ${String(detail).slice(0, 420)}`);
    return row;
  };
}

export async function shot(page, name) {
  const safe = name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const file = path.join(SHOT, `${safe}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => {});
  return file;
}

export async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(600);
}

export async function dismissOverlays(page) {
  for (let round = 0; round < 6; round++) {
    let hit = false;
    for (const name of [
      /Skip for now/i,
      /Do it later/i,
      /End tutorial/i,
      /Got it/i,
      /Not now/i,
      /^Later$/i,
      /^Skip$/i,
      /^Close$/i,
      /Finish/i,
      /Accept and continue/i,
    ]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 250 }).catch(() => false)) {
        await b.click({ force: true }).catch(() => {});
        hit = true;
        await page.waitForTimeout(250);
      }
    }
    const boxes = page.locator('input[type="checkbox"]:visible');
    const n = await boxes.count();
    for (let j = 0; j < n; j++) {
      const box = boxes.nth(j);
      if (!(await box.isChecked().catch(() => true))) {
        await box.check({ force: true }).catch(() => {});
        hit = true;
      }
    }
    const cont = page
      .getByRole('button', { name: /^(Continue|Accept and continue|Accept|I agree|Agree)$/i })
      .first();
    if (await cont.isVisible({ timeout: 300 }).catch(() => false)) {
      await cont.click({ force: true }).catch(() => {});
      hit = true;
      await page.waitForTimeout(300);
    }
    if (!hit) break;
  }
}

export async function hardReset(page, context) {
  await context.clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page
    .evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    })
    .catch(() => {});
  await context.clearCookies();
}

export async function login(page, role, email, password) {
  await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
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
  return { failed, body: body.slice(0, 2500), url: page.url() };
}

export async function acceptTerms(page) {
  const terms = page.locator('#auth-accept-terms');
  if (await terms.count()) await terms.check({ force: true }).catch(() => {});
  await page.locator('.legal-accept-checkbox-visual').first().click().catch(() => {});
}

export async function fillIfVisible(page, pattern, value) {
  const byLabel = page.getByLabel(pattern).first();
  if (await byLabel.isVisible({ timeout: 400 }).catch(() => false)) {
    await byLabel.fill(value);
    return true;
  }
  const byPh = page.getByPlaceholder(pattern).first();
  if (await byPh.isVisible({ timeout: 400 }).catch(() => false)) {
    await byPh.fill(value);
    return true;
  }
  return false;
}

export async function fillLabeled(page, labelText, value) {
  const box = page.locator('label', { hasText: labelText }).first().locator('xpath=..');
  const field = box.locator('input, textarea, select').first();
  if (await field.isVisible({ timeout: 800 }).catch(() => false)) {
    const tag = await field.evaluate((el) => el.tagName.toLowerCase());
    if (tag === 'select') {
      await field.selectOption({ label: value }).catch(() => field.selectOption({ value }));
    } else {
      await field.fill(value);
    }
    return true;
  }
  return fillIfVisible(page, new RegExp(labelText, 'i'), value);
}

export async function selectFirstCity(page, labelText) {
  const box = page.locator('label', { hasText: labelText }).first().locator('xpath=..');
  const select = box.locator('select').first();
  if (!(await select.isVisible({ timeout: 800 }).catch(() => false))) return false;
  const values = await select.locator('option').evaluateAll((opts) =>
    opts.map((o) => ({ value: o.value, label: o.textContent || '' })).filter((o) => o.value)
  );
  const la = values.find((o) => /los angeles/i.test(o.label) || /los angeles/i.test(o.value));
  const pick = la || values[0];
  if (!pick) return false;
  await select.selectOption(pick.value);
  return true;
}

function signupLooksComplete(page, body) {
  const onForm = /auth=sign-up/.test(page.url());
  if (onForm && /please |required|select at least|enter your/i.test(body)) return false;
  if (onForm && /application submitted/i.test(body)) return true;
  return !onForm || /pending|activation|under review|welcome/i.test(body);
}

export async function clickFirstMatching(page, patterns, timeout = 1500) {
  for (const pattern of patterns) {
    const btn = page.getByRole('button', { name: pattern }).first();
    if (await btn.isVisible({ timeout }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      return pattern.toString();
    }
    const link = page.getByRole('link', { name: pattern }).first();
    if (await link.isVisible({ timeout: 200 }).catch(() => false)) {
      await link.click({ force: true }).catch(() => {});
      return pattern.toString();
    }
  }
  return null;
}

export async function visitPath(page, log, label, pathSeg) {
  await page.goto(`${BASE}${pathSeg}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  const text = await page.locator('body').innerText();
  const broken =
    /page could not be found|something went wrong|application error|failed to load/i.test(text);
  const loggedOut =
    /\/(staff|guard|client)\//.test(pathSeg) &&
    /enter your email and password|log in as |create account/i.test(text) &&
    (await page.locator('input[type="email"]').count()) > 0;
  await shot(page, label);
  log(label, !broken && !loggedOut, broken || loggedOut ? text.slice(0, 200) : page.url());
  return !broken && !loggedOut;
}

export async function signUpClient(page, email, password) {
  await page.goto(`${BASE}/?auth=sign-up&ar=client`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await fillIfVisible(page, /^First name$/i, 'Field');
  await fillIfVisible(page, /^Last name$/i, 'Client');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillIfVisible(page, /Acme Corp/i, 'Field Test Properties LLC');
  await fillIfVisible(page, /\+1 \(555\)/i, '(555) 010-1001');
  await selectFirstCity(page, /Primary city of operations/i);
  await acceptTerms(page);
  await page.getByRole('button', { name: /create account|sign up/i }).first().click({ force: true });
  await page.waitForTimeout(4000);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok = signupLooksComplete(page, body) && !/already (exists|registered)|sign up failed/i.test(body);
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function signUpGuard(page, email, password) {
  await page.goto(`${BASE}/?auth=sign-up&ar=guard`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await fillIfVisible(page, /^First name$/i, 'Field');
  await fillIfVisible(page, /^Last name$/i, 'Guard');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillLabeled(page, /^Phone$/i, '(555) 010-2002');
  await fillLabeled(page, /Hourly rate/i, '35');
  await fillLabeled(page, /Years in security/i, '3');
  await fillLabeled(page, /Armed work/i, 'Unarmed only');
  await page.getByRole('button', { name: /Event security/i }).first().click({ force: true }).catch(() => {});
  await page.getByRole('button', { name: /Site patrol/i }).first().click({ force: true }).catch(() => {});
  await selectFirstCity(page, /Primary service area/i);
  await fillLabeled(page, /Guard card status/i, 'Active CA guard card on hand');
  await fillLabeled(page, /Reliable transportation/i, 'Yes');
  await fillIfVisible(
    page,
    /Last 1–2 employers/i,
    'Worked event security and retail loss prevention for multiple employers in Los Angeles.'
  );
  await fillIfVisible(
    page,
    /Training, licenses/i,
    'Field test guard with three years of event and site security experience in Los Angeles.'
  );
  await fillIfVisible(page, /Days\/times you usually work/i, 'Available weekdays and weekends, flexible hours.');
  await acceptTerms(page);
  await page.getByRole('button', { name: /create account|sign up|apply/i }).first().click({ force: true });
  await page.waitForTimeout(4000);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok = signupLooksComplete(page, body) && !/already (exists|registered)|sign up failed/i.test(body);
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function signUpStaff(page, email, password) {
  await page.goto(`${BASE}/?auth=sign-up&ar=staff`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await fillIfVisible(page, /^First name$/i, 'Field');
  await fillIfVisible(page, /^Last name$/i, 'Support');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillLabeled(page, /^Phone$/i, '(555) 010-4004');
  await fillLabeled(page, /Years of experience/i, '4');
  await selectFirstCity(page, /Primary city/i);
  await fillIfVisible(
    page,
    /Recent roles, employers, and operations experience/i,
    'Four years of operations and dispatch experience supporting licensed security teams in California.'
  );
  await fillIfVisible(page, /Days, hours, or schedule/i, 'Weekdays 8am–6pm Pacific.');
  await acceptTerms(page);
  await page.getByRole('button', { name: /create account|sign up|apply/i }).first().click({ force: true });
  await page.waitForTimeout(4000);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok =
    signupLooksComplete(page, body) &&
    !/already (exists|registered)|sign up failed/i.test(body);
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function selectFirstMatchingOption(page, labelRe, valueRe) {
  const select = page.getByLabel(labelRe).first();
  if (await select.isVisible({ timeout: 600 }).catch(() => false)) {
    await select.selectOption({ label: valueRe }).catch(async () => {
      const opts = await select.locator('option').allTextContents();
      const match = opts.find((o) => valueRe.test(o));
      if (match) await select.selectOption({ label: match });
    });
    return true;
  }
  return false;
}

export async function addStaffViaTeam(page, { firstName, lastName, email, role }) {
  try {
    await page.goto(`${BASE}/staff/team`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) =>
        /\+?\s*Add staff/i.test((b.getAttribute('title') || '') + (b.textContent || ''))
      );
      btn?.click();
    });
    const formOpen = await page.getByText(/Add platform staff/i).isVisible({ timeout: 4000 }).catch(() => false);
    if (!formOpen) {
      return { ok: false, detail: 'Add staff form did not open' };
    }
    await page.getByPlaceholder('First name').fill(firstName, { timeout: 4000 });
    await page.getByPlaceholder('Last name').fill(lastName, { timeout: 4000 });
    await page.getByRole('button', { name: /use next/i }).click({ force: true }).catch(() => {});
    const emailInput = page.getByPlaceholder(/signaturesecurityspecialist/i).first();
    if (await emailInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await emailInput.fill(email, { timeout: 4000 });
    } else {
      await page.locator('form input[type="email"]').first().fill(email, { timeout: 4000 });
    }
    const roleSelect = page.locator('form select, [role="dialog"] select').first();
    if (await roleSelect.isVisible({ timeout: 800 }).catch(() => false)) {
      await roleSelect.selectOption({ label: role }).catch(() => roleSelect.selectOption(role));
    }
    const cityBox = page.locator('[role="dialog"] input[type="checkbox"], form input[type="checkbox"]').first();
    if (await cityBox.isVisible({ timeout: 500 }).catch(() => false)) {
      await cityBox.check({ force: true }).catch(() => {});
    }
    await page.getByRole('button', { name: /add staff member|add staff|create/i }).last().click({ force: true });
    await dismissOverlays(page);
    await page.getByRole('button', { name: /add staff member|add staff|create/i }).last().click({ force: true }).catch(() => {});
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    const ok = new RegExp(email.split('@')[0], 'i').test(body) || /added|created|pending|default sign-in/i.test(body);
    return { ok, detail: body.slice(0, 400) };
  } catch (err) {
    return { ok: false, detail: String(err).slice(0, 400) };
  }
}

export async function adShot(page, device, name, { fullPage = true } = {}) {
  const dir = path.join(AD_DIR, device);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: file, fullPage, type: 'png' }).catch(() => {});
  return file;
}

export async function assertJaneJohn(page, log, label) {
  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const bad = /E2E Guard|E2E Client|e2e\.guard|e2e\.client|fieldtest\.(client|guard)/i.test(body);
  log(`names-${label}`, !bad, bad ? `non-ad labels visible: ${body.slice(0, 220)}` : 'Jane/John Doe clean');
  return !bad;
}

export async function clickNamedCta(page, patternSrc) {
  return page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const btn = [...document.querySelectorAll('button')].find((b) =>
      re.test(`${b.getAttribute('title') || ''} ${b.textContent || ''}`)
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, patternSrc);
}

export async function addClientViaStaff(page, { firstName, lastName, email, company, phone }) {
  try {
    await page.goto(`${BASE}/staff/clients`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
    await clickNamedCta(page, String.raw`\+?\s*Add client`);
    const open = await page.getByText(/Add client account/i).isVisible({ timeout: 4000 }).catch(() => false);
    if (!open) return { ok: false, detail: 'Add client form did not open' };
    await dismissOverlays(page);
    await page.getByPlaceholder('First name').fill(firstName, { timeout: 4000 });
    await page.getByPlaceholder('Last name').fill(lastName, { timeout: 4000 });
    await page.getByPlaceholder('client@company.com').fill(email, { timeout: 4000 }).catch(async () => {
      await page.locator('form input[type="email"]').first().fill(email, { timeout: 4000 });
    });
    const companyBox = page.locator('label', { hasText: /Company/i }).first().locator('xpath=..').locator('input');
    if (await companyBox.isVisible({ timeout: 800 }).catch(() => false)) {
      await companyBox.fill(company);
    }
    await page.getByPlaceholder('Optional — shows on job posts').fill(company).catch(() => {});
    await page.locator('label', { hasText: /^Phone$/i }).locator('xpath=..').locator('input').fill(phone).catch(() => {});
    await page.getByRole('button', { name: /create client account|add client/i }).last().click({ force: true });
    await dismissOverlays(page);
    await page.getByRole('button', { name: /create client account|add client/i }).last().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1800);
    const body = await page.locator('body').innerText();
    return { ok: new RegExp(`${firstName}\\s+${lastName}|${email}`, 'i').test(body), detail: body.slice(0, 400) };
  } catch (err) {
    return { ok: false, detail: String(err).slice(0, 400) };
  }
}

export async function addGuardViaStaff(page, { firstName, lastName, email, phone }) {
  try {
    await page.goto(`${BASE}/staff/guards`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
    await clickNamedCta(page, String.raw`\+?\s*Add guard`);
    const open = await page.getByText(/Add field guard/i).isVisible({ timeout: 4000 }).catch(() => false);
    if (!open) return { ok: false, detail: 'Add guard form did not open' };
    await dismissOverlays(page);
    await page.getByPlaceholder('First name').fill(firstName, { timeout: 4000 });
    await page.getByPlaceholder('Last name').fill(lastName, { timeout: 4000 });
    await page.getByPlaceholder('guard@example.com').fill(email, { timeout: 4000 }).catch(async () => {
      await page.locator('form input[type="email"]').first().fill(email, { timeout: 4000 });
    });
    await page.getByPlaceholder('Optional').fill(phone).catch(() => {});
    await page.getByRole('button', { name: /create guard profile|add guard/i }).last().click({ force: true });
    await dismissOverlays(page);
    await page.getByRole('button', { name: /create guard profile|add guard/i }).last().click({ force: true }).catch(() => {});
    await page.waitForTimeout(1800);
    const body = await page.locator('body').innerText();
    return { ok: new RegExp(`${firstName}\\s+${lastName}|${email}`, 'i').test(body), detail: body.slice(0, 400) };
  } catch (err) {
    return { ok: false, detail: String(err).slice(0, 400) };
  }
}

async function setAllFakeFiles(page) {
  if (!FAKE_CRED) return 0;
  const files = page.locator('input[type="file"]');
  const n = await files.count();
  for (let i = 0; i < n; i++) {
    await files.nth(i).setInputFiles(FAKE_CRED).catch(() => {});
    await page.waitForTimeout(400);
  }
  return n;
}

async function clickCredentialSubmit(page) {
  const btn = page
    .getByRole('button', { name: /Submit for review|Save|Add credential|Upload|Submit|Add COI|Add guard card|Done/i })
    .last();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click({ force: true });
    await page.waitForTimeout(1600);
    return true;
  }
  return false;
}

export async function uploadFakeCredentials(page, shotFn) {
  const results = [];
  if (!FAKE_CRED) return [{ step: 'fixture', ok: false, detail: 'fake-credential.png missing' }];

  const tryOpen = async (name) => {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(800);
      return true;
    }
    return false;
  };

  await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);

  if (await tryOpen(/Add government ID/i)) {
    const sel = page.locator('select').first();
    if (await sel.isVisible({ timeout: 800 }).catch(() => false)) {
      await sel.selectOption({ label: /driver|license|state id/i }).catch(() => {});
    }
    await page.getByPlaceholder(/number/i).fill('D1234567').catch(() => {});
    const n = await setAllFakeFiles(page);
    const ok = await clickCredentialSubmit(page);
    if (shotFn) await shotFn('cred-gov-id');
    results.push({ step: 'gov-id', ok, detail: `files=${n}` });
  }

  await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (await tryOpen(/Add COI/i)) {
    for (const el of await page.locator('input:visible, textarea:visible').all()) {
      const type = await el.getAttribute('type');
      if (['file', 'checkbox', 'radio', 'hidden'].includes(type || '')) continue;
      const val = await el.inputValue().catch(() => '');
      if (val) continue;
      const tip = ((await el.getAttribute('placeholder')) || '').toLowerCase();
      if (/carrier|insurer|company/.test(tip)) await el.fill('Field Test Insurance');
      else if (/policy/.test(tip)) await el.fill('COI-DOE-2026');
      else if (type === 'date') await el.fill('2027-12-31').catch(() => {});
    }
    const n = await setAllFakeFiles(page);
    const ok = await clickCredentialSubmit(page);
    if (shotFn) await shotFn('cred-coi');
    results.push({ step: 'coi', ok, detail: `files=${n}` });
  }

  for (const [re, step] of [
    [/Add guard card/i, 'guard-card'],
    [/Add PTA\/UOF/i, 'pta'],
    [/Add Continued Education/i, 'ce'],
  ]) {
    await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    if (!(await tryOpen(re))) {
      results.push({ step, ok: false, detail: 'open button missing' });
      continue;
    }
    const option = page.getByRole('button', { name: /combined|PTA|Guard Card|32-hour|BSIS|certificate/i }).first();
    if (await option.isVisible({ timeout: 800 }).catch(() => false)) await option.click({ force: true });
    for (const el of await page.locator('input:visible').all()) {
      const type = await el.getAttribute('type');
      if (type === 'file' || type === 'checkbox') continue;
      const val = await el.inputValue().catch(() => '');
      if (!val && type !== 'date') await el.fill(`FT-DOE-${step}`).catch(() => {});
    }
    const n = await setAllFakeFiles(page);
    const ok = await clickCredentialSubmit(page);
    if (shotFn) await shotFn(`cred-${step}`);
    results.push({ step, ok, detail: `files=${n}` });
  }

  return results;
}

export async function staffVerifyOpenCredentials(page) {
  await page.goto(`${BASE}/staff/credentials`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  let verified = 0;
  for (let i = 0; i < 8; i++) {
    const row = page.getByText(/John Doe|pending review|Pending/i).first();
    if (!(await row.isVisible({ timeout: 1500 }).catch(() => false))) break;
    await row.click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
    const action = await clickFirstMatching(
      page,
      [/Verify/i, /Approve/i, /Mark verified/i, /Accept/i],
      1200
    );
    if (action) {
      verified += 1;
      await page.waitForTimeout(800);
    } else break;
  }
  const activate = await clickFirstMatching(
    page,
    [/Activate (guard|account)/i, /Approve application/i, /^Activate$/i],
    1500
  );
  return { verified, activate };
}

export async function clickAllFilterTabs(page) {
  const tabs = page.locator('[role="tab"]:visible');
  const n = Math.min(await tabs.count(), 10);
  const labels = [];
  for (let i = 0; i < n; i++) {
    const t = tabs.nth(i);
    const text = ((await t.innerText().catch(() => '')) || '').trim();
    if (!text || text.length > 40) continue;
    await t.click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
    labels.push(text);
  }
  return labels;
}

export async function searchAndOpen(page, term) {
  const search = page.getByPlaceholder(/search/i).first();
  if (await search.isVisible({ timeout: 1500 }).catch(() => false)) {
    await search.fill(term);
    await page.waitForTimeout(800);
  }
  const row = page.getByText(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')).first();
  if (await row.isVisible({ timeout: 2500 }).catch(() => false)) {
    await row.click({ force: true });
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

export async function postJobThroughWizard(page) {
  let jobPosted = false;
  const postBtn = page.getByRole('button', { name: /post a job|post job/i }).first();
  if (await postBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await postBtn.click();
  } else {
    await page.getByText(/post a job|post job/i).first().click({ timeout: 3000 }).catch(() => {});
  }
  await page.waitForTimeout(1500);

  for (let step = 0; step < 14; step++) {
    const stepText = await page.locator('body').innerText();
    const serviceChoice = page
      .getByRole('button', { name: /site patrol|standing guard|corporate event|private party|event security/i })
      .first();
    if (await serviceChoice.isVisible({ timeout: 800 }).catch(() => false)) {
      await serviceChoice.click();
      await page.waitForTimeout(600);
    }

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
        await input.fill('Field Test Patrol Post');
      } else if (/phone/.test(labelish)) {
        await input.fill('(555) 010-3003');
      } else if (/rate|pay|hour|amount|price/.test(labelish)) {
        await input.fill('45');
      } else if (/guard|count|quantity|heads/.test(labelish)) {
        await input.fill('1');
      } else if (type === 'date' || /date/.test(labelish)) {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        await input.fill(d.toISOString().slice(0, 10));
      } else if (type === 'time' || /time|start|end/.test(labelish)) {
        await input.fill(labelish.includes('end') ? '22:00' : '18:00');
      } else if (type === 'number') {
        await input.fill('1');
      }
    }

    const optionCard = page.locator('[role="radio"]:visible, [role="option"]:visible').first();
    if (await optionCard.isVisible({ timeout: 400 }).catch(() => false)) {
      await optionCard.click().catch(() => {});
    }

    const next = page
      .getByRole('button', { name: /^(Continue|Next|Review|Post|Submit|Publish|Create|Confirm|Finish|Pay)/i })
      .first();
    if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
      const label = (await next.innerText()).trim();
      await next.click();
      await page.waitForTimeout(1400);
      if (/post|submit|publish|create|confirm|finish|pay/i.test(label) && step > 2) {
        jobPosted = true;
        break;
      }
    } else if (/job (posted|created|submitted)|pending review|open|success|checkout/i.test(stepText)) {
      jobPosted = true;
      break;
    } else {
      break;
    }
  }

  const endText = await page.locator('body').innerText();
  return {
    jobPosted: jobPosted || /pending|open|posted|created|checkout|stripe/i.test(endText),
    body: endText.slice(0, 1500),
    url: page.url(),
  };
}

export const STAFF_SECTIONS = [
  '/staff/overview',
  '/staff/map',
  '/staff/jobs',
  '/staff/locations',
  '/staff/applications',
  '/staff/credentials',
  '/staff/guards',
  '/staff/clients',
  '/staff/team',
  '/staff/messages',
  '/staff/support',
  '/staff/incidents',
  '/staff/violations',
  '/staff/disputes',
  '/staff/stats',
  '/staff/analytics',
  '/staff/payments',
  '/staff/payment-settings',
  '/staff/agreements',
  '/staff/audit-log',
  '/staff/cities',
  '/staff/permissions',
  '/staff/settings',
  '/staff/integrations',
  '/staff/guide',
  '/staff/dev-updates',
];

export const GUARD_PATHS = [
  '/guard/map',
  '/guard/activation',
  '/guard/my-jobs',
  '/guard/messages',
  '/guard/payments',
  '/guard/profile',
  '/guard/settings',
  '/guard/support',
  '/guard/guide',
  '/guard/preferences',
  '/guard/performance',
  '/guard/availability',
  '/guard/vehicle',
];

export const CLIENT_PATHS = [
  '/client/home',
  '/client/map',
  '/client/jobs',
  '/client/requests',
  '/client/request',
  '/client/messages',
  '/client/payments',
  '/client/reports',
  '/client/guards',
  '/client/locations',
  '/client/profile',
  '/client/settings',
  '/client/support',
  '/client/guide',
];

export const PUBLIC_PATHS = ['/', '/legal/terms', '/legal/privacy'];
