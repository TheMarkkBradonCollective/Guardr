# /pwaaudit — Progressive Web App audit

Perform a complete **PWA** audit (`shellKind: pwa`).

## Verify

### PWA core
- `public/manifest.json` — name, icons, `display: standalone`, theme colors
- Service worker (`public/sw.js`) — install, activate, fetch, cache strategy
- Offline mode and caching behavior
- Installation flow and home-screen install prompt
- Update strategy (cache bust, version sync)
- Storage (localStorage, IndexedDB offline queue)

### App behavior
- Push notifications (web push where configured)
- Background sync (if implemented)
- Icons and splash / standalone chrome
- Responsive layouts at mobile and tablet widths
- Authentication and session in standalone mode
- No browser marketing chrome in app shell (`AppHomeScreen`)

## Repair

- Offline functionality and cache issues
- Install problems and manifest errors
- Service worker registration and update bugs
- UI inconsistencies in standalone shell
- Safe-area and standalone styling (`app-pwa.css`)

## Design target

**Lite experience** — fast startup, low bandwidth, core features prioritized.

## Architecture

```
public/manifest.json, public/sw.js
src/lib/platform/shellKind.ts, appExperience.ts
src/styles/app-pwa.css
body[data-shell="pwa"], body[data-view-surface^="pwa-"]
```

## Branch & PR

- Branch: `cursor/pwaaudit-<descriptive-name>-e760`

## PWA audit report

- **PWA Health Score** (1–10)
- **Install Readiness** (Ready / Needs work / Blocked)
- **Offline Readiness** (Ready / Partial / Not implemented)
- Issues found and fixed
- Recommendations
