# Guardr Development Notes

**Project start:** Saturday, June 6, 2026  
**Last updated:** Thursday, June 25, 2026  
**Total commits:** 824 across 12 active days (20 calendar days)

---

## Time summary

| Metric | Value |
|--------|-------|
| Calendar span | 20 days (Jun 6 → Jun 25) |
| Active development days | 12 days with commits |
| Markeith White direct commits | 23 commits (~8 hours active time) |
| Total project commits | 824 (Markeith White: 23 · Cursor: 801) |
| Estimated total dev time | ~92 hours (~3 days 20 hours, or ~11.5 eight-hour workdays) |

_Times below come from git commit timestamps. They reflect when work was committed, not offline planning or testing without commits._

---

## Major platform milestones

1. **Jun 6** — Project started; Guardr brand, Supabase, staff roles, self-audit foundation
2. **Jun 7** — Uber-inspired redesign; Stripe payments; PWA and cross-platform base
3. **Jun 8** — guardr.co live on Vercel
4. **Jun 9** — Sidebar navigation, BSIS compliance engine, payments pipeline, realtime sync
5. **Jun 10** — Job applications, self-audit and spot-check workflows
6. **Jun 20** — Founder role (was Owner); messaging hub; director financial controls
7. **Jun 22** — ID verification, profile approval flow, production-ready polish
8. **Jun 23** — Full responsive overhaul; overtime/disputes; messenger v2; workflow guide
9. **Jun 24** — Guard favourites, direct job requests, advanced client guard filtering
10. **Jun 25** — IC marketplace alignment: legal/COI stack, guard self-selection, auto Stripe payout, marketplace eligibility framing
11. **Jun 25 (PM)** — Ops hierarchy: two-step guard activation, Founder role, per-role guides, auth scroll fix, live SQL sync

---

## Saturday, June 6, 2026 — Project kickoff

**Contributors:** Markeith White  
**Activity:** 2:49 PM – 7:42 PM · 15 commits (4 PR merges)

| Time | Update |
|------|--------|
| 2:49 PM | Initial commit; Signature Security application initialized |
| 3:15 PM | Supabase auth integration; staff role added |
| 3:21 PM | Guard self-audit and compliance system |
| 4:00 PM | Rebrand to **Guardr**; theme system |
| 4:06 PM | Theme-based design variables |
| 4:34 PM | Staff roles and admin onboarding |
| 4:40 PM | Staff role system and landing UI |
| 4:47 PM | Mock data pruned; migrations hardened |
| 5:05 PM | Premium branding — "Guardr by Signature Security Specialist"; logo standalone mode; manifest sync; live ledger baseline cleared |
| 5:14 PM | Footer and hero URL/branding corrections |
| 6:32–7:42 PM | Merged 4 PRs: Uber-style design, guard/client split, full redesign, auth/data routing fixes |

---

## Sunday, June 7, 2026 — Major MVP build

**Contributors:** Cursor, Markeith White  
**Activity:** 1:19 AM – 10:04 PM · 30 commits (3 PR merges)

| Time | Update |
|------|--------|
| Early AM | Uber Base design styling; date/time shift scheduling |
| Early AM | Guard and client split into separate full-screen experiences |
| Early AM | Full Uber-inspired redesign (sage green theme); 3 themes (Dark, Light, Grey) |
| 11:04 AM | MVP aligned to product spec; Uber Driver-style guard map experience |
| 11:13 AM | User roles and permission-gated workflows |
| 11:14 AM | All AI/Gemini integration removed |
| 11:18 AM | Client SaaS operations dashboard rebuilt |
| 11:21 AM | Staff Operations Command Center rebuilt |
| 11:24 AM | Database schema reset (zero seed data) |
| 11:27 AM | Cross-platform foundation: PWA, theme sync, offline queue |
| 11:29 AM | Official Guardr logo assets added |
| 12:12 PM | Phantom data fix — always sync from Supabase |
| 12:24 PM | Profile screen and bottom nav for all roles |
| 1:42 PM | Staff ops navigation restored; guard staff controls |
| 3:11 PM | Certifications management on guard profile |
| 3:42 PM | **Stripe Checkout and Connect** integrated |
| 4:08 PM | Signup flow simplified (guard card auto-creates cert) |
| 5:39 PM | Home CTAs updated; state-based guard licensing |

---

## Monday, June 8, 2026 — UI polish and deployment

**Contributors:** Cursor  
**Activity:** 4:42 AM – 11:35 PM · 21 commits

| Time | Update |
|------|--------|
| 5:03 AM | Uber driver-style UI redesign; global theme applied app-wide |
| 5:55 AM | Production domain configured: **guardr.co** |
| 6:15 AM | Vercel deployment config and setup guide |
| 6:56–7:19 AM | Vercel API fixes: Express → serverless routes, lazy-load Stripe/Supabase, diagnostic routes |
| 7:52 AM | Stripe Connect platform setup clarified |
| 9:10 AM | Guard mobile layout, staff shift mode, client guard profiles fixed |
| 10:04 AM | Marketplace vs direct requests separated; full guard resume profiles |
| 10:11 PM | Badge number removed from guard profiles |
| 10:42 PM | BSIS guard cards vs training certs reworked (full CA catalog) |
| 11:35 PM | Blank screen crash fix |

---

## Tuesday, June 9, 2026 — Navigation, BSIS, payments, wireframe UI

**Contributors:** Cursor  
**Activity:** 12:04 AM – 10:24 PM · 127 commits (9 PR merges)

| Time | Update |
|------|--------|
| 12:04 AM | Staff given full guard map/shift experience |
| 12:04 AM | Sidebar navigation for all staff screens |
| 12:04 AM | Support section (messaging staff, filing reports) |
| 12:04 AM | Staff ops and guard shift unified into one dashboard |
| 12:04 AM | Bottom nav replaced with sidebar for all roles |
| 12:04 AM | "Dispatch" terminology removed app-wide |
| 12:04 AM | Unapproved client request gates toggled then removed — platform made self-service |
| 12:04 AM | Staff separated from field guards |
| 12:04 AM | **Web Push notifications** for PWA added |
| 12:04 AM | Vercel push API crash fixes |
| 5:54 AM | BSIS qualification aligned to 2024 rules (8-hr PTA/UOF, 32-hr block for Level 2) |
| 5:54 AM | Guards can add supplemental credentials |
| 5:54 AM | Maps center on user location |
| 5:54 AM | Credential badges: on-file vs verification pills |
| 5:54 AM | Duplicate cert/license numbers blocked system-wide |
| 5:54 AM | Staff click-through profiles for guards and clients |
| 5:54 AM | **Supabase realtime sync** across the app |
| 5:54 AM | Profile photo upload for guards and clients |
| 5:54 AM | Complete Supabase schema setup SQL |
| 9:24 AM | Director-only cash payment workflow |
| 9:24 AM | Staff Payments pipeline layout |
| 9:24 AM | Cash-to-Stripe deposit step |
| 9:24 AM | Paid jobs locked from edits; 15-min clock-in/out windows |
| 9:24 AM | Staff Jobs tab added |
| 9:24 AM | Guard earnings split: cash vs Stripe |
| 12:38 PM | **Wireframe UI redesign** — bottom task bar, flat full-screen layout |
| 12:38 PM | Healthcare wireframe design system applied |
| 12:38 PM | Cards only for clickable entities (guards, clients, jobs, certs) |
| 12:38 PM | Staff left sidebar with sage themes |
| 12:38 PM | Grey theme renamed to **Shade** |
| 12:38 PM | Guard nav: My Jobs vs map for available listings |
| 12:38 PM | Inactive guards blocked from working |
| 12:38 PM | Payments UX redesigned with plain-language flow |
| 12:38 PM | Route persistence in URL (refresh stays on page) |
| 12:38 PM | Credential cards open detail view with document photo |
| 12:38 PM | Guardr marketing home page restored; separate security login |
| 12:38 PM | Staff Overview redesigned as operations command center |
| 12:38 PM | Directors can add staff, change roles, create jobs, assign guards |
| 12:38 PM | "Shift" terminology replaced with "jobs" sitewide |

---

## Wednesday, June 10, 2026 — Job workflows and audits

**Contributors:** Cursor  
**Activity:** 12:13 AM – 11:58 PM · 33 commits

| Time | Update |
|------|--------|
| 12:13 AM | Job offer approvals in staff Approvals tab before client payment |
| 12:45 AM | Guard job applications with staff approval workflow |
| 12:54 AM | Executive-professional job listing details |
| 12:56 AM | Uber-style map routing and offer detail cards |
| 12:58 AM | Map tiles/routes follow app theme |
| 1:05 AM | Job detail views flattened |
| 1:19 AM | Job rehire restricted to previously worked guards |
| 1:24 AM | Stripe payout blocked when guard requested cash |
| 1:26 AM | Viewport locked — no horizontal scroll |
| 1:35 AM | Title/location editable after payment; schedule locked |
| 1:38 AM | **Self-audit flow**: staff upload, client confirm, guard can skip |
| 1:54 AM | Visible staff action buttons for job edit and audit upload |
| 2:18 AM | Overview metrics updated (active guard jobs) |
| 2:33 AM | Self-audit photos in staff/guard job views |
| 2:36 AM | Staff spot-check photo upload per job |
| 2:47 AM | Clients can view and confirm staff spot checks |
| 3:03 AM | Guardr home page copy restored |
| 11:57 PM | Guard card only required to work; 8hr/32hr training recommended |

---

## Thursday, June 11, 2026 — Credential polish

**Contributors:** Cursor  
**Activity:** 12:04 AM – 12:10 AM · 6 commits (3 PR merges)

| Time | Update |
|------|--------|
| 12:04 AM | Credential photos locked after upload |
| 12:06 AM | Issue date removed from credential forms |
| 12:10 AM | Guards with valid guard card treated as Active for work |

**No commits June 12–19 (9-day pause)**

---

## Saturday, June 20, 2026 — Payments and messaging return

**Contributors:** Cursor  
**Activity:** 1:14 AM – 9:23 PM · 24 commits (11 PR merges)

| Time | Update |
|------|--------|
| 1:14 AM | Directors can record platform fee paid in cash |
| 1:29 AM | Client cash payment separated from Stripe deposit in ledger |
| 1:36 AM | Director overview financials and operations snapshot |
| 4:24 AM | Manual coordinate entry + auto-geocode for job locations |
| 4:41 AM | Complete schema setup updated with all columns |
| 4:58 AM | Job edit save fixes (null uniform_requirements, title persistence) |
| 5:34 AM | Spot checks limited to one per job |
| 6:12 PM | **Owner role** added above Director |
| 6:30 PM | Same-role staff moderation blocked across tiers |
| 9:23 PM | **Messaging hub**, job chat, and notification controls |

---

## Sunday, June 21, 2026 — Auth tweak

**Contributors:** Cursor  
**Activity:** 4:47 AM · 2 commits (1 PR merge)

| Time | Update |
|------|--------|
| 4:47 AM | Staff-provisioned accounts get default password with change prompt on first login |

---

## Monday, June 22, 2026 — Production polish

**Contributors:** Cursor  
**Activity:** 1:26 AM – 11:31 PM · 163 commits (32 PR merges)

| Time | Update |
|------|--------|
| 1:26 AM | Staff can edit guard profiles and manage credentials |
| 1:26 AM | First/middle/last name fields added |
| 1:26 AM | Account approval workflow; signup duplication fix; staff delete |
| 1:26 AM | **Guard ID verification**: front/back ID + identity selfie |
| 1:26 AM | Verified ID + Guard Card required before activation |
| 1:26 AM | Grandfather migration removed; guards start pending until staff activates |
| 6:40 AM | Production polish: role-distinct UX, premium styling |
| 6:40 AM | Push notifications aligned with SacramentoBuyNothing patterns |
| 6:40 AM | Message threads open separately |
| 6:40 AM | Staff approvals refactored into hub/queue/detail views |
| 6:40 AM | Marketplace legal terms, privacy policy, positioning copy |
| 6:40 AM | Full audit fixes + Uber-style design system |
| 6:40 AM | Push API Vercel bundling fixes |
| 6:40 AM | Uber-sharp design: flat edges, list rows, sage on black chrome |
| 6:40 AM | Messages: live sync and contrast fixes |
| 6:40 AM | Loading screen polish |
| 6:40 AM | Terms and Privacy access across Guardr |
| 6:40 AM | Staff team chat sync fixes |
| 12:22 PM | ID verification repositioned on profiles |
| 12:22 PM | Overview visual dashboard with Guardr sage chrome |
| 12:22 PM | Staff can request clearer ID/credential photos |
| 12:22 PM | ID reject/resubmit flow refined |
| 12:22 PM | Click-to-view modal for ID photos |
| 12:22 PM | Motorola walkie-talkie chirp for notifications |
| 12:22 PM | Trusted badge shown to clients |
| 12:22 PM | Staff accounts moved out of guards table into dedicated staff table |
| 12:22 PM | BSIS Guard Card moved to its own profile section |
| 12:22 PM | Motion transitions for page changes, modals, sheets |
| 12:22 PM | Unified account menu across roles |
| 12:22 PM | Categorized credential viewing |
| 5:47 PM | Government ID expiration date and credential-style card UI |
| 5:47 PM | Credential photo thumbnails on all cert cards |
| 5:47 PM | Light theme readability improvements |
| 5:47 PM | Profile approval vs account activation split |
| 5:47 PM | 48-hour credential grace period |
| 5:47 PM | Document photo proof required for all credentials |
| 5:47 PM | Image save fixes: compression, realtime race blocking |
| 5:47 PM | `complete_schema_setup.sql` one-shot database schema script |
| 5:47 PM | Staff verify buttons on each 32-hour course cert |
| 5:47 PM | Optional client site briefing fields (expanded to **150+ fields**) |
| 5:47 PM | Support messages and reports split onto distinct views |
| 5:47 PM | Smoking area briefing section |
| 5:47 PM | Forms moved to bottom sheets |
| 5:47 PM | Slide-to-confirm for claim/start/end shift |
| 5:47 PM | Full site audit: TS errors, cert flows, UI polish |

---

## Tuesday, June 23, 2026 — Responsive overhaul, overtime, messenger

**Contributors:** Cursor, Markeith White  
**Activity:** 12:24 AM – 11:35 PM · 227 commits (80 PR merges)

| Time | Update |
|------|--------|
| 12:24 AM | Staff separated from guards table permanently |
| 12:24 AM | M. White promoted to Owner |
| 12:24 AM | Operations nav reorganized (Clients, Guards, Staff, chats) |
| 12:24 AM | Credential UI unified (status badges, collapsible sections, Add buttons) |
| 12:24 AM | Guard chat channel for all guards |
| 12:24 AM | Job chats simplified |
| 12:24 AM | Push subscribe crash fixes + comprehensive staff alerts |
| 12:24 AM | Client pay-in-cash request with staff approval |
| 12:24 AM | Owner-configurable payment modes (cash, Stripe, both) |
| 12:24 AM | Grace-period guards can claim shifts |
| 12:24 AM | Staff-then-client guard approval flow |
| 12:24 AM | In-app workflow guide added |
| 12:24 AM | Job location simplified to address + optional coordinates |
| 12:24 AM | **Uber design mirror overhaul** — Waves 1–3: full responsive mobile/tablet/desktop polish |
| 12:24 AM | Sidebar theme switcher (light/grey/dark) |
| 12:24 AM | Cash payment flows refined (Pay guard cash, bank collection) |
| 12:24 AM | On-duty timer from persisted clock-in timestamp |
| 12:24 AM | Route persistence and browser back navigation hardened |
| 12:24 AM | Configurable platform fee models beyond flat $5/hr |
| 3:20 PM | **Income summary on Staff Payments screen (PR #230)** — Markeith White |
| 5:48 PM | Overtime billing for late guard clock-out |
| 5:48 PM | Guard and client approval required before overtime billing |
| 5:48 PM | 15-minute clock-out window removed |
| 5:48 PM | Detailed incident reports (full 5W1H capture) |
| 5:48 PM | Formal overtime dispute flow |
| 5:48 PM | Guard break tracking; staff shift notifications; client break config |
| 5:48 PM | Full support and dispute push notification coverage |
| 5:48 PM | Home page redesigned (mobile, tablet, desktop) |
| 5:48 PM | Messenger UI redesigned: split-pane, reactions, reply-to, read receipts, typing indicator |
| 5:48 PM | Tabbed inbox + scrollable conversation list |
| 5:48 PM | Enriched client sign-up intake form with staff approval detail view |
| 5:48 PM | Explicit trusted flag for guards/clients (Director/Owner only) |
| 5:48 PM | Interactive workflow guide with section hub and accordions |
| 5:48 PM | Fund handling restricted to Directors and Owners |
| 5:48 PM | Account/job/dispute actions restricted to Administrator+ |

---

## Wednesday, June 24, 2026 — Favourites, payments, polish

**Contributors:** Cursor  
**Activity:** 12:05 AM – 6:11 AM · 25 commits (5 PR merges)

| Time | Update |
|------|--------|
| 12:05 AM | Client guard favourites |
| 12:08 AM | Select favourite guard when creating a job |
| 12:25 AM | Guard confirm/decline direct job requests |
| 12:59 AM | Clients and guards can notify staff on signup/submissions |
| 1:03 AM | Notify clients/guards when staff approves or declines |
| 1:11 AM | Default map center changed from NYC to Los Angeles |
| 1:19 AM | Client sign-up intake fields fix |
| 1:51 AM | Schema updated: messenger, client intake, trusted flags |
| 1:52 AM | Vercel build fix (missing markdown import) |
| 5:22 AM | Guard roster badge order restored: Approved → Active → Background checked → Trusted |
| 5:27 AM | All horizontal scroll removed — everything wraps |
| 5:34 AM | Advanced guard filtering for clients |
| 6:10 AM | Merged messenger UI, job coords badge, trusted flag polish branches |

---

## Thursday, June 25, 2026 — IC marketplace alignment

**Contributors:** Cursor  
**Activity:** 5:35 AM – 8:19 AM · 6 commits · PRs #295, #297

| Time | Update |
|------|--------|
| 5:35 AM | **Marketplace compliance (#295)** — ICA, Client Agreement, Guard Code of Conduct; versioned acceptance at signup |
| 5:35 AM | COI upload workflow; guards need verified COI to apply to jobs |
| 5:35 AM | Per-job service agreements recorded when guard is assigned |
| 5:50 AM | **Reduce control signals (#297)** — guards self-select jobs; staff placement dispute/safety only |
| 5:50 AM | Spot checks removed platform-wide |
| 5:50 AM | Card/Stripe only; auto-release ~48h; staff manual release on dispute hold only |
| 5:50 AM | Activation reframed as **marketplace eligibility** — staff still verify credentials |
| 5:50 AM | 48h self-serve grace for optional PTA/32-hr; automated lockout on expiry |
| 5:50 AM | Cash disabled platform-wide |
| 6:21 AM | `docs/guardr-general-guide.md` — **IC marketplace model** section; synced to General guide and Dev notes |
| 7:36 AM | COI added to guard activation checklist and eligibility lead copy |
| 8:15 AM | COI styled as credential row after Government ID (compact card + detail modal) |

---

## Thursday, June 25, 2026 (PM) — Ops hierarchy & live-readiness pass

**Contributors:** Cursor · PR #312

| Update | Detail |
|--------|--------|
| **Two-step guard activation** | `pending` → Moderator+ approves application → `approved` → guard uploads creds → Administrator+ verifies → Administrator+ manually activates → `active`. No auto-activation on verify. |
| **Role hierarchy** | Moderator: approve applications. Administrator+: verify credentials & activate. Director: finances + team. Founder (was Owner): platform governance. |
| **Founder rename** | Owner → Founder across UI, permissions, API session auth, SQL + migration `20260625120000_rename_owner_to_founder.sql` |
| **Auth scroll fix** | Login/signup form column scrolls on desktop side-by-side layout |
| **General guide** | **Whole app — start to finish** section; per-role guides (Moderator, Administrator, Director, Founder); guide UI filters by staff role |
| **Complete SQL** | `complete_schema_setup.sql` — single idempotent schema for the whole site |
| **Tests** | 105 passing; production build verified |

---

## Summary at a glance

| Date | Commits | Main themes |
|------|---------|-------------|
| **Jun 6** | 15 | App created, Guardr rebrand, Supabase, self-audit, themes, staff roles |
| **Jun 7** | 30 | Uber redesign, role split, Stripe, PWA, cross-platform, certifications |
| **Jun 8** | 21 | guardr.co deployment, Vercel API fixes, BSIS catalog |
| **Jun 9** | 127 | Sidebar nav, BSIS compliance, payments pipeline, wireframe UI, realtime |
| **Jun 10** | 33 | Job applications, self-audit/spot-checks, map routing |
| **Jun 11** | 6 | Credential photo locks, guard card = Active |
| **Jun 12–19** | 0 | _No commits — 9-day break_ |
| **Jun 20** | 24 | Cash payments, Founder role, messaging hub |
| **Jun 21** | 2 | Staff default password flow |
| **Jun 22** | 163 | ID verification, approvals, production polish, site briefings, bottom sheets |
| **Jun 23** | 227 | Responsive Uber overhaul, overtime/disputes, messenger redesign, workflow guide |
| **Jun 24** | 25 | Favourites, direct job requests, notifications, guard filtering |
| **Jun 25** | 6+ | IC marketplace compliance, control-signal reduction, COI checklist, ops hierarchy, Founder role, per-role guides |

---

_Visible in the staff console under **Dev notes** (Director and Founder only)._
