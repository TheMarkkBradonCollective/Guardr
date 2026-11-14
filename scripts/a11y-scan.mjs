// Phase 10 a11y scan: axe-core WCAG 2 A/AA on landing, sign-in, and staff sections.
// BASE=http://localhost:8787 W=390 GUARDR_STAFF_EMAIL=... GUARDR_STAFF_PASSWORD=... node scripts/a11y-scan.mjs
// Use a test branch account only. Prints one line of violations per screen; [] means clean.
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8787';
const axeSrc = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const creds = { email: process.env.GUARDR_STAFF_EMAIL || '', password: process.env.GUARDR_STAFF_PASSWORD || '' };
const W = +(process.env.W || 390);
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: 844 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', colorScheme: process.env.THEME || 'light' });
const p = await ctx.newPage();
async function scan(label) {
  await p.addScriptTag({ content: axeSrc });
  const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 40).map(n => n.target.join(" ") + " :: " + n.html.slice(0, 160)) })));
  console.log('##', label, JSON.stringify(r));
}
const go = async (path) => { await p.evaluate((s) => { history.pushState({}, '', s); dispatchEvent(new PopStateEvent('popstate')); }, path); await p.waitForTimeout(2500); };
await p.goto(BASE + '/'); await p.waitForTimeout(4000); await scan('landing');
await p.goto(BASE + '/?auth=sign-in&ar=staff'); await p.waitForTimeout(4000); await scan('signin');
const f = p.locator('form').filter({ has: p.locator('input[type="email"]') });
if (!creds.email) { await b.close(); process.exit(0); }
await f.locator('input[type="email"]').fill(creds.email); await f.locator('input[type="password"]').fill(creds.password);
await f.getByRole('button', { name: 'Sign in', exact: true }).click(); await p.waitForTimeout(8000);
const skip = p.getByRole('button', { name: 'Skip for now' }); if (await skip.count()) await skip.first().click().catch(()=>{});
for (const s of (process.env.SECTIONS || 'overview,jobs,guards,analytics,payments,profile,settings').split(',')) { await go('/staff/' + s); await scan('staff/' + s); }
await b.close();
