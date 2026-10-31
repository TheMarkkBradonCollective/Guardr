# Guardr: Supabase + Vercel -> Neon + Cloudflare (status)

Draft, phased. Production still runs on Supabase + Vercel. Nothing in Supabase, Vercel, or DNS was changed.

## Where the earlier attempt stopped (PRs #1070, #1071)
- Added Neon helpers (`lib/db/*`), `scripts/neon/apply-schema.ts`, `neon.ts`, docs/NEON-MIGRATION.md.
- Neon project existed (now renamed **Guardr**, id gentle-firefly-57124649, us-west-2) but had only the default `neondb`, with no tables. Schema was never applied and no data was copied.
- Cloudflare: a Worker named `guardr` exists but is the "Hello world" template (no bindings, no assets). No Pages project. R2 is not enabled on the account.
- The app's API, auth, realtime and client calls were all still Supabase/Vercel.

## Done in this branch so far
- Neon project renamed to Guardr; empty `guardr` database created.

## Remaining phases
1. Apply schema to Neon `guardr` (`npm run db:neon:apply` with the direct URL).
2. Copy data from Supabase project opgzwurnjkrqkjujqokh (read-only dump -> Neon restore).
3. Worker API (Hono + @neondatabase/serverless) replacing `api/` and `server.ts`; Vite build served as Worker static assets.
4. Own auth (bcrypt/PBKDF2 + JWT signed with a Worker secret); migrate Supabase auth hashes if exportable, else reset flow.
5. R2 for uploads (bucket `guardr-media`), polling instead of Supabase Realtime.
6. Stripe webhooks/cron as Worker routes and Cron Triggers.

## Blockers
- The Supabase connector only sees project "Line", not Guardr's (opgzwurnjkrqkjujqokh), so data and auth hashes can't be read yet.
- R2 must be enabled in the Cloudflare dashboard by the account owner.
