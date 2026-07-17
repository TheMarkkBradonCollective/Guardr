# /documentit — Generate complete documentation

Generate complete documentation for the selected scope, including workflows, APIs, database schema, permissions, features, and changelog.

## Scope

| Selection | What to do |
|-----------|------------|
| **Feature / page** | Document that scope |
| **Role** | Document workflows for guard, client, or staff |
| **Entire project** | Full documentation pass |

## Include

- Application overview and role workflows
- Page and navigation map
- API flow (Supabase client, RPC, edge functions, realtime)
- Database schema summary (tables, relationships, RLS)
- Role permissions matrix
- Feature list (shipped vs partial)
- Setup and deployment notes
- Changelog entry in `docs/DEV-UPDATES.md` when shipping user-visible changes

## Output locations

- `docs/guardr-general-guide.md` — primary product + technical guide
- `docs/CROSS_PLATFORM.md` — surface and platform behavior
- Feature-specific docs under `docs/` when warranted

## Rules

- Read the codebase — do not guess
- Plain language, scannable structure
- Mark gaps and unknowns explicitly

## Report back

- Files created or updated
- Sections completed vs missing
- Open questions for the user
