# /uberit — Complete platform UI/UX redesign (Uber Base Web)

Completely redesign every user-facing surface using **Uber Base Web** and the **Uber Base Design System** while preserving 100% of existing functionality.

> **Current migration policy:** Use **stock Uber Base Web themes** (`LightTheme` / `DarkTheme`). Do **not** apply Guardr sage-green or custom `--brand-*` overrides in Base Web components during migration. Brand colors return in a later pass.

---

## Design references (required reading)

Study before any work:

- https://github.com/uber/baseweb
- https://github.com/uber/base-design-docs
- https://github.com/adrianhajdin/uber
- Internal patterns: `docs/uberit-patterns.md`

Implement design philosophy, component architecture, accessibility, layout, spacing, typography, motion, interaction patterns, and responsive guidelines from these resources.

---

## Mission

Completely redesign every user-facing aspect of the platform from the ground up.

This is **not** a feature redesign.  
This is **not** a backend rewrite.

This is a complete redesign of the **presentation layer**, interaction model, information hierarchy, navigation, and visual system while preserving all existing functionality.

The finished product should feel like a modern, enterprise-grade application with a consistent, refined, highly polished experience across every device.

---

## Preserve 100% functionality

Do **NOT** change:

- Business logic
- APIs
- Database schema
- Authentication / authorization
- User roles, permissions, workflows
- Backend services, data models, integrations

Every feature must continue functioning exactly as today. Only improve how users interact with those features.

Also preserve:

- Route names and `appNavigation.ts` contracts (aliases only if navigation UX requires)
- `App.tsx` data layer — restyle at layout/dashboard boundaries
- Imperative APIs: `showAppToast`, `showAppConfirm`, `closeTopmostDialog`, overlay stack

---

## Supported platforms

Each surface gets a **dedicated design** — not a scaled copy.

| Platform | Breakpoints |
|----------|-------------|
| **Website** | mobile · tablet · laptop · desktop · ultra-wide |
| **PWA** | mobile · tablet · desktop · installable · offline-ready |
| **APK** | phones · foldables · tablets · native feel |

---

## Implementation stack

| Layer | Location |
|-------|----------|
| **Stock Uber theme** | `src/theme/uberBaseTheme.ts` (`LightTheme` / `DarkTheme`) |
| Motion tokens | `src/theme/motionTokens.ts` |
| Provider | `src/components/baseui/BaseUIProvider.tsx` |
| Adapters | `src/components/baseui/Guardr*.tsx` |
| App button bridge | `src/components/ui/AppButton.tsx` |
| Field primitives | `src/components/baseui/primitives/` |
| Layout shells | `src/components/baseui/layout/` |
| Global overlays | `src/components/baseui/overlays/` |
| Carousel | `src/components/baseui/AppCarousel.tsx` |
| Design preview | `src/design-preview/` |
| Legacy CSS (migrate off) | `src/index.css`, `src/styles/*` |

### Theme rule

```ts
import { uberThemeForMode } from '../theme/uberBaseTheme';
import { withAppBreakpoints } from '../components/baseui/layout/shellStyles';

const theme = withAppBreakpoints(uberThemeForMode(mode));
```

- Use `$theme.colors.*` or Styletron token strings (`accent`, `accent50`, `contentSecondary`) in Base Web overrides.
- **Do not** use `var(--brand-primary)` or sage RGB in new Base Web code.
- Legacy Tailwind screens may still use `--brand-*` until Phase 5 CSS cleanup.

---

## Migration phases

### Phase 0 — Foundation
- Stock Uber `LightTheme` / `DarkTheme` via `BaseUIProvider`
- Shared adapters: Button, Card, Input, Tag, Skeleton
- Motion tokens + `AppCarousel`
- Design-preview uses same provider stack

### Phase 1 — Global overlays
- `AppToast` → Base Web Snackbar
- `AppConfirm` / `AppModal` → Base Web Modal
- `AppOverlaySheet` / `AppDrawer` → Base Web Drawer
- Overlay stack + Escape / system-back preserved

### Phase 2 — Layout shells
- `RoleAppShell`, `DesktopAdminShell`, `TabletAdminShell`
- `StaffOpsLayout`, `ClientAppLayout`
- Public: `HomePage`, `AuthPage`, `AppHomeScreen`
- Nav active states use `accent` / `accent50` (Uber blue)

### Phase 3 — Shared primitives
- `AppPrimitives.tsx` form/list exports
- `wireframe/*` → Base Web Card, Tag, Input
- `AppButton` maps `.app-button-*` → `GuardrButton`

### Phase 4 — Role dashboards
- Client (16 views) → Guard (15 tabs, map last) → Staff (27 sections)

### Phase 5 — Feature overlays + CSS cleanup
- Domain modals/sheets; retire redundant CSS and `--brand-*` bridge

### Phase 6 — Preview parity
- Design preview uses shared `src/components/baseui/*`
- Optional staff-only route for live QA

### Later — Brand pass
- Re-apply Guardr colors on top of Uber structure (optional `createLightTheme` / `createDarkTheme` overrides)

---

## Navigation system

Unified navigation across roles:

- Responsive navigation · context-aware nav · sticky headers
- Expandable/collapsible sidebars · breadcrumbs
- Animated route transitions · mobile bottom nav · gesture nav
- Multi-level hierarchy · predictable flows

---

## Motion system

One unified animation language (`src/theme/motionTokens.ts`):

- Consistent duration, easing, spring behavior
- Respect `prefers-reduced-motion`
- Reinforce hierarchy — never random motion

---

## Carousels & sliders

`AppCarousel`: drag, touch, keyboard, wheel, snap, dots, edge fade, autoplay, loop, lazy-friendly.

---

## Microinteractions & visual effects

Button press, hover elevation, focus rings, validation transitions, modal/drawer/sheet motion, skeleton/shimmer, card hover — all via Base Web + motion tokens.

---

## Component standards

Use Uber Base Web components wherever practical. Consistent language for buttons, cards, forms, typography, inputs, menus, drawers, tables, lists, dialogs, tags, notifications, tabs, accordions.

---

## Typography, spacing, responsive, accessibility

- Typography hierarchy: Display → Headline → Label → Paragraph → Caption
- 4px/8px spacing scale · responsive gutters per breakpoint
- WCAG AA · keyboard · screen readers · focus visible · 44px touch targets
- Independent layouts per breakpoint (never scale-only)

---

## Per-screen checklist

- [ ] Layout redesigned for mobile, tablet, desktop
- [ ] Navigation consistent with unified shell
- [ ] Typography hierarchy correct
- [ ] 4px/8px spacing scale
- [ ] WCAG AA contrast, keyboard focus, reduced motion
- [ ] Light + Dark theme tested (stock Uber)
- [ ] PWA + APK safe-area when touching chrome
- [ ] Functionality unchanged

---

## Branch & PR

- Branch: `cursor/uberit-<descriptive-name>-9c4c`
- Base branch: `main`

---

## Report back

- Phase completed and screens touched
- Files changed (theme, baseui, layouts, CSS)
- Functionality preserved checklist
- Design preview URL: `/design-preview.html`
- Test/lint status
- Next recommended phase
