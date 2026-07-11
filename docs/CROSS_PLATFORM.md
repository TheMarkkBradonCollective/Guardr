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
| Phone | Guards, clients | Single column, bottom nav, big actions |
| Tablet | Staff, guards, clients | Sidebar from `md` breakpoint; split list/detail panels |
| Desktop / Chromebook | Staff, clients, admin | Full dashboards, analytics, financial controls |
| PWA standalone | All | No browser chrome; safe-area padding; sage theme color |

Form factor is detected in `src/lib/platform/device.ts` and exposed via `useDevice()` / `body[data-form-factor]`.

## Theme System

- **Primary brand:** Sage green (`#84a279`)
- **Themes:** Dark (default), Light, Grey — all keep sage as accent
- **Persistence:** `localStorage` per user + `theme_preference` column on `guards` / `clients` (migration `20260608100000`)
- **Sync:** On sign-in and theme change, preference writes to Supabase when connected

## Offline + Field Mode (Phase 2)

Design foundation in `src/lib/platform/offlineQueue.ts`:

- Queue types: `self-audit`, `incident-report`, `activity-report`, `job-snapshot`
- Guard can save records offline; sync when `navigator.onLine` returns
- UI shows offline banner via `body[data-online="false"]`

**Not yet implemented:** automatic flush to Supabase on reconnect, conflict resolution.

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
  theme.ts            — theme load/save/apply
  offlineQueue.ts     — IndexedDB offline queue
  DeviceProvider.tsx  — React context + body data attributes
capacitor.config.ts   — native wrapper config (when Capacitor added)
public/manifest.json  — PWA manifest
public/sw.js          — service worker shell cache
```

## Next Steps

- [x] Android APK build + download page (`/download/`)
- [ ] Wire offline queue flush on `online` event in guard shift flow
- [ ] Add Capacitor FCM push notification plugin (Web Push works in APK today)
- [ ] Generate PNG icon set (192, 512) for store requirements
- [ ] Tablet split panels for staff live jobs (staff-ops branch)
- [ ] E2E test PWA install on iOS Safari + Android Chrome
