# /fixit — Complete UI/UX optimization

Perform a complete UI/UX optimization across every Guardr surface. Each device gets its own optimized layout — not a resized copy of another breakpoint.

## Expected outcome

Every screen is fully responsive with purpose-built layouts per platform, improved usability and performance, accessibility fixes applied, and UI bugs resolved.

## Requirements

- Every screen must be fully responsive
- Create **independent layouts** for:
  - **Desktop**
  - **Tablet**
  - **Mobile**
- Do not simply resize elements — each device should have its own optimized layout and navigation
- Improve spacing, typography, animations, and usability
- Fix accessibility issues (focus, contrast, labels, keyboard/touch targets)
- Optimize loading speed
- Ensure all pages work on every device

## Platform designs

### Website

| Surface | Target |
|---------|--------|
| **Desktop** | Full desktop experience — admin workspace density, sidebars, split panels |
| **Tablet** | Optimized touch layout — rail + header + touch-friendly content |
| **Mobile** | Responsive mobile website — single column, bottom nav, sheets |

### PWA

- Lightweight experience
- Faster loading
- Offline support where applicable
- Core features only — no marketing chrome in app shell

### Android APK

- Premium native-style interface
- Enhanced animations
- Mobile-first navigation
- Device integrations: camera, GPS, notifications, storage, biometrics when available

## Architecture (use existing platform layer)

```
shellKind (browser | pwa | native)  ×  formFactor (mobile | tablet | desktop)  →  viewSurface
```

Central files:

```
src/lib/platform/device.ts, shellKind.ts, viewSurface.ts, DeviceProvider.tsx
src/components/layouts/desktop/   — DesktopAdminShell, DesktopStaffAdminShell
src/components/layouts/tablet/    — TabletAdminShell, TabletStaffAdminShell
src/components/layouts/RoleAppShell.tsx
src/styles/desktop-app.css, tablet-app.css, app-pwa.css, app-native.css
```

See `docs/CROSS_PLATFORM.md` for the full surface model.

## General cleanup

- Fix UI bugs, responsive bugs, and alignment issues
- Improve visual and interaction consistency
- Remove unused code and dead CSS
- Optimize performance (lazy load, reduce re-renders, trim bundle where obvious)

## Work order

1. Audit screens against the surface matrix — note what shares a layout that should split
2. Implement **mobile** first (default path)
3. Add **tablet** shell wiring for authenticated app screens
4. Add **desktop** variants where density warrants it
5. Verify **PWA** and **native (APK)** at mobile and tablet widths
6. Run `npm run lint` and `npm test`

## Branch & PR

- Branch: `cursor/fixit-<descriptive-name>-e760`
- Update `docs/CROSS_PLATFORM.md` when surface behavior changes

## Report back

- Surfaces and screens touched (desktop / tablet / mobile / PWA / APK)
- Files changed (shells, components, CSS)
- UI bugs fixed
- Screens still needing a dedicated variant
- Accessibility and performance improvements made
- Test/lint status
