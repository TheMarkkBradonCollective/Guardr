# /themeit — Update themes across scope

Update all themes (**Light**, **Dark**, and **Grey/Shade**) across the selected scope.

## Scope

| Selection | What to do |
|-----------|------------|
| **Component** | Theme that component in all three modes |
| **Page** | Theme that page in all three modes |
| **Global** | Audit and fix theming project-wide |

## Verify in each theme

- Background, surface, border, and text colors
- Sage primary accent and hover states
- Contrast ratios (WCAG AA minimum)
- Icons, badges, status colors (success, warning, danger)
- Form inputs, modals, sheets, nav chrome
- Map overlays and dark-mode map views
- PWA and APK standalone shells

## Central files

```
src/lib/platform/theme.ts
src/index.css (CSS variables)
body[data-theme] / .theme-light / .theme-dark / .theme-grey
```

## Rules

- Use CSS variables — avoid hardcoded colors in components
- Sync theme preference to Supabase when user is signed in
- Test all three themes on desktop, tablet, and mobile widths

## Branch & PR

- Branch: `cursor/themeit-<descriptive-name>-e760`

## Report back

- Scope themed
- Contrast or consistency issues fixed
- Files changed
- Screens still needing theme fixes
