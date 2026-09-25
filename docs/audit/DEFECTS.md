# Guardr full-system audit — defect log

Started: 2026-09-17 (PT)
Operator: Chief of Staff + role bots
Base URL: https://www.guardr.co

## Open defects

### AUD-001 — Staff signup cannot select target ladder role
- Severity: High (UX / hiring clarity)
- Role: Staff applicant (Support–Director bots)
- Repro: Sign up at `/?auth=sign-up&ar=staff` — no control to choose Support / Moderator / Administrator / Manager / Director.
- Observed: Every new staff seat is forced to `staffRole: Support`; requested role in roster still shows Support for moderator@, administrator@, director@ emails.
- Product note: Auth copy says “Support to start” and code sets `staffRole: 'Support'` on create — may be intentional, but applicants applying for a named seat cannot express intent in-app.
- Status: Open — log for product decision (add requested-role field vs keep Director-assign-only).

### AUD-002 — manager@guardr.co application missing after reported submit
- Severity: High
- Role: Manager bot / staff@ inspector
- Repro: Manager reported LA staff apply submitted; later staff@ roster inspect could not find `manager@guardr.co` (Applications page also blank).
- Status: Open — re-check after staff@ Applications page works; possible failed persist or filter bug.

### AUD-003 — Staff Applications page blank for staff@
- Severity: High
- Role: staff@guardr.co (Director QA operator)
- Repro: After Vercel bypass, Applications route blank/failed to render while Staff roster still listed pending seats.
- Status: Open.

### AUD-004 — staff@ shows Inactive while used as Director QA
- Severity: Medium
- Role: staff@guardr.co
- Observed: Logged-in UI shows Director + Inactive (ID/payout checklist unfinished per seed).
- Status: Open — confirm whether Inactive blocks approve actions.

### AUD-005 — Vercel system mitigation blocked shared box egress
- Severity: High (ops / automation)
- Observed: `x-vercel-mitigated: deny` 403 for all bots until System Bypass for `104.30.180.114` / `140.248.50.x`.
- Status: Mitigated (Markeith added System Bypass 2026-09-17); watch for IP drift.

## Passed / notes
- Vercel bypass verified HTTP 200 (2026-09-17 evening).
- Four staff apps visible pending: support@, moderator@, administrator@, director@ (Los Angeles).

## Audit coverage checklist
- [ ] Public visitor — landing + legal
- [ ] Client Personal — signup → activation → job → pay → approve guard → review
- [~] Client Business — signup + Active (Sacramento); AUD-008 hold cleared; gov ID pending; job post held; Open Customer→Downloads (see AUD-009)
- [ ] Client PPO — signup → PPO verification path
- [ ] Guard — signup → creds → activate → apply → shift → complete
- [ ] staff@ — cities, applications, jobs, credentials, guards, full /staff/* tour
- [ ] Ladder staff — each role workspace after approval
- [ ] Viewport sweep — desktop / tablet / mobile key pages

## Test accounts (audit run 2026-09-17)
| Bot | Email | Notes |
|-----|-------|-------|
| Guard | guard@guardr.co | TBD password in memory |
| Client Personal | personal@guardr.co | |
| Client Business | business@guardr.co | Active 2026-09-17 Sacramento; AUD-008 cleared; gov ID pending upload; job post held |
| Client PPO | ppo@guardr.co | |
| Staff ladder | role@guardr.co | already created |
| staff@ | staff@guardr.co | #FieldTestStaff2026 |

## Market scope (updated)
- **Required market: Sacramento only** (Markeith 2026-09-17) — not Los Angeles.
- Founder/staff@ ordered to Open Sacramento and raise/fix staff cap as needed for ladder hiring in Sacramento.

### AUD-002 update — manager@ found via self sign-in
- 2026-09-17: Manager bot signed in; staff activation / Director review in progress. Account exists despite earlier staff@ roster miss.
- Still open: why Applications/roster search missed manager@; city may still be LA until reassigned to Sacramento.

### AUD-006 — Sacramento staff cap blocks audit hires (real staff already occupy slots)
- Severity: High (blocks Sacramento-only audit)
- Observed: Sacramento at staff cap (earlier 2/2 for 4 marketplace users). Markeith notes **actual production staff** are already listed under Sacramento, so minimum slots are consumed and new ladder/audit staff cannot be added or reassigned to Sacramento without raising capacity.
- Product rule: non-executive staff count toward city cap; Directors/Founders do not; default min 2 slots per open city (+1 per 100 marketplace users).
- Needed: raise `minStaffSlotsPerOpenCity` / staff marketplace cap (or free seats) from staff@ so Support–Manager audit seats can use Sacramento.
- Status: Open — Founder/staff@ ordered to raise slots; track whether UI exposes cap controls or requires code/settings change.

### AUD-007 — Shared box Chrome session contamination across role bots
- Severity: High (audit reliability)
- Observed: Guard/Client PPO browser runs landed in another role’s staff session (/staff/overview, e.g. director@). Required clearing Guardr cookies/localStorage across shared Chrome forks; other bots may need re-login.
- Status: Open — process note: each role bot must use clean session / sign out before signup; consider separate profiles if available.

## Progress
- Guard signup PASS: guard@guardr.co, Sacramento, activation pending (2026-09-17).

## Progress
- Client Personal signup PASS: personal@guardr.co, Sacramento, pending approval (2026-09-17).

### AUD-008 — One-role policy hold locks Client Business after signup
- Severity: High (blocks Business client audit path)
- Account: business@guardr.co (Sacramento)
- Exact UI: “Both accounts are locked while a manager reviews a one-role policy hold. You can only sign out and wait — there is no switch-account. Staff will either clear the hold or block both accounts.”
- Final URL: https://www.guardr.co/client/home
- Screenshot: /workspace/guardr-audit/AUD-008-one-role-hold.png
- Needed: staff@ clear one-role hold (or document expected trigger — e.g. shared device/email with another role).
- Status: Cleared for business@ 2026-09-17 (staff@ → Active; hold gone after sign-in). Still open pattern for PPO / shared-device.

### AUD-008 update — also hits Client PPO
- Account: ppo@guardr.co (Sacramento security-company signup)
- Same one-role hold copy; blocks PPO license upload and post-signup progress.
- Final URL: https://www.guardr.co/?auth=sign-in&ar=client&ct=security-company
- Pattern: multiple marketplace signups on shared box device → one-role policy hold (likely device fingerprint / prior role accounts on same browser).

## Founder/staff@ pass (2026-09-17 evening)
- Sacramento marketplace: Open
- business@, ppo@: Pending → Active (approved); no dedicated one-role-hold panel found
- personal@: Active on Customers roster
- Staff ladder (support/moderator/administrator/director): still Pending at end of pass
- Sacramento staff cap: still 2/2 (8 marketplace users); assign Sacramento to administrator@ failed
- City manager Sacramento: none assigned
- Cap raise 8–10: NOT achievable in UI — product gap confirmed (AUD-006)

### AUD-006 update — no Founder UI to raise min staff slots
- StaffCitiesPanel displays cap but does not edit `minStaffSlotsPerOpenCity` / `marketplaceUsersPerStaffSlot`.
- Fix path: code/platform-settings default change (raising min slots), then deploy.

### AUD-006 process note
- Founder proposed freeing real Sacramento staff seats as workaround — **rejected** by Chief of Staff (Markeith wants more slots, not displacing production staff).
- Blocked on Cursor on-demand to ship code raise of `minStaffSlotsPerOpenCity` + Founder-editable control.

### AUD-009 — Client PPO credentials show Pending upload but no upload UI
- Severity: High (blocks PPO verification before first job)
- Account: ppo@guardr.co (Active, Sacramento)
- Path: Profile → Credentials — Government ID + BSIS PPO License both “Pending upload”
- Bug: No upload button / file chooser / interactive card. “Open Customer” goes to APK Downloads; `/account/documents` is Downloads.
- Also: stale one-role hold banner still visible on pre-login sign-in after hold cleared (clears after successful login).
- Status: Open

### AUD-010 — Business Active chrome labels ACCOUNT; Open Customer → Downloads
- Severity: Medium (UX / navigation)
- Account: business@guardr.co
- Observed: After Active approval, signed-in UI shows ACCOUNT (not CLIENT). “Open Customer” routes to Downloads / APK instead of in-browser client workspace (same pattern as AUD-009).
- Evidence: /workspace/guardr-audit/business-hold-cleared-check.png
- Status: Open (likely same root as AUD-009).


### AUD-006 — Guard activation progress counter inconsistent
- Severity: Medium (UX / trust)
- Role: Guard (`guard@guardr.co`)
- Repro: After submitting all five credential groups on `/guard/activation`, UI shows checkmarks/on-file for ID, COI, Guard Card, PTA/UOF, and all 9 CE courses.
- Observed: Header simultaneously reports **"3 of 5 requirements complete"** and **"80%"**. Placeholder image previews render as blank gray squares.
- Exact activation copy: "Application approved — upload and complete each credential below for staff verification." / "Staff is reviewing your credentials. Submitted items are locked until review finishes."
- Status: Open — holding for staff@ credential verify + activate.
- Reported by: Guard bot 2026-09-17 PT

### AUD-010 — Guard activation progress UI inconsistent
- Severity: Medium
- Account: guard@guardr.co
- Observed: All five credential sections show submitted/on-file/checkmarks, but header reports “3 of 5 requirements complete” and “80%”. Placeholder previews render as blank gray squares.
- Status: Open

## Progress
- Guard credentials submitted; awaiting staff verify + activate (2026-09-17).

## Ops — user purge (Markeith confirmed 2026-09-17)
Keep: Markeith White + audit *@guardr.co bots listed above. Delete all other users via staff@.

### AUD-011 — Cascade delete requirement (pending verification)
- Severity: High (data hygiene / ops)
- Requirement (Markeith): One Delete button must remove the user and **all associated data**; related records must not remain undeletable.
- Status: Open — verifying during staff@ purge; will confirm pass/fail from Founder report.

### AUD-011 confirmed gaps (purge 2026-09-17)
- Block ≠ cascade (Khalid Lovett, Rebekah DaisyAnn Brown — credentials remain)
- Same-role moderation block: Tyrone Johnson cannot be removed by Director staff@
- Full associated-data cascade unconfirmed (messages/payouts/sites/applications not on delete UI)
- manager@ missing from kept report — verify existence

### AUD-012 — Cannot set director@ to Director role
- Severity: High
- Observed: director@guardr.co Active but role combobox has no Director option; remains Support.
- Status: Open

## Progress — hire gate PASS (mostly)
- Ladder Active (director role wrong); guard@ activated; clients usable (2026-09-17).

### AUD-007 — Active guard web surfaces gated to Guard app
- Severity: High (blocks web E2E for Map/Jobs/Pay/shift)
- Role: Guard (`guard@guardr.co`, Active)
- Repro: After activation, open `/guard/map`, `/guard/jobs`, `/guard/pay`, `/guard/messages`, and other `/guard/*` routes.
- Observed: Spinner then fallback to `/guard/map?sec=support` or `/account`. Exact text: **"After activation you need the Guard app to use the platform."** `/account/payouts`: **"This feature is available in Guard"** / **"Shifts, check-in, patrols, incidents, and pay live in the Guard app — not on the website."**
- Status: Open — web audit cannot reach Map→Jobs→Pay without APK/PWA.
- Reported by: Guard bot 2026-09-17 PT

### AUD-008 — Stale Credential Pending notifications after verify
- Severity: Medium
- Role: Guard Active
- Observed: 14 unread **"Credential Pending"** notifications (e.g. "Audit Guard uploaded … for review 1H AGO") while credentials UI shows **"Verified — on file"** / **"Guardr verified."**
- Status: Open

### AUD-009 — Activation page stale after Active
- Severity: Medium
- Role: Guard Active
- URL: `/guard/activation?sec=support&bt=available`
- Observed: Still **"Upload activation credentials"**; items **"Submitted — awaiting staff verification"** despite account Active with verified creds.
- Status: Open

### AUD-010 — Settings references missing Preferences/Availability nav
- Severity: Low
- Role: Guard on `/account/settings`
- Exact copy: "Job alerts are under Preferences in the sidebar. Weekly availability is under Availability."
- Observed: Those sidebar items do not exist; direct `/guard/preferences` and `/guard/availability` redirect to `/account`.
- Status: Open

### AUD-013 — Guard web blocked after activation (requires Guard app)
- Severity: High (blocks website-only shift audit)
- Exact: “After activation you need the Guard app to use the platform.”
- Stale Credential Pending notifs + activation page still awaiting verification while Active
- Status: Open — attempting APK/PWA path for audit

### AUD-014 — Job cannot start in the past
- Severity: Medium (breaks fieldtest timing; product may be intentional)
- Exact: “Job cannot start in the past.”
- Workaround for audit: near-future start window
- Status: Open / product decision

### AUD-011 — Map tiles show "API KEY REQUIRED" in installed Guard shell
- Severity: High (ops / map unusable visually)
- Role: Guard Active (Chrome installed PWA / standalone shell)
- Repro: Install Guardr via Chrome "Install Guardr…", open `/guard/map`
- Observed: Map operations UI loads but tiles watermarked **"API KEY REQUIRED"** repeatedly.
- Status: Open — likely missing Maps API key for this deployment/env.
- Note: APK cannot run on shared Linux audit box (no Android runtime); PWA install is the working app path there.
- Reported by: Guard bot 2026-09-17 PT

### AUD-015 — Guard Map “API KEY REQUIRED” watermarks
- Severity: Medium
- Observed in installed Guard PWA /guard/map
- Status: Open

### AUD-013 update
- PWA install unlocks guard ops on desktop; APK not runnable on Linux audit box

### AUD-008 confirmed — clears do not persist
- staff@ clear → moderator@ immediately re-holds on next sign-in
- Staff ability tours paused pending fix / isolated sessions

### AUD-009 expansion — Personal client
- Job post blocked: needs Gov ID + Event Permit + Special Event Permit verified
- No upload UI on Personal profile (Pending upload only)
- Status: Open — checking staff waive/verify path

### AUD-009 confirmed — staff also cannot waive/verify Personal uploads
- No staff Upload/Verify/Waive for Gov ID pending upload
- Event permits have no credential records at all
- Job→shift audit loop blocked

### AUD-016 — Business client web blocked after activation (Customer app required)
- Exact: “After activation you need the Customer to use the platform.”
- Job post impossible on website; trying PWA workaround
- Status: Open

### AUD-012 — /guard/activation and /account/profile spinner while PWA profile works
- Severity: Medium
- Role: Guard Active (PWA shell)
- Repro: Open `/guard/activation` or `/account/profile` while credentials are available at `/guard/profile` in installed shell.
- Observed: Activation and account/profile routes remain on loading spinner; PWA `/guard/profile` shows all five credential groups Verified / on file.
- Status: Open
- Reported by: Guard bot 2026-09-17 PT

### AUD-012 update — upload path found; dummies Pending review
- Path: `/client/profile` → Edit profile → Credentials (+ Add from library); native file picker required
- Uploaded for business@: Gov ID front, Event Permit, Special Event Permit → Pending review / submitted for verification
- No Gov ID back/selfie controls in UI
- Job post still blocked until staff verify (draft Sacramento Sep 17 9–10 PM standing security reached review gate)
- Status: Waiting staff@ credential verify, then retry post


### AUD-009 / AUD-016 update — Business Verified creds still block job post (2026-09-17 ~22:10 PT)
- business@ reports staff claimed Gov ID + Event Permit + Special Event Permit Verified
- Customer PWA Review & post (step 9/9) still gates: "Upload and verify required credentials before posting this job: Government-issued ID (authorized representative), Event Permit,…"
- Draft: Event Security Detail, 123 J Street Sacramento, Sep 18 9–10 AM
- Screenshot: /workspace/guardr-audit/business-job-post-after-verify.png
- Hypothesis: (a) staff status not actually Verified, (b) job gate ignores profile Verified state, (c) gate wants distinct "authorized representative" Gov ID type vs generic Gov ID
- Status: Open — Founder/staff@ re-confirming; Business holding draft (no pay)

### AUD-017 — Live Stripe blocks audit pay (no test mode / no staff waive)
- personal@ Open job req-1789702702145 reached checkout in live Stripe mode
- Stopped per policy (no real card)
- Shift already past end (posted 8:45–9:30 PM PT)
- Need: test Stripe, staff waive/mark paid, or authorized real charge
- Status: Open — waiting Markeith decision

### AUD-009 / AUD-016 CONFIRMED — Business job gate ignores Verified profile credentials (2026-09-17 ~22:12 PT)
- Staff UI (Audit Business LLC, Active): Gov ID (authorized representative), Event Permit, Special Event Permit — all Verified
- Re-verify not needed (already Verified)
- Client Step 9 still blocks with same credential names
- Retry: NO until product fix
- Severity: High — blocks Business job→shift audit loop even after successful upload+verify
- Status: Confirmed Open

### AUD-013 confirmation (2026-09-17 evening)
- Staff@/Founder re-check: Gov ID + Event Permit + Special Event Permit all **Verified** on staff side for business@
- Client job submit still gates with required-credentials copy → **confirmed product defect**: job flow ignores verified Business profile credentials
- Action: do not retry post until product fix; hold Sep 18 9–10 AM Sacramento draft; no payment
- Status: Confirmed Open (blocked on engineering)


### AUD-017 update — Pay step skipped for now (2026-09-17 ~22:24 PT)
- Markeith: skip Stripe; continue audit without pay
- Stripe test mode deferred to new **Stripe Manager** bot (staging/preview later; production stays live)
- Job req-1789702702145 remains Open/unpaid; guard apply + shift loop still blocked until paid
- Status: Deferred (not closed)

### AUD-017 addendum — No staff waive / mark-paid for unpaid client invoice (2026-09-17 ~22:30 PT)
- staff@ Jobs: req-1789702702145 Open, unassigned, $33.75 client bill
- Payments: Needs action / Waiting on client payment — unpaid $33.75
- Closest UI (not a waive): Staff compensation → Staff payouts → Apply adjustments
- No direct waive/mark-paid on unpaid client invoice
- Screens: staff-jobs-open-unpaid.png, staff-payments-tour.png, staff-compensation-adjustment-path.png
- Status: Open (blocks audit pay bypass)

### AUD-018 — Business Customer Sites nav broken
- /client/sites redirects to /client/home
- Severity: Medium
- Screens: business-tour-*.png
- Status: Open

### AUD-015 update — Customer Activity map also shows API KEY REQUIRED
- business@ Activity → /client/map watermark
- Status: Open (same class as Guard map)

### AUD-019 — Job stays Open / payable after displayed end time (Personal)
- Job req-1789702702145: schedule ended 9:30 PM PT; still Open afterward
- UI still: “Pay for this job” / Pay with Stripe / Edit / Cancel / Schedule change…
- No explicit post-shift / expired / past-end copy
- Severity: Medium–High (stale marketplace + pay after window)
- Artifacts: PERSONAL-CLIENT-TOUR.md, personal-job-req-1789702702145-unpaid-open.png
- Status: Open

### AUD-015 update — Personal Activity map API KEY REQUIRED
- Confirmed on Personal Customer PWA Activity map

### Guard empty-state tour (2026-09-17 ~22:32 PT) — PASS with known blockers
- Jobs applied: 0; no clock-in (correct — unpaid job hidden)
- Map empty copy OK + AUD-015 API KEY watermarks
- Pay $0; Connect bank CTA works; Send to bank unavailable at $0
- Profile: all 5 creds Verified/on file
- Active; /guard/activation → map (AUD-012 spinner not reproduced this pass)
- Requires paid/assigned job: Apply, earnings history, payout send, clock-in
- Artifacts: GUARD-EMPTY-TOUR.md, screenshots/guard-empty-tour/*
- Status: Empty path OK; full shift loop still deferred (AUD-017)

### PPO continue — 2026-09-17 PT
- PPO profile shows `Government-issued ID (authorized representative)` — `Verified` and `BSIS Private Patrol Operator (PPO) License` — `Verified`.
- PPO job flow did **not** reproduce AUD-009/AUD-016: Sacramento post was allowed without a credential gate or payment wall.
- New UX defect: review control `Slide to post job offer` immediately posts (`Job posted — pending Guardr review.`); no draft-only path. The audit post was canceled immediately; no payment made.
- Customer Settings notification copy: `Browser permission: denied — enable notifications in browser settings.`
- Open Customer→Downloads renders `Download the apps` APK page while the observed browser route remained `/client/settings?bt=available` (navigation mismatch/dead-end pattern).
- Evidence: `/workspace/guardr-audit/ppo-audit-continue.md` and `ppo-tour-*.png` / `ppo-job-*.png` artifacts.

### AUD-009 / AUD-016 scope note — Business-only (PPO exempt)
- PPO Verified creds → job post allowed (no credential gate)
- Business Verified creds → still blocked at Step 9
- Status: Business gate remains Open; PPO path OK

### AUD-020 — Client job review has no draft-only path (PPO)
- “Slide to post job offer” immediately posts → “Job posted — pending Guardr review.”
- No draft-only control
- Severity: Low–Medium (UX / accidental live posts)
- Status: Open

### AUD-021 — Customer Open Downloads nav mismatch / APK dead-end
- From Customer Settings “Open Downloads” while route stays `/client/settings?bt=available`
- Shows website APK download page copy
- Status: Open (related to multi-APK / website vs PWA)
