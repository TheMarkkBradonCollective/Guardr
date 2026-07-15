# Guardr — guardr.co Platform Reference

**Tagline:** Anytime. Anywhere. Security, When You Need It.

**Live site:** [https://guardr.co](https://guardr.co) (primary canonical domain)  
**Preferred production URL:** [https://www.guardr.co](https://www.guardr.co) — use `www` for Supabase auth, Stripe webhooks, and the Android APK WebView (apex `guardr.co` 307-redirects and can break native POST fetch in the APK shell).

**Current version:** v1.0.48 (web + APK parity)

---

## What Guardr Is

Guardr is an **independent contractor marketplace** connecting **licensed security professionals** with **clients** who need security coverage. Clients post jobs; guards browse open work on a map and apply directly. Think Uber for security.

Guardr is **not** a private patrol operator (PPO), security guard employer, staffing agency, or licensed security services provider. It is a **direct-connect marketplace technology platform**.

| Role | What they do |
|------|----------------|
| **Clients** | Post security requests, pay via Stripe, approve guards, confirm self-audits, review reports |
| **Guards** | Upload credentials, apply for jobs, clock in/out, complete self-audits, file reports, collect pay |
| **Staff** | Approve accounts, verify credentials, review job listings, monitor operations, handle disputes |

---

## Legal & Corporate

| Item | Value |
|------|--------|
| **Operating entity** | Signature Security Specialist, LLC |
| **Product name** | Guardr |
| **Parent brand** | [Signature Security Specialist](https://www.signaturesecurityspecialist.com) |
| **Support email** | support@guardr.co |
| **Platform role** | Technology marketplace only — not a security company |

### Legal documents (in-app)

| Path | Document | Audience |
|------|----------|----------|
| `/legal/terms` | Terms of Service | All users |
| `/legal/privacy` | Privacy Policy | All users |
| `/legal/ica` | Independent Contractor Agreement | Guards |
| `/legal/client-agreement` | Client Service Agreement | Clients |
| `/legal/guard-conduct` | Guard Conduct Policy | Guards |

Legal versions are tracked in `src/lib/legalContent.ts`. Material changes trigger re-acceptance via the in-app legal acceptance modal.

**Short disclaimer:** Guardr is a technology marketplace operated by Signature Security Specialist, LLC. We do not provide security services, employ guards, or act as a private patrol operator or staffing agency.

---

## Public URLs & Routes

| URL | Purpose |
|-----|---------|
| [guardr.co](https://guardr.co) | Homepage / sign-in |
| [guardr.co/guide](https://guardr.co/guide) | Public operating guide (full user manual) |
| [guardr.co/download](https://guardr.co/download) | Android APK install page + PWA instructions |
| [guardr.co/download/guardr.apk](https://guardr.co/download/guardr.apk) | Direct APK download |
| [guardr.co/api/health](https://www.guardr.co/api/health) | Production health check (`{"status":"ok"}`) |
| `/legal/*` | Legal pages (see above) |

Authenticated routes are SPA paths handled by React (clients, guards, staff dashboards). See [guardr-general-guide.md](./guardr-general-guide.md) for role-specific navigation.

---

## Product Surfaces

Guardr ships as **one codebase** across three install surfaces:

| Surface | How to access | Notes |
|---------|---------------|-------|
| **Website** | Any browser at guardr.co | Responsive SPA |
| **PWA** | iOS: Safari → Share → Add to Home Screen; Android/Chrome: Install prompt | Auto-updates with guardr.co; white home-screen branding |
| **Android APK** | [guardr.co/download](https://guardr.co/download) | Capacitor native shell; black branding; loads live site; manual APK updates |

**Android package:** `com.signaturesecurity.guardr`  
**APK build:** `npm run android:apk` — see [ANDROID-APK.md](./ANDROID-APK.md)

---

## Marketplace Model (California-Aligned IC)

- Guards **self-select** jobs — they apply; clients approve or decline.
- Staff placement is for **dispute or safety situations only**.
- Guardr staff **verify guard credentials** for marketplace eligibility — core compliance role.
- Clients and guards **contract directly** for each job.
- Card/Stripe is the primary payment path; payouts auto-release to Stripe Connect ~48 hours after completion unless a dispute holds them.

### Guard activation (five required credentials)

Staff must verify (not auto-approve) before a guard becomes **active**:

1. Government ID (front, back, selfie, state, number, expiration)
2. BSIS Guard Card
3. Certificate of Insurance (COI)
4. Power to Arrest / Appropriate Use of Force (PTA/UOF)
5. 32-hour BSIS course block

Optional: firearms permits, medical certs, FEMA, etc. A **48-hour grace window** may apply for PTA/UOF or 32-hour block at activation.

### Job status lifecycle

```
Draft → Pending Review → Open → Accepted → In Progress → Completed → Closed
```

---

## Staff Hierarchy

| Role | Key responsibilities |
|------|---------------------|
| **Moderator** | Approve client/guard applications; monitor jobs — **cannot** verify credentials or access payments |
| **Administrator** | + Verify credentials, approve job offers, handle disputes, suspend users |
| **Director** | + Payments, financial controls, staff team management (Moderators/Administrators) |
| **Founder** | + Platform governance, payment methods, Director management |

Credential verification and account activation: **Administrator and above only.**

---

## Design & Brand

| Item | Value |
|------|--------|
| **Primary color** | Sage green (`#7C9A7A` / `#84a279`) |
| **Themes** | Dark, Light, Grey (sage accent in all) |
| **UI style** | Uber-inspired, mobile-first, large typography, action-focused |
| **Logo assets** | `public/logo-wordmark.png`, `public/logo.jpg` |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite + Tailwind CSS 4 |
| **Backend / DB** | Supabase (PostgreSQL + Auth) |
| **Payments** | Stripe Connect (platform fee model) |
| **Hosting** | Vercel |
| **Maps** | Leaflet / react-leaflet |
| **Native shell** | Capacitor (Android APK) |
| **Push (web/PWA)** | Web Push (VAPID) |
| **Push (APK)** | Firebase Cloud Messaging (FCM) |
| **CI** | GitHub Actions (lint, test, build, E2E, APK) |
| **Optional** | Sentry (`VITE_SENTRY_DSN`), Twilio SMS, Checkr background checks |

### Repository layout (key paths)

```
src/                    React app (clients, guards, staff)
api/                    Vercel serverless API routes
supabase/               Database schema (complete_schema_setup.sql)
public/                 Static assets, PWA manifest, APK download
android/                Capacitor Android project
docs/                   Documentation (this file, guides, deployment)
```

---

## Payments

### Platform fee models (Staff → Payment settings)

| Model | Description |
|-------|-------------|
| **Flat** | Fixed $/hr (legacy default: $5/hr) |
| **Tiered** | Fee scales with client hourly rate bands |
| **Percent** | % of client rate with min/max caps |

Each job **snapshots** its fee at creation (`platform_fee_per_hour`). Duration is auto-calculated from start/end date-time.

**Example** at $35/hr client rate (flat $5 model): Client $35/hr → Guard $30/hr → Platform $5/hr.

### Stripe integration

| Setting | Production value |
|---------|------------------|
| **Webhook endpoint** | `https://www.guardr.co/api/stripe/webhook` |
| **Webhook events** | `checkout.session.completed`, `payment_intent.succeeded`, `transfer.*` |
| **Connect return URL** | `https://www.guardr.co/?stripe_connect=success` |
| **Connect refresh URL** | `https://www.guardr.co/?stripe_connect=refresh` |
| **Checkout success** | `https://www.guardr.co/?payment=success&...` |

Guards onboard via Stripe Connect from **Pay → Connect bank account**. Platform must complete Stripe Connect profile before live guard onboarding.

---

## API Endpoints

### Health & auth

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Service health check |
| `POST /api/auth/bridge` | Supabase Auth bridge (PBKDF2 password migration) |

### Stripe

| Endpoint | Purpose |
|----------|---------|
| `POST /api/stripe/webhook` | Stripe webhook handler |
| `POST /api/stripe/checkout/create-session` | Job payment checkout |
| `POST /api/stripe/checkout/overtime-charge` | Overtime payment |
| `POST /api/stripe/checkout/schedule-change-charge` | Schedule change charges |
| `POST /api/stripe/checkout/cash-deposit` | Cash deposit flow |
| `POST /api/stripe/connect/create-account` | Create Connect account |
| `POST /api/stripe/connect/account-link` | Connect onboarding link |
| `GET /api/stripe/connect/status/[accountId]` | Connect account status |
| `POST /api/stripe/payout/release` | Manual payout release (dispute hold) |
| `POST /api/stripe/payment/hold` | Payment hold |
| `POST /api/stripe/payment/refund` | Refund |

### Push notifications

| Endpoint | Purpose |
|----------|---------|
| `GET /api/push/vapid-public-key` | VAPID public key for web push |
| `POST /api/push/subscribe` | Subscribe to web push |
| `POST /api/push/unsubscribe` | Unsubscribe |
| `POST /api/push/events` | Push event dispatch |
| `POST /api/push/send` | Send push notification |
| `POST /api/push/test` | Test push delivery |

### Cron (Vercel scheduled)

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/missed-checkins` | Every 5 min | Escalate missed hourly check-ins |
| `/api/cron/pre-shift-briefings` | Every 5 min | Pre-shift briefing notifications |
| `/api/cron/company-placard-expiry` | Daily 14:00 UTC | Company placard / credential expiry alerts |

Cron jobs require `Authorization: Bearer <CRON_SECRET>`.

### Other

| Endpoint | Purpose |
|----------|---------|
| `POST /api/install/register` | APK/PWA install registration |
| `POST /api/messages/staff` | Staff messaging API |
| `POST /api/messages/guards` | Guard messaging API |
| `POST /api/messages/clients` | Client messaging API |

---

## Environment Variables

Production values are set in **Vercel → Settings → Environment Variables**. See `.env.example` for the full list.

### Required (production)

```env
APP_URL=https://www.guardr.co
VITE_APP_URL=https://www.guardr.co

VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # NEVER expose in frontend / VITE_*

STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Push notifications

```env
VITE_VAPID_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support@guardr.co
PUSH_INTERNAL_SECRET=
FCM_SERVICE_ACCOUNT_JSON=           # Android APK native push
CRON_SECRET=                        # Vercel cron auth
```

### Optional

```env
VITE_SENTRY_DSN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
CHECKR_API_KEY=
```

---

## Deployment (guardr.co)

**Hosting:** Vercel  
**Domain registrar:** GoDaddy  
**Database:** Supabase  
**Payments:** Stripe

### DNS (GoDaddy → Vercel)

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

Or use Vercel nameservers for full DNS management.

### Supabase auth URLs

| Field | Value |
|-------|--------|
| **Site URL** | `https://www.guardr.co` |
| **Redirect URLs** | `https://www.guardr.co/**`, `https://guardr.co/**` |

### Database setup

Run `supabase/complete_schema_setup.sql` in Supabase SQL Editor (idempotent, safe to re-run).

### Deploy checklist

- [ ] Schema applied in Supabase
- [ ] Supabase Site URL and redirect URLs configured
- [ ] All env vars in Vercel (especially `VITE_*` for frontend)
- [ ] Redeployed on Vercel
- [ ] `https://www.guardr.co/api/health` returns OK
- [ ] GoDaddy DNS points to Vercel; domain shows valid SSL
- [ ] Stripe webhook URL configured
- [ ] Stripe Connect platform profile completed

Full step-by-step: **[DEPLOYMENT-GUARDR-CO.md](./DEPLOYMENT-GUARDR-CO.md)**

---

## Local Development

```bash
npm install
cp .env.example .env.local   # optional: Supabase keys
npm run dev
```

Open `http://localhost:3000` locally.

```bash
npm run lint      # TypeScript check
npm run test      # Unit tests
npm run test:e2e  # Playwright E2E
npm run build     # Production build
```

---

## Platform Features (v1.0)

- Supabase Auth bridge with PBKDF2 password hashing
- Role-based RLS on audit log, availability, invoices
- Trusted-client auto-publish (Staff → Settings → Approval rules)
- Immutable audit log (Staff → Audit log)
- SLA dashboard (Staff → Analytics)
- Guard availability calendar
- Client invoicing (Client → Reports)
- Offline sync queue for field records
- Onboarding tours per role
- Compliance alerts (credential expiry scanning)
- Rate limiting (60 req/min API, 10/min auth)
- Capacitor Android APK with FCM push
- Web Push (VAPID) for PWA/browser
- System back button support (browser + APK)
- Missed check-in escalation cron
- Pre-shift briefing notifications
- Company placard expiry monitoring

---

## Android APK Summary

| Item | Value |
|------|--------|
| **Install page** | [guardr.co/download](https://guardr.co/download) |
| **Direct APK** | [guardr.co/download/guardr.apk](https://guardr.co/download/guardr.apk) |
| **Package** | `com.signaturesecurity.guardr` |
| **Build command** | `npm run android:apk` |
| **API routing** | `apiUrl()` in `src/lib/siteConfig.ts` routes `/api/*` to `https://www.guardr.co` in native shell |
| **Permissions** | Location, camera, photos, notifications |

Full details: **[ANDROID-APK.md](./ANDROID-APK.md)**

---

## Cross-Platform Strategy

One codebase → Web + PWA + Capacitor native shells. Device form factor detected in `src/lib/platform/device.ts`. Offline field queue in `src/lib/platform/offlineQueue.ts`.

Full details: **[CROSS_PLATFORM.md](./CROSS_PLATFORM.md)**

---

## Related Documentation

| Document | Contents |
|----------|----------|
| [guardr-general-guide.md](./guardr-general-guide.md) | Full operating manual — clients, guards, staff workflows |
| [DEPLOYMENT-GUARDR-CO.md](./DEPLOYMENT-GUARDR-CO.md) | Vercel + GoDaddy + Supabase + Stripe deployment |
| [ANDROID-APK.md](./ANDROID-APK.md) | Android APK build, FCM push, permissions |
| [CROSS_PLATFORM.md](./CROSS_PLATFORM.md) | Web/PWA/native architecture and rollout plan |
| [DEV-UPDATES.md](./DEV-UPDATES.md) | Development changelog / ship log |
| [README.md](../README.md) | Repository overview and quick start |

---

## Support

| Audience | How to get help |
|----------|-----------------|
| **Clients** | In-app **Messages → Contact support** or **File a report** |
| **Guards** | In-app **Messages → Contact support**; **Message client** during active shifts |
| **Staff** | **Messages** support inbox; **Incidents** and **Disputes** for escalations |
| **Email** | support@guardr.co |

---

## Quick Reference Card

```
Domain:       guardr.co / www.guardr.co
Entity:       Signature Security Specialist, LLC
Product:      Guardr — IC security marketplace
Version:      v1.0.48
Stack:        React + Vite + Supabase + Stripe + Vercel
Health:       https://www.guardr.co/api/health
Guide:        https://guardr.co/guide
Download:     https://guardr.co/download
Legal:        https://guardr.co/legal/terms
Support:      support@guardr.co
```
