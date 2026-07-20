# /websitetabletaudit — Tablet website audit

Audit only the **Tablet Website** (`browser-tablet`, 768–1023px).

## Verify

- **Landscape** and **portrait** orientations
- Touch navigation and tablet menus
- Persistent sidebar, command bar, and hybrid shell (`GuardrDrawerShell` / `resolveMobilityChrome`)
- Responsive layouts — merge of desktop density and mobile touch patterns
- Forms, dialogs, scrolling, gestures
- Performance at tablet widths
- No dual chrome (sidebar + bottom nav) on tablet

## Repair

- Tablet-specific UI and layout issues
- Touch usability (tap targets, no hover-only affordances)
- Responsive bugs between 768px and 1023px
- Split-panel and list/detail behavior

## Do not

- Redesign desktop-only marketing pages unless tablet CSS is broken

## Architecture

```
src/components/baseui/layout/GuardrDrawerShell.tsx
src/components/baseui/layout/mobilityChrome.ts
src/styles/tablet-app.css
body[data-form-factor="tablet"]
```

## Branch & PR

- Branch: `cursor/websitetabletaudit-<descriptive-name>-e760`

## Tablet audit report

- Issues found and fixed (tablet only)
- Landscape vs portrait notes
- Recommendations
- Tablet health score
