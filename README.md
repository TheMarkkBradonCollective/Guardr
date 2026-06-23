# Guardr

**Anytime. Anywhere. Security, When You Need It.**

Guardr is an independent contractor marketplace connecting licensed security professionals with clients who need security services. Think Uber for security — clients post requests, guards browse and accept available work.

**Legal positioning:** Guardr is operated by **Signature Security Specialist, LLC** as a technology platform only. We are not a private patrol operator, security guard employer, or staffing agency. Guards and clients contract directly for each job. See in-app Terms of Service and Privacy Policy at `/legal/terms` and `/legal/privacy`.

## Product Overview

- **Clients** post security requests with site details, schedules, and requirements
- **Guards** browse open job offers, accept jobs, complete self-audits, and submit reports
- **Staff** approve clients, guards, certifications, and job postings
- **Admins** have full platform control

Guardr is **not** an employer, staffing agency, or licensed security services provider. It is a direct-connect marketplace technology platform.

## Design

- Uber-inspired, mobile-first UI
- Sage green primary brand color (`#7C9A7A` / `#84a279`)
- Three themes: Dark, Light, Grey
- Large typography, minimal clutter, action-focused flows

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth (demo uses local session) |
| Payments | Stripe Connect (platform fee model) |
| Hosting | Vercel |

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

## Database Migrations

Supabase migrations live in `supabase/migrations/`. For a one-shot catch-up on an existing database, run **`supabase/fix_everything.sql`** in the Supabase SQL Editor (idempotent, safe to re-run).
