# /uberit — Reusable UI patterns

Patterns for the Guardr platform redesign using Uber Base Web. See also `docs/guardedesign.md` and `.cursor/commands/uberit.md`.

## Theme bridge

Production and design-preview share one theme:

```ts
import { guardrThemeForMode } from '../theme/guardrBaseTheme';
import { useThemeMode } from '../lib/platform/useThemeMode';

const theme = guardrThemeForMode(useThemeMode());
```

- **Light:** white canvas, sage `#5E7B61` accent
- **Dark:** black canvas, sage `#6B8F6E` accent
- CSS vars (`--brand-*`) remain source of truth; Base Web theme mirrors them for `baseui` components

## Provider stack

```tsx
<DeviceProvider>
  <BaseUIProvider>
    <AppMotionProvider>
      <App />
    </AppMotionProvider>
  </BaseUIProvider>
</DeviceProvider>
```

Wrap any new Base Web UI inside `BaseUIProvider`. Legacy Tailwind/CSS screens continue to work during migration.

## Component adapters

| Adapter | Base Web | Use for |
|---------|----------|---------|
| `GuardrButton` | `Button` | All CTAs — 44px min height, press scale |
| `GuardrCard` | `Card` | Dashboard widgets — border, no default shadow |
| `GuardrInput` | `Input` | Forms — 44px touch target |
| `GuardrTag` | `Tag` | Chips, filters, status pills |
| `GuardrSkeleton` | `Block` | Loading — shimmer, respects reduced motion |
| `AppCarousel` | `motion` + snap scroll | Hero, stats, galleries, tutorials |

### Button example

```tsx
import { GuardrButton } from '@/src/components/baseui';

<GuardrButton kind="primary" onClick={onSave}>Save changes</GuardrButton>
<GuardrButton kind="secondary" size="compact">Cancel</GuardrButton>
```

### Card example

```tsx
import { GuardrCard } from '@/src/components/baseui';

<GuardrCard interactive title="Earnings">
  <HeadingLarge>$1,240</HeadingLarge>
</GuardrCard>
```

## Motion system

Import from `src/theme/motionTokens.ts`:

| Token | Value | Use |
|-------|-------|-----|
| `MOTION_DURATION.fast` | 150ms | Micro-interactions |
| `MOTION_DURATION.normal` | 200ms | Fade, hover |
| `MOTION_DURATION.sheet` | 320ms | Sheets, drawers |
| `MOTION_EASING.enter` | quintic decel | Enter transitions |
| `MOTION_EASING.exit` | accelerate | Exit transitions |

Always call `prefersReducedMotion()` or `motionDuration()` before animating.

## Carousel (`AppCarousel`)

Features: drag, touch, keyboard (←/→/Home/End), horizontal wheel, snap, dots, edge fade, active scale, optional autoplay + loop.

```tsx
<AppCarousel showDots edgeFade activeScale={1.02} autoplayMs={8000} loop>
  {slides.map((slide) => (
    <GuardrCard key={slide.id}>{slide.content}</GuardrCard>
  ))}
</AppCarousel>
```

## Navigation patterns

| Form factor | Pattern | Target component |
|-------------|---------|------------------|
| Mobile | Bottom nav 3–5 tabs + More sheet | `BottomNavBar` → Base `Navigation` |
| Tablet | Icon rail + top bar | `TabletAdminShell` |
| Desktop | Collapsible side rail + sticky top bar | `DesktopAdminShell` |

Active state: sage accent — never Uber blue.

## Spacing

4px baseline: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

Base Web scale maps: `scale300` = 8px, `scale400` = 12px, `scale500` = 16px, `scale600` = 20px, `scale800` = 32px.

## Accessibility checklist

- [ ] Semantic landmarks (`main`, `nav`, `region`)
- [ ] Visible focus rings (`--focus-ring`)
- [ ] `aria-*` on carousels, modals, tabs
- [ ] 44px minimum touch targets
- [ ] WCAG AA contrast in Light and Dark
- [ ] `prefers-reduced-motion` honored

## Migration rule

**Shells before screens.** Replace layout chrome first, then page content. Do not rewrite `App.tsx` handlers — swap presentation at dashboard boundaries.

## Design preview

`/design-preview.html` — 67 screens mirroring production routes. Use as acceptance checklist during `/uberit` phases.
