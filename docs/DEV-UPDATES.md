# Guardr Development Updates

_Internal release notes from the development team for **Director** and **Owner** roles._

**Project start:** Saturday, June 6, 2026  
**Last updated:** Wednesday, June 24, 2026  
**Total commits:** 673 across 11 active days (19 calendar days)

---

## Time summary

| Metric | Value |
|--------|-------|
| Calendar span | 19 days (Jun 6 → Jun 24) |
| Active development days | 11 days with commits |
| Your direct commits | 22 commits (~8 hours active time) |
| Total project commits | 673 (You: 22 · Cursor Agent: 520 · cursor[bot]: 131) |
| Estimated total dev time | ~92 hours (~3 days 20 hours, or ~11.5 eight-hour workdays) |

_Times below come from git commit timestamps. They reflect when work was committed, not offline planning or testing without commits._

---

## Saturday, June 6, 2026 — Project kickoff

**Contributors:** You  
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

**Contributors:** Cursor Agent, You  
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

**Contributors:** Cursor Agent  
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

**Contributors:** Cursor Agent, cursor[bot]  
**Activity:** 12:04 AM – 10:24 PM · 127 commits (9 PR merges)

### Morning (12:04 AM – 6:10 AM)

- Staff given full guard map/shift experience
- Sidebar navigation for all staff screens
- Support section (messaging staff, filing reports)
- Staff ops and guard shift unified into one dashboard
- Bottom nav replaced with sidebar for all roles
- "Dispatch" terminology removed app-wide
- Unapproved client request gates toggled then removed — platform made self-service
- Staff separated from field guards
- **Web Push notifications** for PWA added
- Vercel push API crash fixes

### Mid-morning (5:54 AM – 9:06 AM)

- BSIS qualification aligned to 2024 rules (8-hr PTA/UOF, 32-hr block for Level 2)
- Guards can add supplemental credentials
- Maps center on user location
- Credential badges: on-file vs verification pills
- Duplicate cert/license numbers blocked system-wide
- Staff click-through profiles for guards and clients
- **Supabase realtime sync** across the app
- Profile photo upload for guards and clients
- Complete Supabase schema setup SQL

### Late morning (9:24 AM – 12:38 PM)

- Director-only cash payment workflow
- Staff Payments pipeline layout
- Cash-to-Stripe deposit step
- Paid jobs locked from edits; 15-min clock-in/out windows
- Staff Jobs tab added
- Guard earnings split: cash vs Stripe

### Afternoon/evening (12:38 PM – 10:24 PM)

- **Wireframe UI redesign** — bottom task bar, flat full-screen layout
- Healthcare wireframe design system applied
- Cards only for clickable entities (guards, clients, jobs, certs)
- Staff left sidebar with sage themes
- Grey theme renamed to **Shade**
- Guard nav: My Jobs vs map for available listings
- Inactive guards blocked from working
- Payments UX redesigned with plain-language flow
- Route persistence in URL (refresh stays on page)
- Credential cards open detail view with document photo
- Guardr marketing home page restored; separate security login
- Staff Overview redesigned as operations command center
- Directors can add staff, change roles, create jobs, assign guards
- "Shift" terminology replaced with "jobs" sitewide

---

## Wednesday, June 10, 2026 — Job workflows and audits

**Contributors:** Cursor Agent  
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

**Contributors:** Cursor Agent, cursor[bot]  
**Activity:** 12:04 AM – 12:10 AM · 6 commits (3 PR merges)

- Credential photos locked after upload
- Issue date removed from credential forms
- Guards with valid guard card treated as Active for work

**No commits June 12–19 (9-day pause)**

---

## Saturday, June 20, 2026 — Payments and messaging return

**Contributors:** Cursor Agent, cursor[bot]  
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

**Contributors:** Cursor Agent, cursor[bot]  
**Activity:** 4:47 AM · 2 commits (1 PR merge)

- Staff-provisioned accounts get default password with change prompt on first login

---

## Monday, June 22, 2026 — Production polish

**Contributors:** Cursor Agent, cursor[bot]  
**Activity:** 1:26 AM – 11:31 PM · 163 commits (32 PR merges)

### Early morning (1:26 – 6:40 AM)

- Staff can edit guard profiles and manage credentials
- First/middle/last name fields added
- Account approval workflow; signup duplication fix; staff delete
- **Guard ID verification**: front/back ID + identity selfie
- Verified ID + Guard Card required before activation
- Grandfather migration removed; guards start pending until staff activates

### Morning (6:40 AM – 1:07 PM)

- Production polish: role-distinct UX, premium styling
- Push notifications aligned with SacramentoBuyNothing patterns
- Message threads open separately
- Staff approvals refactored into hub/queue/detail views
- Marketplace legal terms, privacy policy, positioning copy
- Full audit fixes + Uber-style design system
- Push API Vercel bundling fixes
- Uber-sharp design: flat edges, list rows, sage on black chrome
- Messages: live sync and contrast fixes
- Loading screen polish
- Terms and Privacy access across Guardr
- Staff team chat sync fixes

### Afternoon (12:22 – 5:47 PM)

- ID verification repositioned on profiles
- Overview visual dashboard with Guardr sage chrome
- Staff can request clearer ID/credential photos
- ID reject/resubmit flow refined
- Click-to-view modal for ID photos
- Motorola walkie-talkie chirp for notifications
- Trusted badge shown to clients
- Staff accounts moved out of guards table into dedicated staff table
- BSIS Guard Card moved to its own profile section
- Motion transitions for page changes, modals, sheets
- Unified account menu across roles
- Categorized credential viewing

### Evening (5:47 – 11:31 PM)

- Government ID expiration date and credential-style card UI
- Credential photo thumbnails on all cert cards
- Light theme readability improvements
- Profile approval vs account activation split
- 48-hour credential grace period
- Document photo proof required for all credentials
- Image save fixes: compression, realtime race blocking
- `fix_everything.sql` one-shot database catch-up script
- Staff verify buttons on each 32-hour course cert
- Optional client site briefing fields (expanded to **150+ fields**)
- Support messages and reports split onto distinct views
- Smoking area briefing section
- Forms moved to bottom sheets
- Slide-to-confirm for claim/start/end shift
- Full site audit: TS errors, cert flows, UI polish

---

## Tuesday, June 23, 2026 — Responsive overhaul, overtime, messenger

**Contributors:** Cursor Agent, You, cursor[bot]  
**Activity:** 12:24 AM – 11:35 PM · 227 commits (80 PR merges)

### Overnight/early morning (12:24 – 8:27 AM)

- Staff separated from guards table permanently
- M. White promoted to Owner
- Operations nav reorganized (Clients, Guards, Staff, chats)
- Credential UI unified (status badges, collapsible sections, Add buttons)
- Guard chat channel for all guards
- Job chats simplified
- Push subscribe crash fixes + comprehensive staff alerts
- Client pay-in-cash request with staff approval
- Owner-configurable payment modes (cash, Stripe, both)
- Grace-period guards can claim shifts
- Staff-then-client guard approval flow
- In-app workflow guide added
- Job location simplified to address + optional coordinates
- **Uber design mirror overhaul** — Waves 1–3: full responsive mobile/tablet/desktop polish
- Sidebar theme switcher (light/grey/dark)
- Cash payment flows refined (Pay guard cash, bank collection)
- On-duty timer from persisted clock-in timestamp
- Route persistence and browser back navigation hardened
- Configurable platform fee models beyond flat $5/hr

### Your commit

| Time | Update |
|------|--------|
| **3:20 PM** | **Income summary on Staff Payments screen (PR #230)** |

### Evening (5:48 – 11:35 PM)

- Overtime billing for late guard clock-out
- Guard and client approval required before overtime billing
- 15-minute clock-out window removed
- Detailed incident reports (full 5W1H capture)
- Formal overtime dispute flow
- Guard break tracking; staff shift notifications; client break config
- Full support and dispute push notification coverage
- Home page redesigned (mobile, tablet, desktop)
- Messenger UI redesigned: split-pane, reactions, reply-to, read receipts, typing indicator
- Tabbed inbox + scrollable conversation list
- Enriched client sign-up intake form with staff approval detail view
- Explicit trusted flag for guards/clients (Director/Owner only)
- Interactive workflow guide with section hub and accordions
- Fund handling restricted to Directors and Owners
- Account/job/dispute actions restricted to Administrator+

---

## Wednesday, June 24, 2026 — Today

**Contributors:** Cursor Agent, cursor[bot]  
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
| **Jun 20** | 24 | Cash payments, Owner role, messaging hub |
| **Jun 21** | 2 | Staff default password flow |
| **Jun 22** | 163 | ID verification, approvals, production polish, site briefings, bottom sheets |
| **Jun 23** | 227 | Responsive Uber overhaul, overtime/disputes, messenger redesign, workflow guide |
| **Jun 24** | 25 | Favourites, direct job requests, notifications, guard filtering |

---

## Major platform milestones

1. **Jun 6** — Project started; Guardr brand, Supabase, staff roles, self-audit foundation
2. **Jun 7** — Uber-inspired redesign; Stripe payments; PWA and cross-platform base
3. **Jun 8** — guardr.co live on Vercel
4. **Jun 9** — Sidebar navigation, BSIS compliance engine, payments pipeline, realtime sync
5. **Jun 10** — Job applications, self-audit and spot-check workflows
6. **Jun 20** — Owner role; messaging hub; director financial controls
7. **Jun 22** — ID verification, profile approval flow, production-ready polish
8. **Jun 23** — Full responsive overhaul; overtime/disputes; messenger v2; workflow guide
9. **Jun 24** — Guard favourites, direct job requests, advanced client guard filtering

---

_This document is maintained by the development team and updated with each significant release. Visible in the staff console under **Dev updates** (Director and Owner only)._
