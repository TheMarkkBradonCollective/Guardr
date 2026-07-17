# /designit — Redesign selected page(s)

Completely redesign the selected page(s) while preserving functionality and matching the project's design language.

## Scope

| Selection | What to do |
|-----------|------------|
| **Single page** | Full visual and layout redesign of that page |
| **Multiple pages** | Redesign all selected pages consistently |
| **Flow** | Redesign a multi-step flow (wizard, onboarding, checkout) |

## Preserve

- All existing functionality and business logic
- Role permissions and data contracts
- Route names and navigation entry points unless improvement requires change

## Design language (Guardr)

- **Brand:** Sage green (`#84a279`), clean professional security aesthetic
- **Themes:** Light, Dark, Grey — sage accent in all
- **Typography:** IBM Plex Sans / Plus Jakarta Sans stack
- **Patterns:** Cards, sheets, bottom nav (mobile), admin workbench (desktop), tablet merge shell

## Deliver per surface

- **Desktop** — density, sidebars, split panels
- **Tablet** — touch rail + header + content
- **Mobile** — single column, sheets, large tap targets
- **PWA** — lite standalone chrome
- **APK** — premium native feel, safe areas, animations

## Branch & PR

- Branch: `cursor/designit-<descriptive-name>-e760`

## Report back

- Pages redesigned and surfaces touched
- Before/after summary of layout changes
- Files changed (components, CSS)
- Functionality preserved checklist
- Test/lint status
