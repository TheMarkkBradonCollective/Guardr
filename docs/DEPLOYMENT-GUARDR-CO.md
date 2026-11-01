# Deploying Guardr (Cloudflare Worker + Neon)

Production API and static app are served by a **single Cloudflare Worker** named `guardr`. Custom domain (e.g. guardr.co) is wired later via Cloudflare DNS — do not change DNS until smoke tests pass.

## Live beta URL

https://guardr.themarkkbrandoncollective-2d9.workers.dev

## Prerequisites

- Neon project with database **`guardr`**
- Cloudflare account `92d9592953c4d46474ae07993913f710`
- R2 bucket **`guardr-files`** (binding `FILES`)
- Stripe, VAPID, and cron secrets

## Database

```bash
export NEON_DATABASE_URL_UNPOOLED=postgresql://…/guardr?sslmode=require
npm run db:neon:apply
npm run db:neon:check -- --smoke
STAFF_ADMIN_PASSWORD=… npm run db:seed
```

Pooled `DATABASE_URL` / `NEON_DATABASE_URL` goes to the Worker only (Wrangler secrets).

## Worker deploy

```bash
npm run build
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put CRON_SECRET
npm run worker:dry-run
wrangler deploy
```

Configure Stripe webhooks to `https://guardr.themarkkbrandoncollective-2d9.workers.dev/api/stripe/webhook`.

## Client builds

Set `VITE_APP_URL` to the Worker URL for Vite, PWA, and Android:

```bash
VITE_APP_URL=https://guardr.themarkkbrandoncollective-2d9.workers.dev npm run build
```

Capacitor `server.url` uses the same value (see `capacitor.config.ts`).

## Android APK release

GitHub Actions workflow **Cloudflare Android Release** (`.github/workflows/cf-android-release.yml`) builds APKs and publishes tag **`v1.1.0-cf-beta`**.

See [ANDROID-APK.md](./ANDROID-APK.md).

## What was removed

Vercel (`vercel.json`, serverless `api/`), Express `server.ts`, and Supabase client/auth are no longer part of this branch. HTTP handlers live under `lib/http/routes/` and mount from `worker/app.ts`.
