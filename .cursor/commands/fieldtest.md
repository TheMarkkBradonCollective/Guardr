# /fieldtest — Site-only production field diagnostic

Run a **100% app-driven** field test against production (or preview). No Supabase REST patches, SQL updates, or status overrides during the test run.

This is a full **head-to-toe** diagnostic: account creation for every role, staff ops, jobs through finish, payments, violations, disputes, reviews, layout/design, and **desktop + tablet + mobile** (each view must load and be scrollable).

## Setup (once, outside the test)

Seed the field-test operator. **This is the only allowed database write.**

```bash
node scripts/seed-field-test-staff.mjs
```

| Field | Value |
|-------|-------|
| Email | `staff@guardr.co` |
| Password | `#FieldTestStaff2026` |
| Sign-in path | Staff (`/?auth=sign-in&ar=staff`) |
| Display name | Staff (Field Test) |
| Access | Full ops — every staff section, including governance |

The database `staff_role` column only accepts ladder values (`Support` … `Founder`). There is no `"Staff"` enum, so the row is stored as **Founder** (the only value that grants access above every other seat). The account is **not** a human ladder title — it is a QA operator labeled **Staff**.

Do **not** use this account for live operations. Test purposes only.

## Run

```bash
npm run fieldtest
```

Preview / local:

```bash
GUARDR_BASE_URL=http://127.0.0.1:4173 npm run fieldtest
```

| Variable | Default |
|----------|---------|
| `GUARDR_BASE_URL` | `https://www.guardr.co` |
| `GUARDR_FIELD_TEST_OUT` | `/opt/cursor/artifacts/field-test` |
| `FIELD_TEST_STAFF_EMAIL` | `staff@guardr.co` |
| `FIELD_TEST_STAFF_PASSWORD` | `#FieldTestStaff2026` |
| `FIELD_TEST_PASSWORD` | `#FieldTest2026` (self-signup accounts) |

## What it must do (all through the UI)

### Accounts

1. Sign in as `staff@guardr.co`
2. **Client** self-signup (`fieldtest.client.<tag>@guardr.test`)
3. **Guard** self-signup (`fieldtest.guard.<tag>@guardr.test`)
4. **Staff** public application (Support intake)
5. **Staff of each ladder role** via Team → Add staff: Support, Moderator, Administrator, Manager, Director
6. Sign in as each provisioned ladder role (`#Qwerty12345`)
7. Approve pending client / guard / staff applications from Applications

### Staff console (every section)

Overview, map, jobs, locations, applications, credentials, guards, clients, team, messages, support, incidents, **violations**, **disputes**, stats, analytics, payments, payment-settings, agreements, audit-log, cities, permissions, settings, integrations, guide, dev-updates.

Click filter tabs on violations, disputes, incidents, payments, credentials, support.

### Client workflow

Every `/client/*` route. Post a job through the wizard. Open Payments / invoices. Attempt Stripe checkout if the CTA exists. Look for rate/review CTAs on completed jobs.

### Guard workflow

Every `/guard/*` route including activation, availability, vehicle, performance. Marketplace apply. Payments / Connect bank. Clock-in / complete-job CTAs if a live assignment exists.

### Viewports (must all work and scroll)

| Device | Size |
|--------|------|
| Desktop | 1440×900 |
| Tablet | 768×1024 |
| Mobile | 390×844 |

On each viewport: landing, staff overview/jobs/applications/violations/disputes/incidents/payments/team, client home/jobs/payments, guard map/activation/jobs/payments.

Record:

- Horizontal overflow
- Content taller than the viewport that cannot scroll
- Missing headings
- `pageerror` and console errors

## Rules

| Allowed | Forbidden during the test |
|---------|---------------------------|
| `seed-field-test-staff.mjs` **before** the run | Any `patch()` / DELETE / SQL on jobs or users |
| Playwright clicks, forms, navigation, uploads | Setting `payment_status`, assignment, audits in the DB |
| Screenshots + `report.json` | Ad-workflow DB shortcuts |

If a UI step fails, **record FAIL and continue**. Do not fall back to the database to force the next screen.

## Honest limits (still test the UI)

- **Live Stripe checkout** cannot complete with a fake card on production. Record whether Checkout opens.
- **Full shift → payout** needs an activated guard (credentials + ID verified in the UI) and a paid job. Attempt every CTA; do not invent settlement in SQL.
- Provisioned Team staff sign in with `#Qwerty12345`. Self-signup uses `#FieldTest2026`.

## Output

- Screenshots: `/opt/cursor/artifacts/field-test/screenshots/`
- Report: `/opt/cursor/artifacts/field-test/report.json`

## After the run

1. Summarize pass/fail matrix
2. List emails created this run
3. List design findings (overflow, scroll, missing headings, console errors) per viewport
4. Call out any flow that stopped at a real product gate (activation, Stripe, no open job)
5. Fix product bugs found in the UI when they are clearly broken — not by writing DB shortcuts

## Branch

`cursor/fieldtest-8a1e`
