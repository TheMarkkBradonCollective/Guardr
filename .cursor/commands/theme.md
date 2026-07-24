# /theme — Update Light, Dark, and Grey themes

Audit and fix **Light**, **Dark**, and **Grey (Shade)** theming for the selected scope. Themes must stay consistent with Guardr's sage security brand across website, PWA, and APK.

## Scope

| Selection | What to do |
|-----------|------------|
| **Component** | Theme that component in all three modes |
| **Page** | Theme that page in all three modes |
| **Global** | Audit and fix theming project-wide |

## Guardr theme tokens

| Token | Light | Dark | Grey |
|-------|-------|------|------|
| **Primary accent** | Sage `#84a279` | Sage (lifted for contrast) | Sage on neutral grey surfaces |
| **Background** | Clean white / off-white | Deep charcoal | Mid grey shell |
| **Text** | High-contrast body copy | Light text on dark surfaces | Balanced grey-scale hierarchy |
| **Status** | Success / warning / danger badges readable in all modes | Same | Same |

Typography: IBM Plex Sans / Plus Jakarta Sans. See `docs/guardedesign.md` for full design language.

## Verify in each theme

- Background, surface, border, and text colors
- Sage primary accent and hover/focus states
- Contrast ratios (WCAG AA minimum)
- Icons, badges, and status colors
- Form inputs, modals, sheets, nav chrome
- Map overlays and dark-mode map tiles
- PWA and APK standalone shells (`shellKind`: browser | pwa | native)

## Central files

```
src/lib/platform/theme.ts
src/index.css                    — CSS variables
body[data-theme]                 — theme attribute
.theme-light / .theme-dark / .theme-grey
```

## Work order

1. Confirm scope (component / page / global)
2. Audit hardcoded colors — replace with CSS variables
3. Fix each theme mode; test at desktop, tablet, and mobile widths
4. Verify PWA (`app-pwa.css`) and APK (`app-native.css`) inherit tokens
5. Sync signed-in user theme preference to Supabase when applicable
6. Run `npm run lint` and `npm test`

## Rules

- Use CSS variables — avoid hardcoded hex in components
- Do not change layout or behavior — presentation only (see `/fix` or `/design` for UX work)
- Test all three themes on desktop, tablet, and mobile
- Match `docs/guardedesign.md` and `docs/CROSS_PLATFORM.md` surface rules

## Branch & PR

- Branch: `cursor/theme-<descriptive-name>-8442`

## Report back

- Scope themed
- Contrast or consistency issues fixed
- Files changed
- Screens still needing theme fixes
- Test/lint status

## Related

- `/design` — full page redesign (layout + visual language)
- `/fix` — scope-aware UI/UX optimization across surfaces
- `/uber` or `/uberplatforms` — Uber Base Web presentation-layer migration
