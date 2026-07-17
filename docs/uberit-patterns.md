# /uberit — Reusable UI patterns

Patterns for the platform redesign using **stock Uber Base Web**. See `.cursor/commands/uberit.md`.

## Theme

Production and design-preview share one theme — **no custom brand colors during migration**:

```ts
import { uberThemeForMode } from '../theme/uberBaseTheme';
import { withAppBreakpoints } from '../components/baseui/layout/shellStyles';
import { useThemeMode } from '../lib/platform/useThemeMode';

const theme = withAppBreakpoints(uberThemeForMode(useThemeMode()));
```

- **Light:** Uber `LightTheme` — accent `#276EF1`
- **Dark:** Uber `DarkTheme` — accent `#335BA3`
- Use `useStyletron()` or Styletron token strings in overrides — **not** `var(--brand-primary)`
- Legacy Tailwind `--brand-*` CSS remains for unmigrated screens until Phase 5

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

**Surface bridge:** `src/styles/uber-surfaces.css` — remaps legacy `adm-*`, `app-*`, and brand Tailwind inside `.uber-app-shell` to `--uber-*` tokens on every form factor.

**Mobility platform:** `src/styles/uber-mobility.css` + `mobilityChrome.ts` — global sage→Uber token remap; independent shell per `viewSurface` (mobile drawer / tablet rail / desktop workspace).

**Public landing (browser):** `MobileLandingPage`, `TabletLandingPage`, `DesktopLandingPage` — each form factor has an independent Base Web layout via `LandingSections.tsx`.

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

## Design preview

- Entry: `/design-preview.html` — standalone Vite page using the same provider stack as production
- Pinned **Component showcase** exercises adapters, overlays, and dashboard kit
- Staff live QA: `/staff/design-qa` (Director/Founder) — in-app `ComponentShowcase` with real auth context


`src/components/baseui/primitives/fieldStyles.ts`:

```tsx
import { inputOverrides, formControlOverrides } from '../baseui/primitives';
```

Used by `AppInput`, `AppTextarea`, `AppFormField` in `AppPrimitives.tsx`.
