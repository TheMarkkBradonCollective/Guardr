# Guardr Neon PostgreSQL migration

This change prepares an independent Neon database. It does **not** move production traffic off Supabase. The browser still uses Supabase Auth, PostgREST, and Realtime. No Supabase project, table, or row is modified by these scripts.

## Original architecture

- Frontend: React 19 and Vite 6. The client calls `@supabase/supabase-js` directly (`src/lib/supabase.ts`).
- API: Express (`server.ts`, `server/createApp.ts`) for local development, and Vercel serverless routes under `api/` for production (`vercel.json`).
- Database: Supabase Postgres. Schema source of truth is `supabase/complete_schema_setup.sql`, plus `supabase/migrations/`.
- Auth: Supabase Auth (`signInWithPassword` / `signUp`) with a legacy PBKDF2 password on profile rows (`src/lib/auth/`).
- Authorization: server session checks in `lib/accountSessionAuth.ts`. Many RLS policies are `USING (true)`. Stricter policies call `auth.uid()` helpers.
- Documents: credential and ID photos are resized in the browser and stored as text (`image_url`, `id_front_url`, `id_back_url`, `id_selfie_url`). They are not Supabase Storage objects.
- Realtime: Supabase channels on `postgres_changes` for jobs, messages, notifications, live location, and the audit log.
- Existing `DATABASE_URL` support is only for occasional DDL (`lib/schemaApply.ts`). It is not the application data path.

## New architecture

- Neon is an additional PostgreSQL database named `guardr`.
- Server code reads `NEON_DATABASE_URL` (pooled) and `NEON_DATABASE_URL_UNPOOLED` (direct). A `DATABASE_URL` whose host is `neon.tech` is also accepted. A Supabase URL is ignored for this path.
- `npm run db:neon:apply` transforms `supabase/complete_schema_setup.sql` and runs it on the direct Neon connection.
- `npm run db:neon:check` verifies connectivity. `--smoke` inserts synthetic rows and rolls them back.
- The client bundle is unchanged. Setting the Neon variables does not switch login, jobs, or messaging.

## Schema

The Neon script is the existing schema plus three compatibility edits:

- `auth.uid()` is created in an `auth` schema so current RLS helpers compile. It reads `request.jwt.claim.sub`. Nothing in the app sets that claim yet, so those helpers return null on Neon.
- `ALTER PUBLICATION supabase_realtime` is skipped. Neon has no Supabase Realtime listener.
- `NOTIFY pgrst` is skipped. Neon has no PostgREST.
- `one_role_cases` and `device_account_bindings` are created after the main RLS block. On an empty database the early `ALTER TABLE` would fail, so it is skipped until the tables exist and the same open policies are applied afterward.
- `idx_staff_comp_payouts_status` is created after `payout_status` is added. The Supabase script creates that index first, which only works when the column is already present.

Tables, columns, indexes, checks, and foreign keys from the Supabase script are preserved, including guards, clients, staff, certifications, jobs (`security_requests`), availability, messages, notifications, and `audit_log`. The script is the same bootstrap used for a new Supabase project, so it also inserts the existing founder and director staff rows and runs the existing brownfield cleanup. Run it on an **empty** Neon database.

Documents stay in the existing text columns. They are not copied into `BYTEA`. Base64 text is larger than the original file, and the free Neon quota is small. The app already avoids loading `image_url` in bulk lists.

## What stays on Supabase

- Sign-in, sign-up, and session refresh (`supabase.auth`).
- Every `supabase.from(...)` call in the client.
- Realtime subscriptions.
- Push, Stripe, and cron routes that use the service-role client.
- The Supabase project and its data. Do not delete it.

Replacing Auth would mean a new session issuer and a rewrite of `src/lib/auth/authService.ts`. That is not part of this change. Neon does not provide Supabase Auth.

## Environment variables

Server only. Never prefix with `VITE_`.

| Variable | Purpose |
| --- | --- |
| `NEON_DATABASE_URL` | Pooled Neon connection string for application queries |
| `NEON_DATABASE_URL_UNPOOLED` | Direct Neon connection string for schema apply |
| `DATABASE_URL` | Unchanged. Used by the existing DDL helper. Treated as Neon only when the host is `neon.tech` |

`/api/health` adds `neonDatabase.configured`, `pooled`, and `databaseName`. It does not return the host, user, or password.

## Commands

```bash
npm run db:neon:apply
npm run db:neon:check
npm run db:neon:check -- --smoke
```

`db:neon:apply` exits with code 2 when the direct URL is missing, when the host is Supabase, or when the URL is pooled. It does not connect to Supabase.

## Data copy and rollback

Production data was not copied. After the empty Neon schema has been checked:

1. Keep a backup of the Supabase project (Supabase dashboard backup, or `pg_dump` of a read replica / direct connection you already control).
2. Dump data only, from a machine that already has the Supabase connection string. Do not print the URL.
3. Restore into the Neon database with the direct URL.
4. Expect conflicts on the seeded staff emails. Resolve those rows by hand. Do not re-run the schema script after the copy if you need to keep production rows: the script includes `DELETE` and `UPDATE` statements used for brownfield Supabase projects.

Rollback of this repository change is a revert. Rollback of a future cutover is to leave the client on the Supabase URL and anon key. Dropping the Neon project does not affect Supabase. Do not drop Supabase.

## Manual steps in Neon

1. Sign in at [https://console.neon.tech](https://console.neon.tech).
2. Create a project. Use the database name `guardr` (the default database name Neon offers can be renamed, or create `guardr` from the Neon SQL editor: `CREATE DATABASE guardr;`).
3. Choose a region near the users. For this deployment that is AWS US West (Oregon) if it is available on the free plan.
4. Open **Connect**. Copy the **pooled** connection string into the server environment as `NEON_DATABASE_URL`.
5. Copy the **direct** connection string into `NEON_DATABASE_URL_UNPOOLED`.
6. Confirm both strings contain `/guardr` and `sslmode=require`, and that the pooled host contains `-pooler`.
7. Store them in the host's secret manager (Vercel environment variables for the API, or the process environment for Express). Do not put them in Vite env, the Android app, or git.
8. From this repo, run `npm run db:neon:apply`, then `npm run db:neon:check -- --smoke`.
9. Leave production `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as they are.

No Neon credentials were available in this environment, so steps 2–8 were not executed against Neon.

## Deployment

Production is Vercel (`vercel.json`): static Vite output plus Node serverless functions and crons. That host can use the `pg` driver with Neon's pooled connection string.

Cloudflare Pages can serve the Vite build. It cannot run the Express server, Stripe webhooks, push senders, or cron jobs. Cloudflare Workers do not speak the TCP protocol `pg` uses. A Workers port would need `@neondatabase/serverless` and a rewrite of `api/` and `server/`. Do not deploy the API as a static Pages site.

Do not set the Neon URLs on the production Vercel project until `db:neon:check` succeeds and you have decided how Auth and Realtime move. The health field will show `configured: true` once the pooled URL is present, even while the app still reads and writes Supabase.

## Security

- The Neon role used by `NEON_DATABASE_URL` is the table owner, so row level security does not apply to it. Keep that URL on the server. Authorization has to happen in server code before any future query uses the pool.
- Current client access still depends on the Supabase anon key. Several policies are `USING (true)`. That is existing behavior, not a Neon change.
- `src/lib/supabase.ts` falls back to a baked-in project URL and publishable key when env vars are missing. That key is already in the client bundle. Do not add the Neon URL next to it.
- Identity documents must not be given public URLs. The smoke test uses the text `synthetic-test-document` and rolls back.
- Connection errors are redacted before they are printed.
