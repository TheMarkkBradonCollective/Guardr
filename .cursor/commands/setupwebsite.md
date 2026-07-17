# /setupwebsite — Build or rebuild the complete website

Build or rebuild the complete **Website** (browser shell) with independent layouts per form factor.

## Create

| Surface | Form factor | Shell |
|---------|-------------|-------|
| **Desktop website** | ≥1024px | `browser-desktop` |
| **Tablet website** | 768–1023px | `browser-tablet` |
| **Mobile website** | <768px | `browser-mobile` |

## Requirements

- **Independent layouts** per screen size — do not scale desktop down
- **Shared functionality** — same business logic, routes, and data layer
- Responsive architecture using `useDevice()` and `viewSurface`
- Modern UI matching Guardr design language (sage green, Light/Dark/Grey themes)
- Accessibility compliant (WCAG AA)
- Optimized performance
- Production-ready

## Deliver

- Routing (`appNavigation.ts` — no React Router)
- Navigation per form factor (desktop shell, tablet rail, mobile bottom nav)
- Layout system (`RoleAppShell`, `StaffOpsLayout`, landing, auth)
- Responsive breakpoints (`device.ts`: md 768, lg 1024)
- Shared components under `src/components/`

## Architecture

```
src/lib/platform/          — device, shellKind, viewSurface, DeviceProvider
src/components/layouts/    — desktop/, tablet/, RoleAppShell
src/styles/                — desktop-app.css, tablet-app.css, desktop-landing.css
docs/CROSS_PLATFORM.md
```

## Branch & PR

- Branch: `cursor/setupwebsite-<descriptive-name>-e760`
- Update `docs/CROSS_PLATFORM.md` when surface behavior changes

## Report back

- Surfaces built or rebuilt
- Files changed
- Test/lint status
- Production readiness
