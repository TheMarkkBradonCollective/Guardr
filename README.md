# Guardr

**Anytime. Anywhere. Security, When You Need It.**

Guardr is an independent contractor marketplace connecting licensed security professionals with clients who need security services.

**Live app (beta):** [https://guardr.themarkkbrandoncollective-2d9.workers.dev](https://guardr.themarkkbrandoncollective-2d9.workers.dev) — Cloudflare Worker + Neon Postgres until a custom domain is attached.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, Tailwind 4, Base Web |
| API | Cloudflare Worker (`worker/`), Hono, `@neondatabase/serverless` |
| Database | Neon PostgreSQL (`guardr`), schema in `db/neon-schema.sql` |
| Auth | PBKDF2 + JWT (`JWT_SECRET`), `users` table |
| Files | Cloudflare R2 bucket `guardr-files` |
| Payments | Stripe Connect |
| Android | Capacitor 7 — WebView loads the Worker origin |

Historical Supabase/Vercel schema reference: `docs/legacy/complete_schema_setup.sql`.

## Run locally

```bash
npm install
cp .env.example .dev.vars   # Wrangler secrets (DATABASE_URL, JWT_SECRET, …)
npm run db:schema:generate  # after editing legacy schema
npm run db:neon:apply       # direct Neon URL — empty DB only
npm run db:seed             # STAFF_ADMIN_PASSWORD + NEON_DATABASE_URL_UNPOOLED
npm run dev                 # wrangler dev (API + Vite dist assets)
```

Client env for builds:

```env
VITE_APP_URL=https://guardr.themarkkbrandoncollective-2d9.workers.dev
```

## Deploy Worker (no DNS change)

```bash
npm run build
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
# … Stripe, VAPID, CRON_SECRET — see .env.example
npm run worker:dry-run
wrangler deploy
```

Details: **[docs/CLOUDFLARE-NEON-MIGRATION.md](docs/CLOUDFLARE-NEON-MIGRATION.md)**, **[docs/DEPLOYMENT-GUARDR-CO.md](docs/DEPLOYMENT-GUARDR-CO.md)** (updated for Worker hosting).

## Android APKs

Build against the Worker URL:

```bash
VITE_APP_URL=https://guardr.themarkkbrandoncollective-2d9.workers.dev npm run android:apk:all
```

CI release tag **`v1.1.0-cf-beta`**: [.github/workflows/cf-android-release.yml](.github/workflows/cf-android-release.yml)

Download links in-app point at GitHub Release assets — see **[docs/ANDROID-APK.md](docs/ANDROID-APK.md)**.

## Docs

- [Product guide](docs/guardr.md)
- [Design patterns](docs/design-patterns.md)
- [Neon database](docs/NEON-MIGRATION.md)
- [Google Play](docs/GOOGLE-PLAY.md)

## Verify

```bash
npm run lint && npm test && npm run build && npm run worker:dry-run
```
