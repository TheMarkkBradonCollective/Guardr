# Android APK (Cloudflare Worker backend)

APKs are Capacitor shells that load the Guardr UI from the **Cloudflare Worker** origin (not guardr.co or Vercel).

## Worker URL

```
https://guardr.themarkkbrandoncollective-2d9.workers.dev
```

Set at build time:

```bash
export VITE_APP_URL=https://guardr.themarkkbrandoncollective-2d9.workers.dev
npm run android:apk:all
```

`capacitor.config.ts` sets `server.url` from `VITE_APP_URL`.

## GitHub Release downloads

In-app and `public/download/version.json` point at release **`v1.1.0-cf-beta`**:

| App | URL |
|-----|-----|
| All roles (zip) | https://github.com/TheMarkkBradonCollective/Guardr/releases/download/v1.1.0-cf-beta/Guardr-All-APKs.zip |
| Guard | https://github.com/TheMarkkBradonCollective/Guardr/releases/download/v1.1.0-cf-beta/Guardr-Guard.apk |
| Customer | https://github.com/TheMarkkBradonCollective/Guardr/releases/download/v1.1.0-cf-beta/Guardr-Client.apk |
| Staff | https://github.com/TheMarkkBradonCollective/Guardr/releases/download/v1.1.0-cf-beta/Guardr-Staff.apk |
| Messenger | https://github.com/TheMarkkBradonCollective/Guardr/releases/download/v1.1.0-cf-beta/Guardr-Messenger.apk |

Constants: `src/lib/githubApkRelease.ts`.

## CI

- **Cloudflare Android Release** — `.github/workflows/cf-android-release.yml` (branch `cloudflare-neon-migration`, tag `v1.1.0-cf-beta`)
- Legacy **Android Release** workflow on `main` may still reference Vercel/Supabase; use the Cloudflare workflow for this stack.

## Firebase / FCM

Native push still requires `google-services.json` (or `GOOGLE_SERVICES_JSON` in CI). Local builds without Firebase: `ALLOW_APK_WITHOUT_FCM=1`.

## Play Store

See [GOOGLE-PLAY.md](./GOOGLE-PLAY.md). Play builds use the same `VITE_APP_URL` Worker origin.
