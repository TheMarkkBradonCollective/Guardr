# Guardr Design Language

Official visual and interaction specification for Guardr across **Website** (mobile · tablet · desktop), **PWA** (Full · Lite), and **Android APK** (Full · Premium).

This document captures the *design philosophy* of a premium modular SaaS dashboard (similar in polish to Linear, Stripe, or Notion) while remaining unmistakably **Guardr** — not Uber, not generic fintech, not security-agency cliché.

**Related docs:** [`CROSS_PLATFORM.md`](./CROSS_PLATFORM.md) · [`ANDROID-APK.md`](./ANDROID-APK.md) · [`.cursor/commands/designit.md`](../.cursor/commands/designit.md)

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
