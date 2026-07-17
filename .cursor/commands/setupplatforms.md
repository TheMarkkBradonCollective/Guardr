# /setupplatforms — Build or rebuild every platform

Build or rebuild **every supported platform** in one coordinated pass.

## Platforms

### Website (browser)
- **Desktop** — `browser-desktop` (≥1024px)
- **Tablet** — `browser-tablet` (768–1023px)
- **Mobile** — `browser-mobile` (<768px)

### Progressive Web App
- **Lite experience** — fast, installable, offline-capable

### Android APK
- **Premium experience** — native integrations, animations, push

## For every platform

1. Create **independent layouts** tailored to the device
2. **Share business logic** — same routes, API, permissions, data models
3. Optimize navigation and UI per platform
4. Configure authentication, routing, assets, themes, icons, and branding
5. Verify performance, accessibility, responsiveness, and production readiness
6. Ensure **feature parity** where appropriate:
   - PWA → speed and offline first
   - APK → native device capabilities first

## Work order

1. Website mobile → tablet → desktop (see `/setupmobile`, `/setuptablet`, `/setupdesktop`)
2. PWA shell and offline (see `/setuppwa`)
3. APK native shell and integrations (see `/setupapk`)
4. Cross-platform verification (see `/websiteaudit`, `/pwaaudit`, `/apkaudit`)
5. `npm run lint`, `npm test`, `npm run build`

## Architecture

```
shellKind (browser | pwa | native)  ×  formFactor (mobile | tablet | desktop)  →  viewSurface
```

See `docs/CROSS_PLATFORM.md` for the full surface model.

## Branch & PR

- Branch: `cursor/setupplatforms-<descriptive-name>-e760`
- Update `docs/CROSS_PLATFORM.md` when surface behavior changes

## Report back

- Per-platform status (website desktop/tablet/mobile, PWA, APK)
- Files changed
- Feature parity notes
- Test/lint/build status
- Production readiness per platform
