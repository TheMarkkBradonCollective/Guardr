# Guardr: Supabase + Vercel -> Neon + Cloudflare (status)

Production still runs on Supabase + Vercel until cutover. This branch adds the Neon + Worker stack alongside it.

## Done on `cloudflare-neon-migration` (PR #1072)

- **`db/neon-schema.sql`** — plain Postgres schema (no Supabase Auth, Storage, Realtime, or RLS), plus a **`users`** table for app JWT auth. Regenerate with `npm run db:schema:generate`.
- **`npm run db:seed`** — applies schema if needed, seeds staff admin from `STAFF_ADMIN_PASSWORD` (and optional `STAFF_ADMIN_EMAIL`).
- **`worker/`** — Hono app on **`@neondatabase/serverless`**: auth, `/api/data/query`, R2 uploads (`FILES` → **`guardr-files`**), sync polling, and ported **`api/`** + cron routes via Vercel adapter.
- **`wrangler.toml`** — Worker name **`guardr`**, `account_id` set, **`[assets]`** SPA from `dist`, R2 binding.
- **Frontend** — `src/lib/supabase.ts` now uses a same-origin fetch client (`src/lib/api/guardrClient.ts`); realtime → polling.
- **Server** — `lib/db/adminClient.ts` uses Neon when `DATABASE_URL` / `NEON_DATABASE_URL` is set.

## Deploy (do not run in CI without approval)

```bash
npm run build
wrangler secret put DATABASE_URL      # pooled Neon URL, database guardr
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put CRON_SECRET
npm run db:seed   # with NEON_DATABASE_URL_UNPOOLED + STAFF_ADMIN_PASSWORD
wrangler deploy   # omit --dry-run when ready; do not merge DNS yet
```

Validate bundle: `npm run worker:dry-run`

## Still manual / follow-up

- Enable **R2** on the Cloudflare account and create bucket **`guardr-files`**.
- Copy production data from Supabase when the connector can reach project `opgzwurnjkrqkjujqokh`.
- `/api/auth/bridge` still targets Supabase Auth for linking; retire or rewrite before cutover.
- Point DNS at the Worker only after smoke tests; leave Vercel files in place for guardr.co until then.
