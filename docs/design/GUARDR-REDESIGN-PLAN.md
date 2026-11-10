# Guardr Redesign Plan

Companion to [`COMPLETE-PAGE-INVENTORY.md`](./COMPLETE-PAGE-INVENTORY.md), which is the source of truth for **what exists**. This document says **how the redesign is organised, in what order, who owns which files, and how each page is tracked to done**. It is derived from code at `main` `1355600b` (PR #1084 merged as `70366f6a`; PR #1085, the black website icon, merged after it). No UI was changed by this audit.

## 1. Ground rules

1. **A page is Complete only when all of these hold:** implemented on every surface where it is reachable (inventory M/T/D/App columns), functionality verified against the real Worker and a seeded Neon branch, layout verified at the surface's breakpoints, accessibility checklist passed (Phase 10), and its row in section 9 has a link to the evidence (PR, screenshots, test). **Changing a shell, a token or a CSS file does not move any page past "In progress".**
2. **Status values (per page, in section 9):** `Not started` -> `In progress` -> `Implemented` -> `Functionality verified` -> `Responsive verified` -> `Complete`. Skipping a status is not allowed; moving back is.
3. **Evidence required per transition:** Implemented = merged PR touching the page's component; Functionality verified = a recorded test run (e2e or manual script with account/seed named) covering the page's primary action; Responsive verified = screenshots at the surface widths in section 4 (Phases 3-5) plus the real-device list; Complete = Phase 10 sign-off.
4. **No new reliance on written docs.** The inventory states which docs are wrong (`guardedesign.md` sage-green palette, README workers.dev URL, crew hub, etc.).
5. **Do not reimplement permissions in the UI to look correct.** Server-side enforcement is essentially absent (`/api/data/query` trusts a client-asserted session). Redesigns must not remove client gating, and must not promise enforcement. Fixing enforcement is a separate security track (section 11).

## 2. What exists from PR #1084 and where it is incomplete

PR #1084 ("first visual pass") merged 2026-11-10 as `70366f6a` (31 files, +2,297 / -331). It is a **patch layer on the existing architecture, not a new design system.**

| Delivered | Files | Why it is incomplete |
|---|---|---|
| `visual-refresh.css` (854 lines, 71 `data-surface` selectors), loaded last | `src/styles/visual-refresh.css`, `main.tsx` (+1 import) | A patch layer over ~51k lines of CSS (24,086 in `index.css`). Sets type/controls per surface, legal doc layout, offline banner offsets, overflow hygiene, map sheets. It does **not** replace tokens or any component styling; it wins by import order and specificity. |
| Landing refresh | `landing/mobility/{MobilityStyleLandingPage,MobilityLandingChrome,MobilityExploreGrid,MobilityLandingVisuals}`, `gr-landing.css` (+213) | Landing only. "Safety" and "Company" nav items still open sign-in (pages absent). Three variants share one component. |
| Legal documents | `legal/LegalPage.tsx` | Phone sheet / tablet paper / desktop rail for the six documents. Legal acceptance modal and gate, auth, onboarding untouched. |
| Guide | `docs/AppGuidePage.tsx` | One page. Embedded business plan / company package / dev updates and staff-only guide sections remain in the public bundle. |
| Maps (guard/client/staff) | `map/{MapBrowseDock,MapSelectionExperience}`, `client/ClientMapScreen`, `staff/StaffOpsMapScreen` | Desktop inspector exists for roles that cannot reach desktop (guard/client). Guard map screens themselves are barely touched. |
| Messages | `messaging/MessagesHubLayout`, `client/ClientMessagesPanel`, `guard/GuardMessagesPanel`, `staff/StaffMessagesPanel` | Hub layout only; chat thread panels, job chat, messenger companion untouched. |
| Staff support | `staff/StaffSupportPanel` | One of 30 staff sections. |
| Client invoices | `client/ClientInvoiceScreen` | Ledger layout; Payments, overtime review, request flow untouched. |
| Offline banner | `OfflineBanner.tsx` | Global; other states (loading/empty/error) untouched. |
| Dev harness | `src/dev/*`, 5 preview screens | Dev server only; covers 5 screens. |
| Infra config | `wrangler.toml` previews, `public/.assetsignore` | n/a |

**Not touched at all** (per inventory): every auth screen, onboarding/activation, profile/settings, support/report forms, account portal, download/install, 29 of the 32 staff section pages (only Map, Messages and Support were touched), most guard and client pages, bottom nav / More sheet / account menu / sidebars, tokens, fonts, icons, PWA, native.

Row-level coverage is in the "design condition" column of the inventory. At audit time the redesigned set is the files above only.

## 3. Documented limits and decisions needed before work starts

| # | Limit / fact | Consequence for the plan |
|---|---|---|
| L1 | **There is no desktop-native app.** No Electron/Tauri/Capacitor-Electron anywhere; installed shells never resolve to desktop. | Phase 7 cannot "redesign" something that does not exist. **Decision D1:** (a) ship an installable desktop PWA (needs the missing manifest/role manifests and window controls; smallest), (b) build a Tauri/Electron wrapper (new project, signing, auto-update), or (c) declare "desktop app = website" and close Phase 7 as documentation. Phase 7 is blocked on D1. |
| L2 | **The "dedicated mobile app" is the same web bundle in a Capacitor WebView** (Android only, `server.url` remote origin, portrait lock). No iOS project exists. | Phase 6 is installed-shell behaviour and native chrome, not new screens. Every page redesigned in Phase 3/4 is automatically the app UI. **Decision D2:** keep portrait lock (tablet rail then never ships in the APK) or unlock orientation; **D3:** is iOS in scope. |
| L3 | **Active guards and clients cannot use `/guard/*` or `/client/*` in a browser** (forced to `/account`). Their desktop code is unreachable. | Phase 5 (desktop website) for guard/client = public site + auth + legal + guide + `/account` portal only. Do not invest in guard/client desktop screens until **Decision D4** (open the products in browsers, or delete the dead desktop branches). |
| L4 | Staff sees a full product on all three surfaces in browsers; installed staff app = tablet surface at any width. | Staff is the only role needing all of Phases 3-5 with full coverage. |
| L5 | `App.tsx` is 14,929 lines and mounts every role's pages; `index.css` is 24,086 lines of global CSS. | Parallel work needs the Wave 0 extraction in section 5, otherwise every worker edits the same two files. |
| L6 | Authenticated QA data does not exist: Neon was wiped 2026-11-09, no seed script is documented, screenshot fixtures target Supabase URLs, e2e is unauthenticated. | Phase 9 depends on a seeded Neon test branch and a test-login path (Workstream QA-0). Until then "Functionality verified" cannot be reached for any signed-in page. |
| L7 | Security gaps (client-asserted session on `/api/data/query`, unauthenticated `/api/auth/signup`, login ignores status, legacy rows accept any 4+ char password, UI-only permissions) are **out of scope** but change what functional testing can prove. | Section 11. |
| L8 | Three missing public pages are required by the brief: password recovery, verification, session-expired; plus 404 and error boundary. | New design work (rows `P-32`, `P-33`, `P-34`, `ST-` error/404 rows), owned by WS-PUB and WS-FND. Backend for reset/verify does not exist; **Decision D5.** |

## 4. The ten phases

Phases overlap by workstream (section 6); gates are what must be true before the next phase **starts for that workstream**.

### Phase 1 - Audit and inventory (this PR)
- **Output:** the inventory and this plan.
- **Exit:** both merged to `main`; the section 9 tracker contains one row per inventory row.
- **After this PR:** the inventory is a living file: any PR that adds/removes/renames a route or page must update its row (add to PR template in Phase 2).

### Phase 2 - Design foundation and visual tokens
- **Goal:** one token source and one component kit so Phases 3-5 are page work, not invention.
- **Scope:** (a) decide and write the design language (code is monochrome black/white/grey; `guardedesign.md` is wrong); (b) replace `visual-refresh.css` patching with real tokens: colour roles (surface, text, border, accent, danger/warn/success), spacing, radius, elevation, motion, type scale for 3 surfaces; light + dark; (c) consolidate `gr-tokens.css`, `guardr-design-tokens.css`, `surface-foundation.css`, `surface-look.css`, `src/theme/*` into one documented set and update the four surface-independence tests that pin values; (d) fonts: drop the unshipped "Uber Move" stack, import or remove `@fontsource-variable/inter`, remove Google Fonts preconnect; (e) shared components (section 5, Wave 1); (f) shell and nav (Wave 2); (g) state components: loading, empty, error, restricted, offline, 404, crash (rows `ST-*`).
- **Exit gate:** token docs + a kit page in the dev harness (`?ui-preview=1`) showing every shared component in light/dark x three surfaces; surface-independence tests updated and green; no page migrated yet.
- **Owner:** WS-FND (single worker; everything else waits on Waves 0-2).

### Phase 3 - Mobile website (<744px)
- **Scope:** every page reachable on the mobile surface (inventory "M" column): all of Public, Account, Staff; plus guard/client operational screens (these are the installed-shell UI).
- **Workstreams:** WS-PUB, WS-ACC, WS-GRD-M, WS-CLT-M, WS-STF-OPS, WS-STF-COMMS, WS-STF-FIN (each covers its own staff sections at phone width; the drawer itself is a Wave 2b shell).
- **Exit:** each page row reaches `Responsive verified` at 360, 390, 430 px widths + safe-area, dark and light.

### Phase 4 - Tablet website (744-1179px)
- **Scope:** inventory "T" column. Installed shells use the tablet surface at any width, but the APK is portrait-locked (L2), so the tablet rail is exercised by PWA, browsers and `?ui=tablet`.
- **Workstreams:** WS-PUB, WS-ACC, WS-GRD-T, WS-CLT-T, and the three WS-STF-* streams again at tablet width.
- **Exit:** `Responsive verified` at 744, 834, 1024 and 1179 px, portrait and landscape.

### Phase 5 - Desktop website (>=1180px)
- **Scope:** public site, auth, legal, guide, `/account` portal, and **all of staff** (L3, L4). Guard/client desktop screens are in scope only if D4 opens them.
- **Workstreams:** WS-PUB, WS-ACC, WS-STF-OPS, WS-STF-COMMS, WS-STF-FIN (staff desktop sections split three ways, section 6).
- **Exit:** `Responsive verified` at 1180, 1440, 1920 px with 125%/150% zoom for staff data tables.

### Phase 6 - Dedicated mobile app (Android Capacitor)
- **Scope (L2):** installed-shell behaviour only: safe-area/status bar/navigation bar colours per theme and role, splash handling (`launchAutoHide false` means the web app must hide it), orientation decision D2, deep links, push, install/update flow (`AppDownloadScreen`, `P-47`), `server.url` (currently a workers.dev URL, not `guardr.co`), offline page. Native **icon work excluded** (section 8).
- **Owner:** WS-APP. **Depends on:** Phase 2 tokens (theme colours), Phase 3 pages. **Exit:** release APK per role (`client/guard/staff/messenger`) smoke-tested on a phone and a tablet.

### Phase 7 - Dedicated desktop app
- **Blocked on D1.** If (a): manifest, window-controls-overlay, per-role manifests; if (b): new repo module with its own CI, signing, updater; if (c): close with documentation.
- **Owner:** WS-APP (desktop track). **Exit:** whichever deliverable D1 chooses, installed and launched on Windows and macOS.

### Phase 8 - Website icon and branding
- **Scope:** section 8. PR #1085 already shipped the black icon set (favicon.ico/16/32, SVG that flips white in dark mode, static apple-touch link, SW cache bump). Remaining: true vector mark, 1200x630 social card, theme-color decision, manifest screenshots/shortcuts, role manifests, maskable safe zone, retire `grey`, header/wordmark components, and updating `scripts/web-branding.test.mjs` if the palette changes. **Must not touch native Android icons or `branded-icon.mjs`.**
- **Owner:** WS-BRAND. Independent of Phases 3-7 apart from the final colour decisions from Phase 2. **Exit:** icon matrix verified in Chrome, Safari (iOS home screen), Firefox, Edge, Android install prompt.

### Phase 9 - Functional testing
- **Scope:** every row of the tracker gets `Functionality verified` with evidence. Requires QA-0 (seeded Neon test branch, accounts for each role/type/status, authenticated Playwright fixtures replacing the stale Supabase interceptors). Test matrix in section 10.
- **Owner:** WS-QA (infrastructure) + each page workstream (its own pages).
- **Exit:** authenticated e2e per role covering each primary action; the 39 unlisted unit tests run in `npm test` or are deleted; 6 phantom `npm test` entries removed.

### Phase 10 - Final design and accessibility review
- **Scope:** one review pass across all rows: visual consistency, contrast (AA, 4.5:1 text / 3:1 UI), focus order and visible focus, keyboard operation (staff desktop), screen-reader labels, reduced motion, 200% zoom, touch targets (48/44/32 minimum per surface scale), RTL/long-text overflow, light and dark.
- **Exit:** every row `Complete`; open exceptions are listed with owners.

## 5. Shared files that must change first, and in what order

Page workstreams may not start editing pages until the **gate** after Wave 2. All Wave 0-2 work is done by WS-FND on one branch sequence (small sequential PRs), because these files are imported by everything.

| Wave | Files / areas | Work | Why first |
|---|---|---|---|
| **0a. Unblock parallelism** | `src/App.tsx` (14,929 lines), `src/components/AuthPage.tsx` (1,817), `GuardDashboard.tsx` (2,040), `StaffDashboard.tsx` (1,465), `ClientDashboard.tsx` (953), `src/lib/appNavigation.ts` | Behaviour-neutral extraction of per-area route mounts into `src/app/{public,account,guard,client,staff}/Routes.tsx` (names illustrative); split `AuthPage.tsx` into per-flow files; freeze `appNavigation.ts` grammar (only WS-FND edits it). Verify with existing e2e plus a screenshot diff of the dev harness. | Every page is mounted through these; without this, all workers conflict in the same files. |
| **0b. CSS ownership** | `src/index.css`, `src/main.tsx`, `src/styles/*` | Create `src/styles/redesign/` with one file per workstream (`ws-pub.css`, `ws-acc.css`, `ws-grd.css`, `ws-clt.css`, `ws-stf-ops.css`, `ws-stf-comms.css`, `ws-stf-fin.css`, `ws-app.css`) imported from one barrel file `redesign/index.css` that WS-FND creates and nobody else edits. Freeze legacy CSS files (read-only except by the owner of the page being replaced; deletions happen in the final cleanup). | Stops CSS conflicts and makes legacy removal possible per page. |
| **1. Tokens** | `guardr-design-tokens.css`, `gr-tokens.css`, `surface-foundation.css`, `surface-look.css`, `visual-refresh.css`, `src/theme/*.ts`, `surfaces/surfaceDesign.ts`, `src/lib/platform/{theme,themeBranding}.ts`, `index.css` `@theme`, the four `*SurfaceIndependence.test.ts` / `surfaceDesign.test.ts` / `typography.test.ts` | One token set (colour roles, type, spacing, radius, elevation, motion) for light/dark x mobile/tablet/desktop; remove duplicated `--uber-*`/`--brand-*`/`--look-*` families; fold `visual-refresh.css` into the new layer; update the pinned-value tests in the same PR. | Everything reads tokens. |
| **2a. Shared components** | `src/components/baseui/*`, `src/components/ui/{app,desktop,motion,wireframe}/*`, `AppButton`, `AppConfirm`, `AppSwitch`, `AppToast`, `SlideToConfirm`, `ThemeToggle`, `ListFilterTabs`, `LoadingScreen`, `Logo`, `OfflineBanner`, `legal/LegalAcceptance*`, `credentials/*` badges and status labels, `jobs/JobListCard` family, `messaging/*` (`MessagesHubLayout`, `ChatThreadPanel`, `JobChatPanel`, `MessagesInboxTabs`), `map/*`, `notifications/*`, `support/*`, `shift/ShiftPeriodStatusBar`, `reports/IncidentReportDetailView` | Rebuild on tokens with per-surface variants; add the missing state components (empty, loading skeleton, error, restricted, session-expired, 404, crash) and the table/list/detail/form-section kit. Publish them in the dev-harness kit page. | Pages compose these. Shared components used by several roles are owned by WS-FND only; role workstreams may add role-local components in their own folders. |
| **2b. Shells and navigation** | `src/surfaces/*` (shells, `surfaceNavigation.ts`, kit folders), `layouts/{RoleAppShell,ClientAppLayout,BottomNavBar,MoreMenuSheet,AccountMenu,SidebarFooterLinks,MobileDrawerIdentity}`, `layouts/desktop/*`, `staff/DesktopStaffAdminShell`, `staff/StaffOpsLayout`, `staff/StaffOpsPageShell`, `lib/staffNavGroups.ts`, `lib/staffNavAccess.ts`, `lib/clientCapabilities.ts` nav lists, guard nav in `GuardDashboard`, `lib/guardActivation.ts` | One shell contract (slots: header, primary nav, secondary nav, content, detail, sheet) per surface; fix inventory defects: security-company duplicate ids, Jobs/Coverage never highlighted, hidden vs blocked staff items (11 mismatches), dead `StaffSidebarNav`, three inactive-guard allow-lists, `DesktopStaffAdminShell` misnomer. | Every page renders inside these. |
| **Gate** | | Dev-harness kit page + shell screenshots for 3 surfaces x 2 themes reviewed; `npm run lint && npm test && npm run test:e2e` green. | Page workstreams start. |

**After the gate, the only files shared between workstreams are read-only** (tokens, kit, shells, `appNavigation.ts`). A worker who needs a change there files it to WS-FND instead of editing.

## 6. Parallel workstreams (independent, non-overlapping)

Workstreams after the gate. "Owns" = the only workstream allowed to edit those paths. Row ranges refer to inventory IDs (full lists in section 9).

| WS | Scope and surfaces | Rows | Owns (paths) | Must not touch | Depends on |
|---|---|---|---|---|---|
| **WS-FND** | Waves 0-2, state components, kit page, dev harness, token tests | `P-73..P-74`, `ST-01..ST-35` (37) | section 5 files, `src/dev/*` (shared kit), `src/main.tsx` | page folders | none (first) |
| **WS-PUB** | Public site, landing (3 variants), auth, legal, guide entry, registration choice, missing recovery/verify/session pages. M/T/D | `G-01..G-03`, `C-01..C-03`, `S-01..S-02`, `P-01..P-13`, `P-16..P-34`, `P-53..P-55`, `P-57..P-60` (47) | `components/{landing,legal}/*` (except shared legal acceptance in Wave 2a), `components/AuthPage.tsx` split files, `components/auth/*`, `HomePage.tsx`, `public/download/*.html`, `public/marketing/*`, `ws-pub.css` | account portal, role dashboards | Gate |
| **WS-ACC** | Shared signed-in surfaces: profile/settings/notifications/support/guide, pending/activation/onboarding, download/install, `/account` website portal, messenger companion. M/T/D | `G-04..G-05`, `G-19..G-20`, `G-62`, `G-69`, `G-74`, `G-76`, `G-92..G-99`, `C-04..C-12`, `C-52`, `C-55..C-58`, `S-03..S-07`, `S-34`, `S-38..S-39`, `S-96`, `P-14..P-15`, `P-35..P-36`, `P-38..P-40`, `P-43..P-52`, `P-62..P-71` (66) | `components/{account,website,profile/UserProfileScreen*,app,docs,onboarding,notifications,support,apps,messenger}/*`, `InstallPrompt.tsx`, `AppHomeScreen.tsx`, `ws-acc.css` | role-specific panels | Gate |
| **WS-GRD-M** | Guard operational UI on the mobile surface: field map, shift flow, jobs, pay, messages, activation credentials, profile credential panels, preferences/availability/vehicle, performance. Installed shell only. | `G-06..G-18`, `G-21..G-60`, `G-63..G-67`, `G-70..G-73`, `G-75`, `G-77..G-90`, `P-37`, `P-41..P-42` (80) | `components/guard/*`, `components/profile/Guard*`, `components/shift/*`, `GuardDashboard.tsx` mobile branches, `surfaces/mobile/kit` guard additions, `ws-grd-m.css` | tablet/desktop files | Gate |
| **WS-GRD-T** | Same rows on the tablet surface (rail, two-pane lists, split map) | `G-06..G-18`, `G-21..G-60`, `G-63..G-67`, `G-70..G-73`, `G-75`, `G-77..G-90`, `P-37`, `P-41..P-42` (80) | `components/guard/*Tablet*` and tablet branches (split by Wave 0a into `*.tablet.tsx` files), `ws-grd-t.css` | mobile/desktop files | Gate + WS-GRD-M row structure |
| **WS-CLT-M / WS-CLT-T** | Client operational UI mobile / tablet: home, map, request flow, jobs (Today/Future/Past), invoices, directory, locations, roster, live ops, messages, reports; personal vs business vs security-company variants | `C-13..C-51`, `C-53..C-54` (41) | `components/client/*`, `ClientDashboard.tsx` branches, `components/jobs/*` client composites, `ws-clt-m.css` / `ws-clt-t.css` | guard/staff files | Gate |
| **WS-STF-OPS** | Staff desktop+tablet+mobile for Operations and Dashboard sections: overview, map, jobs, locations, applications, credentials, guards, clients, team, management + nested | `S-08..S-17`, `S-40..S-45`, `S-47..S-72` (42) | `components/staff/*` for those sections, `ws-stf-ops.css` | comms/fin panels, shell | Gate |
| **WS-STF-COMMS** | Staff Communications, Issues, Insights | `S-18..S-24`, `S-73..S-85` (20) | `components/staff/*` for those sections, `ws-stf-comms.css` | ops/fin panels | Gate |
| **WS-STF-FIN** | Staff Finance, Platform, Resources + permissions/ settings/ integrations | `S-25..S-33`, `S-35..S-37`, `S-46`, `S-86..S-95` (23) | `components/staff/*` for those sections, `ws-stf-fin.css` | ops/comms panels | Gate |
| **WS-BRAND** | Phase 8 only | none (co-owns the manifest part of `P-61`; section 8) | `assets/logos/web-*`, `scripts/generate-logo-assets.mjs` (web outputs only), `public/icons/*`, `public/icon-*.png`, `public/logo*`, `public/manifest.json`, `index.html` head, `lib/platform/themeBranding.ts`, `lib/pwaManifests.ts` | `android/**`, `branded-icon.mjs`, play-store assets | Phase 2 colour decisions |
| **WS-APP** | Phases 6-7 | `P-56`, `P-61` (2) | `capacitor.config.ts`, `android/**` except icons, `public/{sw.js,service-worker.js,offline.html}`, `lib/platform/*` native bridges, `.github/workflows/*android*` | web page files | Gate, D1-D3 |
| **WS-QA** | QA-0 seed + authenticated Playwright, unit-test hygiene, screenshot tooling, CI dedupe | n/a (tracker `Functionality verified` / `Responsive verified` evidence) | `e2e/*`, `playwright.config.ts`, `scripts/*-shots.mjs`, `scripts/viewport-audit.mjs`, `package.json` test script, `.github/workflows/{ci,guardr-ci}.yml`, seed scripts | page code | none (start immediately, in parallel with Phase 2) |

Rules that keep workstreams from colliding:
1. **One owner per path** (above). Cross-owner requests go through a note on the tracker row.
2. **No page worker edits `App.tsx`, `appNavigation.ts`, tokens, shells or shared components** after the gate.
3. **New CSS goes in the owner's `redesign/ws-*.css`**; legacy selectors for the page are deleted in the same PR that replaces the component, never edited in place across ownership lines.
4. **Surface splitting:** where mobile and tablet share one file today, Wave 0a splits it into `*.mobile.tsx` / `*.tablet.tsx` / `*.desktop.tsx` so M and T workstreams do not edit the same file. Pages with data logic keep it in a shared hook file owned by the M workstream; T consumes it.
5. **Tracker edits:** each PR updates only the rows it owns (section 9). Row IDs never change.
6. **Merge order inside a role:** M before T (same data hooks), staff ops/comms/fin are independent.

## 7. Testing and review hooks per phase

- Every page PR must run `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` (CI already does).
- Add the page's dev-harness fixture screen for visual review (`?ui-preview=1`; dev only).
- Phase 9 matrix (section 10) is executed by WS-QA infrastructure + page owners.

## 8. Website icon and branding: current state and how to change it without touching the native icon

Full inventory is in `COMPLETE-PAGE-INVENTORY.md` Part E3. Summary:

| Item | Current | Change allowed in WS-BRAND? |
|---|---|---|
| Favicon SVG | `public/favicon.svg`, `public/logo.svg`, root `logo.svg` (black mark, white in dark scheme; **still a raster PNG wrapped in SVG**) | Yes: replace with a true vector mark (new web master) |
| Favicon PNG/ICO | `public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `public/icons/favicon-{dark,light,grey}.png` | Yes (done in #1085 except dropping `grey`) |
| Apple touch | `public/apple-touch-icon.png` (180) + themed variants; static link in `index.html` since #1085 | Yes |
| Manifest | `public/manifest.json`, icons 192/512/maskable, no `screenshots`/`shortcuts`; role manifests referenced but missing | Yes |
| theme-color | three tags, all `#000000`; runtime overrides per role | Yes (colours from Phase 2) |
| OG/Twitter | `logo.jpg` 512x512 (black, white shield) | Yes: add 1200x630 card |
| Wordmark/logo PNGs | `public/logo*.png`, `logo-wordmark*.png`, `badge-72.png` | Yes |
| Generation | `prebuild` -> `generate-logo-assets.mjs` **overwrites all of the above from `assets/logos/*-source.png` on every build**; `scripts/web-branding.test.mjs` (in `npm test`) pins black-mark / no-colour rules | Change the generator/inputs, never the outputs; update the test with any palette change |
| **Native icons** | `android/app/src/main/res/mipmap-*`, adaptive XML, `colors.xml`, splash, `assets/play-store/*`, `scripts/generate-android-icons.mjs`, `generate-play-store-assets.mjs`, `android-role-build.mjs`, **`scripts/branded-icon.mjs`** (imported by web and native generators) | **No.** Do not modify, and do not modify `assets/logos/icon-source.png` / `wordmark-source.png`. |

Safe approach: add `assets/logos/web-icon-source.*`, point only the web outputs of `generate-logo-assets.mjs` at it, and stop that script importing `branded-icon.mjs` for web files. Native generation keeps its inputs and remains reproducible. Role manifests: either create `/manifests/*.webmanifest` (and use the retired role icons) or delete `pwaManifests.ts` references and the `sw.js` precache entries.

## 9. Per-page tracker

All rows start at **Not started**. Update only your rows, in the PR that does the work. "Surfaces in scope" lists where the page needs work; role operational screens are mobile and tablet only (L3), staff and public are all three. Exceptions are recorded in the inventory `M / T / D / App` column and win over this column.

**Tracked pages: 359** (Guard (`G-*`): 96; Client (`C-*`): 58; Staff (`S-*`): 96; Shared and public pages (`P-*`): 74; Shared and public states (`ST-*`): 35).

### Guard (`G-*`)

| ID | Page | Workstream | Surfaces in scope | Status |
|---|---|---|---|---|
| G-01 | Guard sign-in / role choice | WS-PUB | M, T, D | Not started |
| G-02 | Guard application (sign-up) | WS-PUB | M, T, D | Not started |
| G-03 | Legal acceptance gate | WS-PUB | M, T, D | Not started |
| G-04 | Change-password prompt | WS-ACC | M, T, D | Not started |
| G-05 | Guard onboarding tour `guard-welcome` | WS-ACC | M, T, D | Not started |
| G-06 | Activation screen "Application under review / Upload activation credentials / Update your application / Account restricted" | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-07 | Activation upload checklist | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-08 | Government ID capture/detail | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-09 | COI upload / detail | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-10 | BSIS guard card form | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-11 | PTA / UOF mandatory training | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-12 | 32-hour CE | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-13 | Optional credential add | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-14 | BSIS requirements reference | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-15 | Activation support chat | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-16 | Account suspended / blocked card | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-17 | Credential grace banner + work-blocked banner | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-18 | Application-locked / revision-requested state | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-19 | Notifications inbox | WS-ACC | M, T, D | Not started |
| G-20 | Download/Install app | WS-ACC | M, T, D | Not started |
| G-21 | Field (Map) home | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-22 | Map browse dock / tablet rail | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-23 | Map selection experience / offer card | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-24 | Open job detail (apply) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-25 | Pin filter stepper + route banner | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-26 | Next shift card | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-27 | Replacement offer card | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-28 | Tutorial demo job card | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-29 | Active shift sheet (phases `upcoming/en-route/arrived/on-duty/complete`) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-30 | Pre-shift briefing (manual sheet) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-31 | Briefing ack gate | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-32 | Self-audit "Start of job package" | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-33 | Mid-shift check-in | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-34 | Break start/end | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-35 | Incident report | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-36 | Activity log | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-37 | End-of-shift package | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-38 | Late clock-out prompt | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-39 | Client rating modal | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-40 | Message customer / job chat shortcut | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-41 | Stripe Connect return handler | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-42 | Shift trip lock | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-43 | My Jobs list (tabs Available / Scheduled / Completed / Missed) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-44 | My Jobs desktop workbench | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-45 | My job detail (scheduled/in-progress/completed/missed) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-46 | Price negotiation (open-contract jobs) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-47 | Job slot / team panel | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-48 | Overtime approval | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-49 | Self-audit photos section | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-50 | Missed shifts tab | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-51 | Completed shifts | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-52 | Scheduled shifts | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-53 | Available jobs | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-54 | Messages hub (tabs Chats / Jobs) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-55 | Guard community chat | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-56 | Job chat thread | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-57 | Support inbox (tabs Support / Reports) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-58 | Support ticket thread | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-59 | Support compose | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-60 | Report | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-61 | Team chat | n/a | n/a | N/A (not a page; see inventory row) |
| G-62 | Messenger companion app (guard) | WS-ACC | M, T, D | Not started |
| G-63 | Pay / Earnings | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-64 | Pay desktop | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-65 | Stripe Connect sheet | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-66 | Payout invoice confirmation | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-67 | Timesheet (read-only clock audit) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-68 | Cash payout | n/a | n/a | N/A (not a page; see inventory row) |
| G-69 | Profile | WS-ACC | M, T, D | Not started |
| G-70 | Profile > Credentials | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-71 | Credential add / detail sheets | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-72 | Profile > Inventory | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-73 | Profile > Resume | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-74 | Settings | WS-ACC | M, T, D | Not started |
| G-75 | Company roster panel | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-76 | Guide | WS-ACC | M, T, D | Not started |
| G-77 | Preferences (job alerts) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-78 | Job type onboarding sheet | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-79 | Availability (nav "Schedule") | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-80 | Availability > specific dates | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-81 | Vehicle | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-82 | Performance (nav "Standing") | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-83 | Factor drill-down | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-84 | Rewards ("My rewards") | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-85 | Modality tabs (Standing / Driving) | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-86 | Modality metric detail | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-87 | Contract violations list | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-88 | Contract violation detail + dispute | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-89 | Dispute status | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-90 | Ratings (tier) hero | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T (installed shell) | Not started |
| G-91 | 32-hour panel / PTA-UOF panels | n/a | n/a | N/A (not a page; see inventory row) |
| G-92 | Account home | WS-ACC | M, T, D | Not started |
| G-93 | Account profile | WS-ACC | M, T, D | Not started |
| G-94 | Account payouts | WS-ACC | M, T, D | Not started |
| G-95 | Account downloads | WS-ACC | M, T, D | Not started |
| G-96 | Account settings | WS-ACC | M, T, D | Not started |
| G-97 | Account documents | WS-ACC | M, T, D | Not started |
| G-98 | Account support | WS-ACC | M, T, D | Not started |
| G-99 | Open-app CTA | WS-ACC | M, T, D | Not started |

### Client (`C-*`)

| ID | Page | Workstream | Surfaces in scope | Status |
|---|---|---|---|---|
| C-01 | Client kind picker (sign-up and Customer sign-in) | WS-PUB | M, T, D | Not started |
| C-02 | Client sign-up intake form | WS-PUB | M, T, D | Not started |
| C-03 | Client sign-in form | WS-PUB | M, T, D | Not started |
| C-04 | Account pending approval screen | WS-ACC | M, T, D | Not started |
| C-05 | Application revision requested | WS-ACC | M, T, D | Not started |
| C-06 | Website account - Home (Account) | WS-ACC | M, T, D | Not started |
| C-07 | Website account - Profile | WS-ACC | M, T, D | Not started |
| C-08 | Website account - Billing | WS-ACC | M, T, D | Not started |
| C-09 | Website account - Downloads | WS-ACC | M, T, D | Not started |
| C-10 | Website account - Settings | WS-ACC | M, T, D | Not started |
| C-11 | Website account - Documents | WS-ACC | M, T, D | Not started |
| C-12 | Website account - Support | WS-ACC | M, T, D | Not started |
| C-13 | Home / Overview | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-14 | Map / Activity | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-15 | Active shift tracking overlay | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-16 | Request security / Post job (9-step wizard) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-17 | Direct guard request (8 steps) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-18 | Jobs list (Requests) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-19 | Jobs tab: Open | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-20 | Jobs tab: Scheduled | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-21 | Jobs tab: Completed | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-22 | Jobs tab: Missed | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-23 | Job detail | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-24 | Applicant / guard approval, suggestions, team slots | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-25 | Price negotiation / open contract | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-26 | Edit request | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-27 | Shift start verification + self-audit confirm | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-28 | Shift end verification | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-29 | Replacement request | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-30 | Schedule-change approval / extension payment | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-31 | Overtime review | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-32 | Job payment (Stripe / Square checkout) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-33 | Review + tip | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-34 | Violation report (job incident) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-35 | Messages hub | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-36 | Job chat thread | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-37 | Guardr / client channel chat | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-38 | Support inbox | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-39 | Contact support (compose) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-40 | File a report (support-report) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-41 | Support ticket thread | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-42 | Reports | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-43 | Incident report detail | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-44 | Reports -> Invoices tab | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-45 | Payments / Billing / Invoices | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-46 | Invoice detail / payment | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-47 | Guards directory (Guards / Marketplace) | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-48 | Guard profile | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-49 | Locations / Sites / Client sites | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-50 | Company Roster | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-51 | Live Operations | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-52 | Profile | WS-ACC | M, T, D | Not started |
| C-53 | Authorized contacts / team users | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-54 | Client credentials | WS-CLT (M+T: WS-CLT-M, WS-CLT-T) | M, T (installed shell) | Not started |
| C-55 | Account settings | WS-ACC | M, T, D | Not started |
| C-56 | Guide | WS-ACC | M, T, D | Not started |
| C-57 | Guided tour (client-welcome) + tutorial demo job | WS-ACC | M, T, D | Not started |
| C-58 | Messenger companion (client) | WS-ACC | M, T, D | Not started |

### Staff (`S-*`)

| ID | Page | Workstream | Surfaces in scope | Status |
|---|---|---|---|---|
| S-01 | Staff sign-up ("Apply to work at Guardr") | WS-PUB | M, T, D | Not started |
| S-02 | Staff sign-in | WS-PUB | M, T, D | Not started |
| S-03 | Staff activation / pending / reactivation screen | WS-ACC | M, T, D | Not started |
| S-04 | Activation: government ID upload | WS-ACC | M, T, D | Not started |
| S-05 | Activation: Stripe payout bank connect | WS-ACC | M, T, D | Not started |
| S-06 | Staff legal agreements modal (overlay) | WS-ACC | M, T, D | Not started |
| S-07 | Staff product tour (overlay) | WS-ACC | M, T, D | Not started |
| S-08 | Overview | WS-STF-OPS | M, T, D | Not started |
| S-09 | Map | WS-STF-OPS | M, T, D | Not started |
| S-10 | Jobs | WS-STF-OPS | M, T, D | Not started |
| S-11 | Locations | WS-STF-OPS | M, T, D | Not started |
| S-12 | Applications | WS-STF-OPS | M, T, D | Not started |
| S-13 | Credentials | WS-STF-OPS | M, T, D | Not started |
| S-14 | Guards | WS-STF-OPS | M, T, D | Not started |
| S-15 | Customers (nav id `clients`) | WS-STF-OPS | M, T, D | Not started |
| S-16 | Staff (nav id `team`) | WS-STF-OPS | M, T, D | Not started |
| S-17 | Management | WS-STF-OPS | M, T, D | Not started |
| S-18 | Messages | WS-STF-COMMS | M, T, D | Not started |
| S-19 | Support | WS-STF-COMMS | M, T, D | Not started |
| S-20 | Incidents | WS-STF-COMMS | M, T, D | Not started |
| S-21 | Violations | WS-STF-COMMS | M, T, D | Not started |
| S-22 | Disputes | WS-STF-COMMS | M, T, D | Not started |
| S-23 | Statistics | WS-STF-COMMS | M, T, D | Not started |
| S-24 | Analytics | WS-STF-COMMS | M, T, D | Not started |
| S-25 | Payments & invoices | WS-STF-FIN | M, T, D | Not started |
| S-26 | Platform fees | WS-STF-FIN | M, T, D | Not started |
| S-27 | Staff compensation | WS-STF-FIN | M, T, D | Not started |
| S-28 | Agreements | WS-STF-FIN | M, T, D | Not started |
| S-29 | Audit log | WS-STF-FIN | M, T, D | Not started |
| S-30 | Service areas (nav id `cities`) | WS-STF-FIN | M, T, D | Not started |
| S-31 | Permissions | WS-STF-FIN | M, T, D | Not started |
| S-32 | Public information (nav id `settings`) | WS-STF-FIN | M, T, D | Not started |
| S-33 | Integrations | WS-STF-FIN | M, T, D | Not started |
| S-34 | Guide | WS-ACC | M, T, D | Not started |
| S-35 | Development updates | WS-STF-FIN | M, T, D | Not started |
| S-36 | Business plan | WS-STF-FIN | M, T, D | Not started |
| S-37 | Company package | WS-STF-FIN | M, T, D | Not started |
| S-38 | Profile | WS-ACC | M, T, D | Not started |
| S-39 | Settings (nav id `preferences`) | WS-ACC | M, T, D | Not started |
| S-40 | Map selection drawer | WS-STF-OPS | M, T, D | Not started |
| S-41 | Job detail | WS-STF-OPS | M, T, D | Not started |
| S-42 | Job approval controls (approve / deny request, schedule-change review) | WS-STF-OPS | M, T, D | Not started |
| S-43 | Job listing edit | WS-STF-OPS | M, T, D | Not started |
| S-44 | Applicant ranking (read-only) | WS-STF-OPS | M, T, D | Not started |
| S-45 | Create job form | WS-STF-OPS | M, T, D | Not started |
| S-46 | Job approval settings | WS-STF-FIN | M, T, D | Not started |
| S-47 | Location detail / review | WS-STF-OPS | M, T, D | Not started |
| S-48 | Guard application review | WS-STF-OPS | M, T, D | Not started |
| S-49 | Client application review | WS-STF-OPS | M, T, D | Not started |
| S-50 | Staff application review | WS-STF-OPS | M, T, D | Not started |
| S-51 | Add guard form | WS-STF-OPS | M, T, D | Not started |
| S-52 | Add client form | WS-STF-OPS | M, T, D | Not started |
| S-53 | One-role holds | WS-STF-OPS | M, T, D | Not started |
| S-54 | Application credential viewer (modal) | WS-STF-OPS | M, T, D | Not started |
| S-55 | Credential review: certification | WS-STF-OPS | M, T, D | Not started |
| S-56 | Credential review: COI | WS-STF-OPS | M, T, D | Not started |
| S-57 | Credential review: government ID | WS-STF-OPS | M, T, D | Not started |
| S-58 | Credential review: vehicle | WS-STF-OPS | M, T, D | Not started |
| S-59 | Credential review: client credential | WS-STF-OPS | M, T, D | Not started |
| S-60 | Credential review: staff activation | WS-STF-OPS | M, T, D | Not started |
| S-61 | Add credential for guard | WS-STF-OPS | M, T, D | Not started |
| S-62 | Guard detail: Profile tab | WS-STF-OPS | M, T, D | Not started |
| S-63 | Guard detail: Certs tab | WS-STF-OPS | M, T, D | Not started |
| S-64 | Guard detail: Inventory tab | WS-STF-OPS | M, T, D | Not started |
| S-65 | Guard detail: Performance tab | WS-STF-OPS | M, T, D | Not started |
| S-66 | Guard detail: Timesheet tab | WS-STF-OPS | M, T, D | Not started |
| S-67 | Guard edit mode | WS-STF-OPS | M, T, D | Not started |
| S-68 | Guard account controls | WS-STF-OPS | M, T, D | Not started |
| S-69 | Client detail | WS-STF-OPS | M, T, D | Not started |
| S-70 | Team member detail: Profile tab | WS-STF-OPS | M, T, D | Not started |
| S-71 | Team member detail: Timesheets tab | WS-STF-OPS | M, T, D | Not started |
| S-72 | Add staff form | WS-STF-OPS | M, T, D | Not started |
| S-73 | Messages: Team tab | WS-STF-COMMS | M, T, D | Not started |
| S-74 | Messages: Jobs tab | WS-STF-COMMS | M, T, D | Not started |
| S-75 | Support: Support tab | WS-STF-COMMS | M, T, D | Not started |
| S-76 | Support: Reports tab | WS-STF-COMMS | M, T, D | Not started |
| S-77 | Incident detail | WS-STF-COMMS | M, T, D | Not started |
| S-78 | Violation detail + resolve | WS-STF-COMMS | M, T, D | Not started |
| S-79 | Dispute detail + resolution | WS-STF-COMMS | M, T, D | Not started |
| S-80 | Stats: Overview tab | WS-STF-COMMS | M, T, D | Not started |
| S-81 | Stats: Guards tab | WS-STF-COMMS | M, T, D | Not started |
| S-82 | Stats: Compare tab | WS-STF-COMMS | M, T, D | Not started |
| S-83 | Stats: Violations tab | WS-STF-COMMS | M, T, D | Not started |
| S-84 | Analytics: SLA & operations tab | WS-STF-COMMS | M, T, D | Not started |
| S-85 | Analytics: Platform analytics tab | WS-STF-COMMS | M, T, D | Not started |
| S-86 | Payment detail (job payment row / shift details) | WS-STF-FIN | M, T, D | Not started |
| S-87 | Payout invoice row / invoices tab | WS-STF-FIN | M, T, D | Not started |
| S-88 | Financial controls (hold / release / executive actions) | WS-STF-FIN | M, T, D | Not started |
| S-89 | Compensation: own earnings / timesheets | WS-STF-FIN | M, T, D | Not started |
| S-90 | Compensation: pay rules / settings | WS-STF-FIN | M, T, D | Not started |
| S-91 | Compensation: time adjustments + payout confirmation | WS-STF-FIN | M, T, D | Not started |
| S-92 | City detail / edit | WS-STF-FIN | M, T, D | Not started |
| S-93 | Permissions: role tab editor | WS-STF-FIN | M, T, D | Not started |
| S-94 | Permissions: client credential library | WS-STF-FIN | M, T, D | Not started |
| S-95 | Public information: company placard + homepage + broadcast | WS-STF-FIN | M, T, D | Not started |
| S-96 | Guide: staff role permissions reference | WS-ACC | M, T, D | Not started |

### Shared and public pages (`P-*`)

| ID | Page | Workstream | Surfaces in scope | Status |
|---|---|---|---|---|
| P-01 | Homepage - mobile | WS-PUB | M, T, D | Not started |
| P-02 | Homepage - tablet | WS-PUB | M, T, D | Not started |
| P-03 | Homepage - desktop | WS-PUB | M, T, D | Not started |
| P-04 | Landing nav (header, mobile menu, tablet tab strip) | WS-PUB | M, T, D | Not started |
| P-05 | Landing hero + booking fields | WS-PUB | M, T, D | Not started |
| P-06 | Landing trust strip | WS-PUB | M, T, D | Not started |
| P-07 | Landing explore grid | WS-PUB | M, T, D | Not started |
| P-08 | Landing login band | WS-PUB | M, T, D | Not started |
| P-09 | Landing app-download CTA | WS-PUB | M, T, D | Not started |
| P-10 | Company public placard | WS-PUB | M, T, D | Not started |
| P-11 | Landing footer | WS-PUB | M, T, D | Not started |
| P-12 | Landing mobile action dock | WS-PUB | M, T, D | Not started |
| P-13 | Landing command-palette aside | WS-PUB | M, T, D | Not started |
| P-14 | Installed-app welcome | WS-ACC | M, T, D | Not started |
| P-15 | Public guide | WS-ACC | M, T, D | Not started |
| P-16 | Legal - Terms of Service | WS-PUB | M, T, D | Not started |
| P-17 | Legal - Privacy Policy | WS-PUB | M, T, D | Not started |
| P-18 | Legal - Independent Contractor Agreement | WS-PUB | M, T, D | Not started |
| P-19 | Legal - Client Agreement | WS-PUB | M, T, D | Not started |
| P-20 | Legal - Guard Code of Conduct | WS-PUB | M, T, D | Not started |
| P-21 | Legal - Equal Opportunity Notice | WS-PUB | M, T, D | Not started |
| P-22 | Marketplace agreements gate (modal) | WS-PUB | M, T, D | Not started |
| P-23 | Sign in - role chooser | WS-PUB | M, T, D | Not started |
| P-24 | Sign up - path chooser | WS-PUB | M, T, D | Not started |
| P-25 | Sign up - client-kind chooser | WS-PUB | M, T, D | Not started |
| P-26 | Sign up - work chooser | WS-PUB | M, T, D | Not started |
| P-27 | Sign-in form (guard / customer / staff, one `AuthPage`) | WS-PUB | M, T, D | Not started |
| P-28 | Guard sign-up (application intake step 1) | WS-PUB | M, T, D | Not started |
| P-29 | Staff sign-in / sign-up | WS-PUB | M, T, D | Not started |
| P-30 | Client sign-up forms (3 kinds) | WS-PUB | M, T, D | Not started |
| P-31 | Change-default-password dialog | WS-PUB | M, T, D | Not started |
| P-32 | Forgot password / reset | WS-PUB | M, T, D | Not started |
| P-33 | Email / phone verification, OTP, 2FA | WS-PUB | M, T, D | Not started |
| P-34 | Session expired / sign-in-again screen | WS-PUB | M, T, D | Not started |
| P-35 | Guard / client pending-activation screen | WS-ACC | M, T, D | Not started |
| P-36 | Staff activation / reactivation screen | WS-ACC | M, T, D | Not started |
| P-37 | Guard "Account suspended / blocked" | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T, D | Not started |
| P-38 | Onboarding tour / tutorial overlay | WS-ACC | M, T, D | Not started |
| P-39 | Tutorial demo data session | WS-ACC | M, T, D | Not started |
| P-40 | Profile screen (shared shell) | WS-ACC | M, T, D | Not started |
| P-41 | Guard credentials tab | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T, D | Not started |
| P-42 | Guard inventory tab | WS-GRD (M+T: WS-GRD-M, WS-GRD-T) | M, T, D | Not started |
| P-43 | Settings screen | WS-ACC | M, T, D | Not started |
| P-44 | Account menu | WS-ACC | M, T, D | Not started |
| P-45 | Notification bell + inbox | WS-ACC | M, T, D | Not started |
| P-46 | Support screen (Support + Reports tabs) | WS-ACC | M, T, D | Not started |
| P-47 | App download screen (full page) | WS-ACC | M, T, D | Not started |
| P-48 | Website account - Downloads | WS-ACC | M, T, D | Not started |
| P-49 | PWA install prompt / guide | WS-ACC | M, T, D | Not started |
| P-50 | App install banner (role shells) | WS-ACC | M, T, D | Not started |
| P-51 | Open-app CTA | WS-ACC | M, T, D | Not started |
| P-52 | Update panel (Settings) | WS-ACC | M, T, D | Not started |
| P-53 | Download page | WS-PUB | M, T, D | Not started |
| P-54 | Install-register page | WS-PUB | M, T, D | Not started |
| P-55 | Version manifest | WS-PUB | M, T, D | Not started |
| P-56 | Offline fallback page | WS-APP | App | Not started |
| P-57 | Marketing - business card | WS-PUB | M, T, D | Not started |
| P-58 | Marketing - promo banner | WS-PUB | M, T, D | Not started |
| P-59 | Company package page | WS-PUB | M, T, D | Not started |
| P-60 | Manuals PDFs | WS-PUB | M, T, D | Not started |
| P-61 | PWA files | WS-APP | App | Not started |
| P-62 | Website account shell | WS-ACC | M, T, D | Not started |
| P-63 | Account home | WS-ACC | M, T, D | Not started |
| P-64 | Account profile | WS-ACC | M, T, D | Not started |
| P-65 | Account billing | WS-ACC | M, T, D | Not started |
| P-66 | Account payouts | WS-ACC | M, T, D | Not started |
| P-67 | Account downloads | WS-ACC | M, T, D | Not started |
| P-68 | Account settings | WS-ACC | M, T, D | Not started |
| P-69 | Account documents | WS-ACC | M, T, D | Not started |
| P-70 | Account support | WS-ACC | M, T, D | Not started |
| P-71 | Messenger companion app | WS-ACC | M, T, D | Not started |
| P-72 | Dev preview harness | WS-QA | dev only | Not started |
| P-73 | Loading screen | WS-FND | M, T, D | Not started |
| P-74 | Offline banner | WS-FND | M, T, D | Not started |

### Shared and public states (`ST-*`)

| ID | Page | Workstream | Surfaces in scope | Status |
|---|---|---|---|---|
| ST-01 | Pre-hydration blank page | WS-FND | M, T, D | Not started |
| ST-02 | Static offline page | WS-FND | M, T, D | Not started |
| ST-03 | Root loading screen | WS-FND | M, T, D | Not started |
| ST-04 | Surface shell skeleton | WS-FND | M, T, D | Not started |
| ST-05 | `GuardrSkeleton` | WS-FND | M, T, D | Not started |
| ST-06 | Error boundary / crash screen | WS-FND | M, T, D | Not started |
| ST-07 | 404 / unknown route | WS-FND | M, T, D | Not started |
| ST-08 | Unsupported role fallback | WS-FND | M, T, D | Not started |
| ST-09 | Offline / load-issue banner | WS-FND | M, T, D | Not started |
| ST-10 | Request/roster error + retry | WS-FND | M, T, D | Not started |
| ST-11 | `AppRequestState` loading/error blocks | WS-FND | M, T, D | Not started |
| ST-12 | Empty state primitive | WS-FND | M, T, D | Not started |
| ST-13 | Empty notifications | WS-FND | M, T, D | Not started |
| ST-14 | `pending_approval` sign-in result | WS-FND | M, T, D | Not started |
| ST-15 | Sign-in error messages | WS-FND | M, T, D | Not started |
| ST-16 | Wrong-role deep-link redirect | WS-FND | M, T, D | Not started |
| ST-17 | One-role hold / device account blocked | WS-FND | M, T, D | Not started |
| ST-18 | Session expired | WS-FND | M, T, D | Not started |
| ST-19 | Guard account suspended / blocked | WS-FND | M, T, D | Not started |
| ST-20 | Pending / activation gate | WS-FND | M, T, D | Not started |
| ST-21 | APK not served | WS-FND | M, T, D | Not started |
| ST-22 | App blocked on device (download policy) | WS-FND | M, T, D | Not started |
| ST-23 | Download locked until active | WS-FND | M, T, D | Not started |
| ST-24 | App update available / checking / current / failed | WS-FND | M, T, D | Not started |
| ST-25 | PWA auto-update | WS-FND | M, T, D | Not started |
| ST-26 | Legal acceptance gate | WS-FND | M, T, D | Not started |
| ST-27 | Default-password prompt | WS-FND | M, T, D | Not started |
| ST-28 | Blocked section placeholder | WS-FND | M, T, D | Not started |
| ST-29 | Permission denied toasts | WS-FND | M, T, D | Not started |
| ST-30 | Application locked / revision requested banners | WS-FND | M, T, D | Not started |
| ST-31 | Push notification states | WS-FND | M, T, D | Not started |
| ST-32 | Toasts / app notice | WS-FND | M, T, D | Not started |
| ST-33 | Tutorial / onboarding overlay states | WS-FND | M, T, D | Not started |
| ST-34 | Dev preview states | WS-FND | M, T, D | Not started |
| ST-35 | Staff auth screen: "Application submitted" in error slot | WS-FND | M, T, D | Not started |


## 10. Phase 9 functional test matrix (minimum)

| Area | Accounts / data needed | What must be proved |
|---|---|---|
| Public + auth | none, and one of each role | Landing links (inventory landing link map), sign-in/up for each `ar=` role, wrong-role rejection copy, legal acceptance gate and re-acceptance on version bump, 404/crash states |
| Guard | pending, approved, active, suspended, blocked; with/without each of 5 activation credentials; Stripe test connect | Activation upload flow, map -> offer -> accept, shift lifecycle (pre-shift briefing, check-in, break, check-out), incident report, self-audit, pay/payout, messages, support, profile credentials, preferences/availability/vehicle, performance |
| Client | personal, business, security-company; pending, active | Capability gating per type, request create/edit/approve, direct guard request, guard selection, jobs (today/future/past), invoices + payment, overtime review, directory/roster/locations/live ops, messages, reports |
| Staff | one account per seat: Support, Moderator, Administrator, Manager, Director, Founder, Finance desk; pending/active/suspended | Nav visibility per seat vs `COMPLETE-PAGE-INVENTORY.md` matrix, each section primary action, approvals (jobs, applications, credentials, accounts), payments/fees/compensation, permissions overrides, city scope |
| Portal | active guard and client in a normal browser | Forced redirect to `/account`, each portal view, downloads |
| Native | each role APK on phone + tablet | Install, update, push, deep links, safe areas, orientation, splash hide |
| Responsive | all rows | Widths 360/390/430, 744/834/1024/1179, 1180/1440/1920; portrait/landscape; light/dark |

Infrastructure prerequisites (WS-QA): a Neon branch from `production` with schema applied (`/api/admin/apply-schema`) and seeded accounts; Worker preview deployment bound to that branch; Playwright projects for mobile/tablet/desktop with stored auth state; Stripe test mode keys; Google Maps key restrictions for the test origin.

## 11. Open decisions and out-of-scope findings

| ID | Decision / finding | Needed by |
|---|---|---|
| D1 | Desktop app strategy (PWA / Tauri-Electron / website only) | Phase 7 |
| D2 | Android orientation: keep portrait lock or unlock (tablet rail in APK) | Phase 4/6 |
| D3 | iOS: in or out of scope (no `ios/` project today) | Phase 6 |
| D4 | Allow active guards/clients to use `/guard`, `/client` in a browser (making their desktop surface real) or delete desktop branches | Phase 5 |
| D5 | Password reset / email verification backend (none exists) | Phase 3 (auth) |
| D6 | Design language brief (`guardedesign.md` is wrong; code is monochrome) | Phase 2 |
| D7 | Retire legacy CSS (`index.css` 24k lines) per page vs big-bang | Phase 2 |
| S-1 | Security: client-asserted `x-guardr-session`, unauthenticated signup, login ignores status, weak legacy password acceptance, UI-only staff permissions, sensitive docs bundled in the public JS | separate security track; not part of this redesign |
| S-2 | Website APK `apkUrl` is a relative path the Worker cannot serve | WS-ACC/WS-APP during download redesign |
| S-3 | `cf-android-release.yml` triggers on a stale branch; two duplicate CI workflows; obsolete `VITE_SUPABASE_*` env | WS-QA |
