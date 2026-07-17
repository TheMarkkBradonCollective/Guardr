# /uberit — Complete platform UI/UX redesign (Base Web)

Completely redesign every user-facing surface using Uber Base Web and Base Design System principles while preserving 100% of existing functionality.

## Mission

Rebuild the **presentation layer only** — layout, navigation, visual system, motion, and interaction model. Do **not** change business logic, APIs, database schema, auth, permissions, or workflows.

## Design references (required reading)

- https://github.com/uber/baseweb
- https://github.com/uber/base-design-docs
- https://github.com/adrianhajdin/uber
- Internal: `docs/guardedesign.md`, `docs/uberit-patterns.md`

## Brand translation

| Uber Base | Guardr |
|-----------|--------|
| Uber blue accent | Sage green (`--brand-primary`) |
| Uber Move font | Plus Jakarta Sans / IBM Plex Sans |
| Driver/rider copy | Guard / client / staff marketplace language |
| Uber logos | Guardr branding only |

## Preserve

- All business logic, APIs, data models, auth, roles, permissions, workflows
- Route names and `appNavigation.ts` contracts unless navigation UX requires alias only
- `App.tsx` data layer — restyle at layout/dashboard boundaries

## Supported surfaces

Each surface gets dedicated layout (not scaled copies):

- **Website:** mobile · tablet · laptop · desktop · ultra-wide
- **PWA:** mobile · tablet · desktop · installable · offline-ready
- **APK:** phones · foldables · tablets · native feel

## Implementation stack

| Layer | Location |
|-------|----------|
| Base Web theme (Guardr sage) | `src/theme/guardrBaseTheme.ts` |
| Motion tokens | `src/theme/motionTokens.ts` |
| Provider | `src/components/baseui/BaseUIProvider.tsx` |
| Adapters | `src/components/baseui/Guardr*.tsx` |
| Carousel | `src/components/baseui/AppCarousel.tsx` |
| Design preview | `src/design-preview/` (67-screen acceptance checklist) |
| Legacy CSS (migrate off) | `src/index.css`, `src/styles/*` |

## Migration phases

### Phase 0 — Foundation (this branch)
- Guardr Base Web theme (light + dark, sage accent)
- `BaseUIProvider` in `main.tsx`
- Shared adapters: Button, Card, Input, Tag, Skeleton
- Motion tokens + `AppCarousel`
- Unify design-preview with production theme

### Phase 1 — Global overlays
- `AppToast` → Base Web Snackbar
- `AppConfirm` / `AppModal` → Base Web Modal
- `AppOverlaySheet` / `AppDrawer` → Base Web Drawer

### Phase 2 — Layout shells
- `RoleAppShell`, `DesktopAdminShell`, `TabletAdminShell`
- `StaffOpsLayout`, `ClientAppLayout`
- Public: `HomePage`, `AuthPage`, `AppHomeScreen`

### Phase 3 — Shared primitives
- `AppPrimitives.tsx` exports
- `wireframe/*` → Base Web Card, Tag, Table
- Consolidate `.app-button-*` → `GuardrButton`

### Phase 4 — Role dashboards
- Client (16 views) → Guard (15 tabs, map last) → Staff (27 sections)

### Phase 5 — Feature overlays + PWA/native CSS
- Domain modals/sheets, retire redundant CSS

### Phase 6 — Preview parity
- Design preview uses shared `src/components/baseui/*`
- Optional staff-only route for live QA

## Per-screen checklist

For every page/view:

- [ ] Layout redesigned for mobile, tablet, desktop
- [ ] Navigation consistent with unified shell
- [ ] Typography hierarchy (Display → Label → Paragraph)
- [ ] 4px/8px spacing scale
- [ ] WCAG AA contrast, keyboard focus, reduced motion
- [ ] Light + Dark theme tested
- [ ] PWA + APK safe-area verified when touching chrome
- [ ] Functionality unchanged

## Branch & PR

- Branch: `cursor/uberit-<descriptive-name>-9c4c`
- Base branch: `main`

## Report back

- Phase completed and screens touched
- Files changed (theme, baseui, layouts, CSS)
- Functionality preserved checklist
- Design preview URL: `/design-preview.html`
- Test/lint status
- Next recommended phase
