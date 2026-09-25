# Guardr — What's Missing for a Fully Operational Marketplace

**Prepared:** Fri Sep 25, 2026, ~3:25 PM PT · **For:** Markeith White · **Type:** research only (no code, PRs, issues, or messages)
**Code reviewed:** `TheMarkkBradonCollective/Guardr` `main` @ `c243968` (last commit Sep 16, 2026 1:30 PM PT), fresh clone at `/workspace/guardr-gap`
**Also used:** the Sep 17 audit (`DEFECTS.md`, tour reports, screenshots, GitHub issue #1043 + comments), open PRs, and `docs/`.
**Companion file:** `PAGE-INVENTORY.md` has the page-by-page, button-by-button list (about 1,100 controls, each marked works / stub / broken / missing).

How to read the labels:
- **Broken** = it's built, but it fails, is unsafe, or gives the wrong result.
- **Not built** = there's no code for it at all.
- **Stub** = there's a button or screen, but it doesn't do the real thing (for example, it only shows a message or only saves on one device).
- **Unverified** = I couldn't confirm it from the code or the audit, so treat it as a lead to check.

---

## 0. The short version

Guardr has a lot of screens: 5 surfaces, about 65 distinct pages, and about 1,100 wired controls. Most buttons really are connected to something. The problems are underneath the buttons:

1. **The live site is down right now.** `https://www.guardr.co` returns **HTTP 402 "Payment required — DEPLOYMENT_DISABLED"** from Vercel (checked 3:15 PM PT today). Every API route returns the same error. And **every GitHub Actions run since Aug 27 has failed to start** (200 of 200 recent runs show `startup_failure`; the last good CI run was Aug 26, 7:59 PM PT). Both look like billing or plan problems, but I haven't confirmed the cause.
2. **Security is enforced in the browser, not on the server.** Login, roles, and most data changes happen in the user's browser, using a public database key. The database rules in the schema file let anyone read, write, and delete the main tables. Three money endpoints (payout, refund, checkout) don't check who is calling them.
3. **The main loop has never run end to end.** Pay → guard applies → clock-in → complete → review → payout has never been completed. It's blocked by live-only Stripe, the Business credential gate, the website sending users to the apps, and missing expiry and waive tools.
4. **Many features are one-way.** Clients can do a lot. Guards can't withdraw or call off. Staff see many lists but have few real controls for money, incidents, jobs, and cities. The Personal / Business / PPO experiences are mostly the same client screens with items hidden.

---

## (A) Must-have before a real launch

| # | What's missing and why it matters | Who it affects | Status | Evidence |
|---|---|---|---|---|
| A1 | **Production is offline and CI isn't running.** Nobody can use guardr.co until the Vercel account is fixed. With no CI, no automatic tests or APK builds have run for a month. | Everyone | **Broken** (ops/billing) | `curl -I https://www.guardr.co` → `402`, `x-vercel-error: DEPLOYMENT_DISABLED` (Sep 25, 3:15 PM PT). `gh run list`: 200/200 `startup_failure`; last success Aug 26, 7:59 PM PT. Also note: the 5-minute crons in `vercel.json` need a paid Vercel plan (unverified which plan you're on). |
| A2 | **Real server-side login and data protection.** Sign-in checks passwords in the browser against user records (including password hashes) that the browser downloads. Accounts with no saved password accept **any 4+ character password**. The "session" is a JSON note in the browser that can be edited. Roles are only checked in the UI. | Everyone (PII, IDs, guard cards, money) | **Broken** (insecure) | `src/lib/auth/authService.ts` `signInWithCredentials` (falls back to `authMode: 'legacy'`); `src/lib/accountPasswords.ts` `verifyAccountPassword` ("any password ≥ 4 chars"); a default password `#Qwerty12345` for staff-created accounts is in the public code; session = `localStorage 'guardr_current_user'`; `supabase/complete_schema_setup.sql` ~line 1592 gives `guards, staff, clients, security_requests, payments, platform_settings`, messages, etc. `SELECT/INSERT/UPDATE/DELETE USING (true)`; public key is hard-coded in `src/lib/supabase.ts`. *I did not query the live database, so live policies are unverified. The schema file is what the repo would deploy.* |
| A3 | **Lock down the money endpoints.** Anyone on the internet could call payout or refund. The checkout charge amount comes from the browser, so a client could pay $1 for a $500 job. | Clients, guards, the company | **Broken** (unsafe) | `api/stripe/payout/release.ts` has no auth; accepts `force: true`, a caller-chosen `guardConnectAccountId`, `hourlyRate`, and `durationHours`. `api/stripe/payment/refund.ts` has no auth (full refund of any payment intent). `api/stripe/checkout/create-session.ts` uses `amountCents` from the request body. Only `api/stripe/payments.ts` checks for finance staff. |
| A4 | **A safe way to test money plus a staff "mark paid / waive".** Production only runs live Stripe. There's no staging or test mode and no way for staff to settle an unpaid bill, so nobody can prove the loop works without real cards. | Staff, QA, clients | **Not built** | AUD-017; `.env.example` has a single environment; the cash / "mark paid" handlers in `src/App.tsx` (~lines 8995–9630) only show "Cash payments are not supported" and are never connected to a button; `staff-payments-tour.png`. |
| A5 | **Business clients can't post jobs.** A Business client with staff-Verified credentials is still blocked at Step 9. PPO accounts aren't affected. | Customer – Business | **Broken** | AUD-009/016, `business-job-post-after-verify.png`. The check in `src/lib/clientCredentials.ts` (`clientCredentialIsVerified`) also requires a document URL, an exact credential type, and no expiry. *Likely a mismatch with what staff marked Verified. Root cause unverified.* |
| A6 | **Let Active guards and customers use the website, or ship a working app path.** After activation, the website sends guards and customers back to `/account` or to an APK download. Right now the only working path is installing the PWA, and the PWA restore is still an open PR. | Guard, Customer | **Broken** (by design, but it blocks use) | AUD-007/013/016/021; `src/App.tsx` `canOpenOperationalRoute` (~line 747) + redirect at ~line 2315; `src/lib/productApps.ts` "Shifts, check-in, patrols, incidents, and pay live in the Guard app — not on the website." Open PRs **#1031** (PWA for all three apps) and **#1033** (APK downloads). |
| A7 | **Jobs need to expire, and payment should close when the job window closes.** Unfilled or unpaid jobs stay Open and payable after their end time. Checkout doesn't check the date. | Customer, Guard, Staff | **Not built** | AUD-019; `src/lib/jobStatus.ts` has no expired state; `api/stripe/checkout/create-session.ts` only checks `status === 'open'`; the crons (`vercel.json`) only send reminders and never change job status. |
| A8 | **Automatic guard payouts need a server job.** The "auto-release ~48h after completion" only runs while a staff member has Guardr open in a browser tab. If nobody's signed in, nobody gets paid. | Guard | **Broken** (fragile) | `src/App.tsx` `processDueAutoPayouts` + `setInterval(…, 60_000)` gated on `isStaffRole(currentUser.role)` (~lines 12600–12631). No payout cron exists in `vercel.json`. |
| A9 | **Password reset and basic transactional email.** There's no "Forgot password" anywhere. The only notifications are push (browser/Android). There's no email or SMS, so people who miss or block push miss approvals, job offers, and payment notices. | Everyone | **Not built** | No `resetPasswordForEmail` / "forgot" in `src/`; no email provider in `package.json` or `api/`; audit saw "Browser permission: denied" (PPO settings). |
| A10 | **One-role hold clears need to stick.** When staff clear a hold, it comes right back at the next sign-in. That locks out households or shared devices. | Customer, Guard, Staff | **Broken** | AUD-008. *Likely cause:* `signInWithCredentials` re-runs `withDeviceConflict` (`src/lib/oneRolePolicy.ts`) every sign-in and ignores cases already marked `ignored`. |
| A11 | **Maps need an API key.** Guard and customer maps show "API KEY REQUIRED" watermarks. | Guard, Customer | **Broken** (fix in flight) | AUD-015; PR **#1015**. |
| A12 | **Real account deletion.** Staff "Delete" doesn't remove related data. Users can't delete their own account, which Google Play requires (in-app and on the web). | Everyone, compliance | **Broken** (staff) / **Not built** (self-serve) | AUD-011; no self-serve delete in `src/components`; `docs/GOOGLE-PLAY.md` claims "Users can request deletion: Yes (per privacy policy)" but that's only an email address in `src/lib/legalContent.ts`. |
| A13 | **Staff city cap control.** Sacramento is stuck at 2/2 staff seats. The cap is shown but there's nothing to edit it with, so you can't staff the launch city. | Founder/Director | **Not built** | AUD-006; `src/components/staff/StaffCitiesPanel.tsx` (display only). |

## (B) Needed soon after launch

| # | What's missing and why it matters | Who it affects | Status | Evidence |
|---|---|---|---|---|
| B1 | **Guard availability only saves on the phone that set it.** Server job alerts read a different table that the app never writes to, so alerts ignore availability. | Guard | **Broken** | `src/lib/guardAvailability.ts` `saveGuardAvailabilitySchedule` → `localStorage`; `lib/push/guardOpenJobRecipients.ts` reads the DB table `guard_availability`. |
| B2 | **Guards can't back out.** There's no "withdraw application" and no "I can't make this shift" call-off. Only the client can trigger a replacement. | Guard | **Not built** | No withdraw/call-off controls in `src/components/guard/*` or `GuardDashboard` props. |
| B3 | **Recurring coverage doesn't create recurring shifts.** The "Recurring coverage" toggle saves the days on one job, but no future shifts are ever created or billed. | Customer (Business/PPO especially) | **Stub** | `RequestSecurityFlow.tsx` (~line 569); `src/lib/recurringShifts.ts` is imported by nothing; the `recurring_shift_templates` table is unused. |
| B4 | **Disputes and refunds beyond overtime.** The Disputes page only handles overtime. The "Approve / Hold / Partial / Cancel payout" buttons only send a notification or change a ticket status; no money moves (and "Partial payout issued." is misleading). Refunds are full-only. Chargebacks and refunds from Stripe are ignored. | Staff, Customer, Guard | **Stub** / **Not built** | `src/App.tsx` `handleResolveDispute` (~line 13601); `StaffDisputesPanel.tsx` (~lines 355–376); `api/stripe/webhook.ts` handles only `checkout.session.completed`, `payment_intent.succeeded`, `transfer.*`. |
| B5 | **An incident workflow for staff.** The Incidents page is a list plus "Open job". There's no status, owner, escalation, or close-out. | Staff, Customer | **Not built** | `StaffIncidentsPanel.tsx`. |
| B6 | **Real background checks and license lookup.** The Twilio, Checkr, and insurance "integrations" only report whether keys are set; no code calls those services. Background check is a manual toggle. BSIS guard-card validity is checked by eye. That's OK for launch *if* staff follow a written process. | Staff, Customer trust | **Stub** | `api/integrations/health.ts`, `src/lib/integrationProviders.ts`, `StaffGuardDetailPanel.tsx` "Mark background checked". |
| B7 | **Stripe account and payout status events.** The app doesn't hear when a guard's bank setup is incomplete or a payout fails. | Guard, Staff | **Not built** | `api/stripe/webhook.ts` ignores `account.updated` and `payout.failed`. |
| B8 | **Tax (1099) for guards.** Nothing in the app does this. Stripe Connect (Express) can file 1099s from the Stripe dashboard. *Unverified whether that's turned on.* | Guard, Finance | **Not built** in-app | `api/stripe/connect/create-account.ts` (Express, individual); no 1099 code. |
| B9 | **Staff hiring and role tools.** Applicants can't say which role they want (AUD-001). The Applications page went blank for staff@ (AUD-003/002). Only the Founder can make someone a Director, because roles can only be assigned *below* your own rank (AUD-012 is by design). | Staff | **Broken** / by design | `src/lib/permissions.ts` `getAssignableStaffRoles` ("strictly below"); AUD-001/002/003/012. |
| B10 | **Guard activation screen accuracy.** It says "3 of 5 / 80%" when all five are done, stays on "awaiting verification" or spins after the guard is Active, and leaves 14 stale "Credential Pending" alerts. | Guard | **Broken** | AUD-008/009/010/012 (guard section of DEFECTS.md). |
| B11 | **Small navigation fixes.** Save-as-draft (AUD-020); `/client/sites` (the route is really `/client/locations`, AUD-018); Downloads nav mismatch (AUD-021); guard settings copy points to nav items that don't exist (AUD-010). | Customer, Guard | **Broken** / **Not built** | `src/lib/appNavigation.ts` `CLIENT_VIEW_FROM_SLUG` has no `sites`. |
| B12 | **Multi-guard team controls.** "Approve full team", "Deny full team", and "Apply as team lead" are built but never connected, so they never appear. | Customer, Guard | **Broken** (not wired) | `ClientDashboard` props `onApproveFullTeam`/`onDenyFullTeam`, `GuardDashboard` `onApplyAsTeamLead`: none are passed from `src/App.tsx`. |
| B13 | **Staff can't assign or reassign a guard on an existing job.** They can only pick a guard when creating a new job. | Staff | **Not built** | `StaffJobDetailPanel.tsx` (Approve/Decline/Cancel only); `StaffCreateJobForm.tsx` `assignGuardId`. |
| B14 | **PPO companies can't run their own crew.** The roster only adds existing marketplace guards. There's no invite/onboard for the company's own guards, no dispatch, and Live ops is view-only. | Customer – PPO | **Not built** | `SecurityCompanyRosterScreen.tsx`, `SecurityCompanyOperationsScreen.tsx` (one "Open job" button). |
| B15 | **Business and PPO team logins.** "Authorized contacts" are just names and phones. A business can't give a site manager their own login. | Customer – Business/PPO | **Not built** | `src/lib/clientAuthorizedContacts.ts`. |
| B16 | **Server-side error monitoring.** Sentry only runs in the browser, and only if `VITE_SENTRY_DSN` is set (*unverified whether it's set*). API failures go only to `console.error`. | Ops | **Partial** | `src/lib/sentry.ts`; `api/*`. |
| B17 | **Google Play publication.** The build scripts exist. The release keystore, Firebase config (`google-services.json` exists only as `.example`), a data-deletion URL, and (for new accounts) 14-day closed testing are still needed. *Current Console status unverified.* | Guard, Customer, Staff | **Not built** (release) | `docs/GOOGLE-PLAY.md`; `android/app/google-services.json.example`. |
| B18 | **Staff "create ticket for a user".** It's built, but it's never connected to StaffDashboard. | Staff/Support | **Broken** (not wired) | `StaffDashboard` prop `onCreateSupportTicket` not passed from `App.tsx`. |

## (C) Nice-to-have

| # | Item | Who | Status | Evidence |
|---|---|---|---|---|
| C1 | iOS app. Capacitor iOS is a dependency, but there's no `ios/` project. | Guard, Customer | **Not built** | repo root |
| C2 | "Duplicate / post again" and "Extend shift now" for clients. | Customer | **Not built** | no controls found |
| C3 | Analytics export and date filters (analytics is view-only; only the payout CSV exports). | Staff | **Not built** | `StaffAnalyticsPanel.tsx`; `StaffPaymentsPanel.tsx` has "Export payouts CSV" |
| C4 | Captcha / bot protection on sign-up. | Ops | **Not built** | no captcha libs |
| C5 | Accessibility review. There are 272 `aria-label`s, but no audit has been done. | Everyone | **Unverified** | — |
| C6 | Remove dead code. About 30 components are never shown (e.g., `StaffReportsPanel` even though the guide promises a Reports panel, `StaffBulkActionsBar`, `GuardShiftAuditDisputes`, `ClientSelfAuditConfirm`, `LandingSections`). | Eng | Cleanup | `PAGE-INVENTORY.md` appendix |
| C7 | Label the money tiles on Staff Payments (they're bare $ numbers). | Staff | UX | `staff-payments-tour.png` |
| C8 | Break up the 14,837-line `src/App.tsx` into real routes (see Section 4). | Eng (speed/safety) | Structural | `src/App.tsx` |

## Top 5 to fix first

1. **Get production and CI back up (A1).** Settle the Vercel and GitHub Actions billing or plan, then confirm guardr.co returns 200 and CI runs.
2. **Move login and data access to the server (A2), and lock the money endpoints (A3).** Use Supabase Auth for every account, real database rules per role, and server-computed amounts. Protect payout, refund, and checkout with a verified session.
3. **Stand up staging with Stripe test mode, plus a staff "mark paid / waive" (A4).** Then run the full pay → apply → clock-in → complete → review → payout loop once, with the Business gate fixed (A5) and a working app path (A6 / merge #1031, #1015).
4. **Add a server job for job expiry and auto-payouts (A7 + A8).** One scheduled job that closes stale Open jobs, blocks paying after end time, and releases due payouts without a staff tab open.
5. **Password reset + email notifications (A9), sticky one-role clears (A10), and the city-cap control (A13).** These are what stop real people from signing in, staying in, and getting staffed in Sacramento.

---

## 4. Two-way platform gaps

Your instinct is right, with one nuance. The *client* side is fairly rich. The *guard* side is mostly "respond to what the client does." *Staff* has many screens where you can look but only do a few things. Every role's actions also funnel through a handful of giant components and URL settings (query parameters), not dedicated pages.

### 4.1 What each role can DO vs only VIEW (verified in code)

**Guard** (actions passed into `GuardDashboard`, plus `permissions.ts`)
| Capability | Status |
|---|---|
| Apply to a job (slide), accept or decline a direct request | ✅ `GuardJobDetailContent.tsx` |
| Counter-offer on price | ✅ **only** on "open contract" jobs (`PriceNegotiationPanel`) |
| Message the client in job chat; guard community chat; support tickets / "File a report" | ✅ |
| Arrive (GPS), start with self-audit, breaks, mid-shift check-ins, incident report, activity report, complete, geofence-leave alert | ✅ `GuardActiveShift.tsx`, `GuardIncidentReportModal.tsx`, `shiftGeofence.ts` |
| Approve overtime; dispute an audit violation | ✅ (violation dispute lives under Performance → violation detail) |
| Rate the client after a shift | ✅ `GuardRatingModal` (saved into the job audit) |
| Set a minimum rate and job preferences | ✅ `UserProfileScreen` "Minimum hourly rate", `GuardPreferencesScreen` |
| Set availability | ⚠️ **Device-only** (B1) |
| Withdraw an application / call off an accepted shift | ❌ Not built (B2) |
| Apply as team lead | ❌ Built but not connected (B12) |
| Dispute a payout or a client's rating; see a payout failure; download a 1099 | ❌ Not built |
| Do any of this on the website after activation | ❌ Sent to the app (A6) |

**Customer – Personal / Business** (`ClientDashboard` + `ClientJobActionsPanel`)
| Capability | Status |
|---|---|
| Post a job (9 steps), edit, cancel, approve/decline a guard applicant, direct-request a specific guard, favorites/"Rebook a guard" | ✅ |
| Pay (Stripe; Square code also exists), pay overtime, pay a schedule extension, tip at review, rate the guard, report a violation, request a replacement, confirm start/end checkpoints | ✅ (payment is unsafe: A3) |
| Message the guard in job chat; support | ✅ |
| Multiple sites | ✅ Locations/Sites (`client_locations`) |
| Save a draft; duplicate a past job; extend a shift now | ❌ (AUD-020, C2) |
| Dispute anything except overtime; ask for a refund | ❌ (B4) |
| Recurring schedule | ⚠️ Stub (B3) |
| Team members with their own logins | ❌ (B15) |
| Approve/deny a full multi-guard team | ❌ Built but not connected (B12) |
| Business: post a job at all | ❌ Blocked (A5) |

**Customer – PPO (security company)**: same client screens plus **Roster** and **Live ops**.
| Capability | Status |
|---|---|
| Add or remove *marketplace* guards on its roster; direct-request them; post overflow jobs | ✅ |
| Onboard its own employees; dispatch its own guards to its own client sites; schedule board; message all on duty | ❌ (B14) |
| Live ops actions | ⚠️ View plus "Open job" only |

**Staff** (ladder in `src/lib/permissions.ts`: Support ⊂ Moderator ⊂ Administrator ⊂ Manager ⊂ Director ⊂ Founder; there's also a Finance side seat)
| Role | Can act on | Can only view / can't do |
|---|---|---|
| **Support** | Support inbox and messages (reply, change status, delete resolved) | Incidents and violations are view-only; can't approve anyone; can't open a ticket on a user's behalf (B18) |
| **Moderator** | + approve/deny guard and customer applications, request revisions, one-role holds (Ignore/Block, but Ignore doesn't stick: A10) | Stats view only |
| **Administrator** | + verify/reject credentials, approve/decline job offers, suspend, trusted status, overtime disputes (waive/uphold/adjust), locations, settings, integrations (toggle only) | Can't upload or waive a missing customer credential (AUD-009); can't assign or reassign guards (B13); incidents have no workflow (B5); general dispute buttons move no money (B4) |
| **Manager** | + payouts (release, full refund), platform fees, staff compensation, audit log, recommend cities | No mark-paid/waive (A4); no partial refund; can't edit city caps |
| **Director** | + open/close city markets, city managers, staff below Director | Can't create Directors (AUD-012, by design); can't raise the staff cap (A13); can't remove a same-rank peer (AUD-011) |
| **Founder** | + manage Directors/Founders, governance | Same missing money and job tools as above |

**Important:** all of these staff permissions are checked **only in the browser** (A2). Anyone who edits their local session or uses the public database key gets past them.

### 4.2 Where many actions funnel through one shared route or component

| Funnel | What happens | Evidence |
|---|---|---|
| **One 14,837-line `src/App.tsx`** | Holds all state and ~170 action handlers for every role; every screen gets its actions passed down from here. One mistake can affect all roles, and handlers get forgotten (B12, B18). | `src/App.tsx` |
| **A hand-built router with ~26 URL settings (query parameters)** | Pages are really "one page plus settings": `g, c, j, ci, t, edit, gtab, pf, pg, dr, tc, jc, st, sec, sm, mtab, aq, chat, inv, jt, cj, bt, gj, auth, ar, ct`. For example, `/guard/map?sec=support&bt=available` or `/client/settings?bt=available`. | `src/lib/appNavigation.ts` `parseNestedRoute` |
| **Silent fallbacks** | An unknown `/client/<x>` returns "no route" → Home (AUD-018). A client view not allowed for your account type → Home (`resolveAllowedClientView`). An unknown `/guard/<x>` is treated as a guard ID and opens the **Map**. A blocked website route → `/account` plus a toast (A6). | `appNavigation.ts` ~lines 440–452; `clientCapabilities.ts`; `App.tsx` ~line 2315 |
| **Guard "Map" is the home for everything** | Job detail (`?gj=`), direct requests, replacement offers, the active shift (arrive/start/audit/incident/complete), and team slots are all overlays on `/guard/map`, not their own pages. | `GuardDashboard.tsx` ~lines 1366–1520 |
| **One `ClientJobActionsPanel` (1,156 lines)** | Pay, Square pay, approve/decline guard, overtime approve/dispute/pay, schedule change approve/reject/pay, message, complete, rate, tip, violation, replacement, and edit all live in one component. It's reused in the jobs list, the map, and the live shift. | `src/components/client/ClientJobActionsPanel.tsx` |
| **Staff: one `/staff/:section` switch for ~34 sections** | All inside `StaffDashboard.tsx`. `/staff/applications` alone combines nine queues via `?aq=` (accounts, guard/staff/client accounts, job offers, schedule changes, applications, credentials) **plus** one-role holds. | `StaffDashboard.tsx` ~lines 856–1421; `appNavigation.ts` `staffApprovalQueue` |
| **Personal / Business / PPO = one client app with items hidden** | The same screens with feature flags (`clientCapabilities.ts`). Business and PPO needs (teams, contracts, dispatch) aren't separate products. | `src/lib/clientCapabilities.ts` |
| **Messages and Support shared across roles** | The same components, switched by `?sec=support|reports&sm=compose|report`. | `appNavigation.ts` |

### 4.3 Recommended target structure (✅ exists today · ⚠️ partial/stub/broken · ❌ missing)

**Guard app**
| Page | Today |
|---|---|
| Onboarding & credentials (`/guard/activation`) | ⚠️ exists; stale progress (B10) |
| Job board (list + map) | ✅ `/guard/map`, `/guard/my-jobs?bt=available` |
| **Job detail page** (apply, counter, withdraw) | ⚠️ overlay only (`?gj=`); no withdraw |
| **My schedule / upcoming shifts** (call-off, swap) | ⚠️ `/guard/my-jobs?bt=scheduled`; no call-off |
| **Active shift page** (clock-in, geofence, breaks, incidents, patrol log) | ⚠️ overlay on the map, not its own page |
| Messages & support | ✅ |
| Earnings & payouts (history, failures, 1099) | ⚠️ `/guard/payments`; no failures or 1099 |
| Availability | ⚠️ device-only (B1) |
| Preferences, performance, vehicle, profile | ✅ |
| Disputes (payout, rating, violation) | ⚠️ violation only, under Performance |
| Account & privacy (delete account, notification channels) | ❌ |

**Customer app (Personal / Business)**
| Page | Today |
|---|---|
| Overview | ✅ |
| Post a job (with drafts) | ⚠️ no drafts (AUD-020); Business blocked (A5) |
| Jobs list + **job detail page** (applicants, pay, live, closeout) | ⚠️ one mega-panel (`?cj=`) |
| **Recurring schedules** | ❌ stub (B3) |
| Live activity map | ⚠️ map key (A11) |
| Guards directory, favorites, direct request | ✅ |
| Sites / locations | ✅ (route slug mismatch AUD-018) |
| Billing: invoices, receipts, **refunds and disputes** | ⚠️ invoices ✅; disputes overtime-only |
| Reports (Business) | ✅ view |
| **Team & permissions (Business)** | ❌ (B15) |
| Messages & support | ✅ |
| Profile & credentials | ⚠️ upload only via Edit profile (AUD-009) |
| Account & privacy (delete account) | ❌ |

**Customer app – PPO extras**
| Page | Today |
|---|---|
| Roster (marketplace guards) | ✅ |
| **Own-employee onboarding** | ❌ |
| **Dispatch / schedule board** | ❌ |
| Live ops (with actions) | ⚠️ view only |
| Client sites | ✅ |

**Staff app**
| Page | Today |
|---|---|
| Overview / SLA | ✅ |
| **Separate queues**: account approvals, credential review, job-offer review, schedule changes, one-role holds | ⚠️ all in `/staff/applications?aq=`; holds don't stick |
| Jobs (with **expire, assign/reassign, cancel**) | ⚠️ approve/decline/cancel only |
| Live map | ✅ `/staff/map` (map key A11) |
| Guards / Customers / Staff team (with **cascade delete**) | ⚠️ AUD-011 |
| **Incidents workflow** (status, owner, escalation) | ❌ (B5) |
| Violations | ✅ |
| **Disputes & refunds** (all types, partial refunds, chargebacks) | ⚠️ overtime only (B4) |
| Payments (**mark paid / waive**, payouts, refunds) | ⚠️ no mark paid (A4) |
| Platform fees, staff compensation, audit log, agreements | ✅ |
| Cities (**editable staff cap**) | ⚠️ AUD-006 |
| Permissions, settings, integrations (**real connections**) | ⚠️ integrations are status-only |
| Reports / analytics (export) | ⚠️ view only; `StaffReportsPanel` built but never shown |
| **Support: create ticket for a user** | ❌ not connected (B18) |
| **Environment / Stripe mode indicator** | ❌ |

**Website /account**
| Page | Today |
|---|---|
| Account home | ⚠️ "Open app" loops/dead-ends (AUD-013/016/021) |
| Profile, settings, documents, support | ✅ |
| Billing (client) | ✅ invoices |
| Payouts (guard) | ❌ text + a button that loops back |
| Downloads | ⚠️ PR #1033 in flight |
| Delete account / privacy request | ❌ |

---

## 5. What Guardr promises vs. what's there (from `docs/`)

| Promise (README, `docs/guardr.md`, `docs/guardr-general-guide.md`, `docs/executive-summary.md`) | Reality |
|---|---|
| Client posts → staff approves → client pays → guard applies → client approves → shift → complete → auto payout ~48h → rating | Every step has code, but it has **never been completed end to end**. Payout "auto" depends on a staff browser tab (A8). |
| Job status flow Draft → Pending → Open → Accepted → In progress → Completed → Closed | Draft exists in the type list but the client can't save one (AUD-020). Nothing moves stale jobs to Closed (A7). |
| "BSIS credential verification" | Manual staff review of uploaded photos. No automated lookup or background check (B6). |
| "Stripe Connect payments with automated guard payouts" | Connect onboarding + transfers ✅; automation ⚠️ (A8); endpoints unsafe (A3). |
| "Audit log — immutable action history" | ✅ written to `audit_log` (inserts open to anyone; updates/deletes blocked by RLS). |
| "Guard availability calendar" | ⚠️ saves on the device only (B1). |
| "Recurring shifts" (schema comment) | ❌ unused (B3). |
| "Disputes panel … resolve contested charges or conflicts" | ⚠️ overtime only; other outcomes don't move money (B4). |
| "Reports panel" (staff guide) | ❌ `StaffReportsPanel` is never shown. |
| "Push notifications" (web + Android FCM) | ✅ code present (FCM needs `FCM_SERVICE_ACCOUNT_JSON`; *unverified in prod*). |
| "CI/CD — GitHub Actions" | ❌ not running since Aug 27 (A1). |
| "Sentry scaffold" | ⚠️ browser only, env-gated (B16). |
| "Launch cities: LA, Inland Empire, OC, San Diego" (exec summary) | Out of date. Your launch market is Sacramento. |

## 6. Audit defects cross-reference (AUD-###)

| AUD | Summary | Classification | Root cause / note from code |
|---|---|---|---|
| 001 | Staff signup can't pick a role | Not built | Signup hard-sets `staffRole: 'Support'` |
| 002/003 | manager@ missing; Applications blank | Broken | Not reproduced in code review (unverified) |
| 004 | staff@ shows Inactive | Unverified | Seed checklist incomplete |
| 005 | Vercel mitigation blocked the box | Mitigated (ops) | Now superseded by 402 DEPLOYMENT_DISABLED |
| 006 | City staff cap can't be raised | Not built | `StaffCitiesPanel` display-only |
| 007 (guard) / 013 / 016 | Website requires the app | Broken (by design) | `canOpenOperationalRoute` in `App.tsx` |
| 008 | One-role clears don't persist | Broken | Conflict re-detected on every sign-in (likely) |
| 009 / 016 | Customer credential upload + Business gate | Broken | Upload only via Edit profile; gate needs URL + type + no expiry |
| 010 (guard) | Activation 3/5 vs 80% | Broken | — |
| 011 | Delete doesn't cascade | Broken | Also: staff can only manage *lower* ranks |
| 012 | Can't set Director | By design | `getAssignableStaffRoles` = strictly below own rank → only the Founder can |
| 014 | Can't start in the past | Product decision | — |
| 015 | Map "API KEY REQUIRED" | Broken | PR #1015 |
| 017 | Live Stripe only; no waive | Not built | Cash/mark-paid handlers are toast-only and never connected |
| 018 | `/client/sites` → home | Broken | Slug is `locations` |
| 019 | Jobs stay Open after end | Not built | No expiry anywhere |
| 020 | No draft | Not built | — |
| 021 | Downloads nav mismatch | Broken | PR #1033 related |

## 7. Work in flight (open PRs, as of today)

| PR | Title | State | Relevance |
|---|---|---|---|
| #1015 | Fix Map "API KEY REQUIRED" watermarks | Open (Sep 3) | A11 |
| #1031 | Restore PWA as Guard, Customer, and Staff in one home-screen app | Open (Sep 9) | A6 |
| #1033 | Download Android APKs directly from the website | Open (Sep 9) | A6 / AUD-021 |
| #1042 | Finish /fullaudit leftovers | Draft (Sep 9) | misc |
| #1030, #1025, #1010 | App naming copy; three role APKs; Sacramento marketing kit | Draft | — |

Note: with CI failing at startup, none of these PRs have automated test results.

## 8. How this was checked, and what's unverified

- **Verified in code:** every row cites a file or function. The button inventory was built by parsing all 444 `.tsx` components (TypeScript AST). I pulled every `onClick` / `href` / `onSubmit` / slide / toggle control, traced handlers to `App.tsx` or API calls, flagged no-ops and toast-only handlers, flagged optional callbacks that the parent never passes, and flagged components that are never shown. Then I checked those results against the audit reports and screenshots.
- **"Works" in the inventory means "wired in code".** It does not mean it has been proven end to end. The main loop has never completed, and production is down, so nothing could be clicked today.
- **Unverified:** live Supabase RLS policies (I didn't probe the production DB); whether `VITE_SENTRY_DSN`, `FCM_SERVICE_ACCOUNT_JSON`, and the Stripe 1099 settings are configured; Google Play Console status; the Vercel plan and the reason for the 402; the GitHub Actions failure reason; AUD-002/003/004 root causes; the exact Business-gate mismatch (A5).
