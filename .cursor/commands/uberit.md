# /uberit — Complete platform UI/UX redesign (Base Web)

## Powered by Uber Base Web & Uber Base Design System

Completely redesign every user-facing aspect of the platform from the ground up.

This is **not** a feature redesign.  
This is **not** a backend rewrite.  
This is a complete redesign of the **presentation layer**, interaction model, information hierarchy, navigation, and visual system while preserving all existing functionality.

The finished product should feel like a modern, enterprise-grade application with a consistent, refined, and highly polished experience across every device.

---

## Design references (required)

Study and implement design philosophy, component architecture, accessibility, layout, spacing, typography, motion, interaction patterns, and responsive guidelines **before beginning any work**:

- https://github.com/uber/baseweb
- https://github.com/uber/base-design-docs
- https://github.com/adrianhajdin/uber

Internal references:

- `docs/guardedesign.md`
- `docs/uberit-patterns.md`
- `public/design-preview.html` — 67-screen acceptance checklist

These repositories define the UI framework. Guardr retains its own branding, features, and identity while adopting a design language **inspired by** these systems.

### Brand translation

| Uber Base | Guardr |
|-----------|--------|
| Uber blue accent | Sage green (`--brand-primary`) |
| Uber Move font | Plus Jakarta Sans / IBM Plex Sans |
| Driver/rider copy | Guard / client / staff marketplace language |
| Uber logos | Guardr branding only |

---

## Preserve 100% functionality

Do **NOT** change:

- Business logic, APIs, database schema
- Authentication, authorization, user roles, permissions
- Workflows, backend services, data models, integrations

Every feature must continue functioning exactly as it does today. Only improve how users interact with those features.

---

## Supported platforms

Every platform receives a **dedicated design** — not a scaled version of another.

### Website
- Mobile · Tablet · Laptop · Desktop · Ultra-wide Desktop

### Progressive Web App (PWA)
- Mobile · Tablet · Desktop
- Installable · Offline-ready · Native-feeling transitions · Touch-first

### Native APK
- Phones · Foldables · Tablets
- Premium native application — not a website in a wrapper

For platform-specific independent design, use `/uberitplatforms`.

---

## Complete interface redesign

Nothing is excluded. Evaluate and redesign every:

- Landing page, dashboard, auth, registration, onboarding
- User and organization profiles, admin panels, analytics, reports
- Search, filtering, tables, lists, calendars, maps
- Notifications, messages, chat, settings, forms, wizards
- Cards, buttons, drawers, sidebars, modals, popovers, menus, tooltips
- Tabs, accordions, carousels, sliders, media viewers
- Empty, error, success, loading, skeleton, toast, progress states
- Permission dialogs, context menus, breadcrumbs, pagination
- Footer, header, navigation

No existing UI should remain simply because it already works. Every screen should be intentionally redesigned.

---

## Navigation system

Create a unified navigation experience:

- Responsive, context-aware navigation
- Sticky headers, expandable sidebars, collapsible menus
- Breadcrumb navigation, animated route transitions
- Floating action buttons where appropriate
- Multi-level navigation, mobile bottom navigation, gesture navigation
- Intelligent page hierarchy and predictable user flows

---

## Motion system

Develop one unified animation language. All motion follows consistent:

- Duration, easing, velocity, spring behavior, timing, distance, acceleration, deceleration

Use `src/theme/motionTokens.ts`. Animations should never feel random — every transition reinforces hierarchy and usability. Respect `prefers-reduced-motion`.

---

## Advanced sliders & carousels

Implement polished, high-performance sliders and carousels (`src/components/baseui/AppCarousel.tsx`):

- Drag, touch gestures, mouse dragging, momentum scrolling, snap-to-position
- Keyboard controls, wheel scrolling, progress indicators
- Autoplay (where appropriate), lazy loading, hardware acceleration
- Hero banners, featured content, tutorials, galleries, stats, announcements

---

## Microinteractions

Every interaction provides immediate visual feedback:

- Button press, hover elevation, ripple, animated focus rings
- Input validation transitions, toggle/checkbox animations
- Dropdown, modal, drawer, notification entrances
- Card hover states, pull-to-refresh, swipe gestures, drag feedback

---

## Visual effects

Use modern effects thoughtfully:

- Layered elevation, soft shadows, glass overlays (sparingly)
- Frosted blur, gradient accents, skeleton/shimmer loading
- Animated counters, expand/collapse, sticky UI, reveal-on-scroll
- Smooth page transitions — GPU-friendly transforms, no layout thrash

---

## Component standards

Use Uber Base Web components wherever practical (`src/components/baseui/`):

- `GuardrButton`, `GuardrCard`, `GuardrInput`, `GuardrTag`, `GuardrSkeleton`
- `GuardrModal`, `GuardrDrawer`, `GuardrSheet`, `GuardrBottomNav`, `GuardrSideNav`

Maintain consistency for buttons, cards, forms, typography, icons, inputs, menus, drawers, tables, charts, lists, dialogs, navigation, tags, badges, notifications, tooltips, tabs, accordions, data grids.

No custom component should feel disconnected from the system.

---

## Typography

Establish a complete hierarchy: Display, Headlines, Section titles, Card titles, Labels, Body, Captions, Helper text, Error text, Navigation text, Button labels.

Maintain consistent spacing, line heights, and readability.

---

## Spacing & layout

Adopt a unified spacing system (4px/8px scale):

- Margins, padding, gutters, grid, card/form/section spacing
- Responsive spacing, container widths, breakpoints

---

## Responsive design

Each breakpoint independently optimized:

- Mobile portrait/landscape, tablet portrait/landscape
- Laptop, desktop, ultra-wide, foldables

Never rely on simple scaling. Use `shellKind × formFactor → viewSurface`.

---

## Accessibility

Meet or exceed **WCAG AA**:

- Keyboard navigation, screen readers, semantic HTML, ARIA
- Visible focus states, high-contrast compatibility
- Reduced-motion preferences, accessible touch targets (44×44px min)
- Color contrast compliance, logical tab order

---

## Performance

Maintain or improve:

- Lighthouse scores, Core Web Vitals, bundle size
- FCP, LCP, INP, accessibility score
- Smooth 60 FPS interactions — GPU transforms, avoid layout reflows

Run `npm run lint` and `npm test` after changes.

---

## Implementation stack

| Layer | Location |
|-------|----------|
| Base Web theme (Guardr sage) | `src/theme/guardrBaseTheme.ts` |
| Motion tokens | `src/theme/motionTokens.ts` |
| Provider | `src/components/baseui/BaseUIProvider.tsx` |
| Adapters | `src/components/baseui/Guardr*.tsx` |
| Design preview | `src/design-preview/` |
| Legacy CSS (migrate off) | `src/index.css`, `src/styles/*` |

## Migration phases

1. **Foundation** — theme, provider, adapters, motion, carousel
2. **Global overlays** — toast, confirm, modal, drawer, sheet
3. **Layout shells** — RoleAppShell, desktop/tablet/staff shells, public pages
4. **Shared primitives** — AppPrimitives, wireframe components
5. **Role dashboards** — client → guard → staff
6. **PWA/native CSS** — `app-pwa.css`, `app-native.css`
7. **Preview parity** — design preview uses production baseui

---

## Deliverables

For every page, view, and component:

- Redesign layout and visual hierarchy
- Improve navigation and modernize interactions
- Enhance accessibility and optimize responsiveness
- Replace styling with cohesive design system
- Ensure consistent behavior across Website, PWA, and APK
- Document reusable patterns in `docs/uberit-patterns.md`

---

## Branch & PR

- Branch: `cursor/uberit-<descriptive-name>-e760`

## Report back

- Phase completed and screens touched
- Surfaces (desktop / tablet / mobile / PWA / APK)
- Files changed (theme, baseui, layouts, CSS)
- Functionality preserved checklist
- Design preview: `/design-preview.html`
- Test/lint status
- Next recommended phase

## Final goal

A cohesive, premium experience that preserves Guardr's unique branding, colors, content, and functionality while rebuilding the entire presentation layer around Uber Base Web principles. Every user-facing surface evaluated, redesigned, and refined.
