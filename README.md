# Guardr

**Anytime. Anywhere. Security, When You Need It.**

Guardr is an independent contractor marketplace connecting licensed security professionals with clients who need security services. On-demand marketplace — clients post requests, guards browse and accept available work.

**Legal positioning:** Guardr is operated by **Signature Security Specialist, LLC** as a technology platform only. We are not a private patrol operator, security guard employer, or staffing agency. Guards and clients contract directly for each job. See in-app Terms of Service and Privacy Policy at `/legal/terms` and `/legal/privacy`.

## Product Overview

- **Clients** post security requests with site details, schedules, and requirements
- **Guards** browse open job offers, accept jobs, complete self-audits, and submit reports
- **Staff** approve clients, guards, certifications, and job postings
- **Admins** have full platform control

Guardr is **not** an employer, staffing agency, or licensed security services provider. It is a direct-connect marketplace technology platform.

## Design

Built on the [Base Web design system](https://baseweb.design) — see **[docs/design-patterns.md](docs/design-patterns.md)**.

- Monochrome palette: black primary actions on white / `#F6F6F6` surfaces, inverted in dark mode
- Guardr Sans type scale, self-hosted so it renders offline in the PWA and APK
- Purpose-built chrome per surface: desktop workspace on desktop (icon rail, page band, ops tables), labelled sidebar on tablet, tab bar and record cards on phones
- Two themes: Light and Dark, plus PWA Full/Lite and APK Full/Premium experience tiers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth (demo uses local session) |
| Payments | Stripe Connect (platform fee model) |
| Hosting | Vercel |

## Public guide

User-facing overview of Guardr: **[docs/guardr.md](docs/guardr.md)** (what it is, how it works, getting started)

## Stakeholder information package

Head-to-toe company briefing for legal counsel, advisors, investors, and partners: **[docs/company-information-package.md](docs/company-information-package.md)**

| Document | Printable PDF |
|----------|---------------|
| [Executive summary](docs/executive-summary.md) (1 page) | `npm run docs:stakeholder-pdf` → `public/stakeholder/Guardr-Executive-Summary.pdf` |
| [Company package](docs/company-information-package.md) | `Guardr-Company-Information-Package.pdf` |
| [Legal counsel intake form](docs/counsel-intake-form.html) | `Guardr-Counsel-Intake-Form.pdf` |

Manager+ staff: open **Company package** in the staff app to view, download, or print.

User manuals (PDF files): **[/manuals/Guardr-User-Manuals-Combined.pdf](https://www.guardr.co/manuals/Guardr-User-Manuals-Combined.pdf)** — website nav **Manuals**, in-app **Guide / Settings / pending screens → Download PDF manuals**

## Deploy to guardr.co

Full step-by-step: **[docs/DEPLOYMENT-GUARDR-CO.md](docs/DEPLOYMENT-GUARDR-CO.md)** (Vercel + GoDaddy DNS + Supabase + Stripe)

## Run Locally

```bash
npm install
cp .env.example .env.local   # optional: Supabase keys
npm run dev
```

Open [https://guardr.co](https://guardr.co) in production, or `http://localhost:3000` locally.

### Production environment (guardr.co)

Set these in your hosting provider (Vercel, Railway, etc.):

```env
APP_URL=https://guardr.co
VITE_APP_URL=https://guardr.co
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Stripe webhook endpoint:** `https://guardr.co/api/stripe/webhook`

**Supabase auth redirect URLs:** add `https://guardr.co/**` in Supabase → Authentication → URL configuration.

## Job Status Flow

```
Draft → Pending Review → Open → Accepted → In Progress → Completed → Closed
```

## Payments Model

Platform fees are configurable in **Staff → Settings → Platform fees** (Owner/Director). Three models:

| Model | How it works |
|-------|----------------|
| **Flat** | Fixed $/hr (legacy default: $5/hr) |
| **Tiered** | Fee scales with client hourly rate bands |
| **Percent** | % of client rate with min/max caps |

Each job **snapshots** its fee at creation (`platform_fee_per_hour`). Existing jobs are unchanged when you update settings.

Example at $35/hr client rate (flat $5 model):

| Role | Amount |
|------|--------|
| Client rate | $35/hr |
| Guard pay | $30/hr |
| Platform fee | $5/hr |

Duration is auto-calculated from start/end date-time — clients never enter duration manually.

## MVP Features

- Client & guard accounts with staff approval
- Job posting with site name, address, uniform/equipment requirements
- Job marketplace & acceptance
- Pre-job check-in self-audits (appearance, equipment, selfie)
- Job reporting & ratings
- Theme switching
- Mobile-responsive PWA shell
- **Android APK** — [guardr.co/download](https://guardr.co/download) (Capacitor native shell; see [docs/ANDROID-APK.md](docs/ANDROID-APK.md))

## Database Migrations

Supabase schema lives in **`supabase/complete_schema_setup.sql`**. Run that file in the Supabase SQL Editor for fresh installs or to catch up an existing database (idempotent, safe to re-run). It includes all v1.0 platform extensions (auth linking, audit log, availability, invoicing, RLS helpers).

## Platform v1.0 Features

- **Supabase Auth bridge** — PBKDF2 password hashing, auth user linking, server-side migration API (`/api/auth/bridge`)
- **Role-based RLS** — helper functions + policies on new tables (audit log, availability, invoices)
- **Trusted-client auto-publish** — configurable in Staff → Clients → Job posting
- **Audit log** — Staff → Settings (immutable action history)
- **SLA dashboard** — Staff → Analytics (approval time, fill time, no-show rate)
- **Guard availability calendar** — Guard → Settings
- **Client invoicing** — Client → Reports (generate & download)
- **Offline sync** — auto-flush queued field records on reconnect
- **Onboarding tours** — per-role walkthrough on first sign-in
- **Compliance alerts** — credential expiry scanning engine
- **CI/CD** — GitHub Actions (lint, test, build, E2E)
- **Rate limiting** — API middleware (60 req/min, 10/min for auth)
- **Sentry scaffold** — set `VITE_SENTRY_DSN` to enable
- **Capacitor** — Android APK build ready; run `npm run android:apk` (see [docs/ANDROID-APK.md](docs/ANDROID-APK.md))
