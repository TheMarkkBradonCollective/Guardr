# Google Play Console — Guardr

Step-by-step guide to upload **Hire, Work, and Staff** to Google Play. Each app has its own package id. Your developer account is already set up; this doc covers build prep, Console forms, and release.

## Quick commands

| Command | Purpose |
|---------|---------|
| `npm run play:check` | Verify repo is ready (stops at missing keystore / Firebase) |
| `npm run play:assets` | Generate 512×512 icon + 1024×500 feature graphic |
| `npm run android:play` | Build signed Hire, Work, and Staff AABs |

Output AABs after a successful build:

```
dist/play-store/Guardr-Client.aab   (Hire — com.signaturesecurity.guardr.client)
dist/play-store/Guardr-Guard.aab    (Work — com.signaturesecurity.guardr.guard)
dist/play-store/Guardr-Staff.aab    (Staff — com.signaturesecurity.guardr.staff)
```

---

## What was automated in this repo

- **Play vs sideload flavors** — `play` build has no `REQUEST_INSTALL_PACKAGES` (Play policy safe); `sideload` keeps in-app APK updates for guardr.co/download
- **Release signing** — reads `android/keystore.properties` (see `keystore.properties.example`)
- **Play build flag** — `VITE_PLAY_STORE_BUILD=true` hides sideload update UI in Settings
- **Store assets script** — unlabeled `icon-512.png`, Hire/Work/Staff `*-icon-512.png`, `feature-graphic-1024x500.png`
- **Listing copy draft** — `docs/play-store-listing-copy.md`

Sideload APK builds are unchanged: `npm run android:apk` → `public/download/guardr.apk`.

---

## Step 1 — Your action: upload keystore

Google Play requires a **production upload key**. Create it once and back it up.

```bash
mkdir -p secrets
keytool -genkeypair -v \
  -keystore secrets/guardr-upload.keystore \
  -alias guardr-upload \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Signature Security Specialist LLC, OU=Mobile, O=Signature Security Specialist LLC, ST=California, C=US"
```

Copy and edit keystore config:

```bash
cp android/keystore.properties.example android/keystore.properties
# Edit storePassword and keyPassword
```

Print the upload certificate SHA-256 (needed if Play ever resets your upload key):

```bash
keytool -list -v \
  -keystore secrets/guardr-upload.keystore \
  -alias guardr-upload | grep SHA256
```

**Never commit** `keystore.properties`, `*.keystore`, or passwords.

On first upload, enroll in **Play App Signing** (recommended). Google holds the app signing key; you keep the upload key.

---

## Step 2 — Your action: Firebase for push

Play builds require the same Firebase setup as sideload APKs.

1. Firebase Console → add Android app with package `com.signaturesecurity.guardr`
2. Download `google-services.json`
3. Place at **`secrets/google-services.json`** (preferred) or set env `GOOGLE_SERVICES_JSON`
4. Set **`FCM_SERVICE_ACCOUNT_JSON`** on the Guardr server (Vercel) for push delivery

Verify:

```bash
npm run play:check
```

---

## Step 3 — Build the AAB

Prerequisites: Java 17+, Android SDK (`ANDROID_HOME`), Node 22+.

```bash
npm install
npm run play:assets    # optional but recommended before Console upload
npm run android:play
```

Upload the three AABs under `dist/play-store/` (`Guardr-Client.aab`, `Guardr-Guard.aab`, `Guardr-Staff.aab`) — not `public/guardr.apk` (debug-signed sideload build). Each listing is a separate Play app.

---

## Step 4 — Your action: Play Console app setup

### Create app (if not already)

- **App name:** Guardr
- **Default language:** English (United States)
- **App:** App · **Free**
- **Developer:** Signature Security Specialist, LLC

### Main store listing

Upload from `assets/play-store/`:

| Asset | File |
|-------|------|
| Hire app icon (512×512) | `client-icon-512.png` (black field, white logo) |
| Work app icon (512×512) | `guard-icon-512.png` (black field, white logo) |
| Staff app icon (512×512) | `staff-icon-512.png` (white field, black logo) |
| Brand / fallback icon | `icon-512.png` |
| Feature graphic (1024×500) | `feature-graphic-1024x500.png` |

Copy for descriptions: **`docs/play-store-listing-copy.md`**

**You still need:** at least **2 phone screenshots** (capture from emulator or device).

**Contact details:**

| Field | Value |
|-------|--------|
| Website | https://guardr.co |
| Email | your support address (e.g. support@guardr.co) |
| Privacy policy | https://guardr.co/legal/privacy |

---

## Step 5 — Your action: App content (required before publish)

Complete every item under **Policy → App content**:

### Privacy policy

URL: https://guardr.co/legal/privacy

### App access

Guardr requires login. Provide **test credentials** for Google reviewers:

```
Guard account:
  Email: [YOU FILL IN]
  Password: [YOU FILL IN]
  Notes: Open Jobs → browse open offers; Settings shows profile.

Client account:
  Email: [YOU FILL IN]
  Password: [YOU FILL IN]
  Notes: Post a test job request; messaging available after match.

Staff (optional):
  Email: [YOU FILL IN]
  Password: [YOU FILL IN]
```

Include steps: sign in → view jobs/map → open Settings → confirm app loads without crash.

### Ads

Select **No** (unless you add ad SDKs later).

### Content rating

Complete the IARC questionnaire. Expect questions about:

- User-generated content (in-app messaging)
- Location sharing (job check-in, map)
- Payments (Stripe Connect — not Google Play Billing)

Target audience: **18+** (professional workforce marketplace).

### Data safety

Declare data collected/processed (align with https://guardr.co/legal/privacy):

| Data type | Collected | Purpose |
|-----------|-----------|---------|
| Name, email, phone | Yes | Account, job coordination |
| Precise location | Yes | Check-in, job proximity, map |
| Photos | Yes | Self-audits, credentials, ID verification |
| Messages | Yes | Client/guard chat |
| Financial info | Yes (via Stripe) | Payments — processed by Stripe |
| Device IDs | Yes | Push notifications (FCM) |

- Data encrypted in transit: **Yes**
- Users can request deletion: **Yes** (per privacy policy)
- Data shared with third parties: Stripe, Supabase, Firebase (as applicable)

### Financial features

- Marketplace connecting clients and independent contractors
- Payments via **Stripe Connect** (not Google Play Billing)
- Declare payment/financial features; no Play Billing products needed

### Permission declarations

When prompted for sensitive permissions:

| Permission | Justification |
|------------|---------------|
| Location (fine) | Job site check-in, proximity alerts, map |
| Camera | Self-audit photos, ID verification |
| Photos / media | Credential and document uploads |
| Notifications | Job alerts, shift reminders |

---

## Step 6 — Upload and release

1. **Testing → Internal testing** (recommended first)
2. **Create release** → upload that app’s AAB (`Guardr-Client.aab`, `Guardr-Guard.aab`, or `Guardr-Staff.aab`)
3. Release name: e.g. `1.0.122 (222)` matching `versionName` / `versionCode` in `android/app/build.gradle`
4. Add release notes
5. **Save → Review → Start rollout**

Add tester emails under **Testers**. Install via the opt-in link Google provides.

When ready: promote **Internal → Closed → Open → Production**.

**New personal developer accounts** may require **14 days of closed testing** before production — check Console for your account status.

---

## Version bumps (each Play upload)

1. Bump `version` in `package.json`
2. Run `npm run generate:download-version` (updates `build.gradle` versionCode/versionName)
3. `npm run android:play`
4. Upload new AAB with **higher versionCode** (Play rejects duplicates)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `keystore.properties missing` | Copy example file, add real keystore path/passwords |
| `google-services.json missing` | Add Firebase config (Step 2) |
| Play rejects debug APK | Use `npm run android:play` AAB, not sideload APK |
| Upload key lost | Request upload key reset in Play Console; register new cert SHA-256 |
| In-app APK update on Play build | Should not appear — rebuild with `android:play` (sets `VITE_PLAY_STORE_BUILD`) |

---

## Related docs

- Sideload APK: [ANDROID-APK.md](./ANDROID-APK.md)
- Store listing text: [play-store-listing-copy.md](./play-store-listing-copy.md)
- Firebase push: [ANDROID-APK.md](./ANDROID-APK.md#push-setup-apk)
