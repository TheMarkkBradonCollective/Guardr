# /fieldtest — Site-only production field diagnostic + ad screenshots

Type `/fieldtest` to run this entire playbook. Do **not** ask the user to repeat these details.

Run a **100% app-driven** field test against production (or preview). No Supabase REST patches, SQL updates, or status overrides during the test run.

This is a full **head-to-toe** diagnostic **and** advertisement capture:

- Sign in as `staff@guardr.co` to **approve** applicants created on the main site
- **Jane Doe** and **John Doe** self-sign up from the landing page (client + guard flows)
- Each ladder staff role self-applies from the public staff intake form
- Upload **fake credentials** for John and staff-verify them in the UI
- Walk jobs through apply → approve → shift → complete → payments
- Test violations, disputes, reviews, and every staff/client/guard surface
- Check **desktop, tablet, and mobile** (each must load and scroll)
- Save advertisement screenshots (Jane/John Doe only — no `E2E` / `fieldtest` labels in the frame)

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
| `FIELD_TEST_PASSWORD` | `#FieldTest2026` (public self-signup) |

Staff-provisioned Jane/John and ladder staff sign in with `#FieldTest2026` (the password they chose on the public sign-up form).

## What it must do (all through the UI)

### 1. Operator

Sign in as `staff@guardr.co`. Visit every `/staff/*` section. Click filter tabs on violations, disputes, incidents, payments, credentials, support.

### 2. Create accounts on the main site (Jane / John Doe + staff applicants)

From the **public landing page** — not the staff console:

1. **Client sign-up** (`/?auth=sign-up&ar=client`) — Jane Doe, Jane Doe Properties, `jane.doe.<tag>@guardr.test`
2. **Guard sign-up** (`/?auth=sign-up&ar=guard`) — John Doe, `john.doe.<tag>@guardr.test`
3. **Staff application** (`/?auth=sign-up&ar=staff`) — one application per ladder role email: Support, Moderator, Administrator, Manager, Director (`fieldtest.staff.<role>.<tag>@guardr.test`)

Then sign in as **`staff@guardr.co`** and approve every pending application from **Applications** (Jane, John, each staff applicant).

Sign in as each provisioned ladder role to confirm access after approval.

### 3. Fake credentials + activation (John Doe)

1. Sign in as John Doe → `/guard/activation`
2. Upload the fixture `scripts/fixtures/fake-credential.png` for:
   - Government ID (front, back, selfie)
   - Certificate of Insurance
   - BSIS Guard Card
   - PTA / UOF
   - 32-hour Continued Education package
3. Sign in as `staff@guardr.co` → Credentials: verify / approve each item
4. Activate John for marketplace work **in the UI** (Approve / Activate). Do not PATCH `user_status` in the database.

### 4. Job → finish → payments

1. Jane posts a job through the client wizard (Standing Guard / site patrol, Hollywood Blvd)
2. John applies from the marketplace map
3. Jane (or staff) approves the application
4. Attempt Stripe checkout if a Pay CTA exists (record whether Checkout opens — do not fake a live charge)
5. John: en route / clock in / complete job / skip audits if the product allows
6. Staff payments + guard Pay + client invoices
7. Click any **rate / review** CTAs on completed jobs
8. Open **violations** and **disputes** and click every filter tab

### 5. Advertisement screenshots (Jane / John Doe)

Save marketing-quality shots under `ad-screenshots/desktop|tablet|mobile/`.

Names on screen must be Jane Doe / John Doe / Jane Doe Properties. Fail the names check if `E2E` or `fieldtest` is visible in the frame.

Capture at least: landing, marketplace map, client home, client jobs, guard on duty / earnings, staff payments, staff violations, staff disputes.

### 6. Viewports (must all work and scroll)

| Device | Size |
|--------|------|
| Desktop | 1440×900 |
| Tablet | 768×1024 |
| Mobile | 390×844 |

On each: landing, staff overview/jobs/applications/violations/disputes/payments, client home/jobs/payments, guard map/activation/jobs/payments.

Record horizontal overflow, content that cannot scroll, missing headings, `pageerror` / console errors.

## Rules

| Allowed | Forbidden during the test |
|---------|---------------------------|
| `seed-field-test-staff.mjs` **before** the run | Any `patch()` / DELETE / SQL on jobs, payments, or users |
| Playwright clicks, forms, file uploads, navigation | Setting `payment_status`, assignment, or audits in the DB |
| Screenshots + `report.json` | Old `prod-ad-workflow.mjs` DB shortcuts |

If a UI step fails, **record FAIL and continue**. Do not fall back to the database to force the next screen.

## Honest product gates

- **Live Stripe checkout** cannot complete with a fake card on production. Record whether Checkout opens.
- **Full shift → payout** needs John activated (credentials verified in the UI) and a paid job. Attempt every CTA; do not invent settlement in SQL.

## Output

- Diagnostic shots: `/opt/cursor/artifacts/field-test/screenshots/`
- Ad shots: `/opt/cursor/artifacts/field-test/ad-screenshots/{desktop,tablet,mobile}/`
- Report: `/opt/cursor/artifacts/field-test/report.json`

## After the run

1. Pass/fail matrix
2. Emails created this run (Jane, John, each staff role)
3. Design findings per viewport
4. Which ad screenshots are clean Jane/John Doe
5. Any flow that stopped at a real product gate
6. Fix product bugs found in the UI when they are clearly broken — not by writing DB shortcuts

## Branch

`cursor/fieldtest-8a1e`

## Files

- `.cursor/commands/fieldtest.md` — this command
- `scripts/field-test.mjs` — runner (`npm run fieldtest`)
- `scripts/field-test-lib.mjs` — site-only helpers
- `scripts/seed-field-test-staff.mjs` — one-time operator seed
- `scripts/fixtures/fake-credential.png` — fake upload image
