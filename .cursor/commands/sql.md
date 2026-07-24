# /sql — Database audit, build, and sync

Audit, build, optimize, and synchronize the complete database, migrations, relationships, triggers, and policies.

## Scope

| Selection | What to do |
|-----------|------------|
| **Table / feature** | Schema for that domain only |
| **Migrations** | Reconcile migration history |
| **Entire database** | Full schema audit and sync |

## Tasks

1. Review `supabase/migrations/` and `supabase/complete_schema_setup.sql`
2. Verify tables, columns, types, defaults, and constraints
3. Verify foreign keys and relationships
4. Verify indexes for query patterns used in the app
5. Verify RLS policies and grants per role
6. Verify triggers, functions, and RPC definitions
7. Remove duplicate or orphaned migration artifacts
8. Check data integrity (constraints, enums, check violations)
9. Update `complete_schema_setup.sql` to match production-intent schema

## Rules

- Never drop production data without explicit instruction
- Prefer additive migrations over destructive changes
- Test policies against guard, client, and staff roles
- Document SQL the user must run in Supabase dashboard

## Report back

- Schema changes made (migrations, SQL files)
- Relationships and policies verified or fixed
- SQL to run manually (if any)
- Drift or integrity issues found
- Recommendations
