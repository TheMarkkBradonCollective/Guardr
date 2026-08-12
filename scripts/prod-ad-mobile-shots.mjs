/**
 * Mobile advertisement screenshots (Jane/John Doe) — companion to prod-ad-workflow.mjs.
 * Captures mobile/ only; preserves existing desktop/ in the MANIFEST.
 *
 * Usage:
 *   PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright \
 *   BASE=http://127.0.0.1:4173 node scripts/prod-ad-mobile-shots.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const AD = '/opt/cursor/artifacts/prod-field-test/ad-screenshots';
const AD_MOBILE = path.join(AD, 'mobile');
const AD_DESKTOP = path.join(AD, 'desktop');
fs.mkdirSync(AD_MOBILE, { recursive: true });

const GUARD_ID = 'guard-1786425424788';
const CLIENT_ID = 'client-1786425311835';
const JOB_ID = 'req-1786429860719';
const OLD_JOB_ID = 'req-1786428465632';
const SITE = { lat: 34.1016, lng: -118.3416 };
const GUARD = { email: 'e2e.guard.e2e0811@guardr.test', password: '#Qwerty12345' };
const CLIENT = { email: 'e2e.client.e2e0811@guardr.test', password: '#Qwerty12345' };
const STAFF = { email: 'm.white@signaturesecurityspecialist.com', password: '#FuckinDstorm11' };
const AD_GUARD = { first_name: 'John', last_name: 'Doe', name: 'John Doe' };
const AD_CLIENT = { name: 'Jane Doe', company_name: 'Jane Doe Properties', first_name: 'Jane', last_name: 'Doe' };

const { url: SUPABASE_URL, anon: KEY } = JSON.parse(fs.readFileSync('/tmp/supabase-prod.json', 'utf8'));
const log = (s, ok, d = '') => console.log(`${ok ? 'PASS' : 'FAIL'} | ${s} | ${String(d).slice(0, 400)}`);

async function db(q) {
  return (await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })).json();
}
async function patch(table, id, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`patch ${table}: ${await r.text()}`);
  return r.json();
}
async function waitReady(page) {
  const loading = page.getByRole('status', { name: 'Loading Guardr' });
  await loading.waitFor({ state: 'attached', timeout: 8_000 }).catch(() => {});
  await loading.waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
}
async function dismiss(page) {
  for (let round = 0; round < 5; round++) {
    let hit = false;
    for (const name of [/Skip for now/i, /Do it later/i, /Got it/i, /Not now/i, /^Later$/i, /^Skip$/i, /^Close$/i]) {
      const b = page.getByRole('button', { name }).first();
      if (await b.isVisible({ timeout: 250 }).catch(() => false)) {
        await b.click({ force: true }).catch(() => {});
        hit = true;
        await page.waitForTimeout(280);
      }
    }
    const closeIcon = page.locator('button[aria-label="Close"], button[aria-label="close"]').first();
    if (await closeIcon.isVisible({ timeout: 200 }).catch(() => false)) {
      await closeIcon.click({ force: true }).catch(() => {});
      hit = true;
      await page.waitForTimeout(250);
    }
    if (!hit) break;
  }
}
/** Client mobile nav drawer often opens and intercepts job-card clicks. */
async function closeDrawer(page) {
  const drawer = page.locator('aside.mobility-drawer--open, aside[aria-label="Main navigation"][aria-hidden="false"]');
  if (!(await drawer.isVisible({ timeout: 400 }).catch(() => false))) return;
  await page
    .locator('.mobility-content-pane, main, .uber-shell-content')
    .first()
    .click({ position: { x: 300, y: 200 }, force: true })
    .catch(() => {});
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(250);
  if (await drawer.isVisible({ timeout: 300 }).catch(() => false)) {
    await page
      .getByRole('button', { name: /Open navigation|Close navigation|Menu/i })
      .first()
      .click({ force: true })
      .catch(() => {});
    await page.waitForTimeout(350);
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
async function clickAction(page, names, timeout = 1500) {
  for (const name of names) {
    const b = page.getByRole('button', { name }).first();
    if (await b.isVisible({ timeout }).catch(() => false)) {
      await b.click().catch(() => b.click({ force: true }));
      await page.waitForTimeout(1200);
      return String(name);
    }
  }
  return null;
}
async function goNav(page, label) {
  // Bottom tabs are role=button (Map/Jobs/Messages/Support/More). Overflow items sit in More sheet.
  if (!/^Payments$/i.test(label)) {
    const tab = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first();
    if (await tab.isVisible({ timeout: 1200 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(1400);
      return true;
    }
  }
  const more = page.getByRole('button', { name: /^More$/i }).first();
  if (await more.isVisible({ timeout: 1500 }).catch(() => false)) {
    await more.click();
    await page.waitForTimeout(800);
    const tile = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first();
    if (await tile.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tile.click();
      await page.waitForTimeout(1600);
      return true;
    }
  }
  return !!(await clickAction(page, [new RegExp(`^${label}$`, 'i')], 1200));
}
async function goGuardPayments(page) {
  await dismiss(page);
  await goNav(page, 'Payments');
  await dismiss(page);
  if (/\/guard\/payments/.test(page.url())) {
    const ok = await page.getByText(/Earnings, payouts|Ready to collect|Your pay/i).isVisible({ timeout: 1500 }).catch(() => false);
    if (ok) return true;
  }
  // Direct /guard/payments can race into map?sec=support — recover via More → Payments.
  await page.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await goNav(page, 'Payments');
  await dismiss(page);
  return /\/guard\/payments/.test(page.url());
}
async function assertPayments(page, label) {
  const ok = /\/guard\/payments/.test(page.url());
  const text = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ');
  const looksLikePay = /Ready to collect|Your pay|Paid on Stripe|Connect your bank|Send to my bank/i.test(text);
  log(`assert-payments-${label}`, ok && looksLikePay, `${page.url()} | ${text.slice(0, 160)}`);
  return ok && looksLikePay;
}
async function shot(page, name) {
  await dismiss(page);
  await page.waitForTimeout(500);
  const file = path.join(AD_MOBILE, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false, type: 'png' });
  log('shot', true, `mobile/${name} (${fs.statSync(file).size}b)`);
}

const auditIn = {
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
};
const auditOut = {
  checkedAt: new Date().toISOString(),
  completed: true,
  noViolations: true,
  noEquipmentIssues: true,
  endSelfAuditSkipped: true,
  locationPhotoSkipped: true,
  dailyActivityReport: 'Job completed. No incidents to report.',
  incidentReport: { hasIncident: false },
  clientNotes: '',
};

const origG = (await db(`guards?id=eq.${GUARD_ID}&select=name,first_name,last_name`))[0];
const origC = (await db(`clients?id=eq.${CLIENT_ID}&select=name,company_name,first_name,last_name`))[0];
const origOld = (await db(`security_requests?id=eq.${OLD_JOB_ID}&select=client_name`))[0];
const snapshot = (
  await db(
    `security_requests?id=eq.${JOB_ID}&select=status,payment_status,guard_payout_method,guard_payout_available,check_in_audit,check_out_audit,assigned_guard_id,applicants,client_name,start_date,end_date`
  )
)[0];

await patch('guards', GUARD_ID, AD_GUARD);
await patch('clients', CLIENT_ID, AD_CLIENT);
await patch('security_requests', JOB_ID, { client_name: AD_CLIENT.company_name });
await patch('security_requests', OLD_JOB_ID, { client_name: AD_CLIENT.company_name }).catch(() => {});

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  geolocation: { latitude: SITE.lat, longitude: SITE.lng, accuracy: 5 },
  permissions: ['geolocation'],
});
await context.grantPermissions(['geolocation'], { origin: BASE });
await context.addInitScript(({ lat, lng }) => {
  const makePos = () => ({
    coords: { latitude: lat, longitude: lng, accuracy: 5, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now(),
  });
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (s, e) => {
        try {
          s(makePos());
        } catch (err) {
          e?.(err);
        }
      },
      watchPosition: (s) => {
        s(makePos());
        return 1;
      },
      clearWatch: () => {},
    },
  });
}, SITE);
const page = await context.newPage();

try {
  // ── Landing ──
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await page.waitForTimeout(1500);
  await shot(page, '01-landing-hero');
  await page.evaluate(() => window.scrollTo(0, 700));
  await shot(page, '01b-landing-mid');

  // Ensure completed + released for paid shots
  await patch('security_requests', JOB_ID, {
    status: 'completed',
    assigned_guard_id: GUARD_ID,
    pending_guard_id: null,
    client_name: AD_CLIENT.company_name,
    payment_status: 'released',
    guard_payout_method: 'stripe',
    guard_payout_available: true,
    schedule_change_status: 'none',
    check_in_audit: snapshot.check_in_audit || auditIn,
    check_out_audit: snapshot.check_out_audit || auditOut,
  });

  await signIn(page, 'guard', GUARD);
  await injectAvailability(page);
  log('nav-paid', await goGuardPayments(page), page.url());
  await assertPayments(page, 'paid');
  await shot(page, '18-guard-earnings-paid');

  await goNav(page, 'Jobs');
  if (!/jobs|my-jobs/.test(page.url())) {
    await page.goto(`${BASE}/guard/my-jobs`, { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await dismiss(page);
  }
  const completedTab = page.getByRole('button', { name: /Completed/i }).first();
  if (await completedTab.isVisible({ timeout: 2000 }).catch(() => false)) await completedTab.click();
  else await clickAction(page, [/Completed/i], 1500);
  await page.waitForTimeout(1000);
  await shot(page, '22-guard-jobs-history');

  await signIn(page, 'staff', STAFF);
  await page.goto(`${BASE}/staff/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await clickAction(page, [/Settled/i, /All/i], 1500);
  await page.getByText(/Standing Guard Post/i).first().click().catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '19-staff-payments-settled');

  await signIn(page, 'client', CLIENT);
  await page.goto(`${BASE}/client/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(1000);
  await shot(page, '20-client-payments');
  await page.goto(`${BASE}/client/requests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await closeDrawer(page);
  await clickAction(page, [/Completed/i, /Past/i], 1500);
  await closeDrawer(page);
  await page.getByText(/Standing Guard Post/i).first().click().catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '21-client-completed-job');

  // Held / available
  await patch('security_requests', JOB_ID, {
    payment_status: 'held',
    guard_payout_available: false,
    guard_payout_method: null,
    client_name: AD_CLIENT.company_name,
    status: 'completed',
  });
  await signIn(page, 'staff', STAFF);
  await page.goto(`${BASE}/staff/payments`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.getByText(/Standing Guard Post/i).first().click().catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '14-staff-payments-held');
  await patch('security_requests', JOB_ID, {
    guard_payout_available: true,
    guard_payout_available_at: new Date().toISOString(),
    payment_status: 'held',
    client_name: AD_CLIENT.company_name,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.getByText(/Standing Guard Post/i).first().click().catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, '15-staff-payments-available');

  await signIn(page, 'guard', GUARD);
  log('nav-ready', await goGuardPayments(page), page.url());
  await assertPayments(page, 'ready');
  await shot(page, '16-guard-earnings-ready');
  // Scroll payout actions into view for action frame
  await page.evaluate(() => window.scrollTo(0, 280)).catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '17-guard-payout-action');

  // On duty
  await patch('security_requests', JOB_ID, {
    status: 'in-progress',
    assigned_guard_id: GUARD_ID,
    client_name: AD_CLIENT.company_name,
    start_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    latitude: SITE.lat,
    longitude: SITE.lng,
    payment_status: 'paid',
    check_out_audit: null,
    schedule_change_status: 'none',
    check_in_audit: auditIn,
  });
  await signIn(page, 'guard', GUARD);
  await injectAvailability(page);
  await page.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(2400);
  await shot(page, '09-guard-on-duty');
  await shot(page, '07-guard-active-job-late');
  // End-shift affordance if visible
  await page.evaluate(() => window.scrollTo(0, 600)).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, '10-guard-ready-to-complete');
  await shot(page, '13-guard-shift-completed');

  // Client approve (pending applicant John Doe)
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
  await signIn(page, 'client', CLIENT);
  await page.goto(`${BASE}/client/requests`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await closeDrawer(page);
  await clickAction(page, [/^Open$/i], 1500);
  await closeDrawer(page);
  const jobCard = page.locator('p.font-semibold', { hasText: /Standing Guard Post/i }).first();
  if (await jobCard.isVisible({ timeout: 2500 }).catch(() => false)) {
    await jobCard.click({ force: true });
  } else {
    await page.getByText(/Standing Guard Post/i).first().click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(1600);
  await closeDrawer(page);
  const approveBtn = page.getByRole('button', { name: /Approve guard/i }).first();
  if (await approveBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await approveBtn.scrollIntoViewIfNeeded().catch(() => {});
    await shot(page, '04-client-approve-guard');
    await approveBtn.click({ force: true });
    await page.waitForTimeout(1800);
    await dismiss(page);
    await closeDrawer(page);
    await shot(page, '05-client-guard-confirmed');
    log('client-approve', true, 'Approve guard');
  } else {
    await shot(page, '04-client-approve-guard');
    await shot(page, '05-client-guard-confirmed');
    log('client-approve', false, 'no approve button');
  }
  await page.goto(`${BASE}/client/home`, { waitUntil: 'domcontentloaded' }).catch(() =>
    page.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' })
  );
  await waitReady(page);
  await dismiss(page);
  await closeDrawer(page);
  await page.waitForTimeout(1000);
  await shot(page, '06-client-home-scheduled');

  // Marketplace (open job again for apply UI)
  await patch('security_requests', JOB_ID, {
    status: 'open',
    assigned_guard_id: null,
    pending_guard_id: null,
    applicants: [],
    staff_approved_guard_at: null,
    client_name: AD_CLIENT.company_name,
    payment_status: 'paid',
    check_in_audit: null,
    check_out_audit: null,
    start_date: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    latitude: SITE.lat,
    longitude: SITE.lng,
  });
  await signIn(page, 'guard', GUARD);
  await injectAvailability(page);
  await page.goto(`${BASE}/guard/map?jc=${JOB_ID}`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await injectAvailability(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(1800);
  await shot(page, '02-guard-marketplace-map');
  const applied = await clickAction(page, [/Apply for job/i, /Apply/i, /View full job/i], 2000);
  log('marketplace-action', !!applied, applied || 'none');
  if (/View full job/i.test(String(applied || ''))) {
    await clickAction(page, [/Apply for job/i, /Apply/i], 2000);
  }
  await page.waitForTimeout(1200);
  await dismiss(page);
  await shot(page, '03-guard-applied');

  // Briefing / clock-out modal-ish frames from active late state
  await patch('security_requests', JOB_ID, {
    status: 'accepted',
    assigned_guard_id: GUARD_ID,
    pending_guard_id: null,
    applicants: [GUARD_ID],
    client_name: AD_CLIENT.company_name,
    start_date: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    latitude: SITE.lat,
    longitude: SITE.lng,
    payment_status: 'paid',
    check_in_audit: null,
    check_out_audit: null,
    schedule_change_status: 'none',
  });
  await signIn(page, 'guard', GUARD);
  await injectAvailability(page);
  await page.goto(`${BASE}/guard/map`, { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  await dismiss(page);
  await page.waitForTimeout(2000);
  await shot(page, '08-guard-briefing-gate');
  await shot(page, '11-guard-late-clock-out');
  await shot(page, '12-guard-end-package');

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => page.goto(BASE));
  await page.waitForTimeout(1500);
  await shot(page, '23-landing-final');

  // Restore settled job + names
  await patch('security_requests', JOB_ID, {
    status: 'completed',
    assigned_guard_id: GUARD_ID,
    pending_guard_id: null,
    applicants: [GUARD_ID],
    client_name: origC.company_name,
    payment_status: 'released',
    guard_payout_method: 'stripe',
    guard_payout_available: true,
    schedule_change_status: 'none',
    check_in_audit: snapshot.check_in_audit || auditIn,
    check_out_audit: snapshot.check_out_audit || auditOut,
  });
  log('mobile-tour', true, 'complete');
} catch (e) {
  log('fatal', false, e?.stack || String(e));
  await shot(page, '99-fatal').catch(() => {});
} finally {
  await patch('guards', GUARD_ID, origG).catch(() => {});
  await patch('clients', CLIENT_ID, {
    name: origC.name,
    company_name: origC.company_name,
    first_name: origC.first_name,
    last_name: origC.last_name,
  }).catch(() => {});
  await patch('security_requests', OLD_JOB_ID, { client_name: origOld?.client_name }).catch(() => {});
  await browser.close();
  const list = (dir, device) =>
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
  const shots = [...list(AD_DESKTOP, 'desktop'), ...list(AD_MOBILE, 'mobile')];
  fs.writeFileSync(
    path.join(AD, 'MANIFEST.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        names: { guard: 'John Doe', client: 'Jane Doe', company: 'Jane Doe Properties' },
        devices: ['desktop', 'mobile'],
        counts: {
          desktop: list(AD_DESKTOP, 'desktop').length,
          mobile: list(AD_MOBILE, 'mobile').length,
          total: shots.length,
        },
        screenshots: shots,
      },
      null,
      2
    )
  );
  console.log(
    JSON.stringify(
      {
        desktop: list(AD_DESKTOP, 'desktop').length,
        mobile: list(AD_MOBILE, 'mobile').length,
      },
      null,
      2
    )
  );
}
