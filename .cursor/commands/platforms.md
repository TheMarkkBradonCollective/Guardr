# /platforms — Platform-independent Base Web redesign

Same mission as `/design` — complete presentation-layer redesign using Base Web principles — with **mandatory independent design per platform**.

Use this command when the priority is ensuring each platform has its own optimized experience, not when doing a single-surface pass.

---

## Apply to all platforms

```
═══════════════════════════════════════
WEBSITE
═══════════════════════════════════════
• Desktop
• Tablet
• Mobile Website

═══════════════════════════════════════
PWA (FULL • LITE)
═══════════════════════════════════════
• Complete feature set
• Lightweight installable experience
• Fast startup, offline, caching, sync

═══════════════════════════════════════
ANDROID APK (FULL • PREMIUM)
═══════════════════════════════════════
• Complete feature set
• Premium native experience
• Native navigation, permissions, device integrations
```

Each platform must have its **own optimized experience** while maintaining **feature parity**.

**Never simply resize layouts.** Design every platform specifically for its users and device.

---

## Platform matrix

```
shellKind (browser | pwa | native)  ×  formFactor (mobile | tablet | desktop)  →  viewSurface
```

| Platform | Shell | Surfaces to design independently |
|----------|-------|----------------------------------|
| **Website** | `browser` | `browser-mobile`, `browser-tablet`, `browser-desktop` |
| **PWA** | `pwa` | `pwa-mobile`, `pwa-tablet`, `pwa-desktop` |
| **APK** | `native` | `native-mobile`, `native-tablet`, `native-desktop` |

### Website (browser)

| Form factor | Breakpoint | Design target |
|-------------|------------|---------------|
| Mobile | <768px | Bottom nav, sheets, thumb-zone, single column |
| Tablet | 768–1023px | Icon rail + header + touch content (merge shell) |
| Desktop | ≥1024px | Admin workbench, sidebars, split panels, density |
| Laptop | 1024–1280px | Verify overflow and density |
| Ultra-wide | ≥1280px | Max-width containers, no stretched emptiness |

### PWA (FULL • LITE)

- **Full** — complete feature set, same routes and permissions as website
- **Lite** — fast startup, low bandwidth, offline-first where practical
- No marketing landing in app shell — `AppHomeScreen` not `HomePage`
- Standalone chrome, safe areas, `app-pwa.css`
- Service worker, manifest, install prompt, push (web)

### Android APK (FULL • PREMIUM)

- **Full** — complete feature set
- **Premium** — native navigation, animations, Capacitor integrations
- Phones, foldables, tablets — each layout independent
- FCM push, camera, GPS, storage, biometrics when available
- Edge-to-edge safe areas, `app-native.css`, back-button handling

---

## Rules (non-negotiable)

1. **Independent layouts** — each `viewSurface` cell gets purpose-built UI
2. **Shared logic** — same business logic, API calls, auth, permissions across platforms
3. **No scaling** — do not stretch desktop to tablet or mobile
4. **Feature parity** — all platforms support the same features; presentation differs
5. **Preserve functionality** — presentation layer only (see `/design`)

---

## Design references (required)

- https://baseweb.design
- https://baseweb.design
- 
- `docs/guardedesign.md`, `docs/design-patterns.md`, `docs/CROSS_PLATFORM.md`

---

## Work order per platform

For **each** platform in scope, complete before moving to the next:

1. Audit current `viewSurface` cells — note shared layouts that must split
2. Redesign shell chrome (nav, header, footer) for that platform
3. Redesign page content at mobile → tablet → desktop within that platform
4. Apply Base Web adapters (`src/components/baseui/`)
5. Platform-specific CSS (`desktop-app.css`, `tablet-app.css`, `app-pwa.css`, `app-native.css`)
6. Verify feature parity checklist against website reference
7. Test on target device class (browser resize, PWA install, APK build)

## Per-platform checklist

- [ ] Shell chrome redesigned for this platform
- [ ] All pages have independent layout (not scaled)
- [ ] Navigation matches platform conventions (bottom nav / rail / sidebar)
- [ ] Safe areas and offline behavior verified (PWA/APK)
- [ ] Light + Dark + Grey themes tested
- [ ] WCAG AA accessibility verified
- [ ] Feature parity confirmed vs other platforms
- [ ] Functionality unchanged

---

## Central files

```
src/lib/platform/shellKind.ts, viewSurface.ts, DeviceProvider.tsx
src/components/layouts/desktop/, tablet/, RoleAppShell.tsx
src/components/baseui/                    — Base Web adapters
src/theme/guardrBaseTheme.ts, motionTokens.ts
src/styles/desktop-app.css, tablet-app.css, app-pwa.css, app-native.css
```

---

## Branch & PR

- Branch: `cursor/platforms-<descriptive-name>-e760`
- Update `docs/CROSS_PLATFORM.md` when surface behavior changes

## Report back

- Platforms completed (website desktop/tablet/mobile, PWA, APK)
- `viewSurface` cells touched
- Layouts split vs still shared (and why)
- Feature parity status per platform
- Files changed
- Test/lint status
- Next platform or phase

## Final goal

Every platform feels purpose-built — website density on desktop, touch merge on tablet, thumb-first on mobile, lite speed on PWA, premium native on APK — with one cohesive Guardr + Base Web design language underneath.
