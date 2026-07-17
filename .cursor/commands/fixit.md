# /fixit — UI/UX optimization (scope-aware)

Optimize the **selected work** based on its scope. Do not expand beyond what was selected unless the scope is the entire project.

## Scope

| Selection | What to do |
|-----------|------------|
| **Single component** | Improve only that component |
| **Single page** | Fully redesign and optimize that page |
| **Multiple pages** | Optimize all selected pages |
| **Entire project** | Perform a full project UI/UX overhaul |

When no specific selection is given, ask what to target or infer scope from context (open files, recent edits, or an explicit area name).

## Always

- Create independent **Desktop**, **Tablet**, and **Mobile** layouts
- Do not simply scale layouts — design each for its device
- Create an optimized **PWA** version (lite experience)
- Create an optimized **APK** version (premium native experience when applicable)
- Fix responsiveness
- Improve accessibility (focus, contrast, labels, keyboard/touch targets)
- Improve spacing and typography
- Improve navigation
- Improve animations
- Improve performance
- Remove redundant code
- Fix UI inconsistencies
- **Preserve existing functionality** unless improvements require changes

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

## Work order

1. Confirm scope (component / page / pages / project)
2. Audit selected screens against the surface matrix
3. Implement **mobile** first (default path)
4. Add **tablet** shell wiring where needed
5. Add **desktop** variants where density warrants it
6. Verify **PWA** and **native (APK)** at mobile and tablet widths
7. Run `npm run lint` and `npm test`

## Branch & PR

- Branch: `cursor/fixit-<descriptive-name>-e760`
- Update `docs/CROSS_PLATFORM.md` when surface behavior changes

## Report back

- Scope worked on (component / page / pages / project)
- Surfaces touched (desktop / tablet / mobile / PWA / APK)
- Files changed (shells, components, CSS)
- UI bugs fixed
- Screens still needing a dedicated variant
- Accessibility and performance improvements made
- Test/lint status
