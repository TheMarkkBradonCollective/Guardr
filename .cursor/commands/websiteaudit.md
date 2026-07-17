# /websiteaudit — Complete website audit

Perform a complete audit of the entire **Website** (browser shell). Inspect every page, layout, component, feature, and workflow across all screen sizes.

## Surfaces audited

| Surface | Breakpoint |
|---------|------------|
| **Desktop** | ≥1024px |
| **Laptop** | 1024–1280px (verify density and overflow) |
| **Tablet** | 768–1023px |
| **Mobile** | <768px |

Each layout must be **independently designed** — do not simply scale the desktop version.

## Verify

### Layout & UI
- Responsive layouts and independent layouts per screen size
- Navigation, header/footer, sidebars, menus
- Forms, tables, cards, buttons, icons, images
- Typography, spacing, colors
- Animations, loading/empty/error/success states

### Interaction & access
- Accessibility (contrast, labels, focus, ARIA)
- Keyboard navigation
- Touch targets (tablet and mobile)
- Browser compatibility (Chrome, Safari, Firefox)

### Functionality
- API calls, authentication, authorization, routing
- Error handling and edge cases
- Performance and loading speed

## Automatically repair

- Layout and alignment issues
- UI/UX inconsistencies
- Duplicate code
- Performance bottlenecks
- Accessibility gaps where fixable

Run `npm run lint` and `npm test` when code changes.

## Architecture

```
shellKind: browser  ×  formFactor: desktop | tablet | mobile
src/lib/platform/device.ts, viewSurface.ts, DeviceProvider.tsx
src/components/layouts/desktop/, tablet/, RoleAppShell.tsx
src/styles/desktop-app.css, tablet-app.css, desktop-landing.css
```

See `docs/CROSS_PLATFORM.md`.

## Branch & PR

- Branch: `cursor/websiteaudit-<descriptive-name>-e760`

## Audit report

- **Issues Found**
- **Issues Fixed**
- **Recommendations**
- **Website Health Score** (1–10 with rationale)
- **Production Readiness Status**
