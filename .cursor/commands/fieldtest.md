# /fieldtest — Site-only production field diagnostic + ad screenshots

Type `/fieldtest` to run this entire playbook. Do **not** ask the user to repeat these details.

Run a **100% app-driven** field test against production (or preview). **Every action is performed while signed in as that role** — no cross-role shortcuts, no staff-console account creation, no database patches during the run.

## Core rule

| Role | Does what |
|------|-----------|
| **Public visitor** | Landing, legal pages, self-sign-up forms |
| **Jane Doe (client)** | Review profile, tour client workspace, post job, approve guard, pay, review |
| **John Doe (guard)** | Tour guard workspace, upload fake creds, apply on map, shift/payout CTAs |
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

### 2. Public self-sign-up (as themselves)
From the **main page** — not staff console:
- **Jane Doe** — client sign-up (`/?auth=sign-up&ar=client`)
- **John Doe** — guard sign-up (`/?auth=sign-up&ar=guard`)
- **Ladder staff** — staff application per role (`/?auth=sign-up&ar=staff`)

### 3. Staff operator — approve applicants
`staff@guardr.co` signs in → **Applications** → approve Jane, John, each ladder applicant.

### 4. Client Jane — her workflow
Jane signs in → **Review profile** if pending → tour all `/client/*` → **post job** → ad shots.

### 5. Guard John — his workflow
John signs in → tour all `/guard/*` → upload fake creds on `/guard/activation`.

### 6. Staff operator — verify + activate
`staff@guardr.co` → **Credentials** verify John's uploads → **Guards** activate profile.

### 7. Guard John — marketplace + shift
John signs in → apply on map → payments → clock-in/complete CTAs.

### 8. Client Jane — job approval + billing
Jane signs in → **approve guard** on her job → payments → review CTAs.

### 9. Staff operator — full ops tour
`staff@guardr.co` → every `/staff/*` section → violations/disputes/payments tabs → ad shots.

### 10. Each ladder staff — their workspace
Support / Moderator / Administrator / Manager / Director each sign in and tour overview, applications, jobs, support, messages.

### 11. Viewport sweep
Desktop, tablet, mobile — each role signs in on each device and visits key pages.

## Rules

| Allowed | Forbidden during the test |
|---------|---------------------------|
| `seed-field-test-staff.mjs` before the run | SQL / REST patches on jobs, payments, users |
| UI clicks, forms, uploads per role | Staff creating users via Add client/guard/staff |
| Screenshots + `report.json` | Doing client/guard actions while logged in as staff |

If a step fails, **record FAIL and continue**. Do not cheat past the UI.

## Honest product gates

- Live Stripe cannot complete with a fake card — record whether Checkout opens.
- Full payout needs John activated + paid job in the UI.

## Output

- `/opt/cursor/artifacts/field-test/screenshots/`
- `/opt/cursor/artifacts/field-test/ad-screenshots/{desktop,tablet,mobile}/`
- `/opt/cursor/artifacts/field-test/report.json`

## Files

- `scripts/field-test.mjs` — runner (`npm run fieldtest`)
- `scripts/field-test-lib.mjs` — Playwright helpers
- `scripts/seed-field-test-staff.mjs` — operator seed (once)
- `scripts/fixtures/fake-credential.png` — fake upload image
