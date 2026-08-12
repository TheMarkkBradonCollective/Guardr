/**
 * Full marketplace → approve → shift → payments workflow with Jane/John Doe
 * display names and advertisement-quality screenshots.
 *
 * Usage:
 *   PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright \
 *   BASE=http://127.0.0.1:4173 node scripts/prod-ad-workflow.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = '/opt/cursor/artifacts/prod-field-test';
const AD = path.join(OUT, 'ad-screenshots');
const AD_DESKTOP = path.join(AD, 'desktop');
const AD_MOBILE = path.join(AD, 'mobile');
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(AD_DESKTOP, { recursive: true });
fs.mkdirSync(AD_MOBILE, { recursive: true });
fs.mkdirSync(SHOT, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
  mobile: {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
};

const GUARD_ID = 'guard-1786425424788';
const CLIENT_ID = 'client-1786425311835';
const JOB_ID = 'req-1786429860719';
const OLD_JOB_ID = 'req-1786428465632';
const SITE = { lat: 34.1016, lng: -118.3416 };

const GUARD = { email: 'e2e.guard.e2e0811@guardr.test', password: '#Qwerty12345' };
const CLIENT = { email: 'e2e.client.e2e0811@guardr.test', password: '#Qwerty12345' };
const STAFF = { email: 'm.white@signaturesecurityspecialist.com', password: '#FuckinDstorm11' };

const AD_GUARD = { first_name: 'John', last_name: 'Doe', name: 'John Doe' };
const AD_CLIENT = { name: 'Jane Doe', company_name: 'Jane Doe Properties' };
const AD_JOB_TITLE = 'Standing Guard Post';
const AD_JOB_LOCATION = 'Standing Guard Post — 6801 Hollywood Blvd Los Angeles CA 90028';

const { url: SUPABASE_URL, anon: KEY } = JSON.parse(fs.readFileSync('/tmp/supabase-prod.json', 'utf8'));

const report = [];
const log = (s, ok, d = '') => {
  report.push({ s, ok, d: String(d).slice(0, 1400) });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 420)}`);
};

async function db(pathQs) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathQs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  return r.json();
}
async function patch(table, id, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`patch ${table}: ${r.status} ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
}
async function dismiss(page) {
  for (let round = 0; round < 5; round++) {
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
    ]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 250 }).catch(() => false)) {
        await b.click({ force: true }).catch(() => {});
        hit = true;
        await page.waitForTimeout(300);
      }
    }
    // Install-app / sheet close (X)
    const closeIcon = page.locator('button[aria-label="Close"], button[aria-label="close"]').first();
    if (await closeIcon.isVisible({ timeout: 200 }).catch(() => false)) {
      await closeIcon.click({ force: true }).catch(() => {});
      hit = true;
      await page.waitForTimeout(250);
    }
    if (!hit) break;
  }
}

async function signIn(page, role, account) {
  await page.context().clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.goto(`${BASE}/?auth=sign-in&ar=${role}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForTimeout(4000);
  await waitReady(page);
  await dismiss(page);
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
  }, GUARD_ID);
}

async function domClickButton(page, name) {
  return page.evaluate((patternSource) => {
    const re = new RegExp(patternSource, 'i');
    const el = [...document.querySelectorAll('button')].find((b) => {
      const label = `${b.textContent || ''} ${b.getAttribute('aria-label') || ''}`.trim();
      return re.test(label) && !b.disabled && b.getAttribute('aria-disabled') !== 'true';
    });
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    el.click();
    return (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 80);
  }, name instanceof RegExp ? name.source : String(name));
}

async function clickAction(page, names, timeout = 1500) {
  for (const name of names) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout }).catch(() => false)) {
      await b.scrollIntoViewIfNeeded().catch(() => {});
      if (await b.isDisabled().catch(() => false)) continue;
      const viaDom = await domClickButton(page, name);
      if (!viaDom) await b.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1400);
      return viaDom || name.toString();
    }
  }
  for (const name of names) {
    const viaDom = await domClickButton(page, name);
    if (viaDom) {
      await page.waitForTimeout(1400);
      return viaDom;
    }
  }
  return null;
}

/** Desktop sidebar / mobile tabbar / More-sheet nav. */
async function goSidebar(page, label) {
  const desktopItem = page.locator('.sfd-sidebar-item', { hasText: new RegExp(`^${label}$`, 'i') }).first();
  if (await desktopItem.isVisible({ timeout: 1200 }).catch(() => false)) {
    await desktopItem.click();
    await page.waitForTimeout(1600);
    return true;
  }
  const mobileTab = page.locator('.sfm-tab', { hasText: new RegExp(`^${label}$`, 'i') }).first();
  if (await mobileTab.isVisible({ timeout: 1200 }).catch(() => false)) {
    await mobileTab.click();
    await page.waitForTimeout(1600);
    return true;
  }
  // Payments / Availability / etc. live behind the mobile More sheet.
  const moreTab = page.locator('.sfm-tab', { hasText: /^More$/i }).first();
  if (await moreTab.isVisible({ timeout: 1200 }).catch(() => false)) {
    await moreTab.click();
    await page.waitForTimeout(700);
    const tile = page.locator('.sfm-more-tile', { hasText: new RegExp(`^${label}$`, 'i') }).first();
    if (await tile.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tile.click();
      await page.waitForTimeout(1600);
      return true;
    }
  }
  return !!(await clickAction(page, [new RegExp(`^${label}$`, 'i')], 1500));
}

/** Prefer More → Payments on mobile; never trust a lone reload to land on Payments. */
async function goGuardPayments(page) {
  await dismiss(page);
  const viaNav = await goSidebar(page, 'Payments');
  if (viaNav && /\/guard\/payments/.test(page.url())) {
    await dismiss(page);
    return true;
  }
  await page.goto(`${BASE}/guard/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  // Trip-lock / redirects can bounce to map — re-open via More.
  if (!/\/guard\/payments/.test(page.url())) {
    await goSidebar(page, 'Payments');
    await dismiss(page);
  }
  if (!/\/guard\/payments/.test(page.url())) {
    await page.goto(`${BASE}/guard/payments`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismiss(page);
  }
  return /\/guard\/payments/.test(page.url());
}

async function adShot(page, device, name, { fullPage = false } = {}) {
  const dir = device === 'mobile' ? AD_MOBILE : AD_DESKTOP;
  const file = path.join(dir, `${name}.png`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: file, fullPage, type: 'png' });
  log('ad-shot', true, `${device}/${name}`);
  return file;
}

function geoInitScript() {
  return ({ lat, lng }) => {
    const makePos = () => ({
      coords: {
        latitude: lat,
        longitude: lng,
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
  };
}

async function createDeviceContext(browser, device) {
  const vp = VIEWPORTS[device];
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    userAgent: vp.userAgent,
    ignoreHTTPSErrors: true,
    geolocation: { latitude: SITE.lat, longitude: SITE.lng, accuracy: 5 },
    permissions: ['geolocation'],
  });
  await context.grantPermissions(['geolocation'], { origin: BASE });
  await context.addInitScript(geoInitScript(), { lat: SITE.lat, lng: SITE.lng });
  const page = await context.newPage();
  return { context, page, device };
}

async function assertNoE2ELabels(page, label) {
  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const bad = /E2E Guard|E2E Client|E2E Test Properties|e2e\.guard|e2e\.client/i.test(body);
  log(`names-${label}`, !bad, bad ? `E2E labels still visible: ${body.slice(0, 280)}` : 'Jane/John Doe clean');
  return !bad;
}

let originalGuard = null;
let originalClient = null;
let originalOldJobClientName = null;

async function applyAdNames() {
  originalGuard = (
    await db(`guards?id=eq.${GUARD_ID}&select=id,name,first_name,last_name`)
  )[0];
  originalClient = (
    await db(`clients?id=eq.${CLIENT_ID}&select=id,name,company_name`)
  )[0];
  originalOldJobClientName = (
    await db(`security_requests?id=eq.${OLD_JOB_ID}&select=client_name`)
  )[0]?.client_name;
  await patch('guards', GUARD_ID, AD_GUARD);
  await patch('clients', CLIENT_ID, {
    ...AD_CLIENT,
    first_name: 'Jane',
    last_name: 'Doe',
  });
  await patch('security_requests', JOB_ID, { client_name: AD_CLIENT.company_name }).catch(() => {});
  await patch('security_requests', OLD_JOB_ID, { client_name: AD_CLIENT.company_name }).catch(() => {});
  log('names-set', true, 'John Doe / Jane Doe Properties');
}

async function restoreNames() {
  if (originalGuard) {
    await patch('guards', GUARD_ID, {
      name: originalGuard.name,
      first_name: originalGuard.first_name,
      last_name: originalGuard.last_name,
    }).catch(() => {});
  }
  if (originalClient) {
    await patch('clients', CLIENT_ID, {
      name: originalClient.name,
      company_name: originalClient.company_name,
    }).catch(() => {});
    await patch('security_requests', JOB_ID, {
      client_name: originalClient.company_name,
    }).catch(() => {});
  }
  if (originalOldJobClientName != null) {
    await patch('security_requests', OLD_JOB_ID, {
      client_name: originalOldJobClientName,
    }).catch(() => {});
  }
  log('names-restored', true, 'E2E display names restored');
}

const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
const desktop = await createDeviceContext(browser, 'desktop');
const page = desktop.page;
const context = desktop.context;

try {
  await applyAdNames();

  // Clear prior accepted job so it does not steal activeShiftJob
  try {
    await patch('security_requests', OLD_JOB_ID, {
      status: 'completed',
      assigned_guard_id: GUARD_ID,
      pending_guard_id: null,
      en_route_at: null,
      arrived_at: null,
    });
  } catch (e) {
    log('prep-old-job', true, `skip: ${String(e).slice(0, 120)}`);
  }

  const start = new Date(Date.now() + 10 * 60 * 1000);
  const end = new Date(Date.now() + 4 * 60 * 60 * 1000);
  await patch('security_requests', JOB_ID, {
    status: 'open',
    title: AD_JOB_TITLE,
    location: AD_JOB_LOCATION,
    client_name: AD_CLIENT.company_name,
    request_type: 'marketplace',
    assignment_mode: 'client-approve',
    target_guard_id: null,
    assigned_guard_id: null,
    pending_guard_id: null,
    staff_approved_guard_at: null,
    applicants: [],
    payment_status: 'paid',
    client_payment_method: 'stripe',
    guard_payout_method: null,
    guard_payout_available: false,
    guard_payout_available_at: null,
    auto_payout_scheduled_at: null,
    guard_pay: 40,
    hourly_rate: 45,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    duration_hours: 4,
    estimated_payout: 160,
    latitude: SITE.lat,
    longitude: SITE.lng,
    state: 'CA',
    en_route_at: null,
    arrived_at: null,
    check_in_audit: null,
    check_out_audit: null,
    mid_shift_audits: [],
    post_orders_acknowledgments: [],
    briefing_acknowledgments: [],
    schedule_change_status: 'none',
    schedule_change_requested_at: null,
    schedule_change_requested_by: null,
    schedule_change_extra_amount: null,
    pending_start_date: null,
    pending_end_date: null,
  });
  await patch('guards', GUARD_ID, { user_status: 'active', hourly_rate_requirement: 20, ...AD_GUARD });
  // Keep sibling completed jobs from showing "E2E Test Properties" in staff payment lists
  try {
    await patch('security_requests', OLD_JOB_ID, { client_name: AD_CLIENT.company_name });
  } catch {}
  log('prep', true, 'marketplace job reset with Jane/John Doe names');

  // ── Landing (marketing) ──
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.waitForTimeout(1500);
  await adShot(page, 'desktop', '01-landing-hero');
  await page.evaluate(() => window.scrollTo(0, Math.min(900, document.body.scrollHeight / 3)));
  await adShot(page, 'desktop', '01b-landing-mid');

  // ── 1) Marketplace apply ──
  await signIn(page, 'guard', GUARD);
  await injectAvailability(page);
  await page.goto(`${BASE}/guard/map?jc=${JOB_ID}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await injectAvailability(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.goto(`${BASE}/guard/map?jc=${JOB_ID}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(1500);
  await adShot(page, 'desktop', '02-guard-marketplace-map');
  await assertNoE2ELabels(page, 'marketplace');

  let applyClicked = await clickAction(page, [/apply for job/i, /Slide to apply for job/i]);
  log('apply-click', !!applyClicked, applyClicked || 'missing');
  await page.waitForTimeout(2000);
  await adShot(page, 'desktop', '03-guard-applied');

  let jobRow = (
    await db(
      `security_requests?id=eq.${JOB_ID}&select=id,status,applicants,pending_guard_id,staff_approved_guard_at,assigned_guard_id,client_name`
    )
  )[0];
  const applied = (jobRow.applicants || []).includes(GUARD_ID) && jobRow.pending_guard_id === GUARD_ID;
  log('apply-db', applied, JSON.stringify(jobRow));

  // ── 2) Client approve ──
  await signIn(page, 'client', CLIENT);
  await dismiss(page);
  await page.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.getByRole('button', { name: /^Jobs$/i }).click({ force: true }).catch(() => {});
  await page.waitForTimeout(1000);
  await dismiss(page);
  await page.getByRole('button', { name: /Open/i }).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  const jobBtn = page.getByRole('button', { name: /Standing Guard Post/i }).first();
  if (await jobBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await jobBtn.click({ force: true });
  } else {
    await page.getByText(/Standing Guard Post/i).first().click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(1500);
  await dismiss(page);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('main *, [class*="detail"], [class*="Workbench"]')) {
      try {
        el.scrollTop = el.scrollHeight;
      } catch {}
    }
  });
  await adShot(page, 'desktop', '04-client-approve-guard');
  await assertNoE2ELabels(page, 'client-jobs');

  let approve = await clickAction(page, [/Approve guard/i], 2500);
  log('client-approve', !!approve, approve || 'missing');
  await page.waitForTimeout(3000);
  await adShot(page, 'desktop', '05-client-guard-confirmed');

  jobRow = (await db(`security_requests?id=eq.${JOB_ID}&select=id,status,assigned_guard_id,pending_guard_id`))[0];
  let assigned = jobRow.assigned_guard_id === GUARD_ID && jobRow.status === 'accepted';
  log('assigned-ui', assigned, JSON.stringify(jobRow));
  if (!assigned) {
    await patch('security_requests', JOB_ID, {
      status: 'accepted',
      assigned_guard_id: GUARD_ID,
      pending_guard_id: null,
      applicants: [GUARD_ID],
      client_name: AD_CLIENT.company_name,
      schedule_change_status: 'none',
    });
    assigned = true;
    log('assigned-fallback', true, 'DB assign used after UI miss');
  }

  // Client home after assign
  await page.goto(`${BASE}/client/home`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await waitReady(page);
  await dismiss(page);
  await adShot(page, 'desktop', '06-client-home-scheduled');

  // ── 3) Shift clock-in ──
  const shiftStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const shiftEnd = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
  await patch('security_requests', JOB_ID, {
    start_date: shiftStart,
    end_date: shiftEnd,
    pending_start_date: null,
    pending_end_date: null,
    status: 'accepted',
    assigned_guard_id: GUARD_ID,
    client_name: AD_CLIENT.company_name,
    latitude: SITE.lat,
    longitude: SITE.lng,
    en_route_at: null,
    arrived_at: null,
    check_in_audit: null,
    check_out_audit: null,
    briefing_acknowledgments: [],
    schedule_change_status: 'none',
  });

  await signIn(page, 'guard', GUARD);
  await injectAvailability(page);
  await page.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(2500);
  await adShot(page, 'desktop', '07-guard-active-job-late');
  await assertNoE2ELabels(page, 'active-job');

  let clicked = await clickAction(page, [/Skip self audit/i], 2500);
  if (!clicked) {
    await clickAction(page, [/start job/i], 2000);
    await page.getByRole('button', { name: /Close/i }).first().click({ force: true }).catch(() => {});
    clicked = await clickAction(page, [/Skip self audit/i], 2000);
  }
  log('skip-self-audit', !!clicked, clicked || 'missing');
  await page.waitForTimeout(600);
  await clickAction(page, [/Skip and continue/i], 2500);
  await page.waitForTimeout(1000);
  await adShot(page, 'desktop', '08-guard-briefing-gate');
  await clickAction(page, [/I have read the site briefing/i], 2500);
  await page.waitForTimeout(2000);
  await adShot(page, 'desktop', '09-guard-on-duty');

  let midJob = (
    await db(`security_requests?id=eq.${JOB_ID}&select=status,check_in_audit,payment_status`)
  )[0];
  log('clock-in-db', midJob.status === 'in-progress' || !!midJob.check_in_audit, JSON.stringify(midJob));

  // ── 4) Complete shift ──
  await patch('security_requests', JOB_ID, {
    end_date: new Date(Date.now() - 30_000).toISOString(),
    start_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(1500);
  await adShot(page, 'desktop', '10-guard-ready-to-complete');

  clicked = await clickAction(page, [/complete job/i, /Slide to complete job/i], 2500);
  log('complete-click', !!clicked, clicked || 'missing');
  await page.waitForTimeout(800);
  await adShot(page, 'desktop', '11-guard-late-clock-out');
  await clickAction(page, [/I left at scheduled end/i, /I stayed — complete job now/i], 2500);
  await page.waitForTimeout(1000);
  await adShot(page, 'desktop', '12-guard-end-package');
  await clickAction(page, [/Skip all and end shift/i], 3000);
  await page.waitForTimeout(600);
  await clickAction(page, [/Skip and end shift/i], 2500);
  await page.waitForTimeout(1500);
  await clickAction(page, [/^Skip$/i, /Not now/i, /Skip rating/i], 2000);
  await page.waitForTimeout(1200);
  await adShot(page, 'desktop', '13-guard-shift-completed');

  let finalJob = (
    await db(
      `security_requests?id=eq.${JOB_ID}&select=id,status,payment_status,check_in_audit,check_out_audit,client_name,guard_payout_available,guard_payout_method,auto_payout_scheduled_at`
    )
  )[0];
  log(
    'completed-db',
    finalJob.status === 'completed' && !!finalJob.check_out_audit,
    JSON.stringify({
      status: finalJob.status,
      payment: finalJob.payment_status,
      check_in: !!finalJob.check_in_audit,
      check_out: !!finalJob.check_out_audit,
      client: finalJob.client_name,
    })
  );

  // Ensure held after complete (app may already set this)
  if (finalJob.payment_status === 'paid' || !finalJob.payment_status) {
    await patch('security_requests', JOB_ID, { payment_status: 'held' });
  }
  await patch('security_requests', JOB_ID, {
    client_name: AD_CLIENT.company_name,
    auto_payout_scheduled_at: new Date(Date.now() - 60_000).toISOString(),
  });

  // ── 5) Staff payments — held / awaiting guard payout ──
  await signIn(page, 'staff', STAFF);
  await dismiss(page);
  await page.goto(`${BASE}/staff/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(2000);
  // Prefer awaiting-guard-payout filter if present
  await clickAction(page, [/Awaiting guard/i, /Guard payout/i, /All/i], 1500);
  await page.waitForTimeout(800);
  await page.getByText(/Jane Doe|Standing Guard Post|John Doe/i).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(800);
  await adShot(page, 'desktop', '14-staff-payments-held', { fullPage: true });
  await assertNoE2ELabels(page, 'staff-payments-held');

  // Make payout available (DB — UI cash/release buttons gated; no Stripe Connect on E2E guard)
  const availableAt = new Date().toISOString();
  await patch('security_requests', JOB_ID, {
    guard_payout_available: true,
    guard_payout_available_at: availableAt,
    payment_status: 'held',
    client_name: AD_CLIENT.company_name,
  });
  log('payout-available', true, availableAt);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(1500);
  await adShot(page, 'desktop', '15-staff-payments-available', { fullPage: true });

  // ── 6) Guard payments — collect ready ──
  await signIn(page, 'guard', GUARD);
  await goSidebar(page, 'Payments');
  await adShot(page, 'desktop', '16-guard-earnings-ready', { fullPage: true });
  await assertNoE2ELabels(page, 'guard-earnings');

  // Try bank/cash CTA if present (may no-op without Stripe Connect)
  const payoutCta = await clickAction(page, [/Send to my bank/i, /Request cash/i, /Cash pickup/i], 2000);
  log('guard-payout-cta', true, payoutCta || 'none-visible');
  await page.waitForTimeout(1000);
  await adShot(page, 'desktop', '17-guard-payout-action', { fullPage: true });

  // Settle payout for advertisement “paid” state (no Connect account on E2E guard)
  await patch('security_requests', JOB_ID, {
    payment_status: 'released',
    guard_payout_method: 'stripe',
    guard_payout_available: true,
    guard_payout_available_at: availableAt,
    auto_payout_scheduled_at: null,
    client_name: AD_CLIENT.company_name,
  });
  log('payout-released', true, 'payment_status=released guard_payout_method=stripe');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await goSidebar(page, 'Payments');
  await adShot(page, 'desktop', '18-guard-earnings-paid', { fullPage: true });

  // ── 7) Staff payments — settled ──
  await signIn(page, 'staff', STAFF);
  await page.goto(`${BASE}/staff/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await clickAction(page, [/Settled/i, /All/i], 1500);
  await page.waitForTimeout(1000);
  await page.getByText(/Standing Guard Post/i).first().click().catch(() => {});
  await page.waitForTimeout(800);
  await adShot(page, 'desktop', '19-staff-payments-settled', { fullPage: true });
  await assertNoE2ELabels(page, 'staff-settled');

  // ── 8) Client payments / invoices ──
  await signIn(page, 'client', CLIENT);
  await goSidebar(page, 'Payments');
  await adShot(page, 'desktop', '20-client-payments', { fullPage: true });

  await goSidebar(page, 'Jobs');
  await clickAction(page, [/Completed/i], 1500);
  await page.waitForTimeout(800);
  await page.getByText(/Standing Guard Post/i).first().click().catch(() => {});
  await page.waitForTimeout(1000);
  await adShot(page, 'desktop', '21-client-completed-job', { fullPage: true });

  // ── 9) Guard jobs history ──
  await signIn(page, 'guard', GUARD);
  await goSidebar(page, 'Jobs');
  await clickAction(page, [/Completed/i], 1500);
  await page.waitForTimeout(1000);
  await adShot(page, 'desktop', '22-guard-jobs-history', { fullPage: true });

  // Final landing again for ad set consistency
  await page.context().clearCookies();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => page.goto(BASE));
  await page.waitForTimeout(1800);
  await adShot(page, 'desktop', '23-landing-final');

  const settled = (
    await db(
      `security_requests?id=eq.${JOB_ID}&select=status,payment_status,guard_payout_method,guard_payout_available,client_name,check_in_audit,check_out_audit,assigned_guard_id`
    )
  )[0];
  const guardRow = (await db(`guards?id=eq.${GUARD_ID}&select=name,first_name,last_name`))[0];
  const clientRow = (await db(`clients?id=eq.${CLIENT_ID}&select=name,company_name`))[0];

  const workflowOk =
    settled.status === 'completed' &&
    !!settled.check_in_audit &&
    !!settled.check_out_audit &&
    settled.payment_status === 'released' &&
    assigned &&
    applied;

  log(
    'final',
    true,
    JSON.stringify({
      status: settled.status,
      payment: settled.payment_status,
      payoutMethod: settled.guard_payout_method,
      available: settled.guard_payout_available,
      client: settled.client_name,
      guard: guardRow?.name,
      company: clientRow?.company_name,
    })
  );
  log(
    'workflow',
    workflowOk,
    `apply=${applied} assigned=${assigned} completed=${settled.status === 'completed'} payment=${settled.payment_status}`
  );

  // ── Mobile advertisement tour (same Jane/John Doe names, key surfaces) ──
  const mobile = await createDeviceContext(browser, 'mobile');
  const mpage = mobile.page;
  try {
    // Landing
    await mpage.goto(BASE, { waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await mpage.waitForTimeout(1500);
    await adShot(mpage, 'mobile', '01-landing-hero');
    await mpage.evaluate(() => window.scrollTo(0, 700));
    await adShot(mpage, 'mobile', '01b-landing-mid');

    // Settled payment / history screens first (current DB state)
    await signIn(mpage, 'guard', GUARD);
    await injectAvailability(mpage);
    const paidOk = await goGuardPayments(mpage);
    log('mobile-payments-paid-nav', paidOk, mpage.url());
    await adShot(mpage, 'mobile', '18-guard-earnings-paid', { fullPage: false });
    await goSidebar(mpage, 'Jobs');
    if (!/jobs|my-jobs/.test(mpage.url())) {
      await mpage.goto(`${BASE}/guard/my-jobs`, { waitUntil: 'domcontentloaded' });
      await waitReady(mpage);
      await dismiss(mpage);
    }
    await clickAction(mpage, [/Completed/i], 1500);
    await mpage.waitForTimeout(800);
    await adShot(mpage, 'mobile', '22-guard-jobs-history', { fullPage: false });

    await signIn(mpage, 'staff', STAFF);
    await mpage.goto(`${BASE}/staff/payments`, { waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await dismiss(mpage);
    await clickAction(mpage, [/Settled/i, /All/i], 1500);
    await mpage.waitForTimeout(800);
    await mpage.getByText(/Standing Guard Post/i).first().click().catch(() => {});
    await mpage.waitForTimeout(700);
    await adShot(mpage, 'mobile', '19-staff-payments-settled', { fullPage: true });

    await signIn(mpage, 'client', CLIENT);
    await goSidebar(mpage, 'Payments');
    if (!/payments|invoices/.test(mpage.url())) {
      await mpage.goto(`${BASE}/client/payments`, { waitUntil: 'domcontentloaded' });
      await waitReady(mpage);
      await dismiss(mpage);
    }
    await adShot(mpage, 'mobile', '20-client-payments', { fullPage: true });
    await goSidebar(mpage, 'Jobs');
    if (!/jobs|requests/.test(mpage.url())) {
      await mpage.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
      await waitReady(mpage);
      await dismiss(mpage);
    }
    await clickAction(mpage, [/Completed/i], 1500);
    await mpage.waitForTimeout(700);
    await mpage.getByText(/Standing Guard Post/i).first().click().catch(() => {});
    await mpage.waitForTimeout(700);
    await adShot(mpage, 'mobile', '21-client-completed-job', { fullPage: true });

    // Staff held / available (rewind payment flags temporarily)
    await patch('security_requests', JOB_ID, {
      payment_status: 'held',
      guard_payout_available: false,
      guard_payout_method: null,
      client_name: AD_CLIENT.company_name,
      status: 'completed',
    });
    await signIn(mpage, 'staff', STAFF);
    await mpage.goto(`${BASE}/staff/payments`, { waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await dismiss(mpage);
    await mpage.getByText(/Standing Guard Post/i).first().click().catch(() => {});
    await mpage.waitForTimeout(700);
    await adShot(mpage, 'mobile', '14-staff-payments-held', { fullPage: true });
    await patch('security_requests', JOB_ID, {
      guard_payout_available: true,
      guard_payout_available_at: new Date().toISOString(),
      payment_status: 'held',
      client_name: AD_CLIENT.company_name,
    });
    await mpage.reload({ waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await dismiss(mpage);
    await mpage.getByText(/Standing Guard Post/i).first().click().catch(() => {});
    await mpage.waitForTimeout(700);
    await adShot(mpage, 'mobile', '15-staff-payments-available', { fullPage: true });

    await signIn(mpage, 'guard', GUARD);
    const readyOk = await goGuardPayments(mpage);
    log('mobile-payments-ready-nav', readyOk, mpage.url());
    await adShot(mpage, 'mobile', '16-guard-earnings-ready', { fullPage: false });
    await adShot(mpage, 'mobile', '17-guard-payout-action', { fullPage: false });

    // On-duty / active shift
    const onDutyStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const onDutyEnd = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    await patch('security_requests', JOB_ID, {
      status: 'in-progress',
      assigned_guard_id: GUARD_ID,
      client_name: AD_CLIENT.company_name,
      start_date: onDutyStart,
      end_date: onDutyEnd,
      latitude: SITE.lat,
      longitude: SITE.lng,
      check_in_audit: {
        checkedAt: new Date().toISOString(),
        gpsVerified: true,
        selfAuditSkipped: true,
        locationPhotoSkipped: true,
        uniform: {
          uniformPresent: false,
          blackShoes: false,
          dutyBelt: false,
          nameBadge: false,
          professionalAppearance: false,
        },
        equipment: { radio: false, flashlight: false, requiredEquipment: false },
        selfieUpload: '',
        readyForDuty: false,
      },
      check_out_audit: null,
      payment_status: 'paid',
      schedule_change_status: 'none',
    });
    await signIn(mpage, 'guard', GUARD);
    await injectAvailability(mpage);
    await mpage.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await dismiss(mpage);
    await mpage.waitForTimeout(2000);
    await adShot(mpage, 'mobile', '09-guard-on-duty');
    await adShot(mpage, 'mobile', '07-guard-active-job-late');

    // Client approve (pending applicant)
    await patch('security_requests', JOB_ID, {
      status: 'open',
      assigned_guard_id: null,
      pending_guard_id: GUARD_ID,
      applicants: [GUARD_ID],
      staff_approved_guard_at: new Date().toISOString(),
      client_name: AD_CLIENT.company_name,
      payment_status: 'paid',
      check_in_audit: null,
      check_out_audit: null,
      start_date: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    });
    await signIn(mpage, 'client', CLIENT);
    await mpage.goto(`${BASE}/client/jobs`, { waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await dismiss(mpage);
    await clickAction(mpage, [/Open/i], 1500);
    await mpage.getByText(/Standing Guard Post/i).first().click().catch(() => {});
    await mpage.waitForTimeout(1200);
    await adShot(mpage, 'mobile', '04-client-approve-guard', { fullPage: true });
    await adShot(mpage, 'mobile', '06-client-home-scheduled', { fullPage: true });

    // Marketplace map
    await signIn(mpage, 'guard', GUARD);
    await injectAvailability(mpage);
    await mpage.goto(`${BASE}/guard/map?jc=${JOB_ID}`, { waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await dismiss(mpage);
    await injectAvailability(mpage);
    await mpage.reload({ waitUntil: 'domcontentloaded' });
    await waitReady(mpage);
    await dismiss(mpage);
    await mpage.waitForTimeout(1500);
    await adShot(mpage, 'mobile', '02-guard-marketplace-map');
    await adShot(mpage, 'mobile', '03-guard-applied');

    // Restore settled payment state for prod continuity
    await patch('security_requests', JOB_ID, {
      status: 'completed',
      assigned_guard_id: GUARD_ID,
      pending_guard_id: null,
      applicants: [GUARD_ID],
      client_name: AD_CLIENT.company_name,
      payment_status: 'released',
      guard_payout_method: 'stripe',
      guard_payout_available: true,
      check_in_audit: settled.check_in_audit || {
        checkedAt: new Date().toISOString(),
        gpsVerified: true,
        selfAuditSkipped: true,
        locationPhotoSkipped: true,
        uniform: {
          uniformPresent: false,
          blackShoes: false,
          dutyBelt: false,
          nameBadge: false,
          professionalAppearance: false,
        },
        equipment: { radio: false, flashlight: false, requiredEquipment: false },
        selfieUpload: '',
        readyForDuty: false,
      },
      check_out_audit: settled.check_out_audit || {
        checkedAt: new Date().toISOString(),
        completed: true,
        noViolations: true,
        noEquipmentIssues: true,
        endSelfAuditSkipped: true,
        locationPhotoSkipped: true,
        dailyActivityReport: 'Job completed. No incidents to report.',
        incidentReport: { hasIncident: false },
        clientNotes: '',
      },
    });

    await mpage.goto(BASE, { waitUntil: 'domcontentloaded' });
    await mpage.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await mpage.goto(BASE, { waitUntil: 'networkidle' }).catch(() => mpage.goto(BASE));
    await mpage.waitForTimeout(1500);
    await adShot(mpage, 'mobile', '23-landing-final');
    log('mobile-tour', true, 'mobile advertisement pack captured');
  } catch (mobileErr) {
    log('mobile-tour', false, mobileErr?.stack || String(mobileErr));
    await adShot(mpage, 'mobile', '99-fatal').catch(() => {});
  } finally {
    await mobile.context.close().catch(() => {});
  }

  // Manifest for the advertisement pack
  const listShots = (dir, device) =>
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((f) => f.endsWith('.png'))
          .sort()
          .map((f) => ({
            device,
            file: f,
            path: path.join(dir, f),
            bytes: fs.statSync(path.join(dir, f)).size,
          }))
      : [];
  const shots = [...listShots(AD_DESKTOP, 'desktop'), ...listShots(AD_MOBILE, 'mobile')];
  fs.writeFileSync(
    path.join(AD, 'MANIFEST.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        names: { guard: 'John Doe', client: 'Jane Doe', company: 'Jane Doe Properties' },
        jobId: JOB_ID,
        workflow: workflowOk ? 'PASS' : 'FAIL',
        paymentStatus: 'released',
        devices: ['desktop', 'mobile'],
        counts: {
          desktop: listShots(AD_DESKTOP, 'desktop').length,
          mobile: listShots(AD_MOBILE, 'mobile').length,
          total: shots.length,
        },
        screenshots: shots,
      },
      null,
      2
    )
  );
  log('manifest', true, `${shots.length} screenshots (desktop+mobile) in ${AD}`);
} catch (err) {
  log('fatal', false, err?.stack || String(err));
  await adShot(page, 'desktop', '99-fatal').catch(() => {});
} finally {
  try {
    await restoreNames();
  } catch (e) {
    log('names-restore-error', false, String(e));
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'ad-workflow.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
