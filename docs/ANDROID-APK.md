# Android APK (Guardr)

Guardr ships as **three Capacitor-wrapped Android APKs** alongside the web/PWA at [guardr.co](https://guardr.co). Each APK is a dedicated product app and can be installed next to the others on one device.

| App | Package | Launcher name | Opens |
|-----|---------|---------------|--------|
| Client | `com.signaturesecurity.guardr.client` | **Guardr Client** | `/client/*` |
| Guard | `com.signaturesecurity.guardr.guard` | **Guardr Guard** | `/guard/*` |
| Staff | `com.signaturesecurity.guardr.staff` | **Guardr Staff** | `/staff/*` |

Billing, profile, and support stay on the **website** at `/account`. Deep links: `guardr-client://`, `guardr-guard://`, `guardr-staff://`.

## Download

- **Install page:** [https://guardr.co/download/](https://guardr.co/download/)
- **All three APKs (zip):** [https://www.guardr.co/download/guardr-apps.zip](https://www.guardr.co/download/guardr-apps.zip)
- **Client APK:** [https://www.guardr.co/download/guardr-client.apk](https://www.guardr.co/download/guardr-client.apk)
- **Guard APK:** [https://www.guardr.co/download/guardr-guard.apk](https://www.guardr.co/download/guardr-guard.apk)
- **Staff APK:** [https://www.guardr.co/download/guardr-staff.apk](https://www.guardr.co/download/guardr-staff.apk)

Append `?v=<versionCode>` to bust cache after updates. The install page also accepts `?app=client|guard|staff`.

Legacy `/download/guardr.apk` redirects to the zip.

Share the install page with the Signature Security network. Each person installs the app for their role.

## Build locally

### Prerequisites

- Node.js 22+
- Java 17+ (21 recommended)
- Android SDK (`ANDROID_HOME` set)
- `zip` (used to pack `guardr-apps.zip`)

Install Android command-line tools if needed:

```bash
# Ubuntu example — see https://developer.android.com/studio#command-tools
export ANDROID_HOME="$HOME/Android/Sdk"
```

### Commands

```bash
npm install
npm run android:apk:all
```

`npm run android:apk` is the same command. This will:

1. Sync `public/download/version.json` and `android/app/build.gradle` from `package.json`
2. Run `npm run apk:audit` to catch version drift before building
3. For **each** role (`client`, `guard`, `staff`):
   - Build the Vite web bundle with `VITE_PRODUCT_APP=<role>` and `VITE_APP_URL=https://www.guardr.co`
   - Sync assets into `android/`
   - Run `./gradlew assembleSideload<Role>Release`
4. Copy APKs to `public/download/guardr-{client,guard,staff}.apk`
5. Zip them to `public/download/guardr-apps.zip`
6. Re-run the parity audit

Build one role while iterating:

```bash
node scripts/build-android-apk.mjs --role=guard
```

### Verify without building

```bash
npm run apk:audit
```

Checks `package.json`, `version.json`, `build.gradle` role flavors, Capacitor plugins, and whether the three APKs / zip are present.

Gradle output paths (AGP names the folder from both flavor dimensions):

```
android/app/build/outputs/apk/sideloadClient/release/app-sideload-client-release.apk
android/app/build/outputs/apk/sideloadGuard/release/app-sideload-guard-release.apk
android/app/build/outputs/apk/sideloadStaff/release/app-sideload-staff-release.apk
```

### Open in Android Studio

```bash
npm run cap:sync
npm run android:open
```

Select a variant such as `sideloadClientRelease` / `sideloadGuardRelease` / `sideloadStaffRelease`. Play variants are `playClientRelease`, etc.

## How it works

- **One codebase** — same React app as the website, bundled into each APK
- **Baked identity** — `VITE_PRODUCT_APP=client|guard|staff` so `resolveProductApp` / `isAppExperience()` always land in that app. Launch rewrites `/` to the role home (`/client/home`, `/guard/map`, `/staff/overview`). `/account` stays the website account portal.
- **Gradle flavors** — `distribution` (`sideload` / `play`) × `role` (`client` / `guard` / `staff`). Role flavors set `applicationIdSuffix`, launcher label, and deep-link scheme.
- **API calls** — `apiUrl()` in `src/lib/siteConfig.ts` routes `/api/*` to `https://guardr.co` when running in the native shell
- **Push notifications** — Web/PWA uses Web Push (VAPID). Each Android APK uses native FCM via `@capacitor/push-notifications` (requires a `google-services.json` client entry for that package and server `FCM_SERVICE_ACCOUNT_JSON`).
- **Runtime permissions** — location, camera, photos, and notifications are requested on first launch (see `src/lib/platform/nativePermissions.ts`)
- **Release signing** — sideload builds use the debug keystore; Play Store builds use `android/keystore.properties` (see [GOOGLE-PLAY.md](GOOGLE-PLAY.md))

## Permissions

The Android apps request permissions needed for field work:

| Permission | Used for |
|------------|----------|
| **Location** | Map, job proximity, check-in validation |
| **Camera** | Self-audit photos, ID verification selfies |
| **Photos** | Credential and document uploads from gallery |
| **Notifications** | Job alerts, shift reminders, operational push |

Permissions are declared in `android/app/src/main/AndroidManifest.xml` and requested at runtime on first launch via Capacitor (`@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/push-notifications`).

### Push setup (APK)

Firebase must know **each** Android package. The sideload/Play binaries are no longer a single `com.signaturesecurity.guardr` app.

1. Firebase Console → Project settings → **Add app** → Android, three times:

   | App nickname | Package name |
   |--------------|----------------|
   | Guardr Client | `com.signaturesecurity.guardr.client` |
   | Guardr Guard | `com.signaturesecurity.guardr.guard` |
   | Guardr Staff | `com.signaturesecurity.guardr.staff` |

   Keep the original `com.signaturesecurity.guardr` app if it already exists; it is unused by the role APKs but harmless.

2. Download the project `google-services.json` (it should list all three `client` entries) and place it in **one** of these locations (gitignored — never commit):
   - `secrets/google-services.json` (preferred for local/cloud-agent builds — copied to `android/app/` automatically)
   - `android/app/google-services.json` directly
   - `GOOGLE_SERVICES_JSON` environment variable (full JSON string)
3. Set `FCM_SERVICE_ACCOUNT_JSON` on the Guardr server (Vercel env):
   - Firebase Console → Project settings → **Service accounts** → **Generate new private key**
   - Paste the full JSON file contents as the env var value (single line is fine)
   - Use the **Firebase Cloud Messaging API (V1)** — the legacy Server key is deprecated and disabled on new projects
4. Rebuild: `npm run android:apk:all` (fails if Firebase config is missing unless `ALLOW_APK_WITHOUT_FCM=1`)

If the secret still only contains `com.signaturesecurity.guardr`, the build script **clones** that client into the three role packages so Gradle can assemble. Those APKs will **not** receive FCM until you add the three Android apps in Firebase and replace `GOOGLE_SERVICES_JSON`.

**Important:** Always ship the CI-built APKs (or a local build with Firebase) so `versionName` / `versionCode` inside the binaries match `package.json`. Copying an older CI artifact while bumping `version.json` alone will make people see the wrong version after install.

**CI:** Add a GitHub Actions secret `GOOGLE_SERVICES_JSON` with the full contents of `google-services.json`. The Android APK workflow writes it before building so release artifacts include native FCM for whichever packages are listed.

## Play Store

Full guide: **[docs/GOOGLE-PLAY.md](GOOGLE-PLAY.md)**

Play listings are **one app per role** (three application IDs). Sideload (`npm run android:apk:all`) keeps debug signing for guardr.co/download. Play (`npm run android:play`) builds three AABs when the upload keystore is present.

## CI

GitHub Actions workflow `.github/workflows/android-apk.yml` builds all three sideload APKs, zips them, and uploads:

- `public/download/guardr-apps.zip`
- `public/download/guardr-client.apk`
- `public/download/guardr-guard.apk`
- `public/download/guardr-staff.apk`

Required secrets for a push-enabled APK:

| Secret | Purpose |
|--------|---------|
| `GOOGLE_SERVICES_JSON` | Full `google-services.json` file (written to `android/app/` at build time) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Optional; omitted values fall back to production keys in the client |
