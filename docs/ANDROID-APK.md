# Android APK (Guardr)

Guardr ships as a **Capacitor-wrapped Android APK** alongside the web/PWA at [guardr.co](https://guardr.co).

## Download

- **Install page:** [https://guardr.co/download/](https://guardr.co/download/)
- **Direct APK:** [https://guardr.co/download/guardr.apk](https://guardr.co/download/guardr.apk)

The install page compares your **APK** vs **Save to Home Screen (PWA)** install, checks whether an APK update is needed, and explains the tradeoffs (manual APK updates vs auto-updating web shortcut).

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
- **Release signing** — beta builds use the debug keystore for sideload distribution; replace with a production keystore before Play Store submission

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
2. Download `google-services.json` into `android/app/` (gitignored — do not commit)
3. Set `FCM_SERVICE_ACCOUNT_JSON` on the Guardr server (Vercel env):
   - Firebase Console → Project settings → **Service accounts** → **Generate new private key**
   - Paste the full JSON file contents as the env var value (single line is fine)
   - Use the **Firebase Cloud Messaging API (V1)** — the legacy Server key is deprecated and disabled on new projects
4. Rebuild the APK: `npm run android:apk`

**CI:** Add a GitHub Actions secret `GOOGLE_SERVICES_JSON` with the full contents of `google-services.json`. The Android APK workflow writes it before building so release artifacts include native FCM.

## Play Store (future)

1. Create a release keystore (do **not** commit it)
2. Configure `android/app/build.gradle` `signingConfigs.release`
3. Build an AAB: `./gradlew bundleRelease`
4. Upload to Google Play Console

## CI

GitHub Actions workflow `.github/workflows/android-apk.yml` builds the APK on demand and uploads it as an artifact.

Required secrets for a push-enabled APK:

| Secret | Purpose |
|--------|---------|
| `GOOGLE_SERVICES_JSON` | Full `google-services.json` file (written to `android/app/` at build time) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Optional; omitted values fall back to production keys in the client |
