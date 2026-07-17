# /setupmobile — Build or rebuild the mobile website

Build or rebuild the **Mobile Website** only (`browser-mobile`, <768px).

## Optimize for

- Phones — portrait and landscape
- Touch-first navigation
- Bottom navigation (`BottomNavBar` + `MoreMenuSheet`)
- Thumb-friendly controls and large tap targets
- Small screens — single column, sheets, minimal chrome
- Performance and fast loading

## Deliver

- Mobile path in `RoleAppShell` and `StaffOpsLayout`
- Bottom nav primary tabs + overflow menu
- Mobile-specific page layouts (not scaled desktop)
- Sticky footers offset for bottom nav (`3.75rem` + safe area)

## Rules

- Mobile stays simple — no desktop admin chrome
- Run `npm run lint` and `npm test`

## Branch & PR

- Branch: `cursor/setupmobile-<descriptive-name>-e760`

## Report back

- Mobile screens built or updated
- Navigation structure
- Files changed
- Test/lint status
