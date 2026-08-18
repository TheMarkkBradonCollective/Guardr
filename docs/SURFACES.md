# Guardr Surfaces — three independent applications

Guardr does not ship one responsive interface. It ships three applications that
share branding, domain logic, and data, and share nothing else:

| Surface | Who it is for | Shipping as |
|---------|---------------|-------------|
| **Mobile** | Guards in the field, clients on the move | PWA + Android APK (the primary experience) and the mobile website |
| **Tablet** | Guards and clients on a large touchscreen, staff triaging on the move | PWA + APK on tablets, tablet website |
| **Desktop** | Staff operations, admin, finance | Desktop website |

Each one has its own shell, navigation model, page structures, component kit,
design scale, and CSS layer. None is derived from another. A phone is not a small
desktop, a tablet is not a big phone, and a desktop is not a wide tablet.

## The rule

> Do not share layouts, page structures, navigation, or component arrangements
> between surfaces. Responsive scaling is not the mechanism — device detection is.

Concretely, this means:

- **Shared:** brand colour and type family, status hues, focus treatment, all of
  `src/lib/` (domain logic, data access, business rules), `src/types.ts`.
- **Not shared:** shells, navigation, page containers, overlays, list and table
  components, spacing, control sizing, motion timing, interaction grammar.

## Where the decision is made

```
main.tsx
  preloadSurface(resolveSurfaceKind(...))     ← starts the chunk fetch pre-mount
  DeviceProvider                              ← viewport + shell kind
    SurfaceProvider                           ← resolves the surface, writes CSS vars
      BaseUIProvider / AppMotionProvider / …
        App
          RoleAppShell | DesktopStaffAdminShell
            SurfaceAppShell                   ← lazy-loads ONE of three shells
              MobileAppShell | TabletAppShell | DesktopAppShell
```

`resolveSurfaceKind` in `src/surfaces/surfaceKind.ts` is the only place that
decides, in this order:

1. An explicit override wins (`?ui=mobile|tablet|desktop`, or
   `localStorage.guardr_surface_override`). Used by QA, the preview harness, and
   the e2e suite.
2. Width below `SURFACE_BOUNDS.tabletMin` (744px) → **mobile**. This is higher
   than the Tailwind `md` breakpoint on purpose: a 932×430 phone in landscape is
   still a phone, and must not jump into split view mid-shift.
3. Width below `SURFACE_BOUNDS.desktopMin` (1180px) → **tablet**.
4. An installed shell (PWA or APK) never resolves to desktop. A 13" Android
   tablet is a touch device; loading the pointer-only operations centre there
   would ship hover states nobody can reach.
5. A touch-only device at desktop width (kiosk, Surface in tablet mode) → tablet.
6. Otherwise → **desktop**.

CODE12 then writes CODE13, CODE14, and the
surface's full CSS variable set onto the document root during render, so the first
paint already uses the right layer.

## Code splitting

Each shell is a separate lazy chunk, so a phone never downloads the desktop data
table, command palette, or drag-and-drop board, and the desktop never downloads
the sheet gesture code:

CODE15CODE16CODE17

CODE18 runs in CODE19 before CODE20, so the
correct chunk is already in flight and the Suspense skeleton is rarely seen. The
neighbouring surface is warmed after 2.5s idle, so crossing a breakpoint by
resizing or rotating swaps instantly.

## The three design scales

CODE21 holds three authored scales. They are not one base
scale multiplied — a unit test asserts that the ratios between surfaces differ, so
nobody can quietly collapse them into a single scale with a factor.

| | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navigation | bottom tabs + More sheet | side rail | sidebar + top bar |
| Overlay | sheet / modal (existing) | docked side panel | centred dialog |
| Detail view | push over list | two-column split | resizable multi-panel |
| Minimum target | 48px | 44px | 32px |
| Body type | 16px | 15px | 14px |
| Row height | 68px | 60px | 40px |
| Page transition | slide-over 300ms | panel-fade 260ms | cross-fade 160ms |
| Title lives in | header band (avatar + title) | page body | top bar breadcrumb |
| Hover carries meaning | no | no | yes |
| Keyboard shortcuts | no | no | yes |
| Gesture navigation | yes | yes | no |
| Drag and drop | no | no | yes |

Components read these as CSS variables (CODE22, CODE23, CODE24,
…) rather than hard-coding numbers, which is what keeps the CSS layers from
leaking into one another.

**Title ownership** is worth calling out because getting it wrong produces visible
duplication: exactly one place per surface renders the page title. Mobile uses its
header band (avatar + title), tablet uses the page body, desktop uses
the top bar breadcrumb. The tablet shell header therefore shows workspace context,
not a title.

## Mobile is its own application

The mobile surface is a thumb-first phone app: a 56px header (account avatar +
title), an edge-to-edge scrolling canvas, a fixed bottom tab bar, and bottom
sheets for overflow destinations and account. There is no hamburger drawer of
primary destinations, no desktop sidebar scaled down, and no shell floating
action button. Page-level primary actions stay on the screen (sticky action bar,
list CTA, or map card) so they never cover a scrolling list.

Production mobile mounts `MobileAppShell` via `SurfaceAppShell` — the same router
tablet and desktop use for their independent shells. `GuardrDrawerShell` is not
the signed-in phone chrome.

## The three navigation models

CODE31 takes one position-free
destination list and produces three unrelated structures:

- **Mobile** — at most five thumb-reachable tabs, ordered by CODE32. When
  anything would overflow, the fifth slot becomes "More" and opens a bottom sheet
  grouped by section, with overflow badges rolled up onto the tab. Nothing is ever
  silently dropped.
- **Tablet** — every destination on a persistent labelled rail, grouped by section,
  plus a quick-switch strip of the destinations flagged `tabletQuick` (the ones
  used mid-shift).
- **Desktop** — every destination in a grouped sidebar at once, one command palette
  entry each, and `Alt+1..9` shortcuts for the first nine.

A test asserts every enabled destination stays reachable on all three surfaces.

## CSS layers

```
src/styles/surface-foundation.css   brand only: colour, type family, status hues,
                                    focus ring, shell root, shimmer keyframes
src/styles/surface-mobile.css       scoped to body[data-surface='mobile']
src/styles/surface-tablet.css       scoped to body[data-surface='tablet']
src/styles/surface-desktop.css      scoped to body[data-surface='desktop']
```

Class prefixes are `sfm-` (mobile), `sft-` (tablet), `sfd-` (desktop). The
foundation carries a leak guard that outlines any component rendered under the
wrong surface, so a cross-surface import is visible immediately rather than
producing a quiet hybrid layout.

## Building a feature screen

Two options, in order of preference.

### 1. `SurfacePage` — declare intent, let each surface arrange it

Use this when the feature's three layouts differ in structure but not in content.
`SurfacePage`, `SurfaceListDetail`, `SurfaceOverlay`, `SurfaceTabs`, and
`SurfaceSkeleton` each render a different structure per surface:

```tsx
import { SurfaceListDetail, SurfacePage, SurfaceTabs } from '../../surfaces';

<SurfacePage title="Shifts" subtitle="Sacramento" toolbar={<SurfaceTabs … />}>
  <SurfaceListDetail
    hasSelection={selected != null}
    onClearSelection={() => setSelected(null)}
    list={<ShiftList … />}
    detail={<ShiftDetail … />}
    placeholder={<Empty … />}
    inspector={<ShiftActivity … />}   // desktop only; ignored on touch surfaces
    storageKey="shifts"
  />
</SurfacePage>
```

Mobile pushes the detail over the list; tablet shows a fixed two-column split;
desktop shows resizable panels with a third inspector column.

### 2. Three implementations behind `SurfaceSwitch`

Use this when the surfaces genuinely need different content, information density,
or workflow — which is common. Write one file per surface using that surface's kit
and select between them:

```tsx
<SurfaceSwitch
  mobile={<MobileShiftsScreen />}
  tablet={<TabletShiftsScreen />}
  desktop={<DesktopOperationsScreen />}
/>
```

`src/dev/surfaces/` holds a worked example of exactly this: the same feature and
the same data as three unrelated screens. Read those three files before building a
new one.

### Never

- Import a `sfm-*` component into a tablet or desktop screen (or any other
  cross-surface combination).
- Re-derive layout from `window.innerWidth` or a media query in a component. Read
  `useSurface()` instead.
- Add a breakpoint inside a surface layer to make it behave like another surface.
  If the tablet needs a different structure in portrait, that belongs in the
  tablet layer (see `.sft-split`), not in a shared rule.

## Reviewing the surfaces

```bash
npm run dev
# then open http://localhost:3000/?ui-preview=1
```

The harness renders all three applications from their real shells and kits against
static data, with a switcher that pins the surface independently of the viewport —
the only practical way to inspect the desktop operations centre on a laptop window
or the mobile app on a large display. Forced surfaces frame themselves at a
representative device width rather than stretching.

To review the real app on a forced surface, append `?ui=mobile|tablet|desktop` to
any URL.

## Tests

| File | Covers |
|---|---|
| `src/surfaces/surfaceKind.test.ts` | Resolution rules, installed-shell and touch guards, overrides |
| `src/surfaces/surfaceDesign.test.ts` | Scale independence, per-surface control sizing, capability gates |
| `src/surfaces/surfaceNavigation.test.ts` | The three navigation models, overflow, reachability |
| `src/surfaces/commandMatch.test.ts` | Command palette fuzzy match and ranking |
| `src/surfaces/keyboardShortcuts.test.ts` | Combo expansion and platform-correct rendering |
| `e2e/surfaces.spec.ts` | Each device type loads its own application; no surface renders another's chrome |

```bash
npm run lint    # tsc --noEmit
npm test        # unit tests
npm run test:e2e
```

## State on resize

Crossing a surface boundary swaps applications, which remounts the tree and drops
transient component state such as a half-filled form. This is deliberate: the two
surfaces have different page structures, so there is no meaningful mapping between
their component trees. Persisted state (session, route, drafts written to storage)
survives. In practice this only happens when a user resizes a browser window
across 744px or 1180px, or rotates a device that straddles a boundary.

## Migration status

The shells, kits, navigation models, page composition layer, and CSS layers are
complete and wired for every role — guard, client, and staff all load their own
per-surface shell.

Individual feature screens still render their existing content inside the new
per-surface page structures. Migrating each screen onto its surface's kit is
incremental, and this order gives the most benefit first:

1. Guard map and active shift, guard shifts list — the highest-traffic mobile screens
2. Staff jobs, guards, clients, credentials — the densest desktop tables
3. Client home, request wizard, jobs list
4. Messages for all three roles — already split-aware, needs the surface kits
5. Payments, profile, settings, and the long tail of staff admin panels

## Desktop look-and-feel independence

Desktop chrome must not reuse tablet or mobile layouts, and must not key off
Tailwind `lg` (1024px). A 13" laptop is the tablet application until 1180px.

- `FORM_FACTOR_BOUNDS` in `src/lib/platform/device.ts` matches `SURFACE_BOUNDS`
  so `body[data-form-factor]` and `body[data-surface]` agree on website pointer
  devices.
- Dedicated desktop stylesheets (`desktop-*.css`, `gr-direct-desktop.css`)
  target `body[data-surface="desktop"]` only — never
  `data-form-factor="desktop"` or `data-view-surface="browser-desktop"`.
- Landing: `DesktopLandingPage` is an operations-centre site (ink nav, workspace
  preview, command-palette strip). Mobile and tablet keep the mobility homepage.
- Signed-in desktop: ink sidebar, top-bar breadcrumb, status bar, command
  palette, resizable panels. Tablet keeps a paper labelled rail and fixed split.
- `ListDetailLayout` / `MessagesHubLayout` / `HomePage` / `AuthPage` branch on
  `useSurfaceKind()`, not `formFactor`.

See `src/styles/desktopSurfaceIndependence.test.ts`.
