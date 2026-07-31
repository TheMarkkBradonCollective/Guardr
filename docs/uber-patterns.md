# /uber — Reusable UI patterns

Patterns for the platform redesign using **stock Uber Base Web**. See `.cursor/commands/uber.md`.

## Theme

Production uses **Guardr-branded Base Web themes** — monochrome accent on stock Uber Base infrastructure:

```ts
import { guardrThemeForMode } from '../theme/guardrBaseTheme';
import { withAppBreakpoints } from '../components/baseui/layout/shellStyles';
import { useThemeMode } from '../lib/platform/useThemeMode';

const theme = withAppBreakpoints(guardrThemeForMode(useThemeMode()));
```

- **Light:** black accent `#000000`, black primary CTA on white / `#F6F6F6` surfaces
- **Dark:** white accent `#FFFFFF`, white primary CTA; navigation and chrome layer on `#101010` so they stay legible against the `#000` canvas
- `UberThemeVars` syncs theme tokens to CSS custom properties on every render
- Use `useStyletron()` or Styletron token strings in overrides — **not** raw hex values
- `--brand-*` CSS variables are bridged from theme tokens via `UberThemeVars`

## Typography

`src/theme/typography.ts` is the single source for font stacks and Uber's tracking scale — never inline a font stack.

```ts
import { FONT_DISPLAY, FONT_TEXT, TRACKING } from '../theme/typography';
```

- Uber Move / Uber Move Text are proprietary. `styles/uber-typography.css` declares **`Guardr Sans`** from `/public/fonts` (latin + latin-ext variable subsets) as the loaded stand-in, so stacks read `"Uber Move Text", "Guardr Sans", …` and render Uber's type colour even without Uber Move installed.
- `withUberTypeScale()` retightens the Base Web display and heading slots (`-0.04em` display, `-0.02em` heading, `-0.01em` title); body and label slots stay at zero.
- The service worker precaches the two normal-weight subsets, so an installed PWA never cold-starts in Arial.
- Ops numerals use `.uber-tabular` / `font-variant-numeric: tabular-nums` so columns align.

## Forms

`styles/uber-forms.css` loads last and owns field chrome app-wide:

- `.uber-label` / `.app-field-label` — sentence case, 14px/500, primary content colour (**not** uppercase micro-caps)
- `.app-field-hint` — 13px caption in muted grey
- Focus ring — 2px `--uber-text` on both native inputs and Base Web containers

## Provider stack

```tsx
<DeviceProvider>
  <BaseUIProvider>
    <AppMotionProvider>
      <AppSnackbarProvider>
        <App />
      </AppSnackbarProvider>
    </AppMotionProvider>
  </BaseUIProvider>
</DeviceProvider>
```

## Component adapters

| Adapter | Base Web | Use for |
|---------|----------|---------|
| `GuardrButton` | `Button` | All CTAs — 44px min height, press scale |
| `AppButton` | `GuardrButton` | Legacy `.app-button-*` class mapping |
| `GuardrCard` | `Card` | Dashboard widgets — border, no default shadow |
| `GuardrInput` | `Input` | Forms — 44px touch target |
| `GuardrTag` | `Tag` | Chips, filters, status pills |
| `GuardrSkeleton` | `Block` | Loading — Uber-blue shimmer |
| `AppCarousel` | `motion` + snap scroll | Hero, stats, galleries |

### Active nav states

```ts
// shellStyles.ts — use theme tokens, not sage RGB
backgroundColor: $active ? 'accent50' : 'transparent',
borderColor: $active ? 'accent' : 'transparent',
```

### Button example

```tsx
import { AppButton } from '../components/ui/AppButton';

<AppButton variant="primary" onClick={onSave}>Save changes</AppButton>
<AppButton variant="outline" size="compact">Cancel</AppButton>
```

## Motion system

Import from `src/theme/motionTokens.ts`:

| Token | Value | Use |
|-------|-------|-----|
| `MOTION_DURATION.fast` | 150ms | Micro-interactions |
| `MOTION_DURATION.normal` | 200ms | Fade, hover |
| `MOTION_DURATION.sheet` | 320ms | Sheets, drawers |

Always call `prefersReducedMotion()` or `motionDuration()` before animating.
PWA Lite scales durations via `experienceMotionScale()`; use `shouldReduceDecorativeMotion()` to skip chart/counter animations.

## Overlays

Global overlays live in `src/components/baseui/overlays/`:

- `GuardrModal`, `GuardrSheet`, `GuardrDrawer`
- `dismissable={false}` — legal gates that block backdrop/Escape/system-back close
- `overlayStack.ts` — Escape / system-back
- `snackbarBridge.ts` — `showAppToast()` unchanged API
- `AppFormSheet` — Base Web form sheet chrome (no legacy `app-form-sheet-*` CSS)


## Layout shells

`src/components/baseui/layout/`:

- `GuardrDrawerShell` — Uber-style shell: persistent sidebar (desktop), drawer (mobile/tablet), compact top bar
- `GuardrSideNav`, `GuardrBottomNav`, `GuardrIconRail`
- `PublicPageChrome`

### Desktop workspace — Uber Freight TMS

`resolveMobilityChrome()` turns these on for `*-desktop` surfaces only; nothing is passed per screen:

| Piece | Element | Notes |
|-------|---------|-------|
| Icon rail | `GuardrIconRail` (`.uber-rail`) | Black column on the left edge: app-menu toggle on top, first nav group below, hover labels + badges. Stays put on full-bleed map screens. |
| Global bar | `UberDirectTopHeader` | Wordmark left · `contextLabel` centred · notifications + account right. |
| Page band | `.uber-page-band` | `pageBreadcrumb` › `title`, plus `headerContext` and `pageActions`. Suppressed when a screen passes `bleed` or `headerOverride`. |
| Tabs | `WorkbenchTabBar` | Renders as underline tabs inside `[data-uber-direct]`; stays a chip row on phones. |

Tablet and phone keep the compact `mobility-header` title, so the band never duplicates it.

## Data display

`src/components/baseui/`:

- `UberDataTable` — quiet sentence-case headers, hairline rules, tabular figures, right-aligned amounts, whole-row hover/keyboard activation, optional per-column sorting. It measures its own container and switches to stacked record cards (`.uber-record`) whenever a table would scroll sideways — phones always, plus tablet portrait and split panes. Map columns onto card slots with `cardLayout`, or force a shape with `layout`.
- `StatusChip` — tinted state pill (`positive` / `negative` / `warning` / `info` / `neutral` / `accent`), light and dark.

Legacy `.uber-workbench-table` markup follows the same conventions, so existing staff/guard/client tables inherit the look without component changes.

## Dev preview

`npm run dev` then open `/?ui-preview=1` to render the signed-in chrome (rail, bar, band, sidebar, tabs, table, bottom nav) with static data — no session required. Dev only; the production bundle drops it.

- `node scripts/ui-shots.mjs <outDir>` — public pages × desktop/tablet/mobile × light/dark
- `node scripts/ui-tier-shots.mjs <outDir> [path]` — website · PWA full/lite · APK full/premium
- `shellStyles.ts` — breakpoints + nav overrides
- `mobilityChrome.ts` — per-`viewSurface` + experience-tier chrome (PWA Full/Lite, APK Full/Premium)

**Experience tiers:** `src/lib/platform/experienceTier.ts` — resolves `pwa-full|pwa-lite|apk-full|apk-premium|website` and sets `body[data-experience-tier]`, `data-pwa-mode`, `data-apk-mode`.

**Surface bridge:** `src/styles/uber-surfaces.css` — remaps legacy `adm-*`, `app-*`, and brand Tailwind inside `.uber-app-shell` to `--uber-*` tokens on every form factor.

**Mobility platform:** `src/styles/uber-mobility.css` + `mobilityChrome.ts` — independent shell per `viewSurface` (mobile drawer / tablet rail / desktop workspace).

**Platform optimizations:** `src/styles/platform-optimizations.css` — purpose-built CSS for Website · PWA Full/Lite · APK Full/Premium.

**Public landing (browser):** `UberStyleLandingPage` — Uber.com homepage pattern (black nav, booking hero, explore grid, login band). Independent layout per form factor via `MobileLandingPage`, `TabletLandingPage`, `DesktopLandingPage`.

## Dashboard building blocks (Phase 4)

`src/components/baseui/dashboard/`:

| Component | Use for |
|-----------|---------|
| `DashboardHero` | Role hub greeting + status pill |
| `DashboardZone` | Section with title + action link |
| `MetricCell` / `MetricStrip` | At-a-glance stats (GuardrCard) |
| `QuickActionTile` | Client home quick-action grid |
| `AccentIcon` / `MutedIcon` | Lucide icons using theme colors |
| `UberThemeVars` | Syncs `--uber-accent` etc. to CSS (auto-mounted in BaseUIProvider) |

Hybrid screens use `.uber-text-accent`, `.uber-text-muted` instead of `text-brand-*`.

`src/components/baseui/primitives/fieldStyles.ts`:

```tsx
import { inputOverrides, formControlOverrides } from '../baseui/primitives';
```

Used by `AppInput`, `AppTextarea`, `AppFormField` in `AppPrimitives.tsx`.

## Post-login experience (signed-in shell)

Reference targets: **Uber Direct** (desktop web) and **Uber rider/driver app** (mobile PWA/APK).

| Surface | Pattern | Implementation |
|---------|---------|----------------|
| **Desktop website** | White left sidebar · gray `#f6f6f6` canvas · large page title in content · avatar top-right | `GuardrDrawerShell` with `data-uber-direct="true"` — no black top bar; title band + `WorkbenchLayout` content |
| **Mobile / PWA / APK** | Bottom tab bar (Home, Jobs, Map, Messages…) · drawer for overflow · map full-bleed | `GuardrBottomNav` via `RoleAppShell` / `DesktopStaffAdminShell` `mobileBottomNavItems` |
| **Tablet** | Persistent sidebar rail + touch targets | `mobilityChrome` tablet widths |
| **Map / active shift** | Full-bleed map · bottom sheet overlays | `variant="dark"` + `bleed` on shell; panel-specific sheets |

### Shell entry points

- Guard / client: `RoleAppShell` → `GuardrDrawerShell`
- Staff: `DesktopStaffAdminShell` → `GuardrDrawerShell`
- Content inside shell: prefer `WorkbenchPage` / `WorkbenchSplit` on desktop; `AppScreen` card stacks migrating to workbench zones on mobile

### Next migration targets (content inside shell)

1. Client / guard home hubs → `DashboardHero` + `MetricStrip` + white cards on gray canvas
2. List screens → workbench tables with search row (Uber Direct Users/Billing pattern)
3. Map + active shift → Uber bottom-sheet overlays (`uber-in-app.css`)
4. Remove legacy `adm-*` / `text-brand-*` from high-traffic panels
