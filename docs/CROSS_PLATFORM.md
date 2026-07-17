# Guardr Cross-Platform Strategy

This document maps the product cross-platform plan to the current codebase and build order.

## Architecture Decision

**Recommended stack (Option A):** One codebase → Web + PWA + Capacitor native shells.

| Layer | Current implementation | Notes |
|-------|------------------------|-------|
| Web app | React + Vite + Tailwind | Responsive SPA; equivalent role to Next.js for this product (no SSR required yet) |
| PWA | `public/manifest.json`, `public/sw.js`, `InstallPrompt` | Installable on iOS, Android, Chromebook |
| Native apps | `capacitor.config.ts` (scaffold) | Add Capacitor deps when ready for store submission |
| Backend | Supabase PostgreSQL | Shared across all surfaces |
| Offline field mode | `src/lib/platform/offlineQueue.ts` | IndexedDB queue; sync layer TBD |

A future migration to **Next.js** is optional if you need SSR, API routes, or edge rendering. The current Vite stack already satisfies steps 1–4 of the rollout plan.

## Build Order

1. **Web app (responsive)** — in progress; mobile-first guard UX, client SaaS flow, staff dashboard
2. **PWA installability** — manifest, service worker, install prompt, standalone safe areas
3. **Guard mobile UX** — Uber-style bottom nav, large touch targets, optional map
4. **Staff command center** — ops sidebar; tablet split panels on staff-ops branch
5. **Capacitor wrappers** — Android APK available (`npm run android:apk`); iOS pending Apple Developer account
6. **App Store + Play Store** — Apple Developer account, FCM native push, Stripe compliance

## Device Experience Matrix

| Device | Primary users | UI behavior |
|--------|---------------|-------------|
| Phone | Guards, clients | Single column, bottom nav (`BottomNavBar` + `MoreMenuSheet`), big actions |
| Tablet | Staff, guards, clients | **Merge shell** — icon rail + command bar + touch content (`TabletAdminShell`) |
| Desktop / Chromebook | Staff, clients, admin | Full dashboards, analytics, financial controls (`DesktopAdminShell`) |
| PWA standalone | All | No browser chrome; safe-area padding; `app-pwa.css` styling |
| Native APK | All | Capacitor shell; native safe areas; `app-native.css` styling |

Form factor is detected in `src/lib/platform/device.ts` and exposed via `useDevice()` / `body[data-form-factor]`.

### View surface model (`/fixit`)

Guardr uses a **two-axis** layout model:

```
shellKind (browser | pwa | native)  ×  formFactor (mobile | tablet | desktop)  →  viewSurface
```

| Surface | Example |
|---------|---------|
| `browser-desktop` | Advanced marketing + admin workspace |
| `browser-tablet` | Landing merge + `TabletAdminShell` |
| `browser-mobile` | Simple mobile website |
| `pwa-mobile` / `pwa-tablet` | Installed PWA welcome + app chrome |
| `native-mobile` / `native-tablet` | APK welcome + native touch/safe-area |

Central files:

```
src/lib/platform/shellKind.ts       — browser | pwa | native
src/lib/platform/viewSurface.ts     — combined surface resolver
src/components/layouts/tablet/      — TabletAdminShell, TabletStaffAdminShell
src/styles/tablet-app.css           — tablet merge styles
src/styles/app-pwa.css              — PWA overrides
src/styles/app-native.css           — APK overrides
.cursor/commands/fixit.md           — slash command for UI/UX surface work
```

`DeviceProvider` sets `body[data-shell]`, `body[data-view-surface]`, and `body[data-form-factor]` for CSS targeting.

### Pre-auth surfaces (`/uberitplatforms` — Phase 1)

| Surface | Component | Notes |
|---------|-----------|-------|
| `browser-desktop` | `DesktopLandingPage` | Base Web split editorial + preview |
| `browser-tablet` | `TabletLandingPage` | Touch-first 2-column landing (not scaled desktop) |
| `browser-mobile` | `MobileLandingPage` | Thumb-first landing + fixed CTA bar |
| `pwa-mobile`, `pwa-tablet` | `AppHomeScreen` + `AuthPage` (sheet) | Glass dock, “Installed” badge, Uber accent hero copy |
| `native-mobile`, `native-tablet` | `AppHomeScreen` + `AuthPage` (sheet) | Solid dock, safe-area padding, native press feedback |

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

### Uber mobility platform (`/uberitplatforms` Phase 2)

| Surface | Shell behavior |
|---------|----------------|
| `*-mobile` | Thumb-first drawer nav, compact header, optional PWA glass header |
| `*-tablet` | **Persistent** sidebar rail (220–232px), touch padding — not scaled desktop |
| `*-desktop` | Full workspace sidebar (272px), max-width content column |
| `pwa-*` | Glass header blur, safe-area padding |
| `native-*` | 48px touch targets, edge safe areas, solid chrome |

Central files:

```
src/components/baseui/layout/mobilityChrome.ts   — viewSurface → layout config
src/components/baseui/layout/GuardrDrawerShell.tsx
src/styles/uber-mobility.css                     — global brand→Uber remap + per-surface CSS
src/styles/uber-surfaces.css                     — adm/app legacy bridge inside shell
```

## Theme System

- **Presentation layer:** Stock Uber Base Web tokens via `uberBaseTheme.ts` and `uber-mobility.css` global `--brand-*` remap
- **Themes:** Light (default), Dark, Grey — accent is Uber blue (`#276ef1`), not legacy sage
- **Persistence:** `localStorage` per user + `theme_preference` column on `guards` / `clients` (migration `20260608100000`)
- **Sync:** On sign-in and theme change, preference writes to Supabase when connected

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
| Guard | Uber Driver | Map/opportunities, self-audit, earnings |
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
  theme.ts            — theme load/save/apply
  offlineQueue.ts     — IndexedDB offline queue
  DeviceProvider.tsx  — React context + body data attributes
src/components/layouts/tablet/
  TabletAdminShell.tsx
  TabletStaffAdminShell.tsx
src/styles/
  tablet-app.css      — tablet merge shell
  app-pwa.css         — PWA standalone overrides
  app-native.css      — APK native overrides
capacitor.config.ts   — native wrapper config (when Capacitor added)
public/manifest.json  — PWA manifest
public/sw.js          — service worker shell cache
```

## Next Steps

- [x] Android APK build + download page (`/download/`)
- [x] Wire offline queue flush on `online` event in guard shift flow
- [x] Guard offline enqueue for self-audit, incident, and activity reports
- [x] Offline connectivity banner (`OfflineBanner`, `useOnlineStatus`)
- [ ] Conflict resolution for offline sync
- [x] PNG icon set (192, 512) for store requirements
- [ ] Tablet split panels for staff live jobs (staff-ops branch)
- [x] Add Capacitor FCM push notification plugin (native APK; Web/PWA still uses Web Push)
- [ ] Generate manifest screenshots for install UX
- [x] Mobile bottom navigation (`BottomNavBar` + `MoreMenuSheet` in `RoleAppShell`, `StaffOpsLayout`)
- [x] PWA install registration on standalone startup (`registerPwaInstall` in `main.tsx`)
- [ ] E2E test PWA install on iOS Safari + Android Chrome
