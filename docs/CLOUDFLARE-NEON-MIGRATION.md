# Guardr: Neon + Cloudflare (complete on this branch)

Production stack: **Neon Postgres**, **Cloudflare Worker** (`guardr`), **R2** (`guardr-files`), JWT auth, polling instead of Supabase Realtime.

**API URL:** https://guardr.themarkkbrandoncollective-2d9.workers.dev

## Removed

- `@supabase/supabase-js`, Supabase Auth, `/api/auth/bridge`
- Vercel (`vercel.json`, serverless `api/`, Express `server.ts`)
- Bundled push handler copies under `api/push/*`
- Supabase SQL tree (except **`docs/legacy/complete_schema_setup.sql`** for schema generation reference)

## Layout

| Path | Role |
|------|------|
| `db/neon-schema.sql` | Plain Postgres schema |
| `lib/http/routes/` | HTTP handlers (Stripe, push, cron, messages, …) |
| `worker/` | Hono app, assets, R2, cron triggers |
| `src/lib/api/guardrClient.ts` | Browser `/api` client |

## APK release

Tag **`v1.1.0-cf-beta`** — workflow `.github/workflows/cf-android-release.yml`

## Deploy checklist

See [DEPLOYMENT-GUARDR-CO.md](./DEPLOYMENT-GUARDR-CO.md). Do not merge DNS until validated.
