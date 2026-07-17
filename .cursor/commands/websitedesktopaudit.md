# /websitedesktopaudit — Desktop website audit

Audit only the **Desktop Website** (`browser-desktop`, ≥1024px).

## Verify

- Large-screen and multi-column layouts
- Navigation, sidebars, command bars, split panels
- Hover states and mouse interactions
- Keyboard shortcuts and focus order
- Tables, dashboards, data density
- Popups, modals, dialogs, drawers
- Window resizing and overflow behavior
- Browser compatibility (Chrome, Safari, Firefox, Edge)

## Repair

- Alignment and overflow issues
- UI bugs and broken interactions
- Performance (render cost, large lists, map views)
- Accessibility (contrast, keyboard traps, labels)

## Do not

- Change tablet or mobile layouts unless a shared component fix is required

## Architecture

```
src/components/layouts/desktop/DesktopAdminShell.tsx
src/components/layouts/desktop/DesktopStaffAdminShell.tsx
src/components/landing/desktop/
src/styles/desktop-app.css, desktop-landing.css, desktop-auth.css
```

## Branch & PR

- Branch: `cursor/websitedesktopaudit-<descriptive-name>-e760`

## Desktop audit report

- Issues found and fixed (desktop only)
- Screens verified
- Recommendations
- Desktop health score
