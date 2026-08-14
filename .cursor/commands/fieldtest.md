# /fieldtest — Site-only production field diagnostic + ad screenshots

Type `/fieldtest` to run this entire playbook. Do **not** ask the user to repeat these details.

Run a **100% app-driven** field test against production (or preview). **Every action is performed while signed in as that role** — no cross-role shortcuts, no staff-console account creation, no database patches during the run.

## Core rule

| Role | Does what |
|------|-----------|
| **Public visitor** | Landing, legal pages, self-sign-up forms |
| **Jane Doe (client)** | Review profile, tour client workspace, post job, **pay** (while open), approve guard, review |
| **John Doe (guard)** | Tour guard workspace, upload fake creds, apply on map, **clock in + complete shift** on map |
| **staff@guardr.co** | Approve applicants, verify credentials, activate guard, ops tour (violations/disputes/payments) |
| **Ladder staff** | Each signs in after approval and tours their staff workspace |

The only pre-seeded account is **`staff@guardr.co`** (setup script). Everyone else registers on the **main landing page**.

## Setup (once, outside the test)

```bash
node scripts/seed-field-test-staff.mjs
```

| Field | Value |
|-------|-------|
| Email | `staff@guardr.co` |
| Password | `#FieldTestStaff2026` |
| Sign-in path | Staff (`/?auth=sign-in&ar=staff`) |
| Display name | Staff (Field Test) |
| Access | Founder-level ops (QA operator only) |

## Run

```bash
npm run fieldtest
```

| Variable | Default |
|----------|---------|
| `GUARDR_BASE_URL` | `https://www.guardr.co` |
| `GUARDR_FIELD_TEST_OUT` | `/opt/cursor/artifacts/field-test` |
| `FIELD_TEST_PASSWORD` | `#FieldTest2026` (Jane, John, ladder staff) |

## Phases (role order)

### 1. Public visitor
Browse landing + legal. Capture hero ad shot.

### 1b. Staff operator — confirm signup market
`staff@guardr.co` → **Cities** → verify **Sacramento** is **Open** for guard/client signups. The runner **does not** open closed cities (e.g. Los Angeles). Staff applications are remote and may use any city.

### 2. Public self-sign-up (as themselves)
From the **main page** — not staff console. Guard and client signups only offer **open** markets (Sacramento when that is the only open city):
- **Jane Doe** — client sign-up (`/?auth=sign-up&ar=client`)
- **John Doe** — guard sign-up (`/?auth=sign-up&ar=guard`)
- **Ladder staff** — staff application per role (`/?auth=sign-up&ar=staff`)

### 3. Staff operator — approve applicants
`staff@guardr.co` signs in → **Applications** → approve Jane, John, each ladder applicant.

### 4. Client Jane — post job
Jane signs in → **Review profile** if pending → tour all `/client/*` → **post job** (shift starts ~90m ago, ends ~8m ahead) → ad shots.

### 4b. Staff operator — approve job listing
`staff@guardr.co` → **Jobs** → set map coordinates if needed → **Approve Job** → status `open`.

### 4c. Client Jane — pay (marketplace gate)
Jane signs in → **Pay with Stripe** while job is still `open`. Marketplace jobs are hidden until paid.

### 5. Guard John — upload credentials
John signs in → tour all `/guard/*` → upload fake creds on `/guard/activation`.

### 6. Staff operator — verify + activate
`staff@guardr.co` → **Credentials** verify John's uploads → **Guards** activate profile.

### 7. Guard John — apply
John signs in → **apply** on `/guard/map` (with geolocation + availability).

### 8. Client Jane — approve guard
Jane signs in → **Approve guard** on her open job.

### 9. Guard John — complete shift
John signs in → `/guard/map` → skip self-audit → clock in → wait for scheduled end → **complete shift** (end-of-shift package).

### 10. Client Jane — review
Jane signs in → **Completed** tab → leave review if available.

### 11. Staff operator — full ops tour
`staff@guardr.co` → every `/staff/*` section → violations/disputes/payments tabs → ad shots.

### 12. Each ladder staff — their workspace
Support / Moderator / Administrator / Manager / Director each sign in and tour overview, applications, jobs, support, messages.

### 13. Viewport sweep
Desktop, tablet, mobile — each role signs in on each device and visits key pages.

## Rules

| Allowed | Forbidden during the test |
|---------|---------------------------|
| `seed-field-test-staff.mjs` before the run | SQL / REST patches on jobs, payments, users |
| UI clicks, forms, uploads per role | Staff creating users via Add client/guard/staff |
| Screenshots + `report.json` | Doing client/guard actions while logged in as staff |

During `/fieldtest`, **fix problems as you find them** — update the runner or patch product bugs — then re-run. Record FAIL and continue only when blocked. Do not cheat past the UI with SQL, and **do not force-open closed service areas** during the run.

Each run **clears `*@guardr.test` accounts before and after** (skip with `FIELDTEST_SKIP_CLEANUP=1`). When finished, **`staff@guardr.co` posts a summary to Staff chat → Team → Staff chat** with pass/fail steps, cleanup counts, and fixes applied.

## Honest product gates

- **Stripe test mode** (`pk_test_…`): runner completes Checkout with card `4242 4242 4242 4242`.
- **Live Stripe** (`pk_live_…`): records that Checkout opened; full card completion requires test keys on staging/preview.
- Shift complete waits up to ~9 minutes for the posted end time (job end is ~8 minutes after post).
- Full guard payout still needs Stripe Connect onboarding in the UI.

## Output

- `/opt/cursor/artifacts/field-test/screenshots/`
- `/opt/cursor/artifacts/field-test/ad-screenshots/{desktop,tablet,mobile}/`
- `/opt/cursor/artifacts/field-test/report.json`
- `/opt/cursor/artifacts/field-test/report.md`
- Staff chat message from `staff@guardr.co` (Team → Staff chat)

## Files

- `scripts/field-test.mjs` — runner (`npm run fieldtest`)
- `scripts/field-test-lib.mjs` — Playwright helpers
- `scripts/seed-field-test-staff.mjs` — operator seed (once)
- `scripts/fixtures/fake-credential.png` — fake upload image
