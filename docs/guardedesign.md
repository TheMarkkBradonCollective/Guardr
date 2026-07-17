# Guardr Design Language

Official visual and interaction specification for Guardr across **Website** (mobile · tablet · desktop), **PWA** (Full · Lite), and **Android APK** (Full · Premium).

This document captures the *design philosophy* of a premium modular SaaS dashboard (similar in polish to Linear, Stripe, or Notion) while remaining unmistakably **Guardr** — not Uber, not generic fintech, not security-agency cliché.

**Related docs:** [`CROSS_PLATFORM.md`](./CROSS_PLATFORM.md) · [`ANDROID-APK.md`](./ANDROID-APK.md) · [`.cursor/commands/designit.md`](../.cursor/commands/designit.md)

**External reference (design guidelines only):** [Uber Base design system](https://base.uber.com/) — patterns and principles summarized in Appendix A; not Uber branding.

---

## 1. Design intent

### What we are building

A **professional operating system** for security marketplace work — not a marketing brochure with a login button.

- Every screen is a workspace: guards in the field, clients managing coverage, staff running operations.
- Information lives in **modular cards** with clear hierarchy, generous spacing, and subtle depth.
- The interface should feel **premium, confident, and production-ready** on every surface.
- Motion is purposeful: nothing abrupt, nothing decorative for its own sake.

### What we are *not* copying

Do **not** reproduce Uber (or any third party) branding:

| Do not copy | Use instead |
|-------------|-------------|
| Uber logos, wordmarks, fonts | Guardr logo + IBM Plex Sans / Plus Jakarta Sans |
| Uber blue accent system | Guardr sage green (`--brand-primary`) |
| Uber-specific iconography | Lucide icons + Guardr patterns |
| “Driver app” copy or metaphors | Security marketplace language (jobs, shifts, coverage, credentials) |
| Literal layout clones | Same *philosophy* (cards, rail nav, bottom nav) with Guardr structure |

### Reference → Guardr translation

The reference mockups use **deep black chrome + electric blue accents + white type**.

Guardr translates that as:

| Reference element | Guardr rule |
|-------------------|-------------|
| Black backgrounds / chrome | **Theme-dependent canvas** — white (Light) or black (Dark), never third-party blue |
| Blue accents, glows, chart lines | **Sage green** (`--brand-primary`) and green-tinted glows |
| White text on dark | **Light theme:** dark text on white surfaces · **Dark theme:** light text on black surfaces |
| Neon glow on charts | Soft green glow using `color-mix(in srgb, var(--brand-primary) …)` — restrained, not nightclub |
| “Professional driver” widgets | Role-specific widgets (earnings, map, credentials, live coverage, ops queue) |

**Theme pairs (user choice):**

- **Light — Company Green / White:** white and soft green-tinted surfaces, black primary text, sage accents.
- **Dark — Company Green / Black:** true black and charcoal surfaces, off-white primary text, sage accents.

Green is always the **brand accent** (buttons, active nav, charts, focus rings, status emphasis). It does not replace semantic colors (success, warning, danger) or neutral text.

---

## 2. Brand tokens

### Source of truth

All colors, radii, shadows, and spacing tokens live in:

```
src/index.css              — CSS variables (--brand-*, --shadow-*, --radius-*)
src/lib/platform/theme.ts  — Light / Dark mode apply + persistence
src/lib/platform/themeBranding.ts — PWA/APK icon + theme-color meta swap
```

**Never hardcode hex values in components.** Use Tailwind `brand-*` utilities or `var(--brand-*)`.

### Primary palette (current)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--brand-primary` | `#5E7B61` | `#6B8F6E` | Accents, active states, chart lines, CTAs |
| `--brand-primary-hover` | `#4A6B4E` | `#5A7A5D` | Hover / pressed primary |
| `--brand-bg` | `#FFFFFF` | `#000000` | Page canvas |
| `--brand-surface` | `#FFFFFF` | `#111111` | Cards, panels |
| `--brand-elevated` | `#F7F9F7` | `#1A1A1A` | Raised cards, inset areas |
| `--brand-bg-sec` | `#F2F4F2` | `#0A0A0A` | Secondary backgrounds |
| `--brand-text` | `#000000` | `#F5F5F5` | Primary copy |
| `--brand-text-muted` | `#3D3D3D` | `#9CA3AF` | Labels, secondary copy |
| `--brand-border` | `#E2E8E2` | `#242424` | Card and chrome borders |
| `--brand-accent-text` | `#FFFFFF` | `#FFFFFF` | Text on filled primary buttons |

### Semantic status (do not repurpose as brand)

| Token | Role |
|-------|------|
| `--status-success` | Verified, online, completed |
| `--status-warning` | Pending, expiring soon |
| `--status-danger` | Error, rejected, critical alert |
| `--status-info` | Informational, neutral system message |

### Typography

| Role | Stack | Weight |
|------|-------|--------|
| UI / body | Plus Jakarta Sans, Inter, system-ui | 400–600 |
| Admin / data-dense desktop | IBM Plex Sans (secondary) | 500–700 |
| Headings | Same as UI | 700–800, `-0.03em` letter-spacing |
| Numbers / KPIs | Same as UI | 800–900, tabular figures where possible |

**Hierarchy rules:**

- KPI numbers are **large and immediate** (hero stat in card).
- Labels are short, muted (`text-brand-text-muted`).
- Avoid paragraph walls on dashboard screens; use cards and scannable rows.

### Radius, shadow, spacing

| Token | Value | Use |
|-------|-------|-----|
| `--radius-app-lg` / `--radius-card` | 14px | Standard cards |
| `--radius-app-xl` | 18px | Hero cards, modals |
| `--radius-sheet` | 22px | Bottom sheets, drawers |
| `--radius-pill` | full | Badges, chips |
| `--shadow-card` | theme-aware | Default card elevation |
| `--shadow-float` | theme-aware | Hover lift, popovers |
| `--space-touch` | 2.75rem min | Minimum tap target height |

---

## 3. Layout system

### Modular card grid

The dashboard is a **widget grid**, not one scrolling document.

Each widget is an independent card with:

```
┌─────────────────────────────────┐
│ [icon] Title          [actions] │  ← header
├─────────────────────────────────┤
│                                 │
│           body                  │  ← chart, list, map, stat
│                                 │
├─────────────────────────────────┤
│ optional footer / refresh       │
└─────────────────────────────────┘
```

**Card requirements:**

- Rounded corners (`--radius-card`)
- 1px border (`border-brand-border`)
- Soft shadow (`--shadow-card`)
- Optional glass: `bg-brand-surface/92 backdrop-blur-xl` on nav chrome only — not every card
- Hover: subtle lift (`translateY(-2px)`), stronger shadow, green-tinted border
- Interactive states: focus ring via `--focus-ring`

**Widget examples by role:**

| Role | Widgets |
|------|---------|
| Guard | Earnings, rating, trip time, job map, messages, credential status, online toggle |
| Client | Live coverage, active jobs, spend, guard roster, incident feed |
| Staff | Ops queue, approvals, payments, compliance alerts, team status, live map |

Cards should be **responsive and reorderable** across breakpoints (CSS grid / flex), not fixed pixel art.

### Navigation

| Form factor | Pattern | Implementation |
|-------------|---------|----------------|
| Desktop | Permanent left rail; collapsible to icons | `DesktopNavRail`, `DesktopAdminShell`, `adm-sidebar` |
| Tablet | Icon rail + command bar + touch content | `TabletAdminShell`, `TabletStaffAdminShell` |
| Mobile | Bottom nav + More sheet | `BottomNavBar`, `MoreMenuSheet`, `RoleAppShell` |
| PWA / APK mobile | Same as mobile + safe-area padding | `app-pwa.css`, `app-native.css` |

**Nav content (all roles):**

- Logo + product name
- Primary destinations (role-filtered)
- Secondary / overflow (Settings, Legal, Logout)
- Active item: sage fill or left accent bar — never foreign blue

**Desktop top bar** (sticky):

- Location / market selector (when relevant)
- System alert ticker (traffic, compliance, platform notices)
- Search (staff / admin)
- Notifications (badge count)
- Messages shortcut
- User greeting + avatar
- Theme toggle

Keep the top bar **minimal** — one row, no stacked chrome.

### View surface model

Layout is resolved by **shell × form factor**:

```
shellKind (browser | pwa | native) × formFactor (mobile | tablet | desktop) → viewSurface
```

See `src/lib/platform/viewSurface.ts` and `DeviceProvider` (`body[data-shell]`, `body[data-view-surface]`, `body[data-form-factor]`).

| Surface | Chrome behavior |
|---------|-----------------|
| `browser-desktop` | Full marketing + admin workspace |
| `browser-tablet` | Tablet merge shell |
| `browser-mobile` | Mobile web |
| `pwa-*` | Standalone, no browser UI, install icons follow theme |
| `native-*` | APK safe areas, native permissions, FCM push |

---

## 4. Theme behavior

### Modes

| Mode | Canvas | Text | Default platform |
|------|--------|------|------------------|
| **Light** | White / soft green tint | Black / dark gray | PWA, web |
| **Dark** | Black / charcoal | Off-white | APK (default), user preference |

Toggle via `ThemeToggle`; persisted per user (`localStorage` + Supabase `theme_preference`).

### Theme application rules

1. Set `html.theme-light` or `html.theme-dark` — never set colors on individual pages in isolation.
2. Call `applyThemeToDocument()` on change so maps, meta tags, and native chrome sync.
3. PWA `theme-color` and icons swap with mode (`themeBranding.ts`).
4. Map tiles and route layers follow `readThemeFromDocument()` / `useThemeMode()`.
5. Transitions: `background-color 0.3s ease, color 0.3s ease` on root — avoid flashing on route change.

### Contrast

- WCAG **AA minimum** for all body text and interactive labels.
- Sage on white and sage on black must pass; use `--brand-accent-text` (white) on filled primary buttons.
- Warning amber was darkened in Light mode intentionally — do not lighten without re-checking contrast.

---

## 5. Components

Use **one consistent component family** across surfaces. Prefer existing primitives before inventing new ones.

### Core primitives

| Component | Classes / location |
|-----------|-------------------|
| Card | `.app-card`, `.app-card-interactive`, `.uber-card` (legacy name — maps to brand tokens) |
| Sheet | `MoreMenuSheet`, map browse sheets |
| Sidebar nav | `AppSidebarNav`, `uber-side-nav-item` |
| Bottom nav | `BottomNavBar` |
| Badges | Status pills using `--status-*` |
| Tables | Desktop admin tables in `desktop-app.css` |
| Charts | Green stroke + gradient fill under curve; tooltips on hover |
| Maps | `Map*` components — themed pins, route layer, demand overlays |
| Messaging | `ChatThreadPanel`, `JobChatPanel` |
| Empty / loading | Skeleton shimmer on `--brand-bg-sec`, not spinners everywhere |

### Buttons

| Variant | Style |
|---------|-------|
| Primary | `bg-brand-primary text-brand-accent-text` |
| Secondary | `border border-brand-border bg-brand-surface` |
| Ghost | `text-brand-text-muted hover:text-brand-text` |
| Destructive | `status-danger` — never sage |

### Charts (earnings, performance, analytics)

- Smooth curves, not jagged polylines
- Area fill: `color-mix(in srgb, var(--brand-primary) 25%, transparent)` gradient to transparent
- Active point: glow + value label
- Support hover tooltips, responsive resize, live data refresh
- Animate line draw on first mount (≤600ms); respect `prefers-reduced-motion`

### Maps

- Integrated card — same border radius and shadow as other widgets
- Markers: brand green for active job / guard; semantic colors for alerts
- Optional overlays: high demand, pricing, fuel (guard) — as small chips, not billboard UI
- Route line uses theme-aware stroke from map utilities

---

## 6. Motion & animation

| Animation | When | Duration |
|-----------|------|----------|
| Fade in | Page / card mount | 200–320ms |
| Slide up | Sheets, modals | 220–280ms cubic-bezier(0.16, 1, 0.3, 1) |
| Hover lift | Interactive cards | 200ms |
| Glow pulse | Live / online indicators only | subtle, 2s loop max |
| Counter tick | KPI reveal | 400–800ms once |
| Skeleton | Loading states | shimmer 1.2s |

**Rules:**

- Honor `prefers-reduced-motion: reduce` — disable glow, counter, and slide.
- No animation on every keystroke or scroll tick.
- PWA Lite (see §8) may reduce concurrent animations.

---

## 7. Responsive philosophy

### Desktop (≥1024px)

- **Audience:** Staff, clients, admin
- **Density:** Multi-column grid, max information without clutter
- **Input:** Mouse + keyboard — focus states, hover, shortcuts where implemented
- **Shell:** `DesktopAdminShell`, `DesktopWorkspaceShell`, `adm-*` styles

### Tablet (768px–1023px)

- **Audience:** Staff, guards, clients on iPad / Galaxy Tab
- **Density:** Medium — 2-column card grid where space allows
- **Input:** Touch-first — 44px+ targets, no tiny checkboxes
- **Shell:** `TabletAdminShell` — rail + header + scrollable content

### Mobile website (&lt;768px)

- **Audience:** Guards, clients in browser
- **Layout:** Single column, stacked cards
- **Nav:** Bottom bar + More menu
- **Input:** One-handed use — primary actions in thumb zone
- **Performance:** Fast first paint; defer heavy chart animations

### Chromebook

- Same as desktop browser or installed PWA — no separate build.

---

## 8. PWA tiers

| Tier | Goal | Behavior |
|------|------|----------|
| **PWA Full** | Installed app parity | Full feature set, Web Push, offline queue, standalone chrome |
| **PWA Lite** | Battery + bandwidth friendly | Same routes and data; lighter animations, smaller hero assets, reduced chart effects |

**Shared PWA requirements:**

- `display: standalone` in `public/manifest.json`
- Safe-area insets: `env(safe-area-inset-*)` on headers and bottom nav
- Theme icons: white-background set for Light, black-background set for Dark
- Service worker caches shell; feature data stays network-first with offline queue for guard field flows
- Install prompt via `InstallPrompt` — non-blocking

**Lite-specific:**

- Skip glow and counter animations
- Prefer static chart snapshots until user interacts
- Smaller map default zoom footprint on cellular (`navigator.connection` when available)

---

## 9. Android APK tiers

| Tier | Goal | Behavior |
|------|------|----------|
| **APK Full** | Field-ready guard client | GPS, camera, notifications, offline capture, shift alerts |
| **APK Premium** | Most polished native feel | Material motion, biometric unlock (when enabled), richer haptics, optimized splash → home transition |

**Shared APK requirements:**

- Capacitor shell loading `https://guardr.co` (or bundled assets per build)
- Default theme: **Dark** (`DEFAULT_NATIVE_THEME` in `theme.ts`) — black icon / splash alignment
- Native permissions on first use (`nativePermissions.ts`)
- FCM push for shift-critical alerts; routing via `lib/push/routing.ts`
- Safe areas: `app-native.css` overrides
- Status bar / navigation bar sync via `nativeThemeChrome.ts`

**Premium-specific:**

- Shared element transitions on tab change (where Capacitor supports)
- Pull-to-refresh on list screens
- Haptic feedback on clock-in / clock-out confirmations
- Optional biometric re-auth for Pay tab

---

## 10. Persona surfaces

| Persona | Product feel | Key screens |
|---------|--------------|-------------|
| **Guard** | Uber Driver × security compliance | Map, Jobs, Pay, Messages, Credentials, Self-audit |
| **Client** | Airbnb host × SaaS billing | Home, Post job, Live coverage, Guards, Invoices |
| **Staff / Admin** | Stripe Dashboard × ops center | Approvals, Payments, Compliance, Messages, Live jobs map |

Each persona shares the **same design language** but different widget sets and nav items.

---

## 11. Spacing & alignment

- **Grid gutter:** `--space-gutter` (1.25rem) minimum between cards
- **Section breaks:** `--space-section` (2rem) between major dashboard regions
- **Card padding:** `--space-card` (1.125rem) internal; 1.25rem on hero widgets
- **Alignment:** Snap cards to a consistent column grid — no random 3px offsets
- **Whitespace is intentional** — if a card feels cramped, remove a row before shrinking padding

---

## 12. Content & voice

- Professional, direct, calm — security work is serious
- Prefer **verbs** on buttons: “Start shift”, “Approve guard”, “Post job”
- Alert ticker: one line, actionable when possible (“Accident on I-405 — expect delays”)
- No gimmicky gamification copy on earnings cards

---

## 13. Implementation checklist

When building or redesigning a screen (`/designit`, `/fixit`, `/themeit`):

- [ ] Uses CSS variables only — no stray `#5E7B61` in TSX
- [ ] Tested in **Light** and **Dark**
- [ ] Tested at mobile, tablet, desktop widths
- [ ] Tested in browser, PWA standalone, and APK when touching chrome
- [ ] Touch targets ≥ 44px on mobile / tablet
- [ ] Focus visible for keyboard users
- [ ] Maps and charts respect active theme
- [ ] Role permissions unchanged — design only
- [ ] No Uber / third-party branding leaked in

### Key files to touch

```
src/index.css
src/styles/desktop-app.css
src/styles/tablet-app.css
src/styles/app-pwa.css
src/styles/app-native.css
src/components/layouts/
src/lib/platform/theme.ts
public/manifest.json
```

---

## 14. Anti-patterns

| Avoid | Why |
|-------|-----|
| Hardcoded black/white bypassing theme | Breaks Light mode and PWA icon sync |
| Blue accent “because SaaS” | Off-brand; reads as Uber clone |
| Flat full-width tables on mobile | Use cards or horizontal scroll sections |
| More than 3 levels of nested cards | Flattens hierarchy |
| Spinners on every refetch | Use skeleton or inline subtle pulse |
| Different button styles per page | Erodes premium feel |
| Copy-pasting reference mockup pixel positions | Guardr has its own grid and role flows |

---

## 15. Evolution notes

This spec supersedes informal “Uber redesign” references in dev logs. The **Uber layout philosophy** (card grid, driver-style mobile chrome) stays; **Uber visual identity** does not.

Future token work may introduce **deep green-tinted dark chrome** (`color-mix` of `--brand-primary` into `--brand-bg`) for stronger brand presence in Dark mode. Until tokens are updated in `index.css`, treat black canvas as canonical Dark and green as accent only.

---

## 16. Summary

Guardr should feel like **enterprise-grade security marketplace software** — modular, breathable, and confident — with **sage green** as the unmistakable thread through charts, navigation, and focus states, on either a **white** or **black** canvas chosen by the user. The same language ships on web, PWA, and APK; only density, motion, and native integrations change per surface.

---

## Appendix A — Uber Base design guidelines (from base.uber.com)

This appendix summarizes the **design language documented on [base.uber.com](https://base.uber.com/)** — Uber’s official Base styleguide (v05.13.26 as of scrape). It captures *how Uber defines UI design*, not their React codebase. Every section below is translated for **Guardr** (sage green accent, white/black themes, security marketplace identity).

> *“The Base design system defines the foundations of user interfaces across Uber's ecosystem of products & services. It brings all Uber experiences together under a single, unified framework.”* — [Welcome to Base](https://base.uber.com/6d2425e9f/p/93825b-welcome-to-base)

### A.1 How Base is organized

The styleguide has four top-level areas:

| Area | Purpose | Guardr equivalent |
|------|---------|-------------------|
| **Foundation** | Tokens, type, color, grid, radius, elevation, motion, content, inclusion | `index.css`, `theme.ts`, voice/copy rules |
| **Components** | Specs for buttons, cards, nav, charts, sheets, tables, etc. | `src/components/`, layout shells |
| **Patterns** | Cross-component flows: modality, maps, chat, rider flows | Job flows, map browse, messaging |
| **Resources & tools** | Onboarding, Figma, playbooks, a11y articles | `/designit`, docs, E2E |

**Foundation pillars** (from Welcome): Design tokens · Color · Typography · Icons · Dimensions · Layout grids · Corner radius · Elevation · Motion · Content · Equity · Accessibility

### A.2 Core philosophy (Uber → Guardr)

From Uber’s public design platform writing and Base onboarding:

| Uber Base idea | Meaning | Guardr application |
|----------------|---------|---------------------|
| **Dead simple** | Four font categories, three main colors (white, black, accent), five core sizes on a 4px grid | Light/dark canvas + sage accent; limited type scale; 4px-aligned spacing |
| **LEGO bricks** | Basic components combine into many layouts; customize via overrides, not one-offs | Modular `.app-card` widgets; variant props, not per-page CSS |
| **Design for patterns** | Think beyond pixels — digital affordances affect real behavior | Field guard flows, live coverage, credential compliance |
| **Single source of truth** | Documentation lives in design tools (Figma), not stale websites | `guardedesign.md` + tokens in `index.css` |
| **Inclusive by default** | Product inclusion principles inform every decision | WCAG AA, reduced motion, readable type in sunlight |

Uber describes Base as: *reliable, accessible, extensively customizable*. Guardr matches that bar on web, PWA, and APK.

### A.3 Design tokens

Source: [Design tokens](https://base.uber.com/6d2425e9f/p/33fa5e-design-tokens)

**Definition:** Tokens are foundational design decisions as reusable data — shared across iOS, Android, and Web — controlling the entire visual system.

**Anatomy:** Each token has a **name** (required) and **value** (required), optional **description**.

**Three tiers** (aliasing — each tier references the one below):

| Tier | Role | Guardr |
|------|------|--------|
| **Primitive** | Raw, platform-agnostic values (hex, px) | Future `--brand-primary-*` steps in `index.css` |
| **Semantic** | Usage-based names (`backgroundPrimary`, `contentAccent`) | `--brand-bg`, `--brand-text`, `--brand-primary` |
| **Component** | Self-contained per-component tokens | Button heights, nav rail width, card padding |

**Principles Uber teaches:**

- **Shared language** between design and engineering
- **Consistency** — fast to build, slow to break; tokens cement the “feel”
- **Reusability** — never raw hex in components; themes (Light/Dark) depend on tokens
- **Single voice** — deviating from tokens breaks the system

**Supported token types in Base:** Color · Typography · Layout grids · Dimensions · Corner radius · Elevation · Motion · Haptics

**Guardr rule:** Same three-tier mental model. Components use semantic `--brand-*` only; primitives live in `index.css`.

### A.4 Typography

Source: [Typography](https://base.uber.com/6d2425e9f/p/976582-typography)

#### Principles

| Principle | Uber says | Guardr says |
|-----------|-----------|-------------|
| **Go big** | Prioritize larger sizes; legibility and accessibility first | KPI numbers large (~44px); don’t shrink field-critical labels |
| **Less is more** | Fewer style options — no decision paralysis | Four roles × four sizes max in product UI |
| **Simple semantics** | Roles guide usage without over-prescription | Display / Heading / Label / Paragraph naming in docs |

#### Roles

Four type **roles**: **Display**, **Heading**, **Label**, **Paragraph** — each in sizes XSmall → Large (Heading/Display also XLarge, XXLarge).

#### Scale (modular)

- **Base size:** 14px
- **Multiplier:** 1.125 per step (major-second musical scale — “upbeat, happy” rhythm)
- **Line height:** `fontSize × 1.45`, rounded to nearest **4px** (4px baseline grid)
- **Spacing below text:** `(lineHeight − fontSize)` rounded to 4; extra line height below Paragraphs

#### Fonts

- Uber: **Uber Move** (Display, Text, Mono) — Display for large titles only, not body/buttons
- Guardr: **Plus Jakarta Sans** (UI) + **IBM Plex Sans** (admin density) — same role split

#### Mono ramp

Use monospace ramp **only** for isolated numbers (earnings, rates, balances) — not phone numbers, addresses, or inline strings.

#### Do / Don’t (from Base)

| Do | Don’t |
|----|-------|
| Paragraph Medium (16) or Large (18) for multi-line body | Paragraph XSmall (12) for long-form — max ~3 lines (legal disclaimers) |
| Default sizes on settings/list screens | Reinvent sizes on every screen |
| Underline embedded links; label weight inside paragraph | Color-only links |
| Move Mono for metrics in dashboards | Mono for nominal IDs |

**Guardr KPI cards** (earnings, rating, trip time): **Display Small scale** (~44px bold) — not marketing Display Large (96px).

### A.5 Layout grids

Source: [Layout grids](https://base.uber.com/6d2425e9f/p/785d5f-layout-grids)

**Anatomy:** Columns (content aligns here) · Gutters (fixed between columns) · Margins (outer edge padding)

**Rules:**

- Align content to **columns**, not gutters
- **Span** — how many columns a cell occupies; wraps if insufficient
- **Hide** — `span: 0` removes from flow (responsive nav)
- **Skip** — offset columns without empty cells
- Intrinsic-width items (tags, pills) stay natural width — don’t stretch to fill grid
- **Fixed-width** sidebar (side-nav) sits beside fluid grid content
- **Sub-grids** — nested areas use margin-stripped grid variants

**Behaviors:** Fluid (default full width) · Fixed (centered max width) · Hybrid (mix on one screen)

**Breakpoints:** Container width switches grid definition; span/skip/hide accept per-breakpoint values.

**Guardr mapping:**

| Surface | Grid behavior |
|---------|---------------|
| Desktop admin | 12-column mental model; `DesktopAdminShell` |
| Tablet | 8-column / 2-card rows; `TabletAdminShell` |
| Mobile | 4-column compact; single column stack |
| Card feed | 16px gap narrow; grid without dividers ≥600px wide |

### A.6 Corner radius

Source: [Corner radius](https://base.uber.com/6d2425e9f/p/652959-corner-radius)

Radius follows **component footprint** — larger containers get larger radius:

| Radius | Used for |
|--------|----------|
| **16px** | Large containers: sheets, dialogs |
| **12px** (default) | Cards, snackbars, banners, message cards |
| **8px** | Nested elements: buttons inside cards |
| **4px** | Small: tags |

Nested 12px parent → child can drop to **8px** for visual balance.

**Guardr:** `--radius-card` (14px) sits between 12–16 — acceptable for dashboard widgets; use 16px for sheets/modals (`--radius-sheet` 22px for bottom sheets).

### A.7 Elevation

Source: [Elevation](https://base.uber.com/6d2425e9f/p/595594-elevation)

Elevation = **depth cue via shadow**, not border substitute.

**Use shadows when elevated above main surface:**

- Sheet over map · Dialog over screen · Snackbar over content · Button dock with scroll behind · Drag/lift states

**Do not** use shadow only to separate adjacent cards on the same plane — use **border or background color** instead.

| Shadow type | Uber use | Guardr use |
|-------------|----------|------------|
| **Shallow above** | Sheet header, full-screen modal, overflow button dock | Sticky header, bottom nav backdrop |
| **Shallow below** | Dialog, menu, popover, date picker | `NavMenuPopover`, map peek |
| **Deep below** | Tooltips, snackbars | Toasts, floating map controls |

**Cards:** Base explicitly says — *don’t add shadows to cards*; use borders. Background-art cards may need stroke if artwork is white.

**Guardr chart glow** (reference mockups): accent `box-shadow` on live data only — not default card elevation.

### A.8 Motion

Source: [Motion](https://base.uber.com/6d2425e9f/p/116184-motion)

#### Motion principles

| Principle | Summary |
|-----------|---------|
| **Accessible** | Users control motion; no harmful flashing; respect reduced motion |
| **Purposeful** | Feedback, signify change, orient — user always knows what happened |
| **Consistent** | Predictable patterns; brand personality: Bold, Direct, with Heart |
| **Contextual** | Choreographed for focus — never distracting |

#### Accessibility (motion)

- No flashing colors; use transition patterns over jump cuts
- Non-essential loops ≤5s or user can pause/stop/hide
- **Reduced motion:** 100ms crossfade replaces large transitions; static illustrations replace animated brand moments

#### Timing

- **Quintic easing** for most UI — quick, smooth, heavy accel/decel
- Enter/exit defaults: opacity 200ms in / 100ms out; scale/position 400–500ms with decelerate/accelerate

#### Choreography rules

| Rule | Detail |
|------|--------|
| **Continuity** | Container transforms between related views — not abrupt cuts |
| **Keep space** | Elements never collide while moving; fade static elements first |
| **Clean fades** | Fade out completely to background before fading in — avoid muddy cross-fades |
| **Move on grid** | Separate X and Y — no diagonal smart-animate |
| **One direction** | Don’t move horizontal + vertical simultaneously |
| **Transition every change** | Nothing pops in/out without enter/exit pattern |

**Guardr:** Honor `prefers-reduced-motion`; PWA Lite reduces concurrent animation (§8).

### A.9 Cards (dashboard widgets)

Source: [Card](https://base.uber.com/6d2425e9f/p/02338d-card)

The reference dashboard mockup is essentially a **card grid**. Base defines cards as:

> *A contained unit of information related to a topic.*

**Layer cake anatomy** (vertical tiers):

1. **Fixed tier** — eyebrow, headline, paragraph, currency (order fixed)
2. **Media tier** — photo, illustration, video, carousel (position flexible)
3. **Custom tier** — tags, list items, progress bar (reorderable)
4. **Button tier** — single primary action

**Card vs list:**

| Cards | Lists |
|-------|-------|
| Vertical “layer cake” cells | Horizontal scanned rows |
| Feeds, grids, dynamic media | Settings, search results, navigation |
| More viewport space each | Denser, faster scan |

**Behavior:**

- Usually **one destination** or **one action** per card
- Avoid many competing tap targets inside one card
- Truncate: eyebrow 1 line, heading 4 lines, currency 1 line; fit within **80% viewport height** — detail page for overflow
- **No vertical scroll inside a card**
- Feed cards: 100% width &lt;600px with dividers; grid ≥600px without dividers
- **No shadow on standard cards**; border/background separation

**Guardr dashboard widgets** map 1:1: earnings chart card, rating card, map card, messages card — each one topic, one primary action.

### A.10 Navigation

#### Bottom navigation

Source: [Bottom navigation](https://base.uber.com/6d2425e9f/p/1413a0-bottom-navigation)

- **3–5 equally sized tabs** — global, persistent, thumb-reachable
- Independent sections with **preserved scroll state**
- Tap active tab → scroll section to top
- Only **modal surfaces** cover the bar
- Optional badge per tab (must be obvious why on tap)
- **Narrow** (&lt;600): icon + label stacked · **Wide** (≥600): icon + label horizontal
- Don’t use bottom nav to split content within a section — use **Tabs** for that

**Guardr:** `BottomNavBar` + `MoreMenuSheet` for overflow; guard mobile primary shell.

#### Side navigation

Source: [Side navigation](https://base.uber.com/6d2425e9f/p/917574-side-navigation)

- Column of links for categories / subsections
- Combines with top nav + breadcrumbs, or stands alone
- Use cases: product categories, app sections, frequent features (support, safety)

**Guardr:** `DesktopNavRail`, `adm-sidebar`, `TabletAdminShell` rail.

### A.11 Charts

Source: [Charts](https://base.uber.com/6d2425e9f/p/61b6c1-charts)

- Modular parts: gridlines, axes, labels, legend — swap per context
- Labels must not overlap; show on interaction if space is tight
- Choose chart by: **concept** → **variable count** → **time series importance**
- Types: Bar · Line · Area · Circles/dots · Other

**Guardr earnings / performance widgets:** smooth line + area fill under curve; sage green stroke; interactive peak labels; no overlapping axis labels.

### A.12 Product inclusion principles

Source: [Principles](https://base.uber.com/6d2425e9f/p/434f39-principles) (Product inclusion)

1. **Recognize how your identity informs your perspective**
2. **Consider multiple perspectives** — design *with*, not *for*
3. **Prioritize impact over intentions** — who benefits? unintended consequences?

Guardr relevance: guards, clients, and staff have different contexts (field, desk, mobile, night shift). Test layouts for sun glare, one-handed use, screen readers, and non-native English readers.

### A.13 Guardr translation cheat sheet

| Uber Base | Guardr |
|-----------|--------|
| White + black + blue accent | White or black canvas + **sage green** accent |
| Uber Move / Move Mono | Plus Jakarta Sans / IBM Plex Sans; tabular nums for money |
| `brandDefault` blue charts | `--brand-primary` charts + soft green glow on live peaks |
| Driver / rider copy | Guard / client / staff marketplace language |
| Uber maps patterns | Guardr `Map*` components, job pins, route layer |
| Base 1.0 light-only card shadows | Theme-aware `--shadow-card`; no shadow on flat dashboard cards |
| SSO-locked internal pages | Public Guardr spec in this doc + `index.css` tokens |

### A.14 What we do not copy

Uber logos · Uber Move font · Uber blue · “Professional driver” product framing · Literal Base component pixel specs · Private SSO-only Base pages (Color 1.0 token values, some patterns).

### A.15 Adoption order for Guardr `/designit`

1. Token discipline (`--brand-*` only)
2. Card grid dashboard (§A.9) with 12/8/4 column grids (§A.5)
3. Type scale + KPI Display Small numbers (§A.4)
4. Radius + elevation rules — borders on cards, shadows only when floating (§A.6–7)
5. Bottom nav + side rail behavior (§A.10)
6. Motion choreography + reduced motion (§A.8)
7. Chart module patterns (§A.11)
