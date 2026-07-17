# /setuppwa — Build or rebuild the Progressive Web App

Build or rebuild the **PWA** (`shellKind: pwa`).

## Create

- Installable application (`public/manifest.json`)
- Service worker (`public/sw.js`) with caching strategy
- Offline mode and offline queue where applicable
- Push notifications (web push)
- Background sync (where implemented)
- Install prompt and standalone chrome

## Design goals

- **Lightweight experience** — fast startup, low bandwidth
- Optimized mobile workflow
- No marketing landing in app shell — use `AppHomeScreen`
- Sheet auth, safe-area padding, `app-pwa.css` styling

## Maintain

Feature parity with website where practical, prioritizing **speed** and **offline capability** over density.

## Architecture

```
public/manifest.json, public/sw.js
src/lib/platform/appExperience.ts, shellKind.ts
src/styles/app-pwa.css
src/lib/platform/offlineQueue.ts
```

## Branch & PR

- Branch: `cursor/setuppwa-<descriptive-name>-e760`

## Report back

- PWA features built or updated
- Install/offline/push verification
- Files changed
- Test/lint status
