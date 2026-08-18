/**
 * Mobile screenshot harness.
 *
 * Signs a role in by seeding the local session, then walks the phone routes and
 * writes a PNG per screen for both themes. Review-only tooling: it never runs as
 * part of the build.
 *
 * Usage:
 *   node scripts/mobile-shots.mjs [--base http://localhost:3000] [--out /tmp/shots]
 *                                 [--roles guard,client,staff] [--themes light,dark]
 *                                 [--device small|large] [--only route,route]
 */

import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { chromium, devices } from 'playwright';
import { SESSIONS, TABLES } from './mobile-fixtures.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const BASE = flag('base', 'http://localhost:3000');
const OUT = flag('out', '/tmp/shots');
const ROLES = flag('roles', 'guard,client,staff').split(',');
const THEMES = flag('themes', 'light,dark').split(',');
const ONLY = flag('only', '').split(',').filter(Boolean);

const DEVICE_SIZES = {
  small: { width: 360, height: 640 },
  large: { width: 430, height: 932 },
  landscape: { width: 844, height: 390 },
};
const size = DEVICE_SIZES[flag('device', 'large')] ?? DEVICE_SIZES.large;

/** Serve fixture rows for Supabase REST reads so screens render populated. */
async function installFixtures(context) {
  await context.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    if (request.method() !== 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    const table = new URL(request.url()).pathname.split('/rest/v1/')[1]?.split('?')[0] ?? '';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(TABLES[table] ?? []),
    });
  });
  await context.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

const ROUTES = {
  guard: [
    'map',
    'my-jobs',
    'payments',
    'messages',
    'support',
    'availability',
    'preferences',
    'performance',
    'profile',
    'settings',
    'guide',
  ],
  client: [
    'home',
    'requests',
    'map',
    'messages',
    'payments',
    'guards',
    'locations',
    'request',
    'support',
    'settings',
    'profile',
  ],
  staff: [
    'overview',
    'jobs',
    'map',
    'clients',
    'guards',
    'team',
    'applications',
    'credentials',
    'locations',
    'messages',
    'support',
    'payments',
    'incidents',
    'stats',
    'settings',
    'guide',
    'profile',
    'preferences',
  ],
};

async function run() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const failures = [];

  for (const role of ROLES) {
    const session = SESSIONS[role];
    if (!session) continue;

    for (const theme of THEMES) {
      const context = await browser.newContext({
        ...devices['Pixel 7'],
        viewport: size,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      });

      await installFixtures(context);
      await context.addInitScript(
        ([user, mode]) => {
          localStorage.setItem('guardr_current_user', JSON.stringify(user));
          localStorage.setItem('guardr_theme_mode', mode);
          localStorage.setItem('guardr_surface_override', 'mobile');
        },
        [session, theme],
      );

      const page = await context.newPage();
      page.on('pageerror', (error) => failures.push(`${role}/${theme}: ${error.message}`));

      const routes = ROUTES[role].filter((route) => ONLY.length === 0 || ONLY.includes(route));
      for (const route of routes) {
        const url = `${BASE}/${role}/${route}?ui=mobile`;
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          const loading = page.getByRole('status', { name: 'Loading Guardr' });
          await loading.waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {});
          await loading.waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {});
          await page.waitForTimeout(1800);
          const file = path.join(OUT, `${role}-${theme}-${route}.png`);
          await page.screenshot({ path: file });
          const overflow = await page.evaluate(() => ({
            horizontal: document.documentElement.scrollWidth > window.innerWidth + 1,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          }));
          if (overflow.horizontal) {
            failures.push(
              `${role}/${theme}/${route}: horizontal overflow ${overflow.scrollWidth} > ${overflow.innerWidth}`,
            );
          }
          process.stdout.write(`. ${role}/${theme}/${route}\n`);
        } catch (error) {
          failures.push(`${role}/${theme}/${route}: ${error.message}`);
          process.stdout.write(`x ${role}/${theme}/${route}\n`);
        }
      }

      await context.close();
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.log(`\n${failures.length} issue(s):`);
    for (const failure of failures) console.log(`  - ${failure}`);
  } else {
    console.log('\nNo page errors or horizontal overflow detected.');
  }
  console.log(`\nScreenshots in ${OUT}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
