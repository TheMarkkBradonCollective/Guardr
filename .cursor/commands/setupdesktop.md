# /setupdesktop — Build or rebuild the desktop website

Build or rebuild the **Desktop Website** only (`browser-desktop`, ≥1024px).

## Optimize for

- Large displays and multi-column layouts
- Keyboard and mouse interactions
- Dashboards and professional workflows
- High-density information (staff ops, client workbench, admin)
- Hover states, split panels, command bars

## Deliver

- `DesktopAdminShell` / `DesktopStaffAdminShell` wiring
- Desktop page variants (`adm-workbench`, split list/detail)
- `DesktopLandingPage` and `dsk-auth` for marketing and auth
- `desktop-app.css`, `desktop-landing.css`, `desktop-auth.css`

## Rules

- Do not change tablet or mobile layouts unless fixing a shared primitive
- Gate advanced chrome with `formFactor === 'desktop'` or `isAdvancedDesktopSurface`
- Run `npm run lint` and `npm test`

## Branch & PR

- Branch: `cursor/setupdesktop-<descriptive-name>-e760`

## Report back

- Desktop screens built or updated
- Files changed
- Test/lint status
