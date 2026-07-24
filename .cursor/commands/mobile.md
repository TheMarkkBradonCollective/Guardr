# /mobile — Mobile website, PWA, and APK optimization

Optimize only the **Mobile Website**, **PWA**, and **APK** experience.

## Scope

| Surface | Target |
|---------|--------|
| **Mobile website** | Browser at `<768px` — bottom nav, sheets, touch targets |
| **PWA** | Lite standalone install — fast load, offline where applicable, no marketing chrome |
| **APK** | Premium native Capacitor shell — safe areas, push, camera, GPS, biometrics |

## Optimize

- Independent mobile layouts (not scaled desktop)
- Bottom navigation and thumb-zone actions
- Safe-area insets (`env(safe-area-inset-*)`)
- Service worker caching and update strategy (PWA)
- FCM push and native permissions (APK)
- Touch feedback, animations, and native navigation patterns
- Offline queue and field mode where applicable
- APK build version sync with `package.json`

## Architecture

```
src/lib/platform/shellKind.ts   — browser | pwa | native
src/styles/app-pwa.css
src/styles/app-native.css
capacitor.config.ts
public/sw.js, public/manifest.json
```

See `docs/CROSS_PLATFORM.md` and `/fix` for the full surface model.

## Branch & PR

- Branch: `cursor/mobile-<descriptive-name>-e760`

## Report back

- Surfaces optimized (mobile web / PWA / APK)
- Files changed
- Install, offline, push, and permission verification
- Test/lint status
