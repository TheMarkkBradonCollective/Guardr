# /uberit — Reusable UI patterns

Patterns for the platform redesign using **stock Uber Base Web**. See `.cursor/commands/uberit.md`.

## Theme

Production uses **Guardr-branded Base Web themes** — sage-green accent on stock Uber Base infrastructure:

```ts
import { guardrThemeForMode } from '../theme/guardrBaseTheme';
import { withAppBreakpoints } from '../components/baseui/layout/shellStyles';
import { useThemeMode } from '../lib/platform/useThemeMode';

const theme = withAppBreakpoints(guardrThemeForMode(useThemeMode()));
```

- **Light:** Guardr `LightTheme` — sage-green accent `#4A6B4E`, black primary CTA
- **Dark:** Guardr `DarkTheme` — sage-green accent `#7AAE7F`, white primary CTA
- `UberThemeVars` syncs theme tokens to CSS custom properties on every render
- Use `useStyletron()` or Styletron token strings in overrides — **not** raw hex values
- `--brand-*` CSS variables are bridged from theme tokens via `UberThemeVars`

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
