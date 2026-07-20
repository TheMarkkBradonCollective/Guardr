# /setuptablet — Build or rebuild the tablet website

Build or rebuild the **Tablet Website** only (`browser-tablet`, 768–1023px).

## Optimize for

- Touch-first interaction
- **Portrait** and **landscape** orientations
- Medium screens — hybrid of desktop density and mobile touch
- Persistent sidebar + header + touch-friendly content (`GuardrDrawerShell` via `resolveMobilityChrome`)
- Tablet gestures and split panels (`ListDetailLayout` tablet mode)

## Deliver

- Tablet chrome via `RoleAppShell` / `DesktopStaffAdminShell` → `GuardrDrawerShell` (not a separate icon rail)
- Tablet page content (not just shell — wide layouts inside tablet shell)
- `tablet-app.css` and `body[data-form-factor="tablet"]` rules
- No hover-only affordances; bottom nav is **mobile-only**

## Rules

- Tablet merges desktop and mobile DNA — persistent sidebar + sheets + touch targets
- Use `isWideFormFactor` or `formFactor !== 'mobile'` for content density where appropriate
- Run `npm run lint` and `npm test`

## Branch & PR

- Branch: `cursor/setuptablet-<descriptive-name>-e760`

## Report back

- Tablet screens built or updated
- Portrait/landscape verification
- Files changed
- Test/lint status
