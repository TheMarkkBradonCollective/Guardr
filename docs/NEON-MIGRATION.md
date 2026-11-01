# Neon PostgreSQL

Guardr’s production database is **Neon Postgres** (`guardr`). The application talks to it only through the Cloudflare Worker using `@neondatabase/serverless`.

## Schema

- **Applied schema:** `db/neon-schema.sql` (plain Postgres, `users` table, no RLS)
- **Historical Supabase bootstrap:** `docs/legacy/complete_schema_setup.sql` (reference only for `npm run db:schema:generate`)

## Commands

```bash
npm run db:schema:generate   # legacy SQL → db/neon-schema.sql
npm run db:neon:apply        # requires NEON_DATABASE_URL_UNPOOLED
npm run db:neon:check
npm run db:neon:check -- --smoke
npm run db:seed              # STAFF_ADMIN_PASSWORD + direct URL
```

## Environment (Worker secrets / `.dev.vars`)

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | Pooled Neon URL (Worker queries) |
| `NEON_DATABASE_URL` | Same as above (optional alias) |
| `NEON_DATABASE_URL_UNPOOLED` | Direct URL for DDL/seed only |

Never expose database URLs in `VITE_*` variables.

## Cutover notes

Supabase and Vercel are removed from this branch. Migrate production data with `pg_dump` / restore into Neon before switching traffic. Custom domain attaches to the Worker separately from DNS for guardr.co marketing if still needed.
