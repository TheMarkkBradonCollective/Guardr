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
/** Open market used for guard/client signups and field-test job site. */
export const FIELD_TEST_MARKET_CITY = 'Sacramento';
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

/** Launch Playwright with Google Chrome (default) or bundled Chromium. */
export async function launchFieldTestBrowser() {
  const { chromium } = await import('@playwright/test');
  const headed = process.env.FIELDTEST_HEADED === '1';
  const useChrome = (process.env.FIELDTEST_BROWSER || 'chrome').toLowerCase() !== 'chromium';
  const launchOptions = {
    headless: !headed,
    args: ['--ignore-certificate-errors'],
  };
  if (useChrome) launchOptions.channel = 'chrome';
  return chromium.launch(launchOptions);
}

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

/** Key staff console pages each ladder role should reach after public apply + approval. */
export const STAFF_LADDER_PATHS = [
  '/staff/overview',
  '/staff/applications',
  '/staff/jobs',
  '/staff/support',
  '/staff/messages',
];

/** Promo-ready ad captures keyed by path (Jane/John on screen, no E2E labels). */
export const PROMO_AD_BY_PATH = {
  '/client/home': '04-client-home',
  '/client/jobs': '05-client-jobs',
  '/client/payments': '06-client-payments',
  '/guard/map': '02-guard-marketplace-map',
  '/guard/activation': '03-guard-activation',
  '/guard/my-jobs': '17-guard-my-jobs',
  '/guard/payments': '16-guard-earnings',
  '/staff/overview': '08-staff-overview',
  '/staff/jobs': '09-staff-jobs',
  '/staff/applications': '10-staff-applications',
  '/staff/payments': '14-staff-payments',
  '/staff/violations': '23-staff-violations',
  '/staff/disputes': '24-staff-disputes',
};

/** Paths visited on every viewport after the desktop walkthrough. */
export const VIEWPORT_SWEEP_PATHS = {
  public: ['/'],
  staff: [
    '/staff/overview',
    '/staff/map',
    '/staff/jobs',
    '/staff/applications',
    '/staff/credentials',
    '/staff/clients',
    '/staff/management',
    '/staff/guards',
    '/staff/violations',
    '/staff/disputes',
    '/staff/incidents',
    '/staff/payments',
    '/staff/team',
  ],
  client: ['/client/home', '/client/map', '/client/jobs', '/client/payments'],
  guard: ['/guard/map', '/guard/activation', '/guard/my-jobs', '/guard/payments', '/guard/messages'],
};

export async function checkLayout(page, label, findings) {
  try {
    await waitReady(page);
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
    const h1 = document.querySelector(
      'h1, h2, h3, h4, h5, h6, [role="heading"], .uber-page-band-title, .app-subscreen-title'
    );
    if (!h1) out.push('no heading');
    return out;
  });
    for (const issue of issues) findings.push({ label, issue, viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}` });
    return issues;
  } catch (err) {
    findings.push({
      label,
      issue: `layout check skipped (${String(err).slice(0, 120)})`,
      viewport: `${page.viewportSize()?.width}x${page.viewportSize()?.height}`,
    });
    return [];
  }
}

export async function tryScroll(page, label, findings) {
  try {
    await waitReady(page);
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
  } catch (err) {
    findings.push({ label: `${label}-scroll`, issue: `scroll check skipped (${String(err).slice(0, 120)})` });
    return false;
  }
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
    /staff sign in|guard sign in|client sign in|customer sign in|enter your email and password/i.test(body) &&
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
  await page.locator('label[for="auth-accept-terms"]').click().catch(() => {});
  await clickFirstMatching(page, [/Accept and continue/i, /I agree/i], 600);
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
  return selectOpenCityForSignup(page, labelText);
}

/** Pick the configured open market for guard/client signup (Sacramento in production). */
export async function selectOpenCityForSignup(page, labelText, { preferredCity = FIELD_TEST_MARKET_CITY } = {}) {
  const box = page.locator('label', { hasText: labelText }).first().locator('xpath=..');
  const select = box.locator('select').first();
  if (!(await select.isVisible({ timeout: 800 }).catch(() => false))) return false;
  const values = await select.locator('option').evaluateAll((opts) =>
    opts.map((o) => ({ value: o.value, label: o.textContent || '' })).filter((o) => o.value)
  );
  if (values.length === 0) return false;
  const preferred = values.find(
    (opt) => opt.label.includes(preferredCity) || opt.value.includes(preferredCity)
  );
  const chosen = preferred ?? values[0];
  await select.selectOption(chosen.value);
  await page.waitForTimeout(300);
  return chosen.label.trim();
}

function signupLooksComplete(page, body, role = 'any') {
  if (/not accepting new applications|sign up failed|already (exists|registered)/i.test(body)) return false;
  if (/application submitted|under review|pending approval|check your email/i.test(body)) return true;
  const onForm = /auth=sign-up/.test(page.url());
  if (onForm && /please |required|select at least|enter your/i.test(body)) return false;
  if (!onForm && /\/(client|guard)\//.test(page.url())) return true;
  if (!onForm && role === 'staff' && /auth=sign-in/.test(page.url())) return true;
  return false;
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

export async function ensureSignedOut(page, context) {
  await hardReset(page, context);
  await page.goto(`${BASE}/client/home`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  const signOut = page.getByRole('button', { name: /sign out|log out/i }).first();
  if (await signOut.isVisible({ timeout: 1500 }).catch(() => false)) {
    await signOut.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await hardReset(page, context);
}

/** Navigate to the correct public signup form via the role picker (avoids stale ar= param). */
export async function goToAuthSignup(page, role) {
  if (role === 'staff') {
    await page.goto(`${BASE}/?auth=sign-up&ar=staff`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    return;
  }
  await page.goto(`${BASE}/?auth=sign-up&pick=role`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);

  if (role === 'client') {
    const path = await clickFirstMatching(
      page,
      [/^I need security$/i, /^I need security for my site/i, /I need security/i],
      4000
    );
    await waitReady(page);
    await page.waitForTimeout(400);
    const kind = await clickFirstMatching(page, [/^Business/i, /^Personal/i], 4000);
    await waitReady(page);
    await page.waitForTimeout(400);
    return;
  }

  const work = await clickFirstMatching(page, [/^I want to work$/i, /I want to work/i], 4000);
  await waitReady(page);
  await page.waitForTimeout(400);
  const guard = await clickFirstMatching(
    page,
    [/^I'?m a licensed guard/i, /licensed guard \(contractor\)/i],
    4000
  );
  await waitReady(page);
  await page.waitForTimeout(400);
}

export async function assertSignupRoleVisible(page, role) {
  const markers = {
    client: /Business account|Personal account|Business name|Create your client account|Primary city of operations/i,
    guard: /Guard marketplace application|Primary service area/i,
    staff: /Apply to work at Guardr|New staff start as Support/i,
  };
  const ok = await page.getByText(markers[role]).first().isVisible({ timeout: 8000 }).catch(() => false);
  return ok;
}

export async function signUpClient(
  page,
  email,
  password,
  { firstName = AD.client.first, lastName = AD.client.last, company = AD.client.company } = {}
) {
  await goToAuthSignup(page, 'client');
  if (!(await assertSignupRoleVisible(page, 'client'))) {
    const body = await page.locator('body').innerText();
    return { ok: false, body: `wrong signup form\n${body.slice(0, 400)}`, url: page.url() };
  }
  await fillIfVisible(page, /^First name$/i, firstName);
  await fillIfVisible(page, /^Last name$/i, lastName);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillIfVisible(page, /Acme Corp|ABC Nightclub|Acme Patrol Services/i, company);
  await fillIfVisible(page, /\+1 \(555\)/i, '(555) 010-1001');
  await selectOpenCityForSignup(page, /Primary city of operations|^City$/i);
  await acceptTerms(page);
  await page.getByRole('button', { name: /create account|sign up/i }).first().click({ force: true });
  await page.waitForTimeout(4000);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok = signupLooksComplete(page, body, 'client') && !/already (exists|registered)|sign up failed/i.test(body);
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function signUpGuard(
  page,
  email,
  password,
  { firstName = AD.guard.first, lastName = AD.guard.last } = {}
) {
  await goToAuthSignup(page, 'guard');
  if (!(await assertSignupRoleVisible(page, 'guard'))) {
    const body = await page.locator('body').innerText();
    return { ok: false, body: `wrong signup form (expected guard)\n${body.slice(0, 400)}`, url: page.url() };
  }
  await fillIfVisible(page, /^First name$/i, firstName);
  await fillIfVisible(page, /^Last name$/i, lastName);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillLabeled(page, /^Phone$/i, '(555) 010-2002');
  await fillLabeled(page, /Hourly rate/i, '35');
  await fillLabeled(page, /Years in security/i, '3');
  await fillLabeled(page, /Armed work/i, 'Unarmed only');
  await page.getByRole('button', { name: /Event security/i }).first().click({ force: true }).catch(() => {});
  await page.getByRole('button', { name: /Site patrol/i }).first().click({ force: true }).catch(() => {});
  await selectOpenCityForSignup(page, /Primary service area/i);
  await fillLabeled(page, /Guard card status/i, 'Active CA guard card on hand');
  await fillLabeled(page, /Reliable transportation/i, 'Yes');
  await fillIfVisible(
    page,
    /Last 1–2 employers/i,
    'Worked event security and retail loss prevention for multiple employers in Sacramento.'
  );
  await fillIfVisible(
    page,
    /Training, licenses/i,
    'Field test guard with three years of event and site security experience in Sacramento.'
  );
  await fillIfVisible(page, /Days\/times you usually work/i, 'Available weekdays and weekends, flexible hours.');
  await acceptTerms(page);
  await page.getByRole('button', { name: /create account|sign up|submit application/i }).first().click({ force: true });
  await page.waitForTimeout(4000);
  await waitReady(page);
  const body = await page.locator('body').innerText();
  const ok = signupLooksComplete(page, body, 'guard') && !/already (exists|registered)|sign up failed/i.test(body);
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

export async function signUpStaff(page, email, password, { firstName = 'Field', lastName = 'Support' } = {}) {
  await goToAuthSignup(page, 'staff');
  if (!(await assertSignupRoleVisible(page, 'staff'))) {
    const body = await page.locator('body').innerText();
    return { ok: false, body: `wrong signup form (expected staff)\n${body.slice(0, 400)}`, url: page.url() };
  }
  await fillIfVisible(page, /^First name$/i, firstName);
  await fillIfVisible(page, /^Last name$/i, lastName);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await fillLabeled(page, /^Phone$/i, '(555) 010-4004');
  await fillLabeled(page, /Years of experience/i, '4');
  await selectOpenCityForSignup(page, /Primary city/i);
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
    signupLooksComplete(page, body, 'staff') &&
    !/already (exists|registered)|sign up failed/i.test(body);
  return { ok, body: body.slice(0, 1500), url: page.url() };
}

/** Verify the guard/client signup market is open — never changes city status during fieldtest. */
export async function staffAssertSignupMarketReady(page, requiredCity = FIELD_TEST_MARKET_CITY) {
  await page.goto(`${BASE}/staff/cities`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  const search = page.getByPlaceholder(/search cities/i).first();
  if (await search.isVisible({ timeout: 2000 }).catch(() => false)) {
    await search.fill('');
    await search.fill(requiredCity);
    await page.waitForTimeout(700);
  }
  let row = page.getByRole('button', { name: new RegExp(requiredCity, 'i') }).first();
  if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) {
    row = page.locator('.app-list-row').filter({ hasText: requiredCity }).first();
  }
  if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) {
    return { ok: false, detail: `${requiredCity}:missing` };
  }
  await row.click({ force: true });
  await page.waitForTimeout(900);
  const statusSelect = page.getByLabel(/Service area status/i).first();
  if (await statusSelect.isVisible({ timeout: 2500 }).catch(() => false)) {
    const current = await statusSelect.inputValue();
    if (current === 'open') {
      return { ok: true, detail: `${requiredCity}:open` };
    }
    return { ok: false, detail: `${requiredCity}:${current || 'not-open'}` };
  }
  const inlineSelect = page.locator('.app-list-row').filter({ hasText: requiredCity }).locator('select').first();
  if (await inlineSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    const current = await inlineSelect.inputValue();
    if (current === 'open') {
      return { ok: true, detail: `${requiredCity}:open` };
    }
    return { ok: false, detail: `${requiredCity}:${current || 'not-open'}` };
  }
  return { ok: false, detail: `${requiredCity}:status-unreadable` };
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
    await clickNamedCta(page, String.raw`\+?\s*Add staff`);
    const formOpen = await page.getByText(/Add platform staff/i).isVisible({ timeout: 4000 }).catch(() => false);
    if (!formOpen) {
      return { ok: false, detail: 'Add staff form did not open' };
    }
    await clearBlockingModals(page);
    const sheet = visibleDialog(page);
    await fillInDialog(page, 'First name', firstName);
    await fillInDialog(page, 'Last name', lastName);
    const roleSelect = sheet.locator('select').first();
    if (await roleSelect.isVisible({ timeout: 800 }).catch(() => false)) {
      await roleSelect.selectOption({ label: role }).catch(() => roleSelect.selectOption(role));
      await page.waitForTimeout(400);
    }
    await sheet.getByRole('button', { name: /use next/i }).click({ force: true });
    await page.waitForTimeout(300);
    const emailInput = sheet.getByPlaceholder(/signaturesecurityspecialist/i).first();
    if (await emailInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await emailInput.fill(email, { timeout: 4000 });
    } else {
      await sheet.locator('input[type="email"]').first().fill(email, { timeout: 4000 });
    }
    const citySearch = sheet.getByPlaceholder('Search cities...');
    if (await citySearch.isVisible({ timeout: 800 }).catch(() => false)) {
      await citySearch.fill(FIELD_TEST_MARKET_CITY);
      await page.waitForTimeout(400);
      const cityRow = sheet.locator('label').filter({ hasText: new RegExp(FIELD_TEST_MARKET_CITY, 'i') }).first();
      if (await cityRow.isVisible({ timeout: 800 }).catch(() => false)) {
        await cityRow.click({ force: true });
      } else {
        const firstCity = sheet.locator('#add-staff-operations-access label').first();
        if (await firstCity.isVisible({ timeout: 500 }).catch(() => false)) {
          await firstCity.click({ force: true });
        }
      }
    }
    await clickDialogSubmit(page, /create staff account|submit for approval/i);
    await page.waitForTimeout(2500);
    const stillOpen = await page.getByText(/Add platform staff/i).isVisible({ timeout: 400 }).catch(() => false);
    const sheetText = stillOpen ? await visibleDialog(page).innerText().catch(() => '') : '';
    if (stillOpen) {
      return { ok: false, detail: sheetText.slice(0, 500) || 'Create staff form stayed open' };
    }
    const found = await searchAndOpen(page, email);
    const body = await page.locator('body').innerText();
    const ok = Boolean(found) && body.includes(email);
    return { ok, detail: ok ? email : (sheetText || body).slice(0, 400) };
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

export async function clearBlockingModals(page) {
  for (let i = 0; i < 6; i++) {
    const boxes = page.locator('input[type="checkbox"]:visible');
    const n = await boxes.count();
    for (let j = 0; j < n; j++) {
      const box = boxes.nth(j);
      if (!(await box.isChecked().catch(() => true))) await box.check({ force: true }).catch(() => {});
    }
    const accept = page.getByRole('button', { name: /Accept and continue/i }).first();
    if (await accept.isVisible({ timeout: 400 }).catch(() => false)) {
      await accept.click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
      continue;
    }
    break;
  }
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

export function visibleDialog(page) {
  return page.locator('[role="dialog"]:visible').last();
}

export async function confirmAppDialog(page, extraPatterns = []) {
  const patterns = [
    ...extraPatterns,
    /^Approve account$/i,
    /^Approve profile$/i,
    /^Mark trusted$/i,
    /^Approve application$/i,
    /^Confirm$/i,
  ];
  await page.waitForTimeout(500);
  for (const pattern of patterns) {
    const btn = page.getByRole('button', { name: pattern }).first();
    if (await btn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await btn.click({ force: true });
      await page.waitForTimeout(900);
      return String(pattern);
    }
  }
  return null;
}

export async function fillInDialog(page, placeholder, value) {
  const field = visibleDialog(page).getByPlaceholder(placeholder).first();
  await field.waitFor({ state: 'visible', timeout: 8000 });
  await field.fill(value, { force: true });
}

async function clickDialogSubmit(page, nameRe) {
  const btn = visibleDialog(page).getByRole('button', { name: nameRe }).last();
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click({ force: true });
    return true;
  }
  return false;
}

export async function approvePendingClient(page) {
  const approve = await clickFirstMatching(page, [/Approve client account/i], 2500);
  if (approve) await confirmAppDialog(page, [/^Approve account$/i]);
  await page.waitForTimeout(600);
  const trust = await clickFirstMatching(page, [/^Mark as trusted$/i], 1500);
  if (trust) await confirmAppDialog(page, [/^Mark trusted$/i]);
  await page.waitForTimeout(800);
  const body = await page.locator('body').innerText();
  return {
    ok: /active|approved|trusted/i.test(body) && !/Pending approval/i.test(body),
    detail: [approve, trust].filter(Boolean).join(' → ') || body.slice(0, 240),
  };
}

export async function approvePendingGuard(page) {
  const review = await clickFirstMatching(
    page,
    [/Review application/i, /Approve guard application/i, /Approve application/i],
    2500
  );
  await page.waitForTimeout(800);
  const approve = await clickFirstMatching(
    page,
    [/Approve guard application/i, /^Approve application$/i, /Approve profile/i],
    2500
  );
  if (approve) await confirmAppDialog(page, [/^Approve profile$/i, /^Approve application$/i]);
  await page.waitForTimeout(800);
  const body = await page.locator('body').innerText();
  return {
    ok: Boolean(review || approve) && /approved|active|application/i.test(body),
    detail: [review, approve].filter(Boolean).join(' → ') || body.slice(0, 240),
  };
}

export async function addClientViaStaff(page, { firstName, lastName, email, company, phone }) {
  try {
    await page.goto(`${BASE}/staff/clients`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
    await clickNamedCta(page, String.raw`\+?\s*Add client`);
    const open = await page.getByText(/Add client account/i).isVisible({ timeout: 4000 }).catch(() => false);
    if (!open) return { ok: false, detail: 'Add client form did not open' };
    await clearBlockingModals(page);
    await fillInDialog(page, 'First name', firstName);
    await fillInDialog(page, 'Last name', lastName);
    await visibleDialog(page)
      .getByPlaceholder('client@company.com')
      .fill(email, { timeout: 4000 })
      .catch(async () => {
        await visibleDialog(page).locator('input[type="email"]').first().fill(email);
      });
    await visibleDialog(page)
      .getByPlaceholder('Optional — shows on job posts')
      .fill(company)
      .catch(() => {});
    await visibleDialog(page)
      .locator('label', { hasText: /^Phone$/i })
      .locator('xpath=..')
      .locator('input')
      .fill(phone)
      .catch(() => {});
    await clickDialogSubmit(page, /create client account/i);
    await page.waitForTimeout(2000);
    await searchAndOpen(page, email).catch(() => searchAndOpen(page, `${firstName} ${lastName}`));
    const approved = await approvePendingClient(page);
    const body = await page.locator('body').innerText();
    const created = new RegExp(`${email}|${firstName}\\s+${lastName}`, 'i').test(body);
    return {
      ok: created && approved.ok,
      detail: created
        ? `created; approve=${approved.detail}`
        : body.slice(0, 400),
    };
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
    await clearBlockingModals(page);
    await fillInDialog(page, 'First name', firstName);
    await fillInDialog(page, 'Last name', lastName);
    await visibleDialog(page)
      .getByPlaceholder('guard@example.com')
      .fill(email, { timeout: 4000 })
      .catch(async () => {
        await visibleDialog(page).locator('input[type="email"]').first().fill(email);
      });
    await visibleDialog(page).getByPlaceholder('Optional').fill(phone).catch(() => {});
    await clickDialogSubmit(page, /create guard profile/i);
    await page.waitForTimeout(2000);
    await searchAndOpen(page, email).catch(() => searchAndOpen(page, `${firstName} ${lastName}`));
    const body = await page.locator('body').innerText();
    const created = new RegExp(`${email}|${firstName}\\s+${lastName}`, 'i').test(body);
    return { ok: created, detail: created ? email : body.slice(0, 400) };
  } catch (err) {
    return { ok: false, detail: String(err).slice(0, 400) };
  }
}

async function setAllFakeFiles(page) {
  if (!FAKE_CRED) return 0;
  const files = page.locator('input[type="file"]');
  const n = await files.count();
  let attached = 0;
  for (let i = 0; i < n; i++) {
    try {
      await files.nth(i).setInputFiles(FAKE_CRED);
      attached += 1;
      await page.waitForTimeout(700);
    } catch {
      /* hidden or detached */
    }
  }
  return attached;
}

async function waitForPhotoReady(page, submitName) {
  for (let i = 0; i < 12; i++) {
    const processing = page.getByRole('button', { name: /Processing/i }).first();
    if (await processing.isVisible({ timeout: 200 }).catch(() => false)) {
      await page.waitForTimeout(400);
      continue;
    }
    const btn = page.getByRole('button', { name: submitName }).last();
    if (await btn.isVisible({ timeout: 400 }).catch(() => false) && !(await btn.isDisabled().catch(() => true))) {
      return true;
    }
    await page.waitForTimeout(350);
  }
  return false;
}

async function clickCredentialSubmit(page, nameRe = /Submit for review|Upload credential|^Add$|Save|Done/i) {
  const ready = await waitForPhotoReady(page, nameRe);
  const btn = page.getByRole('button', { name: nameRe }).last();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click({ force: true });
    await page.waitForTimeout(1600);
    return true;
  }
  return ready;
}

async function fillCredentialSheet(page, { issuer, number, submitName }) {
  const sheet = visibleDialog(page);
  await sheet
    .getByPlaceholder(/Issuing organization/i)
    .fill(issuer)
    .catch(() => {});
  await sheet
    .getByPlaceholder(/Certificate number/i)
    .fill(number)
    .catch(() => {});
  const n = await setAllFakeFiles(page);
  const ok = await clickCredentialSubmit(page, submitName);
  return { ok, files: n };
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
    const sel = visibleDialog(page).locator('select').first();
    if (await sel.isVisible({ timeout: 800 }).catch(() => false)) {
      await sel.selectOption({ label: /driver|license|state id/i }).catch(() => {});
    }
    await visibleDialog(page).getByPlaceholder(/number/i).fill('D1234567').catch(() => {});
    const n = await setAllFakeFiles(page);
    const ok = await clickCredentialSubmit(page, /Submit for review|Save|Upload/i);
    if (shotFn) await shotFn('cred-gov-id');
    results.push({ step: 'gov-id', ok, detail: `files=${n}` });
  }

  await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (await tryOpen(/Add COI/i)) {
    for (const el of await visibleDialog(page).locator('input, textarea').all()) {
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
    const ok = await clickCredentialSubmit(page, /Add COI|Submit|Save|Upload/i);
    if (shotFn) await shotFn('cred-coi');
    results.push({ step: 'coi', ok, detail: `files=${n}` });
  }

  await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (await tryOpen(/Add guard card/i)) {
    const option = visibleDialog(page)
      .getByRole('button', { name: /Guard Card|BSIS|combined/i })
      .first();
    if (await option.isVisible({ timeout: 800 }).catch(() => false)) await option.click({ force: true });
    await fillCredentialSheet(page, {
      issuer: 'BSIS',
      number: 'FT-DOE-guard-card',
      submitName: /Upload credential|Add guard card|Submit|Save/i,
    }).then(async ({ ok, files }) => {
      if (shotFn) await shotFn('cred-guard-card');
      results.push({ step: 'guard-card', ok, detail: `files=${files}` });
    });
  } else {
    results.push({ step: 'guard-card', ok: false, detail: 'open button missing' });
  }

  await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (await tryOpen(/Add PTA\/UOF/i)) {
    const combinedToggle = visibleDialog(page).getByRole('button', { name: /^Combined certificate$/i });
    if (await combinedToggle.isVisible({ timeout: 1500 }).catch(() => false)) {
      await combinedToggle.click({ force: true });
      await page.waitForTimeout(400);
    }
    const combined = visibleDialog(page).getByRole('button', {
      name: /Upload combined 8-hour certificate/i,
    });
    if (await combined.isVisible({ timeout: 1500 }).catch(() => false)) {
      await combined.click({ force: true });
      await page.waitForTimeout(600);
    }
    const { ok, files } = await fillCredentialSheet(page, {
      issuer: 'BSIS',
      number: 'PTA-DOE-2026',
      submitName: /Upload credential/i,
    });
    if (shotFn) await shotFn('cred-pta');
    results.push({ step: 'pta', ok: ok && files > 0, detail: `files=${files}` });
  } else {
    results.push({ step: 'pta', ok: false, detail: 'open button missing' });
  }

  await page.goto(`${BASE}/guard/activation`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  if (await tryOpen(/Add Continued Education/i)) {
    const courseAdd = visibleDialog(page).getByRole('button', { name: /^Add$/i }).first();
    if (await courseAdd.isVisible({ timeout: 1500 }).catch(() => false)) {
      await courseAdd.click({ force: true });
      await page.waitForTimeout(600);
    }
    const { ok, files } = await fillCredentialSheet(page, {
      issuer: 'BSIS',
      number: 'CE-DOE-2026',
      submitName: /^Add$/i,
    });
    if (shotFn) await shotFn('cred-ce');
    results.push({ step: 'ce', ok: ok && files > 0, detail: `files=${files}` });
  } else {
    results.push({ step: 'ce', ok: false, detail: 'open button missing' });
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
      await confirmAppDialog(page);
      await page.waitForTimeout(800);
    } else break;
  }
  const activate = await clickFirstMatching(
    page,
    [/Activate (guard|account)/i, /Approve application/i, /^Activate$/i],
    1500
  );
  if (activate) await confirmAppDialog(page, [/^Approve profile$/i, /^Activate$/i]);
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
  const allTab = page.getByRole('tab', { name: /^All$/i }).first();
  if (await allTab.isVisible({ timeout: 800 }).catch(() => false)) {
    await allTab.click({ force: true });
    await page.waitForTimeout(400);
  } else {
    await page.getByText(/^All$/, { exact: true }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
  }
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

/** Sacramento site used for geocoding + guard on-site GPS during shift tests. */
export const FIELD_TEST_SITE = {
  lat: 38.5816,
  lng: -121.4944,
  address: '1010 8th St, Sacramento, CA 95814',
  city: FIELD_TEST_MARKET_CITY,
  zip: '95814',
};

/** Shift window: started recently, ends soon — clock-in open now, complete opens during the run. */
export function shiftTimesForFieldTest() {
  const now = Date.now();
  const start = new Date(now - 90 * 60 * 1000);
  const end = new Date(now + 8 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => d.toISOString().slice(0, 10);
  const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    startDate: fmtDate(start),
    endDate: fmtDate(end),
    startTime: fmtTime(start),
    endTime: fmtTime(end),
  };
}

export async function fetchStripeHealth() {
  try {
    const res = await fetch(`${BASE}/api/stripe/health`);
    const data = await res.json();
    const pk = data.publishableKey || '';
    return {
      configured: Boolean(data.configured),
      publishableKey: pk,
      testMode: pk.startsWith('pk_test_'),
      liveMode: pk.startsWith('pk_live_'),
    };
  } catch (err) {
    return {
      configured: false,
      publishableKey: null,
      testMode: false,
      liveMode: false,
      error: String(err).slice(0, 200),
    };
  }
}

export async function applyFieldTestGeolocation(context) {
  const { lat, lng } = FIELD_TEST_SITE;
  await context.grantPermissions(['geolocation'], { origin: BASE }).catch(() => {});
  await context.addInitScript(
    ({ lat: la, lng: ln }) => {
      const makePos = () => ({
        coords: {
          latitude: la,
          longitude: ln,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (success, error) => {
            try {
              success(makePos());
            } catch (e) {
              error?.(e);
            }
          },
          watchPosition: (success) => {
            success(makePos());
            return 1;
          },
          clearWatch: () => {},
        },
      });
    },
    { lat, lng }
  );
}

export async function injectGuardAvailability(page) {
  const guardId = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('guardr_guard_availability_'));
    if (key) return key.replace('guardr_guard_availability_', '');
    try {
      const raw = localStorage.getItem('guardr_current_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user?.role === 'guard' ? user.id : null;
    } catch {
      return null;
    }
  });
  if (!guardId) return false;
  await page.evaluate((id) => {
    const weekly = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      id: `avail-${id}-${day}`,
      guardId: id,
      dayOfWeek: day,
      startTime: '00:00',
      endTime: '23:59',
      isAvailable: true,
    }));
    localStorage.setItem(`guardr_guard_availability_${id}`, JSON.stringify(weekly));
  }, guardId);
  return true;
}

export async function domClickButton(page, patternSrc) {
  return page.evaluate((source) => {
    const re = new RegExp(source, 'i');
    const el = [...document.querySelectorAll('button')].find((b) => {
      const label = `${b.textContent || ''} ${b.getAttribute('aria-label') || ''}`.trim();
      return re.test(label) && !b.disabled && b.getAttribute('aria-disabled') !== 'true';
    });
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    el.click();
    return (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 80);
  }, patternSrc instanceof RegExp ? patternSrc.source : String(patternSrc));
}

export async function clickShiftAction(page, patterns, timeout = 2000) {
  for (const name of patterns) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout }).catch(() => false)) {
      await b.scrollIntoViewIfNeeded().catch(() => {});
      const disabled = await b.isDisabled().catch(() => false);
      if (disabled) continue;
      const viaDom = await domClickButton(page, name);
      if (!viaDom) await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1400);
      return viaDom || name.toString();
    }
  }
  for (const name of patterns) {
    const viaDom = await domClickButton(page, name);
    if (viaDom) {
      await page.waitForTimeout(1400);
      return `text:${viaDom}`;
    }
  }
  return null;
}

export async function staffApproveJobListing(page, jobTitle = 'Field Test') {
  await page.goto(`${BASE}/staff/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await page.getByText(jobTitle, { exact: false }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);

  const edit = page.getByRole('button', { name: /Edit job listing/i }).first();
  if (await edit.isVisible({ timeout: 2500 }).catch(() => false)) {
    await edit.click({ force: true });
    await page.waitForTimeout(1000);
    const lat = page.getByPlaceholder(/34\.05223|latitude|lat/i).first();
    const lng = page.getByPlaceholder(/-118\.24368|longitude|lng/i).first();
    if (await lat.isVisible({ timeout: 800 }).catch(() => false)) {
      await lat.fill(String(FIELD_TEST_SITE.lat));
    }
    if (await lng.isVisible({ timeout: 800 }).catch(() => false)) {
      await lng.fill(String(FIELD_TEST_SITE.lng));
    }
    await clickFirstMatching(page, [/Apply coordinates/i], 1200);
    await page.waitForTimeout(500);
    await clickFirstMatching(page, [/Save changes/i], 2000);
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
    await page.getByText(jobTitle, { exact: false }).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);
  }

  const approveBtn = page.getByRole('button', { name: /Approve Job/i }).first();
  const disabled = await approveBtn.isDisabled().catch(() => true);
  if (!disabled && (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    await approveBtn.click({ force: true });
    await page.waitForTimeout(1500);
    await confirmAppDialog(page).catch(() => {});
  }
  const body = await page.locator('body').innerText();
  const ok = /Open|Approved|Active/i.test(body) && !/Pending review/i.test(body.slice(0, 500));
  return { ok, detail: body.match(/Open|Pending review|No map coordinates/i)?.[0] || body.slice(0, 200) };
}

export async function clientApproveGuardOnJob(page, searchTerm = 'Field Test') {
  await page.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await page.getByRole('button', { name: /^Open$/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  const opened = await searchAndOpen(page, searchTerm);
  if (!opened) {
    await page.getByText(new RegExp(searchTerm, 'i')).first().click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(800);
  const approved = await clickFirstMatching(page, [/Approve guard/i, /^Approve$/i], 2500);
  if (approved) await confirmAppDialog(page, [/Confirm/i, /Approve/i, /Yes/i]);
  await page.waitForTimeout(1500);
  const body = await page.locator('body').innerText();
  return {
    ok: Boolean(approved) || /confirmed|assigned|accepted/i.test(body),
    detail: approved || body.slice(0, 200),
  };
}

export async function completeStripeCheckout(page, log, stripeHealth, shotFn) {
  await page.waitForTimeout(2000);
  const url = page.url();
  if (!/checkout\.stripe\.com|pay\.stripe\.com|stripe\.com\/c\/pay/i.test(url)) {
    return { ok: false, paid: false, detail: `no stripe redirect: ${url}` };
  }
  if (shotFn) await shotFn('stripe-checkout');
  if (!stripeHealth.testMode) {
    log(
      'stripe-live-mode',
      true,
      'Checkout opened on live Stripe — use pk_test_ keys (staging/preview) to complete with card 4242…'
    );
    return { ok: true, paid: false, detail: 'checkout-opened-live-mode' };
  }

  const fillCard = async () => {
    const selectors = [
      'input[name="cardNumber"]',
      'input[autocomplete="cc-number"]',
      'input[placeholder*="1234"]',
      '#cardNumber',
    ];
    for (const sel of selectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        await el.fill('4242424242424242');
        return true;
      }
    }
    const frame = page.frameLocator('iframe[name*="card"], iframe[title*="card"]').first();
    const inner = frame.locator('input[name="cardnumber"], input[placeholder*="1234"]').first();
    if (await inner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inner.fill('4242424242424242');
      return true;
    }
    return false;
  };

  const filled = await fillCard();
  if (!filled) {
    return { ok: false, paid: false, detail: 'could not find card field on Stripe Checkout' };
  }
  await page.locator('input[name="cardExpiry"], input[autocomplete="cc-exp"]').first().fill('12/34').catch(() => {});
  await page.locator('input[name="cardCvc"], input[autocomplete="cc-csc"]').first().fill('123').catch(() => {});
  await page.locator('input[name="billingName"], input[autocomplete="name"]').first().fill('Jane Doe').catch(() => {});
  await page.getByRole('button', { name: /pay/i }).click({ force: true }).catch(() => {});
  await page.waitForURL(/guardr\.co|payment=success|client\/invoices/i, { timeout: 120_000 }).catch(() => {});
  const paid = /payment=success|paid/i.test(page.url()) || /paid|thank you|success/i.test(await page.locator('body').innerText());
  if (shotFn) await shotFn('stripe-payment-success');
  return { ok: paid, paid, detail: paid ? page.url() : `checkout submitted — ${page.url()}` };
}

export async function clientPayJobWithStripe(page, log, stripeHealth, shotFn) {
  await page.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await page.getByRole('button', { name: /^Open$/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  await searchAndOpen(page, 'Field Test');
  await page.waitForTimeout(800);
  if (shotFn) await shotFn('client-pay-before');
  const payClicked = await clickFirstMatching(page, [/Pay with Stripe/i, /Pay now/i, /^Pay$/i], 3000);
  if (!payClicked) {
    await page.goto(`${BASE}/client/payments`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await clickFirstMatching(page, [/Pay with Stripe/i, /Pay now/i, /^Pay$/i], 2500);
  }
  await page.waitForTimeout(2500);
  const checkout = await completeStripeCheckout(page, log, stripeHealth, shotFn);
  log('client-stripe-payment', checkout.paid || checkout.ok, checkout.detail);
  return checkout;
}

export async function completeGuardShiftOnMap(page, log, shotFn) {
  await injectGuardAvailability(page);
  await page.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismissOverlays(page);
  await page.waitForTimeout(2000);
  await clickShiftAction(page, [/Next Job/i, /See full details/i, /See job details/i], 2000);
  if (shotFn) await shotFn('guard-shift-map-start');

  let clicked = await clickShiftAction(page, [/Skip self audit/i], 2500);
  if (!clicked) {
    await clickShiftAction(page, [/start job/i, /Slide to start job/i], 2000);
    await page.waitForTimeout(800);
    await page.getByRole('button', { name: /Close/i }).first().click({ force: true }).catch(() => {});
    clicked = await clickShiftAction(page, [/Skip self audit/i], 2000);
  }
  log('guard-skip-self-audit', Boolean(clicked), clicked || 'not shown');
  if (clicked) {
    await clickShiftAction(page, [/Skip and continue/i], 2500);
    await page.waitForTimeout(1200);
  }

  await clickShiftAction(page, [/I have read the site briefing/i, /I have read the post orders/i], 2000);
  await page.waitForTimeout(1500);
  if (shotFn) await shotFn('guard-shift-clocked-in');

  const bodyAfterClock = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const clocked = /On job|on-duty|in progress|Complete job/i.test(bodyAfterClock);
  log('guard-clock-in', clocked, clocked ? 'on duty' : bodyAfterClock.slice(0, 280));

  // Wait for scheduled end (posted ~8 min ahead) so Complete job unlocks.
  let completeClicked = null;
  const deadline = Date.now() + 9 * 60 * 1000;
  while (Date.now() < deadline) {
    completeClicked = await clickShiftAction(
      page,
      [/complete job/i, /Slide to complete job/i, /End shift/i],
      1500
    );
    if (completeClicked) break;
    const body = await page.locator('body').innerText();
    if (/Complete job opens at/i.test(body)) {
      await page.waitForTimeout(15_000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitReady(page);
      await dismissOverlays(page);
      continue;
    }
    if (/On job|on-duty|in progress/i.test(body) && !/Complete job opens at/i.test(body)) {
      completeClicked = await clickShiftAction(page, [/complete job/i, /Slide to complete job/i], 1500);
      if (completeClicked) break;
    }
    await page.waitForTimeout(10_000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
  }
  log('guard-complete-click', Boolean(completeClicked), completeClicked || 'complete CTA never enabled');

  await clickShiftAction(page, [/I left at scheduled end/i, /I stayed — complete job now/i], 2500);
  await page.waitForTimeout(1000);
  await clickShiftAction(page, [/Skip all and end shift/i], 3000);
  await clickShiftAction(page, [/Skip and end shift/i], 2500);
  await page.waitForTimeout(1500);
  await clickShiftAction(page, [/^Skip$/i, /Not now/i, /Skip rating/i], 2000);
  if (shotFn) await shotFn('guard-shift-completed');

  const finalBody = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const completed = /completed|shift complete|thank you/i.test(finalBody);
  log('guard-shift-complete', completed || Boolean(completeClicked), finalBody.slice(0, 280));
  return { ok: completed || Boolean(completeClicked), detail: finalBody.slice(0, 300) };
}

export async function postJobThroughWizard(page, options = {}) {
  const shift = options.shiftPreset === 'immediate-complete' ? shiftTimesForFieldTest() : null;
  let jobPosted = false;
  const pending = await page.getByText(/Account pending approval/i).isVisible({ timeout: 1500 }).catch(() => false);
  if (pending) {
    const body = await page.locator('body').innerText();
    return { jobPosted: false, body: `blocked: account pending approval\n${body.slice(0, 400)}`, url: page.url() };
  }

  const named = await clickNamedCta(page, String.raw`\+?\s*Post a job`);
  if (!named) {
    const postBtn = page.getByRole('button', { name: /post a job|post job/i }).first();
    if (await postBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await postBtn.click();
    } else {
      await page.goto(`${BASE}/client/request`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
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
        await input.fill(FIELD_TEST_SITE.address);
      } else if (/city/.test(labelish)) {
        await input.fill(FIELD_TEST_SITE.city);
      } else if (/zip|postal/.test(labelish)) {
        await input.fill(FIELD_TEST_SITE.zip);
      } else if (/name|title|site/.test(labelish)) {
        await input.fill('Field Test Patrol Post');
      } else if (/phone/.test(labelish)) {
        await input.fill('(555) 010-3003');
      } else if (/rate|pay|hour|amount|price/.test(labelish)) {
        await input.fill('45');
      } else if (/guard|count|quantity|heads/.test(labelish)) {
        await input.fill('1');
      } else if (type === 'date' || /date/.test(labelish)) {
        if (shift) {
          await input.fill(/end/.test(labelish) ? shift.endDate : shift.startDate);
        } else {
          const d = new Date();
          d.setDate(d.getDate() + 2);
          await input.fill(d.toISOString().slice(0, 10));
        }
      } else if (type === 'time' || /time|start|end/.test(labelish)) {
        if (shift) {
          await input.fill(/end/.test(labelish) ? shift.endTime : shift.startTime);
        } else {
          await input.fill(labelish.includes('end') ? '22:00' : '18:00');
        }
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
  '/staff/platform-fees',
  '/staff/staff-compensation',
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

const FIELDTEST_KEY_STEPS = [
  'cleanup-before',
  'staff-signup-market-check',
  'public-signup-jane-doe',
  'public-signup-john-doe',
  'staff-approve-jane-doe',
  'staff-approve-john-doe',
  'client-job-post',
  'staff-approve-job-listing',
  'client-payment-gate',
  'staff-verify-john-creds',
  'guard-apply',
  'jane-approve-john',
  'guard-shift-workflow',
  'cleanup-after',
];

const FIELDTEST_STEP_LABELS = {
  'cleanup-before': 'Clear leftover test accounts before the run',
  'cleanup-after': 'Clear test accounts after the run',
  'staff-signup-market-check': 'Confirm Sacramento is open for guard and client signups',
  'public-signup-jane-doe': 'Jane Doe signs up as a client',
  'public-signup-john-doe': 'John Doe signs up as a guard',
  'staff-approve-jane-doe': 'Staff approves Jane Doe',
  'staff-approve-john-doe': 'Staff approves John Doe',
  'client-job-post': 'Jane posts a field test job',
  'staff-approve-job-listing': 'Staff approves the job listing',
  'client-payment-gate': 'Jane pays for the job through Stripe',
  'client-stripe-payment': 'Jane completes the Stripe checkout',
  'staff-verify-john-creds': 'Staff verifies John’s uploaded credentials',
  'staff-activate-john-profile': 'Staff activates John’s guard profile',
  'guard-apply': 'John applies to Jane’s job',
  'jane-approve-john': 'Jane approves John for the job',
  'guard-shift-workflow': 'John completes the shift on the map',
  'guard-complete-click': 'John taps Complete on the shift',
  'guard-clock-in': 'John clocks in on the shift',
  'guard-shift-complete': 'Shift shows as completed',
};

function humanizeSectionKey(section) {
  if (FIELDTEST_STEP_LABELS[section]) return FIELDTEST_STEP_LABELS[section];
  let text = section;
  if (text.startsWith('desktop-')) text = `Desktop check: ${text.slice(8)}`;
  else if (text.startsWith('tablet-')) text = `Tablet check: ${text.slice(7)}`;
  else if (text.startsWith('mobile-')) text = `Mobile check: ${text.slice(7)}`;
  else if (text.startsWith('staff-login-')) {
    const role = text.slice('staff-login-'.length);
    return `Staff sign-in tour (${role.charAt(0).toUpperCase()}${role.slice(1)} role)`;
  }
  else if (text.startsWith('public-signup-staff-')) {
    const role = text.slice('public-signup-staff-'.length);
    return `Field test staff applicant signs up (${role})`;
  }
  text = text.replace(/^public-/, '').replace(/-/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isUrlDetail(detail) {
  return /^https?:\/\//i.test(String(detail || '').trim());
}

function describeStepOutcome(row) {
  const label = humanizeSectionKey(row.section);
  const detail = String(row.detail || '').trim();
  if (row.ok) {
    if (!detail || isUrlDetail(detail)) return `${label} worked.`;
    return `${label} worked (${detail.slice(0, 140)}).`;
  }
  if (!detail) return `${label} did not work.`;
  return `${label} did not work: ${detail.slice(0, 180)}.`;
}

function describeCleanupPhase(phase, cleanup) {
  if (!cleanup) return null;
  if (cleanup.skipped) {
    return phase === 'before'
      ? 'We skipped clearing test accounts before this run.'
      : 'We skipped clearing test accounts after this run.';
  }
  const when = phase === 'before' ? 'Before the run' : 'After the run';
  const found = cleanup.found;
  const remaining = cleanup.verify?.remaining;
  const parts = [];
  if (found?.guards) parts.push(`${found.guards} guard test account${found.guards === 1 ? '' : 's'}`);
  if (found?.clients) parts.push(`${found.clients} client test account${found.clients === 1 ? '' : 's'}`);
  if (found?.staff) parts.push(`${found.staff} staff test account${found.staff === 1 ? '' : 's'}`);
  const foundText = parts.length ? parts.join(', ') : 'no leftover test accounts';
  const allClear =
    remaining &&
    remaining.guards === 0 &&
    remaining.clients === 0 &&
    remaining.staff === 0 &&
    (remaining.testJobs == null || remaining.testJobs === 0);
  if (cleanup.ok && allClear) {
    return `${when}, we removed ${foundText}. Everything was cleared afterward — nothing was left behind.`;
  }
  if (cleanup.ok) {
    return `${when}, we removed ${foundText}. Cleanup finished, but some test data may still remain.`;
  }
  return `${when}, cleanup failed${cleanup.error ? `: ${String(cleanup.error).slice(0, 120)}` : '.'}`;
}

/** Plain-English report for Staff chat (posted by staff@guardr.co after each run). */
export function formatFieldtestStaffChatReport(summary) {
  const lines = [];
  const market = summary.marketCity || FIELD_TEST_MARKET_CITY;
  const passed = summary.passed ?? 0;
  const failed = summary.failed ?? 0;
  const site = summary.base || BASE;

  lines.push(`Field test report (${summary.runId})`);
  lines.push('');
  lines.push(
    `We finished a full field test on ${site}. Sacramento is the open market we use for signups and jobs. Overall, ${passed} checks passed and ${failed} failed.`
  );
  lines.push('');

  if (summary.emails?.client || summary.emails?.guard) {
    lines.push(
      `This run created Jane Doe (${summary.emails?.client || 'n/a'}) and John Doe (${summary.emails?.guard || 'n/a'}) as temporary test users.`
    );
    lines.push('');
  }

  lines.push('Cleanup');
  for (const phase of ['before', 'after']) {
    const sentence = describeCleanupPhase(phase, summary.cleanup?.[phase]);
    if (sentence) lines.push(sentence);
  }
  lines.push('');

  const workflowRows = FIELDTEST_KEY_STEPS.map((key) => summary.results?.find((r) => r.section === key)).filter(
    Boolean
  );
  const workflowPassed = workflowRows.filter((r) => r.ok);
  const workflowFailed = workflowRows.filter((r) => !r.ok);

  if (workflowPassed.length) {
    lines.push('What worked');
    for (const row of workflowPassed) {
      if (row.section === 'cleanup-before' || row.section === 'cleanup-after') continue;
      lines.push(`• ${describeStepOutcome(row)}`);
    }
    lines.push('');
  }

  if (workflowFailed.length) {
    lines.push('What did not work');
    for (const row of workflowFailed) {
      if (row.section === 'cleanup-before' || row.section === 'cleanup-after') continue;
      lines.push(`• ${describeStepOutcome(row)}`);
    }
    lines.push('');
  }

  const otherFailed = (summary.results || []).filter((r) => !r.ok && !FIELDTEST_KEY_STEPS.includes(r.section));
  if (otherFailed.length) {
    lines.push('Other issues (layout checks, viewport sweeps, and similar)');
    for (const row of otherFailed.slice(0, 10)) {
      lines.push(`• ${describeStepOutcome(row)}`);
    }
    if (otherFailed.length > 10) {
      lines.push(
        `• There were ${otherFailed.length - 10} more minor issues. The full report file has the complete list.`
      );
    }
    lines.push('');
  }

  lines.push('Fixes applied during this run');
  if (!summary.fixesApplied?.length) {
    lines.push('We did not need to change the app or the test runner during this run.');
  } else {
    for (const fix of summary.fixesApplied) {
      lines.push(`• ${fix.description}`);
    }
  }
  lines.push('');

  if (summary.stripe?.liveMode) {
    lines.push(
      'Note: Production is on live Stripe keys. The automated runner cannot enter a real card number, so payment steps may fail even when checkout is working for real users.'
    );
    lines.push('');
  }

  lines.push(
    'Technical details (exact step names, URLs, and screenshots) are saved in the field test report on the server.'
  );
  return lines.join('\n').slice(0, 7800);
}

/** Plain-English markdown report written to report.md after each run. */
export function formatFieldtestMarkdownReport(summary) {
  const lines = [
    `# Field test report — ${summary.runId}`,
    '',
    `We ran a full field test on **${summary.base}** using **${summary.marketCity}** as the open market.`,
    `**Started:** ${summary.startedAt}`,
    `**Finished:** ${summary.finishedAt}`,
    `**Result:** ${summary.passed} checks passed, ${summary.failed} failed.`,
    '',
    '## Cleanup',
    '',
  ];

  for (const phase of ['before', 'after']) {
    const sentence = describeCleanupPhase(phase, summary.cleanup?.[phase]);
    if (sentence) lines.push(`- ${sentence}`);
  }

  lines.push('', '## What worked', '');
  const passedSteps = (summary.results || []).filter((r) => r.ok);
  const keyPassed = FIELDTEST_KEY_STEPS.filter((k) => k !== 'cleanup-before' && k !== 'cleanup-after')
    .map((key) => summary.results?.find((r) => r.section === key))
    .filter((r) => r?.ok);
  if (keyPassed.length === 0) {
    lines.push('_No major workflow steps passed._');
  } else {
    for (const row of keyPassed) {
      lines.push(`- ${describeStepOutcome(row)}`);
    }
  }

  lines.push('', '## What did not work', '');
  const failedSteps = (summary.results || []).filter((r) => !r.ok);
  if (failedSteps.length === 0) {
    lines.push('_All checks passed._');
  } else {
    for (const row of failedSteps) {
      lines.push(`- ${describeStepOutcome(row)}`);
    }
  }

  lines.push('', '## Fixes applied during this run', '');
  if (!summary.fixesApplied?.length) {
    lines.push('_We did not need to change the app or the test runner during this run._');
  } else {
    for (const fix of summary.fixesApplied) {
      lines.push(`- ${fix.description}`);
    }
  }

  if (summary.stripe?.liveMode) {
    lines.push(
      '',
      '## Stripe',
      '',
      'Production uses live Stripe keys. The automated runner cannot complete a real card payment, so payment-related steps may fail even when checkout works for real users.'
    );
  }

  lines.push(
    '',
    '## Artifacts',
    '',
    `- Report JSON: \`${summary.reportJsonPath}\``,
    `- Screenshots: \`${summary.screenshotsDir}\``,
    `- Total checks recorded: ${passedSteps.length + failedSteps.length}`
  );

  return lines.join('\n');
}

function describeCleanupBeforeStart(cleanup) {
  if (!cleanup) return null;
  if (cleanup.skipped) return 'We skipped clearing test accounts before this run.';
  const parts = [];
  if (cleanup.found?.guards) {
    parts.push(`${cleanup.found.guards} guard test account${cleanup.found.guards === 1 ? '' : 's'}`);
  }
  if (cleanup.found?.clients) {
    parts.push(`${cleanup.found.clients} client test account${cleanup.found.clients === 1 ? '' : 's'}`);
  }
  if (cleanup.found?.staff) {
    parts.push(`${cleanup.found.staff} staff test account${cleanup.found.staff === 1 ? '' : 's'}`);
  }
  if (!parts.length) {
    return 'We checked for leftover test accounts before starting and did not find any.';
  }
  return `Before starting, we removed ${parts.join(', ')}.`;
}

/** Plain-English heads-up for Staff chat before each run begins. */
export function formatFieldtestStaffChatStartMessage(input) {
  const market = input.marketCity || FIELD_TEST_MARKET_CITY;
  const site = input.base || BASE;
  const lines = [
    `Starting field test (${input.runId})`,
    '',
    `We are about to run a full field test on ${site}. ${market} is the open market we use for guard and client signups.`,
  ];

  const cleanupSentence = describeCleanupBeforeStart(input.cleanupBefore);
  if (cleanupSentence) {
    lines.push('', cleanupSentence);
  }

  if (input.emails?.client || input.emails?.guard) {
    lines.push(
      '',
      `This run will create Jane Doe (${input.emails.client || 'new client'}) and John Doe (${input.emails.guard || 'new guard'}) as temporary test users, then walk through signup, approvals, job posting, payments, guard activation, and shift completion.`
    );
  } else {
    lines.push(
      '',
      'This run will create temporary Jane Doe and John Doe test users, then walk through signup, approvals, job posting, payments, guard activation, and shift completion.'
    );
  }

  lines.push(
    '',
    'We will post another message here when the run finishes with what worked, what did not, and any fixes.'
  );
  return lines.join('\n').slice(0, 7800);
}

/** Post any message to Staff chat → Team → Staff chat as staff@guardr.co. */
export async function postStaffChatMessage(body, verifySnippet) {
  const browser = await launchFieldTestBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    const { failed, body: loginBody } = await login(page, 'staff', STAFF_EMAIL, STAFF_PASSWORD);
    if (failed) {
      return { ok: false, detail: `staff login failed: ${loginBody.slice(0, 200)}` };
    }

    await page.goto(`${BASE}/staff/messages?mtab=team`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismissOverlays(page);
    await page.waitForTimeout(800);

    const teamTab = page.getByRole('button', { name: /^Team$/i }).first();
    if (await teamTab.isVisible({ timeout: 1500 }).catch(() => false)) {
      await teamTab.click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }

    const staffChat = page.getByRole('button', { name: /Staff chat/i }).first();
    if (await staffChat.isVisible({ timeout: 3000 }).catch(() => false)) {
      await staffChat.click({ force: true });
      await page.waitForTimeout(600);
    }

    const composer = page.locator('textarea.app-chat-composer-input, textarea[placeholder*="Guardr team"]').first();
    if (!(await composer.isVisible({ timeout: 5000 }).catch(() => false))) {
      return { ok: false, detail: 'Staff chat composer not found' };
    }

    await composer.fill(body);
    await page.waitForTimeout(300);
    const send = page.getByRole('button', { name: /Send message/i }).first();
    if (await send.isDisabled().catch(() => true)) {
      return { ok: false, detail: 'Send button disabled after filling message' };
    }
    await send.click({ force: true });
    await page.waitForTimeout(1500);

    const threadText = await page.locator('body').innerText();
    const snippet = verifySnippet?.trim();
    const posted = snippet
      ? threadText.includes(snippet) || threadText.includes(body.slice(0, 80))
      : threadText.includes(body.slice(0, 80));
    return { ok: posted, detail: posted ? 'posted to Staff chat' : 'send clicked; verify in thread' };
  } finally {
    await browser.close();
  }
}

/** Post fieldtest start notice to Staff chat before the run begins. */
export async function postFieldtestStartToStaffChat(input) {
  const body = formatFieldtestStaffChatStartMessage(input);
  return postStaffChatMessage(body, input.runId);
}

/** Post fieldtest summary to internal Staff chat as staff@guardr.co. */
export async function postFieldtestReportToStaffChat(summary) {
  const body = formatFieldtestStaffChatReport(summary);
  return postStaffChatMessage(body, summary.runId);
}
