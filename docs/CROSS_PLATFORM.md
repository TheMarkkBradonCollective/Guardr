# Guardr Cross-Platform Strategy

This document maps the product cross-platform plan to the current codebase and build order.

## Architecture Decision

**Recommended stack (Option A):** One codebase → Web + PWA + Capacitor native shells.

| Layer | Current implementation | Notes |
|-------|------------------------|-------|
| Web app | React + Vite + Tailwind | Responsive SPA; equivalent role to Next.js for this product (no SSR required yet) |
| PWA | `public/manifest.json`, `public/sw.js`, `InstallPrompt` | Installable on iOS, Android, Chromebook |
| Native apps | Capacitor 7 (`capacitor.config.ts`, `android/`) | Android APK via `npm run android:apk`; iOS pending Apple Developer account |
| Backend | Supabase PostgreSQL | Shared across all surfaces |
| Offline field mode | `src/lib/platform/offlineQueue.ts` | IndexedDB queue; flush on `online` (Background Sync API not used) |

A future migration to **Next.js** is optional if you need SSR, API routes, or edge rendering. The current Vite stack already satisfies steps 1–4 of the rollout plan.

## Build Order

1. **Web app (responsive)** — in progress; mobile-first guard UX, client SaaS flow, staff dashboard
2. **PWA installability** — manifest, service worker, install prompt, standalone safe areas
3. **Guard mobile UX** — Guardr-style bottom nav, large touch targets, optional map
4. **Staff command center** — ops sidebar; tablet split panels on staff-ops branch
5. **Capacitor wrappers** — Android APK available (`npm run android:apk`); iOS pending Apple Developer account
6. **App Store + Play Store** — Apple Developer account, FCM native push, Stripe compliance

## Device Experience Matrix

Guardr ships **three independent applications**, not one responsive layout. See
[`docs/SURFACES.md`](./SURFACES.md) for the full architecture; this table is the summary.

| Device | Primary users | Application | UI behavior |
|--------|---------------|-------------|-------------|
| Phone | Guards, clients | Classic mobile shell (`GuardrDrawerShell`) | Hamburger drawer sidebar + sticky bottom footer tabs + More sheet; scrollable content pane |
| Tablet | Staff, guards, clients | `TabletAppShell` | Persistent labelled rail + quick-switch strip, master/detail split views, docked side panels, persistent inspector, 44px targets |
| Desktop / Chromebook | Staff, clients, admin | `DesktopAppShell` | Permanent grouped sidebar, top bar breadcrumb, data tables, command palette (`Cmd/Ctrl+K`), `Alt+1..9` shortcuts, resizable panels, drag-and-drop, status bar, 32px targets |
| PWA standalone | All | mobile or tablet | Never the desktop application — an installed shell is touch-first by definition |
| Native APK | All | mobile or tablet | Capacitor shell; native safe areas; haptics |

Which application loads is decided **only** in `src/surfaces/surfaceKind.ts` and
published via `useSurface()` / `body[data-surface]`. Width floors are 744px
(mobile → tablet) and 1180px (tablet → desktop). `formFactor` /
`body[data-form-factor]` uses the same floors (`FORM_FACTOR_BOUNDS`) so a 13"
laptop is not labelled desktop while the tablet application is mounted.
Installed PWA/APK shells and touch-only devices never resolve to desktop.
Override with `?ui=mobile|tablet|desktop`.

Desktop look-and-feel CSS targets `body[data-surface="desktop"]` only. Do not
reuse `data-form-factor="desktop"` or `data-view-surface="browser-desktop"` for
chrome that must stay off tablet and mobile.

Each shell is a separate lazy chunk, so a phone never downloads the desktop data
table or command palette.

Form factor and shell kind remain available for finer-grained decisions:
`src/lib/platform/device.ts` exposes `useDevice()` / `body[data-form-factor]`, and
experience tiers (PWA Full/Lite, APK Full/Premium) resolve in
`src/lib/platform/experienceTier.ts` / `body[data-experience-tier]`. Those adjust
chrome, motion, and haptics **within** a surface; they never change which surface
loads.

### View surface model (`/fix`)

Guardr uses a **two-axis** layout model:

```
shellKind (browser | pwa | native)  ×  formFactor (mobile | tablet | desktop)  →  viewSurface
```

| Surface | Example |
|---------|---------|
| `browser-desktop` | Advanced marketing + admin workspace |
| `browser-tablet` | Landing merge + persistent tablet sidebar (`GuardrDrawerShell`) |
| `browser-mobile` | Simple mobile website |
| `pwa-mobile` / `pwa-tablet` | Installed PWA welcome + app chrome |
| `native-mobile` / `native-tablet` | APK welcome + native touch/safe-area |

Central files:

```
src/lib/platform/shellKind.ts       — browser | pwa | native
src/lib/platform/viewSurface.ts     — combined surface resolver
src/components/layouts/tablet/      — deprecated aliases → GuardrDrawerShell / DesktopStaffAdminShell
src/styles/tablet-app.css           — tablet merge styles (split panels, welcome, touch)
src/styles/app-pwa.css              — PWA overrides
src/styles/app-native.css           — APK overrides
.cursor/commands/fix.md           — slash command for UI/UX surface work
```

`DeviceProvider` sets `body[data-shell]`, `body[data-view-surface]`, and `body[data-form-factor]` for CSS targeting.

### PWA tiers (Full · Lite)

| Tier | Detection | Behavior |
|------|-----------|----------|
| **PWA Full** | Default installed PWA | Glass chrome, full motion, decorative welcome art |
| **PWA Lite** | `saveData` / 2G / ≤2GB RAM, `?pwa=lite`, `localStorage.guardr_pwa_mode`, or `VITE_PWA_EXPERIENCE=lite` | No blur, reduced motion, no hero art — same routes & data |

Body attrs: `data-pwa-mode="full|lite"` · `data-experience-tier="pwa-full|pwa-lite"`

### Android APK tiers (Full · Premium)

| Tier | Detection | Behavior |
|------|-----------|----------|
| **APK Full** | Default phones | 48px targets, solid chrome, field-ready |
| **APK Premium** | Tablets by default; `?apk=premium`, `localStorage.guardr_apk_mode`, or `VITE_APK_EXPERIENCE=premium` | Wider rail, richer cards, haptic confirm on slide-to-confirm |

Body attrs: `data-apk-mode="full|premium"` · `data-experience-tier="apk-full|apk-premium"`

Central files:

```
src/lib/platform/experienceTier.ts   — tier resolver + capability helpers
src/lib/platform/nativeHaptics.ts    — Premium APK haptic confirm
src/lib/platform/DeviceProvider.tsx  — body data attributes
src/components/baseui/layout/mobilityChrome.ts — tier-aware shell chrome
src/styles/platform-optimizations.css — per-surface + per-tier CSS
```

### Pre-auth surfaces (`/platforms` — Phase 1)

| Surface | Component | Notes |
|---------|-----------|-------|
| `browser-desktop` | `DesktopLandingPage` | Base Web split editorial + preview |
| `browser-tablet` | `TabletLandingPage` | Touch-first 2-column landing (not scaled desktop) |
| `browser-mobile` | `MobileLandingPage` | Thumb-first landing + fixed CTA bar |
| `pwa-mobile`, `pwa-tablet` | `AppHomeScreen` + `AuthPage` (sheet over welcome) | Glass dock, “Installed” badge, accent hero copy |
| `native-mobile`, `native-tablet` | `AppHomeScreen` + `AuthPage` (sheet over welcome) | Solid dock, safe-area padding, native press feedback |

Central files:

```
src/components/HomePage.tsx              — routes to platform-specific landing pages
src/components/landing/mobile/MobileLandingPage.tsx
src/components/landing/tablet/TabletLandingPage.tsx
src/components/landing/desktop/DesktopLandingPage.tsx
src/components/landing/shared/LandingSections.tsx
src/components/app/AppWelcomeChrome.tsx — shell-specific hero, dock, badges (Base Web)
src/components/auth/AuthFormChrome.tsx  — shared sign-in/sign-up chrome
src/styles/app-pwa.css                  — PWA welcome + auth-sheet overrides (--uber-*)
src/styles/app-native.css               — APK welcome + auth-sheet safe areas
```

Signed-in chrome (`RoleAppShell`, `StaffOpsLayout`) uses **`GuardrDrawerShell`** with **`resolveMobilityChrome(viewSurface)`** — independent layouts per cell (mobile drawer, tablet persistent rail, desktop workspace). PWA/native deltas via `data-shell` + `uber-mobility.css`.

### Base Web mobility platform (`/platforms` Phase 2)

| Surface | Shell behavior |
|---------|----------------|
| `*-mobile` | Thumb-first drawer nav, compact header, optional PWA glass header |
| `*-tablet` | **Persistent** sidebar rail (220–232px), touch padding — not scaled desktop |
| `*-desktop` | Full workspace sidebar (272px), max-width content column |
| `pwa-*` | Glass header blur, safe-area padding |
| `native-*` | 48px touch targets, edge safe areas, solid chrome |

**Phase 3 dashboard migration** — remaining role dashboards migrated to `WorkbenchLayout`:

| Screen | Component | Status |
|--------|-----------|--------|
| Guard earnings desktop | `GuardEarningsDesktop` | Migrated — `WorkbenchGrid`, `GuardrCard`, `GuardrButton` |
| Guard crew hub | `GuardCrewHubPanel` | Migrated — `WorkbenchPage` + `WorkbenchSplit` |
| Guard performance | `GuardPerformanceScreen` | Migrated — `WorkbenchFlatSplit` |
| Guard preferences / availability | `GuardPreferencesScreen`, `GuardAvailabilityScreen` | Migrated — `WorkbenchPage` + toolbar |
| Client reports desktop | `ClientReportsDesktop` | Migrated — `WorkbenchTabBar` + `WorkbenchSplit` |
| Client invoice panel | `ClientInvoicePanel` | Migrated — `GuardrButton`, Base Web table typography |
| Client guard directory | `ClientDashboard` (guards view) | Migrated — `WorkbenchFlatSplit` |
| Staff incidents / violations / disputes | `StaffIncidentsPanel`, etc. | Migrated — `WorkbenchPage` + `WorkbenchSplit` |
| Staff payments / legal / cities / audit | Staff ops panels | Migrated — workbench adapters |
| Staff analytics / SLA | `StaffAnalyticsPanel`, `StaffSlaDashboard` | Migrated — `WorkbenchGrid` + `GuardrCard` |
| Platform guide / dev notes | `AppGuidePage`, `DevNotesPage` | Migrated — `WorkbenchSplit` |

**Phase 4 dashboard kit** — `DashboardHero`, `MetricStrip`, `MetricCell`, `DashboardZone` on remaining hubs:

| Screen | Component | Status |
|--------|-----------|--------|
| Staff payment summary | `StaffPaymentSummary` | Migrated — `MetricStrip` + `MetricCell` |
| Staff SLA dashboard | `StaffSlaDashboard` | Migrated — `MetricCell` grid |
| Staff analytics | `StaffAnalyticsPanel` | Migrated — `MetricCell` metrics |
| Staff job approval | `StaffJobApprovalSettings` | Migrated — `GuardrCard` |
| Staff company placard | `StaffCompanyPlacardPanel` | Migrated — `MetricStrip` + `GuardrButton` |
| Client request wizards | `RequestSecurityFlow`, `DirectGuardRequestFlow` | Migrated — `GuardrButton` CTAs |
| Client guard profile | `GuardProfileScreen` | Migrated — `DashboardHero` + `MetricStrip` (desktop) |

**Phase 5 overlays + CSS cleanup** — feature overlays and legacy class retirement:

| Area | Component / file | Status |
|------|------------------|--------|
| Overlay chrome | `OverlaySheetHeader` | New — shared bottom-sheet header |
| Guard shift modals | `GuardSelfAuditModal`, `GuardEndShiftCheckpointModal` | Migrated — `OverlaySheetHeader` + `uber-overlay-sheet-body` |
| Guard field modals | `GuardIncidentReportModal`, `GuardActivityLogModal`, `GuardRatingModal` | Migrated — `GuardrButton` + `uber-label` / `uber-overlay-actions` |
| Map inspector | `MapSelectionExperience` | Migrated — `GuardrButton` + `uber-map-inspector-close` |
| Pre-shift briefing | `GuardPreShiftBriefing` | Migrated — `uber-text-accent` / `uber-text-muted` |
| Form wizards | `RequestSecurityFlow`, `DirectGuardRequestFlow` | Migrated — `uber-form-wizard` (replaces `adm-form-wizard`) |
| Global CSS | `uber-global.css` | Overlay sheet, form wizard, map inspector utilities |

**Phase 2 dashboard migration** — Base Web adapters replace legacy `adm-workbench` markup:

| Screen | Component | Status |
|--------|-----------|--------|
| Staff overview desktop | `StaffOverviewDesktop` | Migrated — `DashboardHero`, `MetricStrip`, `GuardrCard`, `DashboardZone` |
| Staff ops pages | `StaffOpsPageShell` | Migrated — `WorkbenchPage` |
| List-detail (jobs, guards, clients) | `ListDetailLayout` | Migrated — `WorkbenchSplit` |
| Guard my jobs desktop | `GuardMyJobsDesktop` | Migrated — `WorkbenchPage` + stat chips + table |
| Client requests desktop | `ClientRequestsDesktop` | Migrated — `WorkbenchPage` + stat chips + table |
| Client home desktop | `ClientHomeDesktop` | Already migrated (Phase 1 reference) |

Central files:

```
src/components/baseui/layout/WorkbenchLayout.tsx  — WorkbenchPage, Split, StatChips, Grid
src/styles/gr-workbench.css                     — Base Web workbench layout CSS
src/components/staff/StaffOverviewDesktop.tsx     — staff command center (desktop)
src/components/guard/GuardMyJobsDesktop.tsx       — guard shifts workbench
src/components/client/ClientRequestsDesktop.tsx   — client jobs workbench
```

## Theme System

- **Presentation layer:** Base Web tokens via `guardrBaseTheme.ts` / `guardrBaseTheme.ts`, `uber-tokens.css`, `uber-global.css`, and `uber-mobility.css`
- **Themes:** Light (default web/PWA), Dark (default APK) — black/white primary CTAs, monochrome accent system
- **Experience tiers:** PWA Full/Lite and APK Full/Premium adjust chrome, motion, and haptics without changing feature set
- **Typography:** Guardr Sans / Guardr Sans stack
- **Persistence:** `localStorage` per user + `theme_preference` column on `guards` / `clients` (migration `20260608100000`)
- **Sync:** On sign-in and theme change, preference writes to Supabase when connected

### design system files (`/platforms` complete)

```
src/styles/gr-tokens.css      — canonical --uber-* tokens + --brand-* bridge
src/styles/gr-global.css      — global presentation overrides (buttons, cards, inputs, tables)
src/styles/gr-mobility.css    — per-viewSurface shell chrome
src/styles/gr-surfaces.css    — legacy adm-*/app-* bridge inside .uber-app-shell
src/styles/gr-landing.css     — public marketing (mobility homepage pattern)
src/styles/app-pwa.css          — PWA glass chrome, safe areas
src/styles/app-native.css       — APK native touch targets, safe areas
src/components/baseui/          — Base Web adapters (GuardrButton, GuardrCard, etc.)
src/components/landing/mobility/      — MobilityStyleLandingPage (mobile / tablet / desktop)
```

## Offline + Field Mode (Phase 2)

Design foundation in `src/lib/platform/offlineQueue.ts`:

- Queue types: `self-audit`, `incident-report`, `activity-report`, `job-snapshot`
- Guard can save records offline; sync when `navigator.onLine` returns
- UI shows offline banner via `OfflineBanner` + `body[data-online="false"]`
- Guard field flows enqueue via `src/lib/platform/guardOfflineCapture.ts`
- Automatic flush on reconnect via `useOfflineSync` in `App.tsx`

**Not yet implemented:** conflict resolution for concurrent offline edits.

## Product Feel Targets

| Persona | Reference | Guardr surface |
|---------|-----------|----------------|
| Guard | guard field app | Map/opportunities, self-audit, earnings |
| Staff / Admin | Stripe Dashboard | Ops center, approvals, payments |
| Client | Airbnb host flow | Request wizard, live coverage, reports |
| Real-time | Slack | Activity feed (from real job events only) |

## Chromebook

- **Browser:** Full app at deployed URL
- **PWA install:** Same manifest; `display: standalone` removes browser UI
- No separate Chromebook build required

## Files Reference

```
src/lib/platform/
  device.ts           — breakpoints, standalone detection
  shellKind.ts        — browser | pwa | native
  viewSurface.ts      — combined surface id (e.g. pwa-tablet)
  experienceTier.ts   — PWA Full/Lite · APK Full/Premium resolver
  nativeHaptics.ts    — Premium APK haptic feedback
  theme.ts            — theme load/save/apply
  offlineQueue.ts     — IndexedDB offline queue
  DeviceProvider.tsx  — React context + body data attributes
src/components/layouts/tablet/
  TabletAdminShell.tsx          — deprecated alias → GuardrDrawerShell
  TabletStaffAdminShell.tsx     — deprecated alias → DesktopStaffAdminShell
src/styles/
  tablet-app.css              — tablet merge shell (split panels, welcome, touch)
  app-pwa.css                 — PWA standalone overrides
  app-native.css              — APK native overrides
  platform-optimizations.css  — per-surface + per-tier CSS
capacitor.config.ts   — Capacitor 7 native wrapper
public/manifest.json  — PWA manifest (icons + install screenshots)
public/sw.js          — service worker shell cache
```

## Next Steps

- [x] Android APK build + download page (`/download/`)
- [x] Wire offline queue flush on `online` event in guard shift flow
- [x] Guard offline enqueue for self-audit, incident, and activity reports
- [x] Offline connectivity banner (`OfflineBanner`, `useOnlineStatus`)
- [ ] Conflict resolution for offline sync
- [x] PNG icon set (192, 512) for store requirements
- [x] Tablet staff/guard/client merge shell via `GuardrDrawerShell` (persistent sidebar; bottom nav mobile-only)
- [x] Staff jobs / messages / roster list-detail split on tablet (`ListDetailLayout`)
- [x] Add Capacitor FCM push notification plugin (native APK; Web/PWA still uses Web Push)
- [x] Generate manifest screenshots for install UX
- [x] Mobile bottom navigation (`BottomNavBar` + `MoreMenuSheet` in `RoleAppShell`, `StaffOpsLayout`)
- [x] PWA install registration on standalone startup (`registerPwaInstall` in `main.tsx`)
- [x] PWA/APK sheet auth over `AppHomeScreen`
- [ ] E2E test PWA install on iOS Safari + Android Chrome
- [ ] Background Sync API (optional; online-event flush already works)
- [ ] Capacitor Haptics plugin (Premium APK currently uses Vibration API)
- [ ] Biometrics / Play Store release signing when store-ready
