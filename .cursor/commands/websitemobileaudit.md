# /websitemobileaudit — Mobile website audit

Audit only the **Mobile Website** (`browser-mobile`, <768px).

## Verify

- **Portrait** and **landscape** orientations
- Bottom navigation and mobile menus
- Touch targets (minimum 44×44px)
- Swipe gestures and sheet behavior
- Mobile forms and keyboard behavior (input types, scroll-into-view)
- Safe areas (`env(safe-area-inset-*)`)
- Responsive single-column layout
- Performance and fast loading

## Repair

- Mobile UX and navigation
- Layout and alignment
- Accessibility (focus, labels, contrast)
- Performance (bundle, images, lazy load)
- Touch interactions and sticky footers

## Architecture

```
src/components/layouts/RoleAppShell.tsx (mobile path)
src/components/layouts/BottomNavBar.tsx
src/components/layouts/MoreMenuSheet.tsx
```

## Branch & PR

- Branch: `cursor/websitemobileaudit-<descriptive-name>-e760`

## Mobile audit report

- Issues found and fixed (mobile only)
- Portrait vs landscape notes
- Recommendations
- Mobile health score
