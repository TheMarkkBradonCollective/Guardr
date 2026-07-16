# Guardr Dev Notes

**Started:** Saturday, June 6, 2026  
**Last updated:** Thursday, July 16, 2026  
**Commits so far:** 1,200+  
**Live at:** [guardr.co](https://www.guardr.co) — currently **v1.0.68**

---

This is my running log of what shipped on Guardr. I'm building the Uber-for-security marketplace for Signature Security — clients post coverage, licensed guards pick up work on the map, staff verify credentials so the platform stays compliant. Most of the heavy lifting is Cursor agents plus my direction; timestamps below come from git when stuff actually landed.

---

## The big picture (what mattered most)

1. **Jun 6** — Kicked the project off. Guardr brand, Supabase, staff roles, self-audit foundation.
2. **Jun 7** — Uber-style redesign, Stripe in, PWA + cross-platform base.
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
| 6:32–7:42 PM | Merged 4 PRs: Uber-style design, guard/client split, redesign, auth routing |

---

## Sunday, June 7, 2026 — MVP day

Big build day — 30 commits. Uber-inspired look, guard/client split, Stripe, PWA foundation.

| Time | What shipped |
|------|----------------|
| Early AM | Uber Base styling; shift scheduling |
| Early AM | Guard and client as separate full-screen apps |
| Early AM | Full Uber redesign (sage green); Dark / Light / Grey themes |
| 11:04 AM | MVP to spec; Uber Driver-style guard map |
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
| 5:03 AM | Uber driver UI; theme app-wide |
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
| 12:56 AM | Uber-style map routing + offer cards |
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
| 6:40 AM | Full audit + Uber design system |
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

227 commits — biggest day on the repo. Uber mirror overhaul, overtime, messenger v2.

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
| 12:24 AM | **Uber design mirror** — mobile/tablet/desktop Waves 1–3 |
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
| **Jun 7** | 30 | Uber redesign, Stripe, PWA, certs |
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

