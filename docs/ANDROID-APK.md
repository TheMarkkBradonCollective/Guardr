# Android APK (Guardr)

Guardr ships as a **Capacitor-wrapped Android APK** alongside the web/PWA at [guardr.co](https://guardr.co).

## Download

- **Install page:** [https://guardr.co/download/](https://guardr.co/download/)
- **Direct APK (QR code):** [https://www.guardr.co/download/guardr.apk?v=167](https://www.guardr.co/download/guardr.apk?v=167) — append `?v=<build>` to bust cache after updates

The install page compares your **APK** vs **Save to Home Screen (PWA)** install, checks whether an APK update is needed (reads the version inside your installed APK), and explains the tradeoffs (manual APK updates vs auto-updating web shortcut).

Share the install page with guards in the Signature Security network.

## Build locally

### Prerequisites

- Node.js 22+
- Java 17+ (21 recommended)
- Android SDK (`ANDROID_HOME` set)

Install Android command-line tools if needed:

```bash
# Ubuntu example — see https://developer.android.com/studio#command-tools
export ANDROID_HOME="$HOME/Android/Sdk"
```

### Commands

```bash
npm install
npm run android:apk
```

This will:

1. Sync `public/download/version.json` and `android/app/build.gradle` from `package.json`
2. Run `npm run apk:audit` to catch version drift before building
3. Build the Vite web bundle with `VITE_APP_URL=https://guardr.co`
4. Sync assets into `android/`
5. Run `./gradlew assembleRelease`
6. Copy the APK to `public/download/guardr.apk` for static hosting
7. Re-run the parity audit (warnings if the bundled web assets are stale)

### Verify without building

```bash
npm run apk:audit
```

Checks `package.json`, `version.json`, `build.gradle`, Capacitor plugins, and whether `public/download/guardr.apk` matches the current version.

Output APK path:

```
android/app/build/outputs/apk/release/app-release.apk
```

### Open in Android Studio

```bash
npm run cap:sync
npm run android:open
```

## How it works

- **One codebase** — same React app as the website, bundled into the APK
- **API calls** — `apiUrl()` in `src/lib/siteConfig.ts` routes `/api/*` to `https://guardr.co` when running in the native shell
- **Push notifications** — Web/PWA uses Web Push (VAPID). The Android APK uses native FCM via `@capacitor/push-notifications` (requires `android/app/google-services.json` and server `FCM_SERVICE_ACCOUNT_JSON`).
- **Runtime permissions** — location, camera, photos, and notifications are requested on first launch (see `src/lib/platform/nativePermissions.ts`)
- **Release signing** — sideload builds use the debug keystore; Play Store builds use `android/keystore.properties` (see [GOOGLE-PLAY.md](GOOGLE-PLAY.md))

## Permissions

The Android app requests permissions needed for guard field work:

| Permission | Used for |
|------------|----------|
| **Location** | Map, job proximity, check-in validation |
| **Camera** | Self-audit photos, ID verification selfies |
| **Photos** | Credential and document uploads from gallery |
| **Notifications** | Job alerts, shift reminders, operational push |

Permissions are declared in `android/app/src/main/AndroidManifest.xml` and requested at runtime on first launch via Capacitor (`@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/push-notifications`).

### Push setup (APK)

1. Create a Firebase project and add an Android app with package `com.signaturesecurity.guardr`
2. Place Firebase config in **one** of these locations (gitignored — never commit):
   - `secrets/google-services.json` (preferred for local/cloud-agent builds — copied to `android/app/` automatically)
   - `android/app/google-services.json` directly
   - `GOOGLE_SERVICES_JSON` environment variable (full JSON string)
3. Set `FCM_SERVICE_ACCOUNT_JSON` on the Guardr server (Vercel env):
   - Firebase Console → Project settings → **Service accounts** → **Generate new private key**
   - Paste the full JSON file contents as the env var value (single line is fine)
   - Use the **Firebase Cloud Messaging API (V1)** — the legacy Server key is deprecated and disabled on new projects
4. Rebuild the APK: `npm run android:apk` (fails if Firebase config is missing unless `ALLOW_APK_WITHOUT_FCM=1`)

**Important:** Always ship the CI-built APK (or a local build with Firebase) so `versionName` / `versionCode` inside the binary match `package.json`. Copying an older CI artifact while bumping `version.json` alone will make guards see the wrong version after install.

**CI:** Add a GitHub Actions secret `GOOGLE_SERVICES_JSON` with the full contents of `google-services.json`. The Android APK workflow writes it before building so release artifacts include native FCM.

## Play Store

Full guide: **[docs/GOOGLE-PLAY.md](GOOGLE-PLAY.md)**

1. Create upload keystore → `android/keystore.properties` (see `keystore.properties.example`)
2. Add Firebase `google-services.json` for `com.signaturesecurity.guardr`
3. `npm run android:play` → upload `dist/play-store/guardr-play-release.aab`
4. Complete Play Console store listing, Data safety, content rating, and reviewer test accounts

The **play** flavor omits sideload-only permissions; **sideload** (`npm run android:apk`) keeps debug signing for guardr.co/download.

## CI

GitHub Actions workflow `.github/workflows/android-apk.yml` builds the APK on demand and uploads it as an artifact.

Required secrets for a push-enabled APK:

| Secret | Purpose |
|--------|---------|
| `GOOGLE_SERVICES_JSON` | Full `google-services.json` file (written to `android/app/` at build time) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Optional; omitted values fall back to production keys in the client |
