# /buildit — Build a feature, page, component, or system

Build the requested feature, page, component, or system **completely** using the project's standards.

## Scope

| Selection | What to do |
|-----------|------------|
| **Single component** | Build only that component end-to-end |
| **Single page** | Build the full page with routing, state, and API wiring |
| **Multiple pages / feature** | Build the full feature across all affected surfaces |
| **System** | Build the complete subsystem (DB, API, UI, tests) |

## Standards

- Match existing naming, types, folder structure, and abstractions
- Use the platform layer (`shellKind`, `formFactor`, `viewSurface`) for UI
- Wire Supabase schema, RLS, and client API calls when data is involved
- Support **desktop, tablet, and mobile** layouts where UI is added
- Add PWA and APK considerations for installed-app surfaces
- Run `npm run lint` and `npm test` before finishing
- Update `docs/DEV-UPDATES.md` for user-visible changes

## Work order

1. Confirm scope and read surrounding code first
2. Design data model / API if needed
3. Implement backend (migrations, RPC, policies) before UI when applicable
4. Implement mobile first, then tablet and desktop variants
5. Verify role permissions and edge cases
6. Test manually against acceptance criteria

## Branch & PR

- Branch: `cursor/buildit-<descriptive-name>-e760`

## Report back

- What was built and where (files, routes, tables)
- Surfaces supported (desktop / tablet / mobile / PWA / APK)
- SQL to run in Supabase (if any)
- Test/lint status
- Follow-up items
