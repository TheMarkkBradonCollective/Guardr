# /viewit — Multi-surface view design (desktop / mobile / tablet / PWA / APK)

Design and wire **distinct UI surfaces** for every Guardr entry point. Each form factor and shell should feel purpose-built — not a stretched mobile layout.

## Surfaces to ship

| Surface | Shell | Form factor | Design target |
|---------|-------|-------------|---------------|
| **Website desktop** | `browser` | `desktop` (≥1024px) | Advanced admin workspace — XORIC-style sidebar, command bar, split panels, analytics density |
| **Website mobile** | `browser` | `mobile` (<768px) | Simple, fast, bottom-nav / single-column — keep current mobile feel |
| **Website tablet** | `browser` | `tablet` (768–1023px) | **Merge of both** — docked icon rail + desktop-lite header + mobile touch targets |
| **PWA** | `pwa` | `mobile` + `tablet` | Standalone install shell — no marketing chrome, sheet auth, safe-area padding, soft standalone chrome |
| **APK** | `native` | `mobile` + `tablet` | Native Capacitor shell — edge-to-edge, native safe areas, material touch feedback, FCM push, no install prompts |

Desktop website is **browser-only**. PWA and APK never show the public marketing landing — they use `AppHomeScreen` instead of `HomePage`.

## Architecture (do not reinvent)

Use the **two-axis model** already in the codebase:

```
shellKind  ×  formFactor  →  viewSurface
browser    ×  desktop     →  browser-desktop
browser    ×  tablet      →  browser-tablet
browser    ×  mobile      →  browser-mobile
pwa        ×  tablet      →  pwa-tablet
pwa        ×  mobile      →  pwa-mobile
native     ×  tablet      →  native-tablet
native     ×  mobile      →  native-mobile
```

### Central files

```
src/lib/platform/
  device.ts            — breakpoints (md 768, lg 1024)
  shellKind.ts         — browser | pwa | native
  viewSurface.ts       — combined surface resolver
  appExperience.ts     — isAppExperience()
  DeviceProvider.tsx   — sets body[data-form-factor], body[data-shell], body[data-view-surface]

src/components/layouts/
  desktop/             — DesktopAdminShell, DesktopStaffAdminShell (browser desktop only)
  tablet/              — TabletAdminShell, TabletStaffAdminShell (all shells at tablet width)
  RoleAppShell.tsx     — routes desktop → DesktopAdminShell, tablet → TabletAdminShell, mobile → bottom nav
  staff/StaffOpsLayout.tsx — same pattern for staff

src/styles/
  desktop-app.css      — browser desktop admin chrome
  desktop-landing.css  — browser desktop marketing
  tablet-app.css       — tablet merge shell (rail + header + touch)
  app-pwa.css          — PWA standalone overrides (mobile + tablet)
  app-native.css       — APK native overrides (mobile + tablet)
```

## Rules

1. **Split at the layout shell first** — do not sprinkle `formFactor === 'desktop'` inside leaf components unless the UI truly diverges (e.g. `StaffOverviewDesktop`).
2. **CSS targets surfaces** — prefer `body[data-view-surface="pwa-tablet"]` or `body[data-shell="native"]` over ad-hoc media queries in components.
3. **Mobile stays simple** — single column, bottom nav, sheets, large tap targets. Do not add desktop chrome on mobile.
4. **Tablet merges both** — always-visible compact rail (desktop DNA) + mobile content patterns (sheets, touch, no hover-only affordances).
5. **PWA ≠ APK** — both use `AppHomeScreen` and sheet auth, but PWA gets install/standalone styling; APK gets native safe areas, back button, and Capacitor push. Gate install prompts with `shellKind !== 'native'`.
6. **Browser desktop is advanced** — full `DesktopAdminShell` / `DesktopStaffAdminShell`, `DesktopLandingPage`, `DesktopCommandBar`, split list/detail panels.
7. **No React Router** — keep History API routing in `appNavigation.ts`.

## Per-surface checklist

When implementing or auditing a screen:

- [ ] Uses `useDevice()` for `formFactor`, `shellKind`, `viewSurface`
- [ ] Layout chosen at shell level (`RoleAppShell`, `StaffOpsLayout`, `HomePage` vs `AppHomeScreen`)
- [ ] Desktop variant lives under `components/layouts/desktop/` or `components/landing/desktop/`
- [ ] Tablet variant uses `TabletAdminShell` / `TabletStaffAdminShell` or `landing-page--tablet`
- [ ] PWA/native safe areas respected (`env(safe-area-inset-*)`, `--gr-safe-area-*`)
- [ ] Install/download CTAs hidden in PWA/APK where appropriate
- [ ] Map views: desktop inspector vs mobile sheet vs tablet split dock

## Work order for new features

1. Pick the **viewSurface** matrix cell(s) this feature affects.
2. Implement **mobile** first (default path).
3. Add **tablet** shell wiring if the screen is in the authenticated app.
4. Add **desktop** shell or panel variant if staff/client density warrants it.
5. Verify **PWA** and **native** at both mobile and tablet widths — no browser-only assumptions.
6. Add/adjust CSS in the correct split file (`tablet-app.css`, `app-pwa.css`, `app-native.css`).
7. Run `npm run lint` and `npm test`.

## Branch & PR

- Branch: `cursor/viewit-<descriptive-name>-a79f`
- Update `docs/CROSS_PLATFORM.md` when surface behavior changes
- Report back: which surfaces were touched, breakpoints verified, and any screens still sharing a layout that should split

## Report back

- Surfaces implemented or audited (desktop / mobile / tablet / PWA / APK)
- Files changed (shells, CSS, platform layer)
- Screens still needing a dedicated variant
- Test/lint status
