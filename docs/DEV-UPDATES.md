# Guardr Dev Notes

**Started:** Saturday, June 6, 2026  
**Last updated:** Friday, September 26, 2026  
**Commits so far:** 1,200+  
**Live at:** [guardr.co](https://www.guardr.co) — currently **v1.0.132**

---

This is my running log of what shipped on Guardr. I'm building the on-demand security marketplace for Signature Security — clients post coverage, licensed guards pick up work on the map, staff verify credentials so the platform stays compliant. Most of the heavy lifting is Cursor agents plus my direction; timestamps below come from git when stuff actually landed.

The **Dev activity** heatmap on Staff → Dev notes is parsed from `| Time | What shipped |` tables under dated `## Weekday, Month D, YYYY` headings (and from `**Activity:**` / `### Title (h:mm AM)` lines). Every `/update` must add those Time rows from git commit times, bump **Last updated**, fill Guide gaps for what shipped, and refresh **Quick reference by date**. Changelog-only entries without times do not light up the cloud.

---

## Friday, September 26, 2026 — /update → v1.0.132

| Time | What shipped |
|------|----------------|
| 12:03 AM | Staff control center labels, HR workforce helpers, Finance-desk application role labels |
| 12:16 AM | Staff signup requested-role picker, Founder staff cap editor, SLA approval fix, guard card expiry, `/client/sites`, role-filtered downloads |
| 12:38 AM | Revert browser full Customer/Guard workspace — app-first (PWA/APK); remove team-lead apply wiring |
| 12:40 AM | Merge PR #1058; release v1.0.132-beta, PWA cache bust, download version |

**Shipped**
- **v1.0.132** (build **232**) — open GitHub issue fixes while keeping **Customer/Guard platform use in the app**, not plain browser ops
- Staff **Service Areas** minimum slot editor for Founder; default **6** slots per open city
- **Staff applications** show Finance-desk requested roles correctly; applicants pick intended ladder role at sign-up
- PWA cache: `guardr-cache-v1-0-132-beta`
- CI workflows: `permissions: contents: read`
- **GitHub:** merge PR for issue batch close (#1043, #1046, #1047–#1057); **#1044** stays open for Waves 1–2 (comment text in `docs/github/`)

**Download**
- https://www.guardr.co/download/guardr.apk?v=232

---

## Wednesday, August 19, 2026 — /update → v1.0.131

| Time | What shipped |
|------|----------------|
| 5:27 AM | Rename user-facing client labels to customer / hiring account |
| 5:31 AM | Fix formatReviewCount test for customer review wording |
| 5:43 AM | Merge PR #1001 — customer / hiring-account UI labels |
| 5:44 AM | Release v1.0.130-beta — version bump, PWA cache |
| 5:51 AM | Ship CI-built guardr.apk v1.0.130 (build 230) |
| 6:14 AM | Remove add/create buttons from role sidebars |
| 6:17 AM | Show add buttons on Management and Credentials pages |
| 6:48 AM | Merge PR #1003 — sidebar create cleanup |
| 7:11 AM | Merge PR #1004 — staff platform and auth use Customer labels |
| 7:35 AM | Merge PR #1005 — release v1.0.131-beta, APK via CI, Git LFS for APK |
| 7:45 AM | Complete /update docs — Guide, Dev notes, user manuals |

**Shipped**
- **v1.0.131** (build **231**) — unified **Customer** terminology on staff/auth; sidebar create buttons removed; inline add on Management + Credentials
- PWA service worker cache bust: `guardr-cache-v1-0-131-beta`
- Android CI: sideload APK (`guardr-android-apk` artifact); **AAB skipped** — Play keystore secrets not configured
- **Git LFS** — `*.apk` tracked via LFS (APK exceeds GitHub 100 MB blob limit)
- **Docs** — `guardr-general-guide.md`, user manuals, Dev notes activity cloud

**Download**
- https://www.guardr.co/download/guardr.apk?v=231

---

## Wednesday, August 19, 2026 — /update → v1.0.130

| Time | What shipped |
|------|----------------|
| 5:43 AM | Merge PR #1001 — rename user-facing client labels to customer / hiring account |
| 5:45 AM | Release v1.0.130-beta — APK + AAB via CI |

**Shipped**
- **v1.0.130** (build **230**) — customer / hiring-account UI labels (guards, staff, auth); code identifiers unchanged
- PWA service worker cache bust: `guardr-cache-v1-0-130-beta`
- Android CI: sideload APK + Play AAB artifacts

---

## Tuesday, August 18, 2026 — /update → v1.0.129

| Time | What shipped |
|------|----------------|
| 3:21 PM | Release v1.0.129-beta — full platform update, APK + AAB via CI |
| 3:22 PM | Land v1.0.129 on `main` |

**Shipped**
- **v1.0.129** (build **229**) — web + PWA + sideload APK + Play AAB version alignment
- Packages Aug 18 session: roster category tabs, Management page, client credentials fix, staff activation lock, management Profile ID upload, consolidated SQL catch-up
- PWA service worker cache bust: `guardr-cache-v1-0-129-beta`
- Android CI builds **APK** always; **AAB** when Play keystore secrets are configured

**SQL to run** (if not already applied)
- `supabase/snippets/20260818_full_session_update.sql`

**Release verification**
- Lint, test, build green
- Android Release workflow: `guardr-android-apk` artifact + `guardr-android-aab` when keystore present

---

## Tuesday, August 18, 2026 — /update → v1.0.128

| Time | What shipped |
|------|----------------|
| 3:15 PM | Add consolidated Aug 18 session SQL catch-up snippet |
| 3:18 PM | Release v1.0.128-beta — version bump, PWA cache |
| 3:19 PM | Land v1.0.128 on `main` |

**Shipped**
- **`supabase/snippets/20260818_full_session_update.sql`** — one-shot Supabase script for client_type, authorized_contacts, client credentials, `client_credential_rules`, staff ID bounce, and staff active→approved demotion

**SQL to run**
- `supabase/snippets/20260818_full_session_update.sql` (or individual migrations under `supabase/migrations/202608180*.sql`)

**Release verification**
- Lint, test (**697**), build green

---

## Tuesday, August 18, 2026 — /update → v1.0.127

**PR cleanup (merged to `main`)**
- **#998** — Client credential library editor moved off Credentials Clients tab to Permissions
- **#999** — Staff activation lock, management Profile ID upload, Applications feed cleanup

| Time | What shipped |
|------|----------------|
| 2:10 PM | Fix Android CI: build APK always, AAB when Play keystore secrets exist |
| 2:11 PM | Trigger Android CI when workflow file changes |
| 2:50 PM | Fix client credentials tab showing library editor on top of review list |
| 2:58 PM | Fix staff activation: lock approved hires, exempt management, profile ID upload |
| 3:05 PM | Keep management approved until ID upload from Profile |
| 3:07 PM | Sync staff ID demotion SQL snippet; exempt Owner role with Founder |
| 3:10 PM | Release v1.0.127-beta — version bump, docs, PWA cache |
| 3:11 PM | Land v1.0.127 on `main` |

**Shipped**
- **Credentials → Clients** — review queue only; credential library editor moved to **Permissions** with Save/Discard (no per-keystroke DB writes)
- **Staff activation** — approved-but-not-active operations staff locked to activation screen until **active**
- **Management (Manager+)** — skip activation lock; stay **approved** (inactive) until government ID uploaded from **Profile**; blank management entries removed from Applications
- **Active staff** — upload/re-upload government ID from **Profile**
- **v1.0.127** (build **227**) web + PWA version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-127-beta`

**SQL to run**
- `supabase/migrations/20260818040000_staff_inactive_missing_id.sql`
- Or `supabase/snippets/staff_demote_active_missing_id.sql` in Supabase SQL Editor
- Or re-run `supabase/complete_schema_setup.sql` (idempotent)

**Release verification**
- Lint, test (**697**), build green

---

## Tuesday, August 18, 2026 — /update → v1.0.126

**PR cleanup (merged to `main`)**
- **#997** — Staff roster category tabs, Management page, status sub-filters, job posting settings moved to Permissions

Staff roster pages now use **two filter rows**: category tabs on top (Personal/Business, armed class, or role) and status sub-filters underneath (default **All**). Manager+ executives moved to a separate **Management** page hidden from lower staff.

| Time | What shipped |
|------|----------------|
| 1:39 PM | Remove Roster and Job posting tabs from Clients screen |
| 1:42 PM | Replace roster status filters with type, armed, and role tabs |
| 1:49 PM | Split Manager+ into dedicated Management roster page |
| 1:54 PM | Hide management profiles from staff below Manager rank |
| 1:55 PM | Restore status sub-filters on roster pages with All default |
| 2:00 PM | Release v1.0.126-beta — version bump, PWA cache, APK + AAB release pipeline |
| 2:01 PM | Land v1.0.126 on `main` |

**Shipped**
- **Clients** — Personal / Business tabs; status row: All / Pending / Active / Suspended. Job posting review settings moved to **Permissions → Job posting review**
- **Guards** — Unarmed / Light Armed / Armed tabs; status row: All / Pending / Approved / Active
- **Staff** — Support / Moderator / Administrator role tabs (operations only); status row: All / Pending / Inactive / Active / Suspended
- **Management** (Manager+) — Manager / Director / Founder roster; same status sub-filters; nav and profiles hidden from staff below Manager
- **v1.0.126** (build **226**) web + PWA version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-126-beta`
- **Android release** — `/update` and CI always build **both** sideload APK and Play AAB (`npm run android:release`)

**Release verification**
- Lint, test, build green

---

## Tuesday, August 18, 2026 — /update → v1.0.124

**PR cleanup (merged to `main`)**
- **#976** — One client system with Personal vs Business capabilities (signup, tools, dual fee tables, frozen posted prices, staff ID bounce, client credential library, Guide/Dev notes)

One client system: **Personal** vs **Business** is who hires and pays — not how often they book and not the site type.

| Time | What shipped |
|------|----------------|
| 8:13 AM | Split client signup into Personal and Business accounts |
| 8:20 AM | Treat Personal vs Business as the contracting party (`client_type`) |
| 8:31 AM | Gate client tools by Personal vs Business capabilities |
| 8:36 AM | Let personal clients request, rebook, and schedule recurring coverage |
| 9:13 AM | Separate personal and business platform fees by guard type |
| 9:19 AM | Freeze posted job and contract prices when fee tables change |
| 9:47 AM | Bounce unverified staff IDs and add a client credential library |
| 9:55 AM | Update Guide, Dev notes, manuals, and /update activity-cloud checklist |
| 9:57 AM | Merge #976 onto the v1.0.124 /update branch |
| 9:58 AM | Release v1.0.124-beta — version bump, PWA cache, download notes |
| 10:00 AM | Land v1.0.124 on `main` |
| 10:01 AM | Fix sideload APK signing so CI can build 1.0.124 |
| 10:41 AM | Rename Test all users to **Broadcast** — Director/Founder push + inbox to everyone |

**Shipped**
- **Signup** — three doors: I need security / I want to work → Personal vs Business → licensed guard vs Apply to work at Guardr
- **Capabilities** — both types are repeat clients (request, rebook, recurring). Business-only: multiple sites, staffing, reporting, team contacts, company documents
- **Platform fees** — two schedules (personal / business), each with per-guard-type rates. Live tables apply to **new** jobs only; posted/approved/contracted jobs keep snapshotted `platformFeePerHour` / `guardPay`
- **Staff government ID** — verified-without-photos is bounced to pending upload; active staff missing ID photos are restricted (**Reactivation**) until front + back + selfie are verified. Founder can still open ops to review IDs
- **Client credential library** — always-required government ID (personal) or authorized-representative ID (business); other licenses stay library-only unless Required For is set. Staff **Credentials → Clients** tab + library editor (Manager+). Posting a job blocks until required creds for that client type + job type are verified
- **v1.0.124** (build **224**) web + PWA version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-124-beta`
- **APK CI** — sideload release uses flavor `signingConfig` (debug) instead of writing the read-only `variant.signingConfig` (AGP 8)

**SQL to run**
- `supabase/migrations/20260818010000_client_account_kind.sql`
- `supabase/migrations/20260818020000_client_authorized_contacts.sql`
- `supabase/migrations/20260818030000_client_credentials_staff_id_bounce.sql`
- Or re-run `supabase/complete_schema_setup.sql` (idempotent)

**Docs**
- Guide, Dev notes, user manuals (Quick Start / Client / Guard / Staff), and `/update` always refresh Guide + dates + activity-cloud Time tables

**Release verification**
- Lint, test (**676**), build green

---

## Friday, August 14, 2026 — /update → v1.0.123

| Time | What shipped |
|------|----------------|
| 2:40 AM | Write fieldtest Staff chat reports in plain English |
| 2:50 AM | Let users delete their own chat messages; higher staff can delete others |
| 2:52 AM | Post a Staff chat heads-up before fieldtest runs |
| 2:55 AM | Release v1.0.123-beta: fieldtest chat, message delete, Google Play prep |
| 2:58 AM | Use Google Chrome for fieldtest Playwright runs |
| 3:15 AM | Sweep fieldtest certifications during test data cleanup |
| 3:17 AM | Default staff list filters to All tab on each page |

**PR cleanup (merged to `main`)**
- **#953** — Separate printable user manuals; combined PDF merges standalone files
- **#965** — Google Play release pipeline and store prep
- **#971** — Field-test staff account branded as Guardr (not Founder) in Staff chat
- **#972** — Users can delete own chat messages; higher staff can delete others in group chats
- **#973** — Fieldtest posts Staff chat heads-up before each run starts

**Shipped**
- **Fieldtest automation** — pre/post cleanup, plain-English Staff chat report before and after each run, Sacramento-only signup market
- **Staff chat** — field-test operator posts as **Guardr** (Director-level ops, not Founder tag)
- **Chat delete** — trash icon on your own messages; higher-ranked staff can remove lower staff/guard/client posts in group channels (not support)
- **Google Play prep** — `build:play`, readiness checks, store assets and docs (`docs/GOOGLE-PLAY.md`)
- **v1.0.123** (build **223**) web + PWA version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-123-beta`

**Release verification**
- Lint, test (613), build green

---

## Tuesday, August 11, 2026 — /update → v1.0.122

Same-day activity on `main` (field-test fixes, ICN rename, and the user-manuals release). Time rows cloud the heatmap for this Tuesday.

| Time | What shipped |
|------|----------------|
| 12:06 AM | Fix marketplace apply and guard activation blockers |
| 2:31 AM | Remove cash payment and cash pickup flows (Stripe-only) |
| 2:32 AM | Show closed disputes; fix mobile staff layout overflow |
| 2:34 AM | Fix Violations resolve actions for open audit flags |
| 2:40 AM | Rename guard Badge GR- to Independent Contractor Number ICN- |
| 3:42 AM | Fix client approve and late shift clock-in for field test |
| 3:56 AM | Chain end-shift package after late clock-out |
| 6:05 AM | Jane/John Doe ad workflow through payments |
| 6:35 AM | Harden mobile ad screenshots |
| 8:28 AM | Fix GuardInsurancePolicy pendingUpdate TypeScript error |

**PR cleanup (merged to `main`)**
- **#953** — Separate printable user manuals; combined PDF merges standalone files

**Shipped**
- **Standalone printable PDFs** — each role manual (Quick Start, Client, Guard, Staff) is a complete printable document with cover and document control
- **Combined binder** — `Guardr-User-Manuals-Combined.pdf` merges the four standalone PDFs in order (plus binder cover) so content always matches
- **`npm run docs:manuals-pdf`** — uses `pdf-lib` merge; regenerated all manual PDFs
- Download UI copy updated (Guide, Settings, embedded)
- **v1.0.122** (build **222**) web + PWA + APK version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-122-beta`

**Release verification**
- Lint, test, build green

---

## Tuesday, August 11, 2026 — /update → v1.0.121

**PR cleanup (merged to `main`)**
- **#951** — Raise staff revenue-share to 50% of platform fees

**Shipped**
- **Staff compensation** — default revenue-share raised from ~18% to **~50%** of collected platform fees
- Role ladder: Support 4%, Moderator 6%, Administrator 7%, Manager 10%, Director 11.1%, Founder 11.9%
- Period caps bumped; migration rewrites stock configs only (custom Payment-settings edits left alone)
- Guide updated for the 50% pool + editable role percents
- **v1.0.121** (build **221**) web + PWA + APK version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-121-beta`

**SQL to run**
- `supabase/migrations/20260811020000_staff_comp_50_percent.sql`

**Release verification**
- Lint, test, build green

---

## Tuesday, August 11, 2026 — /update → v1.0.120

**Shipped**
- **User manuals expanded** — full pay/payout sections for guards (contractor earnings, Stripe, release stages), clients (costs, platform fee model, overtime/tips), and staff (revenue share, Prop 22 hourly add-ons, timesheets, governance limits)
- **Legal positioning** — each manual states role clearly: guards/clients = independent contractors / direct engagement; staff = Guardr employees
- Restored `docs/user-manuals/*.md` sources + `npm run docs:manuals-pdf` build pipeline
- Regenerated all PDFs in `public/manuals/`
- **v1.0.120** (build **220**) web + PWA + APK version alignment

**Release verification**
- Lint, test, build green
- No open PRs after merge

---

## Tuesday, August 11, 2026 — /update → v1.0.119

**PR cleanup (merged to `main`)**
- **#948** — Rename all files containing `uber` in their names

**Shipped**
- **File renames** — 26 files: `uber-*.css` → `gr-*.css`, `landing/uber/` → `landing/mobility/`, `UberDataTable` → `GuardrDataTable`, `DirectTopHeader`, etc.
- Removed redundant `uberBaseTheme.ts`; tests use `guardrBaseTheme.ts` directly
- **v1.0.119** (build **219**) web + PWA + APK version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-119-beta`

**Release verification**
- Lint, test (582), build green
- No open PRs after merge

---

## Tuesday, August 11, 2026 — rename uber filenames

**Shipped**
- Renamed 26 source files that contained `uber` in the filename (CSS `gr-*`, mobility landing, `GuardrDataTable`, `DirectTopHeader`, etc.)
- Removed redundant `uberBaseTheme.ts` shim; tests use `guardrBaseTheme.ts` directly
- Updated imports/exports across the codebase; CSS class tokens (`.uber-*`) unchanged

---

## Tuesday, August 11, 2026 — /update → v1.0.118

**Shipped**
- **Docs & comments** — removed all third-party brand mentions from README, dev docs, and code comments; code identifiers unchanged (`uber-*` CSS, component names, file paths)
- Renamed `docs/uber-patterns.md` → `docs/design-patterns.md`; cursor commands `/design` and `/platforms`
- **v1.0.118** (build **218**) web + PWA + APK version alignment

**Release verification**
- Lint, test (588), build green
- No open PRs after merge

---

## Tuesday, August 11, 2026 — /update → v1.0.117

**PR cleanup (merged to `main`)**
- **#945** — Homepage **Download** and **Manuals** links in nav and footer

**Shipped**
- **Homepage nav** — **Download** → `/download` (APK + PWA install) and **Manuals** → combined PDF on desktop, mobile, and tablet landing
- **Footers** — same links on desktop, mobile, and shared landing footer
- **v1.0.117** (build **217**) web + PWA + APK version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-117-beta`

**Release verification**
- `npm run lint`, `npm test`, and `npm run build` pass
- Version parity: `package.json`, `version.json`, `build.gradle` (code **217**), and `public/sw.js` aligned on **1.0.117-beta**
- No new Supabase migrations

**APK note:** Binary refreshed via Android APK workflow (FCM-enabled). Download: [guardr.co/download](https://www.guardr.co/download)

---

## Tuesday, August 11, 2026 — /update → v1.0.116

**PR cleanup (merged to `main`)**
- **#943** — Print-ready PDF user manuals + website/app downloads

**Shipped**
- **PDF user manuals** — Quick Start, Client, Guard, Staff Ops, and combined binder as real `.pdf` files under `/manuals/`
- **Website access** — landing **Manuals** nav/footer; `/manuals` redirects to the combined PDF
- **In-app access** — **Guide → Download PDF manuals**, **Settings → User manuals**, and pending activation screens (client/guard/staff)
- **APK/PWA** — PDF links resolve via `apiUrl()` to `www.guardr.co` so native WebView can open downloads
- **v1.0.116** (build **216**) web + PWA + APK version alignment
- PWA service worker cache bust: `guardr-cache-v1-0-116-beta`

**Release verification**
- `npm run lint`, `npm test`, and `npm run build` pass
- Version parity: `package.json`, `version.json`, `build.gradle` (code **216**), and `public/sw.js` aligned on **1.0.116-beta**
- No new Supabase migrations in this release (staff onboarding SQL from v1.0.115 still applies if not run)

**Supabase:** if not already applied from v1.0.115, run in order:
1. `supabase/migrations/20260811000000_payments_timesheet_staff_comp.sql`
2. `supabase/migrations/20260811010000_staff_onboarding.sql`
3. `supabase/migrations/20260811004500_drop_guard_shift_time_adjustment.sql`

**APK note:** Binary refreshed via Android APK workflow (FCM-enabled). Download: [guardr.co/download](https://www.guardr.co/download)

---

## Tuesday, August 11, 2026 — /update → v1.0.115

**PR cleanup (merged to `main`)**
- **#936** — Staff pay on **Payments** (Prop 22 hourly add-ons, weekly period rows including $0)
- **#937** — Remove guard shift time adjustment (contractors use clock audit only)
- **#938** — Staff onboarding: application intake, government ID, Stripe Connect payouts
- **#939** — Signup clarity: **Work at Guardr** (staff hiring) vs marketplace guard/client signup
- **#934** — Closed (promo marketing; not shipping)

**Shipped**
- **Staff compensation** — Directors confirm weekly revenue-share payouts on **Payments**; Prop 22 hourly add-ons and manual bonuses (add-only); $0 period rows allowed
- **Staff time tracking** — clock in/out on **Profile → Timesheets** (employees), not on Payments
- **Staff onboarding** — pending staff can sign in; upload gov ID (front/back/selfie); connect Stripe for payouts; `pending → approved → active` when Director approves and checklist complete
- **Staff signup** — homepage and auth flows separate **Work at Guardr** (staff jobs) from guard/client marketplace signup
- **Guard timesheet** — **Profile → Timesheet** tab is read-only shift clock history from job audit (no staff overrides)
- **v1.0.115** (build **215**) web + PWA manifest aligned; APK rebuild via CI on merge
- PWA service worker cache bust: `guardr-cache-v1-0-115-beta`

**Release verification**
- `npm run lint`, `npm test`, and `npm run build` pass
- Version parity: `package.json`, `version.json`, `build.gradle` (code **215**), and `public/sw.js` aligned on **1.0.115-beta**
- Schema: staff onboarding columns + staff compensation tables in `complete_schema_setup.sql`; guard `shift_time_adjustment` removed

**Supabase:** run in order if not already applied:
1. `supabase/migrations/20260811000000_payments_timesheet_staff_comp.sql` — staff comp + time entries
2. `supabase/migrations/20260811010000_staff_onboarding.sql` — staff ID + Stripe columns
3. `supabase/migrations/20260811004500_drop_guard_shift_time_adjustment.sql` — drop guard shift override column (run even if you accidentally ADDed it earlier)

**APK note:** Binary refreshed via Android APK workflow on `main` push (FCM-enabled). Download: [guardr.co/download](https://www.guardr.co/download)

**Known follow-ups (not in this release):** `staff_pending_approval` push type, staff gov ID in main Credentials queue, staff application revision flow, stale AuthPage copy for pending staff.

---

## Friday, August 7, 2026 — /update → v1.0.114

**Shipped**
- **Unified Payments** — guards, staff, and clients all use a **Payments** page with consistent nav and routes (`/guard/payments`, `/staff/payments`, `/client/payments`); legacy `/pay` and `/billing` aliases still work
- **Guard timesheet tab** — guard profiles include a **Timesheet** tab with shift clock-in/out history and worked hours (read-only from clock audit)
- **Support chat delete** — staff can delete resolved support threads (PR #924)
- **v1.0.114** (build **214**) web + PWA manifest aligned; APK rebuild via CI on merge
- PWA service worker cache bust: `guardr-cache-v1-0-114-beta`

**Release verification**
- `npm run lint`, `npm test`, and `npm run build` pass
- Version parity: `package.json`, `version.json`, `build.gradle` (code **214**), and `public/sw.js` aligned on **1.0.114-beta**

**Note (superseded in v1.0.115):** An early draft mentioned `shift_time_adjustment` on `security_requests`. That column was **never shipped to production intent** — PR #937 removed it. Do **not** ADD it; run the DROP migration instead.

**APK note:** Binary refreshed via Android APK workflow on `main` push (FCM-enabled).

---

## Friday, July 31, 2026 — /update → v1.0.102

**Shipped**
- **Map-first mobile** — guard, client, and staff map tabs are full-bleed on phone/PWA/APK; the browse list no longer stacks under the map (desktop keeps the side inspector)
- **PWA auto-update** — service worker checks on load and when the tab returns; new builds activate and reload automatically
- **Loading screen** — app version (`beta v1.0.102`) shown on the boot splash for web, PWA, and APK
- **UI fit** — map canvas uses absolute inset layout on all roles; FAB/offer cards no longer offset for a hidden browse dock
- **v1.0.102** (build **202**) web + PWA + APK manifest aligned; APK binary rebuild via CI
- PWA service worker cache bust: `guardr-cache-v1-0-102-beta`
- `/update` slash command documented in `.cursor/commands/update.md`

**Release verification**
- `npm run lint`, `npm test` (479), and `npm run build` pass
- Version parity: `package.json`, `version.json`, `build.gradle` (code **202**), and `public/sw.js` aligned on **1.0.102-beta**
- Schema: `complete_schema_setup.sql` current (inventory columns from v1.0.101 — no new migration)
- Fixed date-sensitive unit tests for map pin / Jobs history buckets
- Guide updated to **v1.0.102** / build **202**

**APK note:** Binary refreshed in-repo at build **202** (PR #873). FCM-enabled; `apk:audit` clean.

**Supabase:** no new SQL for this release if v1.0.101 inventory columns are already applied.

---

## Tuesday, July 28, 2026 — /updateit → v1.0.101

**PR cleanup**
- Merged **#864** (grey credential rows, black section headers, divider lines)
- Merged **#865** (PTA/UOF section header → **BSIS Mandatory**)
- Merged **#866** (**Continuing Education** renamed to **Continued Education**)
- Merged **#867** (separate **Inventory** tab — equipment + uniform profiles)

**Shipped**
- **Credentials** tab polish — cert row titles grey; section headers solid black; divider lines between rows
- **BSIS Mandatory** section label for PTA/UOF (was long weapon title)
- **Continued Education** label for the 32-hour CE package (Guardr product copy; BSIS official wording unchanged in explanatory text)
- **Inventory** tab on guard profile (guards edit) and staff guard detail (`?gtab=inventory`) — separate from credentials
- **Equipment inventory** — type, brand, model, condition, quantity, notes, primary + additional photos; certified gear (OC, baton, ECD, firearm) only lists when credentials verified
- **Uniform inventory** — corporate, tactical, polo, executive protection, hi-vis, event staff, business casual, custom — full description + preview photo for client assignment requests
- Free gear (body cam, flashlight, handcuffs, duty belt, radio, IFAK, etc.) available without weapon permits; cred-gated items unlock from **Credentials** tab first
- **v1.0.101** (build **201**) web + PWA + APK
- PWA service worker cache bust: `guardr-cache-v1-0-101-beta`

**Release verification**
- `npm run lint`, `npm test` (477), and `npm run build` pass on `main`
- Version parity: `package.json`, `version.json`, `build.gradle` (code **201**), and `public/sw.js` aligned on **1.0.101-beta**

**Supabase:** run new columns on `guards` if not already applied:
```sql
ALTER TABLE guards ADD COLUMN IF NOT EXISTS inventory_equipment JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS inventory_uniforms JSONB DEFAULT '[]'::jsonb;
```

---

## Tuesday, July 28, 2026 — /update → v1.0.100

**PR cleanup**
- Merged **#836** (active guards no longer bounced to activation screen)
- Merged **#845** (release integration)
- Merged **#846** (weapon sections above Other BSIS Training)
- Merged **#847** (staff account controls on Credentials tab)
- Merged **#849** (ship v1.0.100 FCM APK matching web/PWA)
- Merged **#850** (guard deactivate, block, and restore account controls)
- Merged **#851** (sticky Save/Cancel while editing profile)
- Merged **#852** (staff cannot edit guard credentials)
- Merged **#853** (hide account/admin buttons while editing profile)
- Merged **#854** (fold post-release fixes into v1.0.100 release notes)
- Merged **#855** (Save/Cancel pinned to top of profile edit form)
- Merged **#856** (remove revoke application for approved guards)
- Merged **#857** (CI typecheck fix + final v1.0.100 release notes)
- **#838–#844** already on `main` (credentials catalog, gear, per-weapon sections)

**Shipped**
- **Credentials tab** on guard profiles (renamed from Certs) — full credential catalog for self-service upload and staff verify
- **Gear & carry status** moved to Credentials tab; duty gear (flashlight, handcuffs, equipment) in **Guard gear** section
- **Per-weapon credential sections** (OC spray, baton, TASER, firearm) — weapon permits/training only, no duplicate guard card; weapons render above **Other BSIS Training**
- BSIS activation alignment: separate PTA/UOF uploads, full 32-hour CE package (9 courses), site-wide BSIS requirements reference
- Active guards gated on **account status** (`user_status: active`) — no more redirect to **Application under review** when credentials are still hydrating or on grace period
- Staff **account access** on guard detail (Profile, Credentials, Guard status): **Deactivate**, **Block**, and **Restore access**; deny pending applications from **Applications** only
- Removed misplaced **Reject application** from Government ID review (approve/resubmit only)
- Staff **cannot edit** guard credentials — review, verify, reject, and request updates only; guards upload and resubmit
- **Edit profile** — Save/Cancel pinned at top while editing; account access and admin actions hidden until save or cancel
- Removed staff **Add credential** and **Edit credentials** flows; removed **Revoke application** for approved guards (use Deactivate/Block instead)
- **v1.0.100** (build **200**) web + PWA + APK; FCM-enabled binary at [guardr.co/download](https://www.guardr.co/download/guardr.apk?v=200)
- PWA service worker cache bust: `guardr-cache-v1-0-100-beta`

**Release verification**
- `npm run lint`, `npm test` (474), and `npm run build` pass on `main`
- CI **build-and-test** and **Android APK** green after **#857**
- Version parity: `package.json`, `version.json`, `build.gradle` (code **200**), and `public/sw.js` aligned on **1.0.100-beta**
- APK binary refreshed from CI artifact (post-**#857** `main` build)

**Supabase:** no new SQL.

---

## Monday, July 27, 2026 — /updateit → v1.0.99

**PR cleanup**
- Merged **#834** (Rejected credentials tab, thumbnail fix, Edit/resubmit flow)
- Merged **#833** (activation support chat for approved guards + backfill)

**Shipped**
- Staff **Credentials** page: new **Rejected** tab with count badge
- Credential list thumbnails no longer show government ID photos on unrelated pending-upload rows
- Guards resubmit clearer photos via **Edit** (not Add) when staff reject a credential — avoids duplicate-number errors
- Approved guards on activation screen get **Contact support** and an **Activation help** support thread (auto-created on approval + backfill)
- **v1.0.99** (build **199**) web + PWA; APK CI rebuild on push to `main`
- PWA service worker cache bust: `guardr-cache-v1-0-99-beta`

**Supabase:** no new SQL.

---

## Sunday, July 26, 2026 — /update → v1.0.98

**PR cleanup**
- Merged **#831** (staff add credential on desktop and mobile)

**Shipped**
- Staff **Credentials** page: **Add credential** works on desktop (sidebar CTA) and mobile (inline toolbar button)
- Staff wizard to add guard credentials on behalf of a guard (saved as verified)
- **v1.0.98** (build **198**) web + PWA; APK CI rebuild on push to `main`
- PWA service worker cache bust: `guardr-cache-v1-0-98-beta`

**Supabase:** no new SQL.

---

## Sunday, July 26, 2026 — /update → v1.0.97

**PR cleanup**
- No open PRs at start; #825–#829 already merged to `main`

**Shipped**
- Staff list pages: stacked toolbar layout (search + filters) aligned with Applications
- Removed redundant separate **All** filter rows on list pages
- Back/edit button bar scrolls with page content (no sticky overlap)
- **Edit profile** moved into account controls sections; black/white button styling restored
- **v1.0.97** (build **197**) web + PWA; APK CI rebuild on push to `main`
- PWA service worker cache bust: `guardr-cache-v1-0-97-beta`

**Supabase:** no new SQL.

---

## Friday, July 24, 2026 — /merge + /update → v1.0.96

**PR cleanup**
- Merged **#822** (slash command rename) via **#823**
- Closed **#822** — landed on main

**Shipped**
- All `*it` slash commands renamed (`/merge`, `/update`, `/fix`, `/theme`, etc.) + command index
- Guard map test fixtures use future dates (no-show logic no longer flakes on calendar day)
- **v1.0.96** (build **196**) web + PWA; APK CI rebuild on push to `main`
- PWA service worker cache bust: `guardr-cache-v1-0-96-beta`

**Supabase:** no new SQL.

---

## Wednesday, July 22, 2026 — Guard UI cards harden → v1.0.95

**Why**
- Preferences toggle still overlapped titles / crushed descriptions (Base UI label)
- App screens used grey `#f6f6f6` canvas; Availability/Performance still looked flat or inconsistently boxed
- `uber-in-app.css` (loads last) was flattening clickable lists back to divider rows

**Shipped**
- White canvas for app screens; clickable lists as bordered white cards (factors, prefs, availability days, jobs, item stacks)
- Icon-only switch for preference cards (no duplicate aria label text)
- Preference description full-width under the title row
- **v1.0.95** (build **195**) web + PWA + APK

**Supabase:** no new SQL.

---

## Wednesday, July 22, 2026 — /mergeit + /updateit → v1.0.94

**PR cleanup**
- Merged #813 (client & guard staff look/feel parity)

**What this release packages**
- Client + guard Jobs/Crew/Performance/Support use staff-style underline filter tabs
- Flat canvas (no grey boxed empty states / surface panels) under `.uber-app-shell`
- Refresh stays on the same jobs tab/selection via URL (`jt`/`cj`, `bt`/`gj`)
- System + in-app back parity for client/guard detail stacks (matches staff)
- Flattened invoice, locations, and directory detail chrome

**Release:** **v1.0.94** (build **194**) — web + PWA cache (`guardr-cache-v1-0-94-beta`) + CI FCM APK

**Supabase:** no new SQL.

---

## Wednesday, July 22, 2026 — /mergeit + /updateit → v1.0.93

**PR cleanup**
- No open PRs at start of this release; #807–#811 already on `main`

**What this release packages**
- Website desktop: no slide-up sheets / swipe confirms (kept on mobile, PWA, APK)
- Locations ops Add CTA matches Jobs/Guards sidebar pattern
- Locations tabs: **All / Active / Rejected / Archived** (Pending queue removed)
- Locations enter catalog on staff job approval; reject blocks address reuse; private/unlist for clients
- Black + white app icons (red **Lite** tag on PWA only; APK clean)
- APK Full Version binary rebuilt to match web/PWA

**Release:** **v1.0.93** (build **193**) — web + PWA cache (`guardr-cache-v1-0-93-beta`) + CI FCM APK

**Supabase:** ensure `listed BOOLEAN NOT NULL DEFAULT true` on `job_locations` and `client_locations` (from #809). Run `complete_schema_setup.sql` / `ALTER … ADD COLUMN IF NOT EXISTS` if missing.

---

## Wednesday, July 22, 2026 — Ship APK with locations workflow → v1.0.92

**Why**
- Locations tabs/workflow (All / Active / Rejected / Archived + private listing) shipped on web/PWA first
- Capacitor APK embeds a static web build, so it needed a new binary to match

**Shipped**
- **v1.0.92** (build **192**) — web + PWA cache (`guardr-cache-v1-0-92-beta`) + FCM APK with locations QC parity

**Supabase:** `listed` column on `job_locations` / `client_locations` (from #809 schema). Run `complete_schema_setup.sql` if missing.

---

## Wednesday, July 22, 2026 — /mergeit + /updateit → v1.0.91

**Downloads page (brand match)**
- Restyled [guardr.co/download](https://www.guardr.co/download) from sage-on-black cards to Guardr-style black/white Guardr chrome (sticky black nav, flat panels, black CTAs)
- In-app install screen CTAs/highlights no longer use emerald leftovers — black primary to match landing

**Icons / permissions / chrome (already on main, CI fixed)**
- Black + white app icons; red Lite tag on PWA only
- Sidebar brand height matched to main header
- Opaque toasts + expanded staff permissions catalog
- CI Support defaults unit test fixed (#805)

**PR cleanup**
- No open PRs at start of this release; #805 already merged

**Release:** **v1.0.91** (build **191**) — web + PWA cache (`guardr-cache-v1-0-91-beta`) + CI FCM APK

**Supabase:** no new SQL.

---

## Wednesday, July 22, 2026 — /mergeit + /updateit → v1.0.90

**Auth navigation**
- Sign-in/sign-up **Back** returns to role picker (not home)
- Android/browser system back follows auth trail: home → role picker → sign-in form
- Refresh keeps the same auth screen via URL state
- Sign-in/sign-up forms match Guardr-style role picker layout

**Staff management / insights**
- Management, platform, and insight pages use flat ops canvas (no grey card boxes in dark mode)
- Inbox underline tabs (`StaffListFilterTabs`) on Stats, Violations, Disputes, Permissions, Clients, Payments, Agreements, Analytics, Guide, and related panels
- Stats Guards sort uses scrollable tabs; Analytics unified under SLA vs Platform tabs

**PR cleanup**
- Merged #794 (auth back + role picker styling) and #795 (management flat ops + tabs)

**Release:** **v1.0.90** (build **190**) — web + PWA cache (`guardr-cache-v1-0-90-beta`) + CI FCM APK

**Supabase:** no new SQL.

---

## Wednesday, July 22, 2026 — /updateit → v1.0.89

**Install / update UX**
- Redesigned in-app install screen with product cards, feature rows, and two-line CTAs
- Surface-specific copy: browser shows lite + full; PWA focuses on APK upgrade; native is update-only
- Shorter context pill and fixed truncated download button text

**Release:** **v1.0.89** (build **189**) — web + PWA cache (`guardr-cache-v1-0-89`) + CI FCM APK

**Supabase:** no new SQL.

---

## Tuesday, July 21, 2026 (night) — APK parity with PWA → v1.0.88

**Why**
- PWA was ahead of the sideloaded APK after portrait lock, full-page auth, and update-screen fixes landed on `main`
- Capacitor APK embeds a static web build, so it needs a new binary (not just `version.json`) to match

**Shipped**
- **v1.0.88** (build **188**) — web + PWA cache (`guardr-cache-v1-0-88`) + FCM APK with current `main` (portrait lock, PWA/APK detection, full-page sign-in)

**Supabase:** no new SQL.

---

## Tuesday, July 21, 2026 (late) — /mergeit + /updateit → v1.0.87

**Install / update UX**
- In-app **Install options** screen (no URL) from account menu → green **Download** / **APK (Full Version)** / **Update** by surface
- **Appearance** toggle moved into account menu header with name and title
- **Settings → App update** with one-tap APK install on native (Capacitor `GuardrApkInstaller` plugin)
- Surface-specific labels: website shows **PWA (Lite Version)** + **APK (Full Version)**; PWA shows full APK upgrade only; native APK is update-only

**Staff credentials**
- Credential edit rules and application submission snapshot (merged #783)

**PR cleanup**
- No open PRs at start of cycle; merged #784–#785 earlier today

**Release:** **v1.0.87** (build **187**) — web + PWA cache bust (`guardr-cache-v1-0-87`) + CI FCM APK

**Supabase:** no new SQL this release (schema current in `complete_schema_setup.sql`).

---

## Tuesday, July 21, 2026 — /updateit → v1.0.86

**Auth paths**
- Role picker includes **Staff** for log in / sign up; staff sign-up creates pending Support awaiting Director
- Removed Sign in / Sign up segmented toggle — mode comes from the role picker
- Sign-in enforces path matching (guard ≠ staff ≠ client) with clear redirect copy
- Role choice screen shows **Back to Home** on installed app

**Staff product**
- Cities / markets page renamed **Service Areas** (Operations nav group kept)
- New **Locations** tab for shared job-site QC — reusable across jobs/clients when the address matches
- Solid brand black/white surfaces on staff list pages (no grey tab/search/inbox washes)
- Welcome splash: Sign in / Sign up spacing; Guardr Direct restyle earlier in the day

**Staff roles / permissions**
- New **Support** role under Moderator
- Permissions role tabs use Ops-style segmented control; **Job posting** under **Clients**

**PR cleanup**
- No open PRs remaining (merged #766–#777 in this cycle)

**Release:** **v1.0.86** (build **186**) — web + PWA cache bust (`guardr-cache-v1-0-86`) + CI FCM APK

**Test coverage:** 455 unit tests, lint and production build clean.

**Supabase:** run if missing on production:

```sql
CREATE TABLE IF NOT EXISTS job_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'archived')),
  site_instructions TEXT,
  parking_instructions TEXT,
  access_instructions TEXT,
  place_key TEXT NOT NULL,
  created_by_client_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_job_locations_place_key ON job_locations(place_key);
CREATE INDEX IF NOT EXISTS idx_job_locations_status ON job_locations(status);
ALTER TABLE client_locations ADD COLUMN IF NOT EXISTS shared_location_id TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS job_location_id TEXT;
```

Also already reflected in `supabase/complete_schema_setup.sql`. Realtime publication includes `job_locations`.

---

## Monday, July 20, 2026 (evening) — /mergeit + /updateit → v1.0.85

**En route → on-site → start job (#732)**
- Persist **`arrived_at`** separately from clock-in / self-audit
- Arrival no longer blocked by the 15-minute start window (GPS only)
- Skip self-audit requires current on-site GPS; late path restored after briefing
- Live location shared with the client from en route / arrived / on job
- Active job uses **job** language (not clock-in / shift) in the trip UI

**Map & Next Job**
- Empty map dock shows **Next Job** with live countdown inside 24h; tap → briefing + slide to start heading
- Full-screen Guardr-style active job from en route through complete
- Map browse: guards see available + claimed + flashing direct requests; clients see own upcoming; staff sees site-wide active/upcoming; past/canceled/missed stay on **Jobs** only

**Staff UX**
- Operations pages (Jobs…Staff) use Communications-style inbox tabs
- Side nav: more edge padding; active page is an inverted tab (light: black tab / white text; dark: white tab / black text)

**PR cleanup**
- Merged **#732**; no open PRs remaining

**Release:** **v1.0.85** (build **185**) — web + PWA cache bust (`guardr-cache-v1-0-85`) + CI FCM APK

**Test coverage:** 449 unit tests, lint and build clean.

**Supabase:** run if missing on production:

```sql
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;
```

Also already reflected in `supabase/complete_schema_setup.sql`.

---

## Monday, July 20, 2026 — /mergeit + /updateit → v1.0.84

**Platform shells (#725–#727)**
- **#725** — Tablet website/PWA/APK hardening: staff tablet dual chrome fix, PWA sheet auth over AppHomeScreen, install screenshots, cross-platform docs
- **#726** — Mobile shell fixes: safe-area insets, bottom nav retarget, APK haptics, PWA install prompt, status-bar icons
- **#727** — Desktop client home job selection, guard earnings workbench parity, landing nav legal/guide links

**Settings & UX (#722–#724, #728–#730)**
- **#722** — Flat native settings layout (no gray card canvases)
- **#723** — Strict black/white staff Overview/Jobs screens
- **#724** — City-centric staff operations access in Operations tab
- **#728** — Appearance theme toggle moved to profile menu popup
- **#729** — Support inbox matches Messages hub style (client, guard, staff)
- **#730** — App home simplified to Sign in / Sign up → role picker

**PR cleanup**
- Merged **#725–#730**; all open PRs closed

**Release:** **v1.0.84** (build **184**) — web + PWA cache bust (`guardr-cache-v1-0-84`) + CI FCM APK

**Test coverage:** 429 unit tests, lint and build clean.

**Supabase:** No schema changes — nothing to run.

---

## The big picture (what mattered most)

1. **Jun 6** — Kicked the project off. Guardr brand, Supabase, staff roles, self-audit foundation.
2. **Jun 7** — Guardr-style redesign, Stripe in, PWA + cross-platform base.
3. **Jun 8** — **guardr.co** live on Vercel.
4. **Jun 9** — Sidebar nav, BSIS compliance engine, payments pipeline, realtime sync.
5. **Jun 10** — Job applications, self-audit and spot-check flows.
6. **Jun 20** — Founder role (was Owner), messaging hub, director money controls.
7. **Jun 22** — ID verification, approval flow, production polish pass.
8. **Jun 23** — Full responsive overhaul, overtime/disputes, messenger v2, workflow guide.
9. **Jun 24** — Guard favourites, direct requests, better client filtering.
10. **Jun 25** — IC marketplace alignment: legal docs, COI, guards self-select jobs, Stripe auto-payout.
11. **Jun 25 (night)** — Ops hierarchy locked in, Founder rename, per-role Guide, full SQL schema in one file.
12. **Jun 26 – Jul 14** — Split Applications and Credentials, auto-activate guards, credential UX overhaul, full redesign, PWA white / APK black, production hardening for investor demo.
13. **Jul 15** — Production audit, demo test accounts, system back button on website + PWA + APK, renamed everything to just **Guide**.

---

## Saturday, June 6, 2026 — Day one

First real day on the build. 15 commits, 4 PR merges. Got Guardr named, wired Supabase, self-audit, themes, staff roles.

| Time | What shipped |
|------|----------------|
| 2:49 PM | Initial commit — Signature Security app started |
| 3:15 PM | Supabase auth; staff role |
| 3:21 PM | Guard self-audit + compliance |
| 4:00 PM | Rebrand to **Guardr**; theme system |
| 4:06 PM | Theme design variables |
| 4:34 PM | Staff roles + admin onboarding |
| 4:40 PM | Staff role system + landing UI |
| 4:47 PM | Mock data cleaned up; migrations hardened |
| 5:05 PM | Premium branding — "Guardr by Signature Security Specialist"; logo; manifest |
| 5:14 PM | Footer + hero URL fixes |
| 6:32–7:42 PM | Merged 4 PRs: Guardr-style design, guard/client split, redesign, auth routing |

---

## Sunday, June 7, 2026 — MVP day

Big build day — 30 commits. refined look, guard/client split, Stripe, PWA foundation.

| Time | What shipped |
|------|----------------|
| Early AM | Base Web styling; shift scheduling |
| Early AM | Guard and client as separate full-screen apps |
| Early AM | Full platform redesign (sage green); Dark / Light / Grey themes |
| 11:04 AM | MVP to spec; field-app guard map |
| 11:13 AM | Roles + permission gates on workflows |
| 11:14 AM | Removed all AI/Gemini stuff |
| 11:18 AM | Client ops dashboard rebuilt |
| 11:21 AM | Staff command center rebuilt |
| 11:24 AM | DB schema reset — no seed data |
| 11:27 AM | PWA, theme sync, offline queue |
| 11:29 AM | Official Guardr logo assets |
| 12:12 PM | Fixed phantom data — always sync from Supabase |
| 12:24 PM | Profile + bottom nav all roles |
| 1:42 PM | Staff ops nav; guard staff controls |
| 3:11 PM | Certifications on guard profile |
| 3:42 PM | **Stripe Checkout + Connect** |
| 4:08 PM | Signup simplified — guard card auto-creates cert |
| 5:39 PM | Home CTAs; state-based guard licensing |

---

## Monday, June 8, 2026 — Deploy day

Got it on the real domain. 21 commits.

| Time | What shipped |
|------|----------------|
| 5:03 AM | field-app UI; theme app-wide |
| 5:55 AM | **guardr.co** production domain |
| 6:15 AM | Vercel config + setup guide |
| 6:56–7:19 AM | Vercel API fixes — serverless routes, lazy Stripe/Supabase |
| 7:52 AM | Stripe Connect platform setup |
| 9:10 AM | Guard mobile layout, staff shift mode, client guard profiles |
| 10:04 AM | Marketplace vs direct requests; full guard resumes |
| 10:11 PM | Badge number off guard profiles |
| 10:42 PM | BSIS guard cards vs training certs (full CA catalog) |
| 11:35 PM | Blank screen crash fix |

---

## Tuesday, June 9, 2026 — Navigation + BSIS + wireframe

127 commits — one of the biggest days. Sidebar, compliance engine, payments, wireframe UI.

| Time | What shipped |
|------|----------------|
| 12:04 AM | Staff get full guard map/shift experience |
| 12:04 AM | Sidebar nav all staff screens |
| 12:04 AM | Support section — message staff, file reports |
| 12:04 AM | Staff ops + guard shift unified |
| 12:04 AM | Bottom nav → sidebar all roles |
| 12:04 AM | "Dispatch" wording removed everywhere |
| 12:04 AM | Self-service platform — dropped unapproved client gates |
| 12:04 AM | Staff separated from field guards |
| 12:04 AM | **Web Push** for PWA |
| 12:04 AM | Vercel push API crash fixes |
| 5:54 AM | BSIS 2024 rules — 8-hr PTA/UOF, 32-hr block |
| 5:54 AM | Guards can add supplemental creds |
| 5:54 AM | Maps center on user location |
| 5:54 AM | Credential badges — on-file vs verification |
| 5:54 AM | Duplicate cert numbers blocked |
| 5:54 AM | Staff click-through profiles |
| 5:54 AM | **Supabase realtime** everywhere |
| 5:54 AM | Profile photo upload |
| 5:54 AM | `complete_schema_setup.sql` |
| 9:24 AM | Director cash workflow; Payments pipeline |
| 9:24 AM | Cash-to-Stripe deposit; paid jobs locked |
| 9:24 AM | Staff Jobs tab; guard earnings split |
| 12:38 PM | **Wireframe UI** — bottom task bar, flat layout |
| 12:38 PM | Healthcare wireframe design system |
| 12:38 PM | Cards only for clickable stuff |
| 12:38 PM | Staff left sidebar, sage themes |
| 12:38 PM | Grey theme → **Shade** |
| 12:38 PM | Guard nav: My Jobs vs map |
| 12:38 PM | Inactive guards blocked from work |
| 12:38 PM | Payments UX plain language |
| 12:38 PM | URL route persistence |
| 12:38 PM | Credential cards → detail + photo |
| 12:38 PM | Marketing home restored; separate login |
| 12:38 PM | Staff Overview = ops command center |
| 12:38 PM | Directors add staff, roles, jobs, assign guards |
| 12:38 PM | "Shift" → "jobs" sitewide |

---

## Wednesday, June 10, 2026 — Jobs + audits

33 commits. Job approvals, applications, self-audit flow.

| Time | What shipped |
|------|----------------|
| 12:13 AM | Job offers need staff approval before client pays |
| 12:45 AM | Guard job applications + staff approval |
| 12:54 AM | Pro job listing details |
| 12:56 AM | Guardr-style map routing + offer cards |
| 12:58 AM | Map tiles follow theme |
| 1:05 AM | Job details flattened |
| 1:19 AM | Rehire only guards who worked job before |
| 1:24 AM | Stripe payout blocked if guard asked for cash |
| 1:26 AM | No horizontal scroll |
| 1:35 AM | Title/location editable after pay; schedule locked |
| 1:38 AM | **Self-audit flow** — guard photos, client confirms |
| 1:54 AM | Staff action buttons for edit + audit upload |
| 2:18 AM | Overview metrics — active guard jobs |
| 2:33 AM | Self-audit photos in staff/guard views |
| 2:36 AM | Staff spot-check upload per job |
| 2:47 AM | Clients confirm spot checks |
| 3:03 AM | Home page copy restored |
| 11:57 PM | Guard card required to work; 8hr/32hr recommended |

---

## Thursday, June 11, 2026

Quick 6 commits — credential photo locks, guard card = Active.

**Nothing committed Jun 12–19** — 9-day pause.

---

## Saturday, June 20, 2026 — Messaging is back

24 commits. Cash flows, Owner role (later Founder), messaging hub.

| Time | What shipped |
|------|----------------|
| 1:14 AM | Directors record platform fee in cash |
| 1:29 AM | Client cash vs Stripe deposit split in ledger |
| 1:36 AM | Director overview financials |
| 4:24 AM | Manual coords + geocode for jobs |
| 4:41 AM | Schema setup updated |
| 4:58 AM | Job edit save fixes |
| 5:34 AM | One spot check per job max |
| 6:12 PM | **Owner role** above Director |
| 6:30 PM | Same-tier staff can't moderate each other |
| 9:23 PM | **Messaging hub**, job chat, notification controls |

---

## Sunday, June 21, 2026

Staff-provisioned accounts get default password `#Qwerty12345` with change prompt on first login.

---

## Monday, June 22, 2026 — Production polish

163 commits — ID verification, approvals hub, bottom sheets, site briefings. This is when it started feeling like a real product.

| Time | What shipped |
|------|----------------|
| 1:26 AM | Staff edit guard profiles + creds |
| 1:26 AM | First/middle/last name fields |
| 1:26 AM | Account approval workflow; signup dedup; staff delete |
| 1:26 AM | **Guard ID verification** — front/back + selfie |
| 1:26 AM | Verified ID + guard card before activation |
| 6:40 AM | Production polish — role UX, premium styling |
| 6:40 AM | Push notifications |
| 6:40 AM | Message threads open separate |
| 6:40 AM | Staff approvals → hub/queue/detail |
| 6:40 AM | Legal terms, privacy, marketplace copy |
| 6:40 AM | Full audit + design system |
| 6:40 AM | Push API Vercel bundling |
| 6:40 AM | Flat edges, list rows, sage on black |
| 6:40 AM | Messages live sync |
| 12:22 PM | ID verification on profiles |
| 12:22 PM | Overview dashboard sage chrome |
| 12:22 PM | Staff request clearer ID photos |
| 12:22 PM | ID reject/resubmit flow |
| 12:22 PM | Click-to-view ID photos |
| 12:22 PM | Walkie-talkie chirp on notifications |
| 12:22 PM | Trusted badge for clients |
| 12:22 PM | Staff table separate from guards |
| 12:22 PM | BSIS guard card own section |
| 12:22 PM | Motion on page changes, modals, sheets |
| 12:22 PM | Unified account menu |
| 5:47 PM | Gov ID expiry + credential cards |
| 5:47 PM | Cert photo thumbnails |
| 5:47 PM | Light theme readability |
| 5:47 PM | Profile approval vs activation split |
| 5:47 PM | 48-hour credential grace |
| 5:47 PM | Photo proof required all creds |
| 5:47 PM | Image compression + save fixes |
| 5:47 PM | `complete_schema_setup.sql` one-shot |
| 5:47 PM | Client site briefing — **150+ fields** |
| 5:47 PM | Support vs reports split |
| 5:47 PM | Bottom sheets for forms |
| 5:47 PM | Slide to claim/start/end shift |
| 5:47 PM | Full site audit — TS, certs, UI |

---

## Tuesday, June 23, 2026 — Responsive + messenger

227 commits — biggest day on the repo. design mirror overhaul, overtime, messenger v2.

| Time | What shipped |
|------|----------------|
| 12:24 AM | Staff permanently out of guards table |
| 12:24 AM | M. White → Owner |
| 12:24 AM | Ops nav: Clients, Guards, Staff, chats |
| 12:24 AM | Credential UI unified |
| 12:24 AM | Guard community chat |
| 12:24 AM | Job chats simplified |
| 12:24 AM | Push subscribe crash fixes |
| 12:24 AM | Client cash request + staff approval |
| 12:24 AM | Owner payment modes (cash/Stripe/both) |
| 12:24 AM | Grace-period guards can claim |
| 12:24 AM | Staff-then-client guard approval |
| 12:24 AM | In-app workflow guide |
| 12:24 AM | **design mirror** — mobile/tablet/desktop Waves 1–3 |
| 12:24 AM | Sidebar theme switcher |
| 12:24 AM | Cash flows refined |
| 12:24 AM | On-duty timer from clock-in |
| 12:24 AM | Browser back navigation hardened |
| 12:24 AM | Configurable platform fees |
| 3:20 PM | **Income summary on Staff Payments** — me (PR #230) |
| 5:48 PM | Overtime billing late clock-out |
| 5:48 PM | Guard + client approve overtime |
| 5:48 PM | 15-min clock-out window removed |
| 5:48 PM | Detailed incident reports (5W1H) |
| 5:48 PM | Overtime dispute flow |
| 5:48 PM | Break tracking; shift notifications |
| 5:48 PM | Support + dispute push coverage |
| 5:48 PM | Home page mobile/tablet/desktop |
| 5:48 PM | Messenger v2 — split pane, reactions, receipts, typing |
| 5:48 PM | Tabbed inbox |
| 5:48 PM | Client signup intake + staff approval view |
| 5:48 PM | Trusted flag (Director/Owner) |
| 5:48 PM | Interactive workflow guide |
| 5:48 PM | Money handling Directors/Owners only |

---

## Wednesday, June 24, 2026

Favourites, direct requests, notifications, guard filtering. 25 commits.

| Time | What shipped |
|------|----------------|
| 12:05 AM | Client guard favourites |
| 12:08 AM | Pick favourite guard on new job |
| 12:25 AM | Guard confirm/decline direct requests |
| 12:59 AM | Notify staff on signup/submissions |
| 1:03 AM | Notify users when staff approves/declines |
| 1:11 AM | Map default LA not NYC |
| 1:19 AM | Client signup intake fix |
| 1:51 AM | Schema: messenger, intake, trusted |
| 5:22 AM | Guard roster badge order fixed |
| 5:27 AM | No horizontal scroll anywhere |
| 5:34 AM | Advanced guard filtering for clients |

---

## Thursday, June 25, 2026 — IC marketplace

Aligned the product with independent-contractor marketplace rules. Cash off, guards self-select, legal stack in.

| Time | What shipped |
|------|----------------|
| 5:35 AM | ICA, Client Agreement, Guard Conduct — versioned at signup |
| 5:35 AM | COI upload; verified COI to apply |
| 5:35 AM | Per-job service agreements on assign |
| 5:50 AM | Guards self-select; staff place only dispute/safety |
| 5:50 AM | Spot checks removed |
| 5:50 AM | Card/Stripe only; auto-release ~48h |
| 5:50 AM | Marketplace eligibility framing |
| 5:50 AM | 48h grace PTA/32-hr; lockout on expiry |
| 5:50 AM | Cash disabled platform-wide |
| 6:21 AM | Guide updated — IC marketplace section |
| 7:36 AM | COI on activation checklist |
| 8:15 AM | COI as credential row + detail modal |

**Same night (PR #312):** Locked ops hierarchy — Moderator approves apps, Administrator+ verifies creds, Director money + team, Founder governance. Owner renamed to **Founder**. Auth scroll fix on desktop. Guide got the "whole app start to finish" section plus per-role filters. One SQL file for the whole schema. 105 tests passing.

---

## June 26 – July 14, 2026 — What I was pushing for before investor demo

This stretch is me cleaning up everything that kept getting half-done. I'd mention stuff in one agent run and it'd get skipped — had to repeat a lot. Focus was: make the whole thing production-ready on website, PWA, and APK.

**Staff side**
- Killed the old Approvals blob. Now it's **Applications** (account intake, job offers, staff-provisioned accounts) and **Credentials** (verify docs) as separate sidebar tabs.
- Guards **auto-activate** when all five creds are verified — no more manual "grant eligibility" button.
- Pending guards can upload creds during application review; staff see it in the Applications popup.
- Expired creds → auto-request update + **Restricted** label on the account.
- Credential views unified — lightbox images, full edit pages, staff wizard to add creds.
- Roster badges show account state + what's still pending. Pulled armed-level badges off the UI.
- Staff can edit their own profile (name, phone, bio, photo).
- **Payment settings**, **Marketplace agreements**, and **Audit log** each got their own sidebar tab for Directors/Founders.
- Role permissions reference lives in the **Guide** now.

**Look and feel**
- Full redesign pass on mobile, tablet, desktop, and APK — sage green back, bottom nav fixed, guards land on map not a blank screen.
- PWA = white home-screen icons. APK = black splash and status bar.
- APK sideload at `/download/guardr.apk` — Capacitor shell loads live site from guardr.co.

**Demo accounts**
- SQL seed for investor walkthrough: `testg@test.com` (guard), `testc@test.com` (client), `tests@test.com` (staff) — password `#Qwerty12345`.

---

## Wednesday, July 15, 2026 — Investor-ready push

Bringing this to investors — needed every workflow working, every button, every page, uploads, the whole thing. Ran through all the agents to make sure nothing I already asked for got skipped again.

**v1.0.43**
- Fixed 11 TypeScript errors that were blocking CI.
- PWA install icons were too small — bumped them.
- Investor demo accounts SQL in repo.
- Service worker cache bust.

**v1.0.44**
- **System back button** — had to work on website, PWA, and APK (mobile, tablet, desktop). Hardware back on Android, browser back everywhere else. Closes dialogs and sheets first, then walks you back through pages. At the root on APK it minimizes instead of killing the app.

**v1.0.45**
- Renamed **General guide** → just **Guide** everywhere — that's what I wanted it called.
- Synced Guide + these dev notes with how the app actually works now.

**Test coverage at this point:** 234 unit tests, 3 E2E smoke tests, lint and build clean.

**Demo logins** (run `supabase/investor_demo_accounts.sql` if they're not in prod yet):
- `testg@test.com` — active guard, all creds verified
- `testc@test.com` — approved client
- `tests@test.com` — staff Moderator
- Password all: `#Qwerty12345`

---

## Quick reference by date

| Date | Commits | What happened |
|------|---------|---------------|
| **Jun 6** | 15 | App born — Guardr, Supabase, self-audit, themes |
| **Jun 7** | 30 | platform redesign, Stripe, PWA, certs |
| **Jun 8** | 21 | guardr.co live |
| **Jun 9** | 127 | Sidebar, BSIS, payments, wireframe UI |
| **Jun 10** | 33 | Job apps, self-audit, map routing |
| **Jun 11** | 6 | Credential locks |
| **Jun 12–19** | 0 | Break |
| **Jun 20** | 24 | Cash, Owner role, messaging |
| **Jun 21** | 2 | Default staff password |
| **Jun 22** | 163 | ID verify, approvals, polish, briefings |
| **Jun 23** | 227 | Responsive overhaul, messenger, overtime |
| **Jun 24** | 25 | Favourites, direct requests, filters |
| **Jun 25** | 6+ | IC marketplace, Founder, Guide sections |
| **Jun 26 – Jul 14** | 300+ | Applications/Credentials, redesign, PWA/APK |
| **Jul 16** | 50+ | Push/FCM fix, APK parity, invoices, realtime sync, notification sound, v1.0.67 |
| **Jul 15** | 4+ | Production audit, back button, Guide rename → v1.0.45 |
| **Aug 11** | 20+ | User manuals, staff 50% revenue share, v1.0.115–122 |
| **Aug 19** | 12+ | /update v1.0.131 — Customer labels (staff/auth), sidebar create cleanup, APK build 231, Git LFS |
| **Aug 19** | 6+ | /update v1.0.130 — customer/hiring-account UI labels, APK build 230 |
| **Aug 14** | 10+ | /update v1.0.123 — fieldtest chat, message delete, Google Play prep |
| **Aug 18** | 24+ | /update v1.0.129 — full platform release, APK + AAB via CI |
| **Aug 18** | 22+ | /update v1.0.128 — consolidated Aug 18 Supabase SQL catch-up snippet |
| **Aug 18** | 20+ | /update v1.0.127 — staff activation lock, management Profile ID, client credentials fix, staff ID demotion SQL |
| **Aug 18** | 14+ | /update v1.0.126 — staff roster category tabs, Management page, status sub-filters, APK + AAB release pipeline |
| **Aug 18** | 9+ | /update v1.0.124 — Personal vs Business clients, dual fee tables, frozen prices, staff ID bounce, client credential library |

---

_You see this in staff under **Dev notes** (Director and Founder only). Everyone else uses **Guide** in the sidebar or account menu for how the app works._

---

## Thursday, July 16, 2026 — Tier heroes, crew polish, v1.0.51

Unified the Jobs experience across guard and client roles and finished the crew documentation pass.

**Design**
- Guard **Jobs** tier hero with pie chart, color legend, and pinned segmented tabs (crew-style layout).
- **Client Jobs** now matches — same tier hero, pie breakdown, and tab pattern as guards.
- Shared `JobsScreenHero` component; legend items are keyboard-focusable buttons.
- Performance and Preferences tier heroes fitted cleanly; shield crest cutout removed from heroes.
- Crew hub flat sections (join + lead); standing crew dissolves when trusted status is revoked.

**Functionality**
- Crew lead state sync between guard and staff views.
- Join crew moved from Settings to Crew page.

**Docs**
- Guide updated with full **Crew** section for trusted guards.
- Onboarding tours cover Jobs hero breakdown and Crew tab.

**Release**
- **v1.0.51** — web bundle; APK build when Android SDK is available.

**Test coverage:** 404 unit tests, lint and build clean.

---

## Thursday, July 16, 2026 (afternoon) — Push, APK parity, full merge → v1.0.67

Second big push day — fixed native push, stopped APK version mismatches, merged five open PRs into one release.

### Push notifications & APK

- **#575** — Bundled `/api/push/vapid-public-key` for Vercel (was crashing with `FUNCTION_INVOCATION_FAILED` on production). Extended `/api/health` with `hasVapid` and `hasFcm`.
- **#576** — Shipped the **correct** FCM-enabled APK binary. Prior release bumped `version.json` to 1.0.66 but the APK inside was still build **165** — Android kept reporting v1.0.65. Added `?v=<build>` cache-busting on download URLs and no-cache headers for the APK.
- CI builds with `GOOGLE_SERVICES_JSON` → `VITE_NATIVE_FCM_CONFIGURED=true`. Server needs `FCM_SERVICE_ACCOUNT_JSON` on Vercel for delivery.

### Full platform merge (**#583** → **v1.0.67**)

| PR | What shipped |
|----|--------------|
| **#577** | Staff roster pages (Applications, Incidents) fit mobile viewport — no awkward full-page scroll |
| **#578** | Real-time sync — audit log, user notifications, live location update without manual refresh |
| **#580** | Configurable Android notification sound in Settings (Guardr tone vs system picker) |
| **#581** | Client **Invoices** page — view/download PDF, pay when due, invoice-ready push alerts |
| **#582** | Community chat sync respects database message deletions (no ghost messages after staff clear) |

Skipped **#570** / **#572** — premium priority + standing/driving tabs already on `main` from earlier vehicle/performance work.

### Earlier Jul 16 (morning)

- Staff ops cleanup — removed duplicate job detail panels; role permissions guide tweak.
- **v1.0.66** interim release with FCM APK fix.

### Release

- **v1.0.67** — web + APK (build **167**), FCM-enabled, download at [guardr.co/download](https://www.guardr.co/download/guardr.apk?v=167)
- Run `supabase/complete_schema_setup.sql` in prod if `client_invoices` or new notification columns are missing.

**Test coverage:** 404 unit tests, lint and build clean.

---

## Thursday, July 16, 2026 (midday) — /runit → v1.0.68

No new PRs to merge (#570 / #572 superseded — close on GitHub).

**Realtime everywhere**
- `client_invoices`, `message_reactions`, `guard_availability` added to core realtime sync
- Message **DELETE** events sync all chat tables instantly (community, staff, client, job, support)
- Schema realtime publication aligned

**Release:** **v1.0.68** (build **168**) — web + PWA cache bust + CI FCM APK

**Test coverage:** 404 unit tests, lint and build clean.

---

## Thursday, July 16, 2026 (afternoon) — /updateit → v1.0.69

**Notifications UX (#590)**
- Account menu: **Profile → Notifications → Settings** — inbox opens on click (not inline in dropdown)
- Unread badge on avatar and Notifications row; Back navigation in sub-view

**PR cleanup**
- Skipped/closed **#570** / **#572** — premium priority + standing/driving tabs already on `main`

**Release:** **v1.0.69** (build **169**) — web + PWA cache bust (`guardr-cache-v1-0-69`) + CI FCM APK

**Test coverage:** 404 unit tests, lint and build clean.

---

## Friday, July 17, 2026 — /updateit → v1.0.70

**Desktop staff command center (#592, #595)**
- **Overview** — full status panels with metrics, meters, pie charts, line graphs, and donut gauges
- **Stats** tab (desktop sidebar) — guard performance breakdown, tier % progress bars, compare up to four guards, violations rollup

**Permissions & agreements (#594, #596)**
- **Permissions** sidebar page (Manager+) — per-role staff permission toggles; job posting approval rules live under **Clients → Job posting**
- Marketplace agreement checkboxes enlarged for better tap targets

**Multi-surface views (#597)**
- `/viewit` view system — desktop, tablet, PWA, and APK layouts share one surface-aware shell

**Developer slash commands (#601–#606)**
- Explicit commands: `/mergeit`, `/updateit`, `/readit`, `/fixit`, `/runit`, `/automergeit`, `/deployit`, and more
- `/mergeit` docs: must always close merged and superseded PRs
- Closed **#600** — remove-slash-commands superseded by explicit command set

**PR cleanup**
- No open PRs at release — all work already on `main`

**Release:** **v1.0.70** (build **170**) — web + PWA cache bust (`guardr-cache-v1-0-70`) + CI FCM APK

**Test coverage:** 409 unit tests, lint and build clean.

---

## Friday, July 17, 2026 — /updateit → v1.0.71

**Cross-platform production readiness (#611, #612)**
- **Mobile website** — bottom navigation (`BottomNavBar` + `MoreMenuSheet`) in `RoleAppShell` and `StaffOpsLayout`
- **PWA** — `registerPwaInstall()` on browser/PWA startup; offline connectivity banner
- **Offline field mode** — guard self-audit, incident, and activity reports enqueue when offline; sync on reconnect
- **Settings** — About section distinguishes Android app vs installed PWA vs web

**PR cleanup**
- Merged #611 via #612; no open PRs at release

**Release:** **v1.0.71** (build **171**) — web + PWA cache bust (`guardr-cache-v1-0-71`) + CI FCM APK

**Test coverage:** 409 unit tests, lint and build clean.

---

## Friday, July 17, 2026 (morning) — /updateit → v1.0.72

**/platform-ui UI migration (phases 3–6, #629)**
- **Stock Base Web Web theme** — `LightTheme` / `DarkTheme` via `guardrBaseTheme.ts`; sage brand deferred to later pass
- **Phase 3** — shared primitives: `AppButton`, `AppPrimitives`, wireframe kit, field styles
- **Phase 4** — dashboard kit (`DashboardHero`, `MetricCell`, `QuickActionTile`, `GuardrThemeVars`); hub screens: client home, staff overview, guard earnings, user profile
- **Phase 5** — overlay gates (`LegalAcceptanceModal`, onboarding, briefing, lightbox); `AppFormSheet` Base Web rebuild; removed dead `GuardBottomSheet`
- **Phase 6** — design-preview parity (`/design-preview.html`); `ComponentShowcase`; staff live QA at `/staff/design-qa`

**PR cleanup**
- Merged platform UI stack via **#629**; closed **#623–#628** (superseded or landed)

**Release:** **v1.0.72** (build **172**) — web + PWA cache bust (`guardr-cache-v1-0-72`) + CI FCM APK

**Test coverage:** 415 unit tests, lint and build clean.

---

## Friday, July 17, 2026 (late morning) — /updateit → v1.0.73

**White-screen hotfix (#632 audit + #633)**
- **Production build crash** — circular `vendor-map` ↔ `vendor-baseweb` chunk duplicated React; fixed by isolating `vendor-react` in Vite `manualChunks`
- **Design preview** — `/design-preview.html` now built through Vite (was serving HTML for the module script in production)
- **Base Web + React 19** — named `Modal`/`Drawer` imports; explicit `hasThumbnail` on `GuardrCard`
- **PWA** — service worker no longer returns `index.html` for failed JS/CSS asset requests
- **Security audit (#632)** — manager role session fix, finance gate on Stripe payments, auth bridge secret, health endpoint hardening

**PR cleanup**
- Merged **#632** (full audit) and **#633** (white screen); no open PRs at release

**Release:** **v1.0.73** (build **173**) — web + PWA cache bust (`guardr-cache-v1-0-73`) + CI FCM APK

**Test coverage:** 418 unit tests, 3 e2e public-page tests, lint and build clean.

---

## Friday, July 17, 2026 (midday) — /updateit → v1.0.74

**/platform-ui Phase 2 — home + auth (#635)**
- **Home page** — `PublicLandingHeader`, `LandingPrimitives`, `GuardrCard`/`GuardrTag`/`AppButton` sections; desktop landing rebuilt with Base Web `Block` layout
- **Sign-in / sign-up** — `AuthFormChrome` (segmented control, role picker), `AppButton` submit, `GuardrSheet` for PWA auth sheet
- **Auth hero** — accent gradient via `--uber-accent` (`.auth-experience--uber`)
- **`GuardrCard`** — optional `onClick` for interactive public cards

**PR cleanup**
- Merged **#635** (platform UI home/auth); no open PRs at release

**Release:** **v1.0.74** (build **174**) — web + PWA cache bust (`guardr-cache-v1-0-74`) + CI FCM APK

**Test coverage:** 418 unit tests, 3 e2e public-page tests, lint and build clean.

---

## Friday, July 17, 2026 (late morning) — /updateit → v1.0.75

**/platform-uiplatforms Phase 1 — PWA/APK welcome + auth (#637)**
- **App welcome** — `AppWelcomeChrome` with shell-specific hero copy, `GuardrCard` role dock, `AppButton` CTAs for `pwa-mobile/tablet` and `native-mobile/tablet`
- **Auth sheet** — `auth-sheet--{viewSurface}` + `auth-sheet-panel--{shellKind}` for PWA glass vs APK safe-area chrome
- **CSS** — `app-pwa.css` / `app-native.css` use `--uber-*` tokens for welcome dock and auth sheet
- **Design preview** — App welcome · PWA/APK and Auth sheet pages; Browser/PWA/APK shell toggle
- **Docs** — `CROSS_PLATFORM.md` pre-auth surface matrix

**PR cleanup**
- Merged **#637** (platform UIplatforms); no open PRs at release

**Release:** **v1.0.75** (build **175**) — web + PWA cache bust (`guardr-cache-v1-0-75`) + CI FCM APK

**Test coverage:** 418 unit tests, 3 e2e public-page tests, lint and build clean.

---

## Friday, July 17, 2026 (afternoon) — /updateit → v1.0.76

**/platform-ui — unified drawer sidebar + app shell body (#639, merged via #640)**
- **`GuardrDrawerShell`** — Base Web drawer sidebar with `GuardrSideNav` for client, guard, and staff on **all breakpoints** (replaces mobile bottom nav and tablet icon rail)
- **`RoleAppShell` / `StaffOpsLayout`** — single shell path; map bleed, header overrides, and nav permission gates preserved
- **Body chrome** — Guardr `backgroundPrimary` content pane; `.uber-app-shell` CSS bridge maps legacy `bg-brand-*` / `text-brand-*` to `--uber-*` tokens inside the shell
- **Design preview** — mobile/tablet/desktop all use drawer sidebar

**PR cleanup**
- Merged **#639** and **#640**; no open PRs at release

**Release:** **v1.0.76** (build **176**) — web + PWA cache bust (`guardr-cache-v1-0-76`) + CI FCM APK

**Test coverage:** 418 unit tests, 3 e2e public-page tests, lint and build clean.

**Supabase:** No schema changes — nothing to run.

---

## Friday, July 17, 2026 (late afternoon) — /updateit → v1.0.77

**/platform-ui — complete surface finish (#642, merged via #643)**
- **`GuardrDrawerShell`** — Guardr-style persistent desktop sidebar, drawer on mobile/tablet/PWA/APK, compact top bar with inline title, gray content canvas
- **`uber-surfaces.css`** — remaps legacy `adm-*`, `app-*`, and `bg-brand-*` inside `.uber-app-shell` to `--uber-*` tokens on all breakpoints
- **`AppPrimitives`** — Base Web `AppEmptyState`, `AppScreen`, `AppSection`, `AppHeroBand`, `AppStatusBanner`
- **Docs** — `platform UI-patterns.md` surface bridge notes

**PR cleanup**
- Merged **#642** and **#643**; no open PRs at release

**Release:** **v1.0.77** (build **177**) — web + PWA cache bust (`guardr-cache-v1-0-77`) + CI FCM APK

**Test coverage:** 418 unit tests, 3 e2e public-page tests, lint and build clean.

**Supabase:** No schema changes — nothing to run.

---

## Friday, July 17, 2026 (evening) — /updateit → v1.0.78

**/runit — Platform UI shell audit + surface bridge (#645)**
- **Mobile layout fix** — drawer sidebar no longer reserves 260px in flex row on phone/tablet
- **Accessibility** — Escape closes drawer; `prefers-reduced-motion` for sidebar transition
- **`uber-surfaces.css`** — stat cards, quick links, charts, role badges on all breakpoints inside shell

**PR cleanup**
- Merged **#645**; no open PRs at release

**Release:** **v1.0.78** (build **178**) — web + PWA cache bust (`guardr-cache-v1-0-78`) + CI FCM APK

**Test coverage:** 418 unit tests, 3 e2e public-page tests, lint and build clean.

**Supabase:** No schema changes — nothing to run.

---

## Friday, July 17, 2026 (night) — /updateit → v1.0.79

**Base Web Web redesign — Phases 1–5 (#651, merged from #650)**
- **Phase 1:** Global design tokens, `uber-global.css`, black CTAs, sage-green removal
- **Phase 2:** High-traffic workbenches (`StaffOverviewDesktop`, `GuardMyJobsDesktop`, `ClientRequestsDesktop`)
- **Phase 3:** Remaining role dashboards → `WorkbenchLayout` adapters (`WorkbenchSplit`, `WorkbenchTabBar`, `WorkbenchFlatSplit`)
- **Phase 4:** Dashboard kit (`DashboardHero`, `MetricStrip`, `MetricCell`) on staff finance + client hubs
- **Phase 5:** Feature overlays (`OverlaySheetHeader`), guard field modals, map inspector, `uber-form-wizard` CSS

**PR cleanup**
- Merged **#651** (integration) and closed **#650**; no open PRs at release

**Release:** **v1.0.79** (build **179**) — web + PWA cache bust (`guardr-cache-v1-0-79`) + CI FCM APK

**Test coverage:** 418 unit tests, 3 e2e public-page tests, lint and build clean.

**Supabase:** No schema changes — nothing to run.

---

## Sunday, July 19, 2026 — /updateit → v1.0.83

**Guardr-style mobile polish (#708–#709)**
- **#708** — Staff cert review: flat on-page latest info, full-screen image viewer, history for prior uploads only, no title ellipsis
- **#709** — Global subscreen headers wrap titles (never `...`); auth mobile/PWA safe-area padding matches role-choice page; staff credential/application inbox rows wrap full titles

**Credentials & auth (#705–#707)**
- **#705** — Staff credentials: solid overlays, inline records, no edge clipping
- **#706** — Credential timeline dedupe — history shows prior uploads only
- **#707** — Auth role-choice page safe horizontal padding

**Release:** **v1.0.83** (build **183**) — web + PWA cache bust (`guardr-cache-v1-0-83`) + CI FCM APK

**Test coverage:** 427 unit tests, e2e public-page tests, lint and build clean.

**Supabase:** No schema changes — nothing to run.

---

## Saturday, July 18, 2026 — /updateit → v1.0.82

**Mobile auth polish (#699, #700, #703)**
- **#699** — Mobile sign-in aligned with desktop: role-specific titles, focused header, no redundant toggles
- **#700** — PWA and APK use full-page auth (not sheet overlay); v1.0.81 shipped
- **#703** — Mobile page auth drops empty black hero band; large centered wordmark logo above sign-in form

**Messages & support (#702)**
- **Support** is its own sidebar tab under the **Messages** group for staff, clients, and guards
- Separate unread badges for job chats vs open support tickets
- `/support` routes directly to the Support tab

**Staff ops (#701)**
- **Create crew** on Crews page — staff can pick trusted guards who are not crew leads and not already in a crew

**Staff overview polish (#696–#698)**
- Toolbar spacing, removed desktop quick actions, mobile overview hero above quick actions

**PR cleanup**
- Merged **#699–#703**; closed draft **#662** (superseded homepage replica — not ready for release)

**Release:** **v1.0.82** (build **182**) — web + PWA cache bust (`guardr-cache-v1-0-82`) + CI FCM APK

**Test coverage:** 427 unit tests, e2e public-page tests, lint and build clean.

**Supabase:** No schema changes — nothing to run.
