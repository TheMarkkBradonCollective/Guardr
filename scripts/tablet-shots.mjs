/**
 * Tablet QA harness.
 *
 * Drives the preview build through every tablet route for each role at several
 * tablet geometries in both themes, then reports layout defects (overflow,
 * clipping, off-viewport controls, undersized touch targets) alongside the
 * screenshots. Run it after any tablet layout change:
 *
 *   node scripts/tablet-shots.mjs                 # all roles, default sizes
 *   node scripts/tablet-shots.mjs --role staff    # one role
 *   node scripts/tablet-shots.mjs --size ipad-portrait --theme dark
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fixtureFor } from './tablet-qa-fixtures.mjs';

const BASE = process.env.TABLET_QA_BASE ?? 'http://127.0.0.1:4173';
const OUT = process.env.TABLET_QA_OUT ?? '/tmp/tablet-shots';

const SIZES = {
  // Small tablet, portrait — the tightest supported tablet geometry.
  'small-portrait': { width: 744, height: 1133 },
  'small-landscape': { width: 1133, height: 744 },
  // Standard 10.9" tablet.
  'ipad-portrait': { width: 834, height: 1194 },
  'ipad-landscape': { width: 1194, height: 834 },
  // Large 12.9" tablet.
  'large-portrait': { width: 1024, height: 1366 },
  'large-landscape': { width: 1366, height: 1024 },
};

const ROLES = {
  staff: {
    user: {
      id: 'qa-staff',
      name: 'Dana Reyes',
      email: 'dana@guardr.co',
      role: 'owner',
      staffRole: 'Founder',
      badgeNumber: 'S-1001',
    },
    routes: [
      'overview', 'map', 'jobs', 'locations', 'applications', 'credentials',
      'guards', 'clients', 'team', 'messages', 'support', 'payments',
      'platform-fees', 'staff-compensation', 'agreements', 'audit-log',
      'incidents', 'violations', 'disputes', 'stats', 'analytics', 'cities',
      'permissions', 'settings', 'integrations', 'guide', 'profile',
    ].map((s) => `/staff/${s}`),
  },
  guard: {
    // Must match the `guards` fixture row: the app resolves the signed-in guard
    // by profile id/email and bounces to the landing page when it cannot.
    user: {
      id: 'guard-1',
      name: 'Miles Okafor',
      email: 'miles.okafor@guardr.co',
      role: 'guard',
      badgeNumber: 'IC-4200',
      hourlyRate: 28,
    },
    routes: [
      'map', 'my-jobs', 'payments', 'messages', 'support', 'availability',
      'preferences', 'performance', 'profile', 'settings', 'guide',
    ].map((s) => `/guard/${s}`),
  },
  client: {
    // Matches the `clients` fixture row for the same reason as the guard.
    user: {
      id: 'client-1',
      name: 'Ava Lindqvist',
      email: 'ava@northgate.com',
      role: 'client',
      clientName: 'Northgate Properties',
      organization: 'Northgate Properties',
    },
    routes: [
      'home', 'requests', 'map', 'request', 'guards', 'locations', 'messages',
      'support', 'payments', 'reports', 'profile', 'settings', 'guide',
    ].map((s) => `/client/${s}`),
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { roles: Object.keys(ROLES), sizes: Object.keys(SIZES), themes: ['light', 'dark'] };
  for (let i = 0; i < args.length; i += 1) {
    const next = args[i + 1];
    if (args[i] === '--role') { out.roles = [next]; i += 1; }
    else if (args[i] === '--size') { out.sizes = [next]; i += 1; }
    else if (args[i] === '--theme') { out.themes = [next]; i += 1; }
  }
  return out;
}

/**
 * Layout audit executed in the page. Reports the defects the tablet redesign is
 * required to be free of: horizontal overflow, content escaping the viewport,
 * controls hidden behind fixed chrome, and touch targets under 44px.
 */
function auditPage() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const problems = [];

  const doc = document.scrollingElement || document.documentElement;
  if (doc.scrollWidth > vw + 1) {
    problems.push({ kind: 'document-overflow-x', detail: `${doc.scrollWidth}px > ${vw}px` });
  }

  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
      : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const visible = (el, rect, style) =>
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    Number(style.opacity) !== 0 &&
    rect.width > 0 &&
    rect.height > 0;

  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!visible(el, rect, style)) continue;

    // Content pushed past the right edge of the viewport.
    if (rect.left < vw && rect.right > vw + 1 && style.overflowX !== 'auto' && style.overflowX !== 'scroll') {
      const parent = el.parentElement;
      const parentScrolls = parent && ['auto', 'scroll'].includes(getComputedStyle(parent).overflowX);
      if (!parentScrolls) {
        problems.push({ kind: 'overflow-right', node: describe(el), detail: `right=${Math.round(rect.right)} vw=${vw}` });
      }
    }

    // Text clipped by a fixed-height box.
    if (el.scrollHeight > el.clientHeight + 2 && style.overflowY === 'hidden' && el.clientHeight > 0) {
      const t = (el.textContent || '').trim();
      if (t && style.textOverflow !== 'ellipsis' && style.whiteSpace !== 'nowrap') {
        problems.push({ kind: 'clipped-text', node: describe(el), detail: `${el.scrollHeight}>${el.clientHeight}` });
      }
    }
  }

  // Touch targets. Tablet minimum is 44px per the surface control scale.
  const controls = Array.from(document.querySelectorAll('button, a[href], input, select, [role="button"], [role="tab"], [role="option"]'));
  const small = [];
  for (const el of controls) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!visible(el, rect, style)) continue;
    if (rect.bottom < 0 || rect.top > vh) continue;
    if (rect.height < 40 || rect.width < 24) {
      small.push({ node: describe(el), detail: `${Math.round(rect.width)}x${Math.round(rect.height)}` });
    }
  }
  if (small.length) problems.push({ kind: 'small-touch-target', count: small.length, samples: small.slice(0, 6) });

  return {
    surface: document.body.dataset.surface,
    problems,
    scrollWidth: doc.scrollWidth,
    viewport: { vw, vh },
  };
}

async function run() {
  const { roles, sizes, themes } = parseArgs();
  const browser = await chromium.launch();
  const report = [];

  for (const roleName of roles) {
    const role = ROLES[roleName];
    if (!role) throw new Error(`unknown role ${roleName}`);

    for (const sizeName of sizes) {
      const size = SIZES[sizeName];
      if (!size) throw new Error(`unknown size ${sizeName}`);

      for (const theme of themes) {
        const context = await browser.newContext({
          viewport: size,
          deviceScaleFactor: 1,
          hasTouch: true,
          isMobile: false,
          colorScheme: theme,
        });
        await context.addInitScript(
          ([user, mode]) => {
            localStorage.setItem('guardr_current_user', JSON.stringify(user));
            localStorage.setItem('guardr_surface_override', 'tablet');
            localStorage.setItem('guardr_theme', mode);
            localStorage.setItem('guardr_legal_accepted', 'true');
            localStorage.setItem(`guardr_tutorial_${user.id}`, JSON.stringify({ lifecycle: 'declined', session: null }));
          },
          [role.user, theme],
        );

        // Serve the app's Supabase reads from fixtures. Without this the tablet
        // screens only ever render their empty states, which hides every
        // density and hierarchy problem the redesign has to solve.
        await context.route('**/rest/v1/**', async (route) => {
          const url = new URL(route.request().url());
          const table = url.pathname.split('/rest/v1/')[1]?.split('?')[0] ?? '';
          const rows = fixtureFor(table);
          const single = url.searchParams.has('id') && !Array.isArray(rows);
          const body = single || !Array.isArray(rows) ? rows : rows;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' },
            body: JSON.stringify(body ?? []),
          });
        });
        await context.route('**/auth/v1/**', (route) =>
          route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
        );
        // Map tiles are irrelevant to layout QA and slow the run down.
        await context.route('**/*.{png,jpg,jpeg}', (route) => {
          if (route.request().url().includes('tile')) return route.abort();
          return route.continue();
        });

        const page = await context.newPage();
        for (const route of role.routes) {
          const slug = route.replace(/\//g, '_').replace(/^_/, '');
          const dir = path.join(OUT, roleName, `${sizeName}-${theme}`);
          mkdirSync(dir, { recursive: true });
          try {
            // The app rewrites the URL during bootstrap, which aborts a normal
            // `goto`. Commit the navigation and then wait for the surface.
            await page.goto(`${BASE}${route}?ui=tablet`, { waitUntil: 'commit', timeout: 30000 });
            await page.waitForFunction(() => document.body.dataset.surface === 'tablet', null, { timeout: 25000 }).catch(() => {});
            await page.waitForTimeout(1500);
            const audit = await page.evaluate(auditPage);
            await page.screenshot({ path: path.join(dir, `${slug}.png`), fullPage: false });
            report.push({ role: roleName, size: sizeName, theme, route, ...audit });
            const flags = audit.problems.map((p) => p.kind).join(',');
            if (flags) console.log(`  ! ${roleName} ${sizeName} ${theme} ${route} → ${flags}`);
          } catch (error) {
            report.push({ role: roleName, size: sizeName, theme, route, error: String(error).slice(0, 200) });
            console.log(`  x ${roleName} ${sizeName} ${theme} ${route} → ${String(error).slice(0, 120)}`);
          }
        }
        await context.close();
        console.log(`done ${roleName} ${sizeName} ${theme}`);
      }
    }
  }

  await browser.close();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  const withProblems = report.filter((r) => r.problems?.length);
  console.log(`\n${report.length} captures, ${withProblems.length} with layout problems`);
  const byKind = {};
  for (const r of withProblems) for (const p of r.problems) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
  console.log(byKind);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
