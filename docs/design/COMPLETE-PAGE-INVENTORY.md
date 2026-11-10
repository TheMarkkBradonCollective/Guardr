# Guardr Complete Page Inventory

Audit phase of the Guardr platform redesign. **Documentation only: no UI was changed.**

- **Derived from:** source code at `main` `1355600b` (PR #1084 merged as `70366f6a`; PR #1085 black web icon merged after it; both are reflected here). Docs were treated as claims to verify, not as truth. Contradictions are listed per part.
- **Companion:** [`GUARDR-REDESIGN-PLAN.md`](./GUARDR-REDESIGN-PLAN.md) (phases, workstreams, per-page tracker).
- **Method:** custom routing traced through `src/lib/appNavigation.ts`, `src/lib/productApps.ts`, `src/App.tsx`, `src/surfaces/*`, every role dashboard and nav config; permission matrices were produced by executing the real `src/lib/permissions.ts` and `staffNavAccess.ts` from a scratch copy (repo untouched). Infrastructure was checked read-only against the live Cloudflare account and the Neon project (Part E). Nothing in the app was run in a browser.
- **Row IDs:** `G-nn` guard, `C-nn` client, `S-nn` staff, `P-nn` shared/public pages, `ST-nn` shared/public states (the shared audit called these `S-nn`; renamed here to avoid colliding with staff). `X-nn` = documented but not present.

## 1. How to read the tables

Every page row records: name · route or nav id · account type · permission/gating · parent nav group · children/tabs/detail views · component files · existing functionality · **design condition** · **M / T / D / App status** · required redesign work · testing status.

| Term | Meaning |
|---|---|
| **Redesigned (PR1084)** | The component file itself was changed by PR #1084 (`git diff 07074aab 03bd8b49`). |
| **Partially redesigned** | Only shared CSS selectors or a sibling component from PR1084 reach it. |
| **Global only** | Restyled solely by the generic selectors in `src/styles/visual-refresh.css` (type scale, button size, card radius). No layout change. |
| **Outdated** | Untouched by PR1084, pre-refresh look. |
| **Duplicated / Legacy / Dead** | Second implementation of the same screen / superseded code / no importer. |
| **M / T / D** | Mobile (<744px), Tablet (744-1179px), Desktop (>=1180px) surface. `D*` = desktop code exists but is **unreachable in production** for that role (see section 3). |
| **App** | The installed Capacitor Android app. It is the **same web bundle in a WebView** (there is no separate native UI), so App status equals the mobile/tablet web status plus native chrome. |
| **UT / UT\*** | Unit test run by the `npm test` allow-list / test file exists but is **not** in the allow-list. |

## 2. Counts

| Account type / area | Rows | Notes |
|---|---|---|
| Guard (`G-01..G-99`) | **99** | 96 distinct live screens/sheets/states + 3 placeholder/duplicate rows (`G-61`, `G-68`, `G-91`). 9 primary nav destinations. 7 documented-but-absent items (`X-01..X-07`) listed separately. |
| Client (`C-01..C-58`) | **58** | 18 distinct routable `ClientView` screens; the rest are tabs, job-detail actions, forms, portal views. Personal / Business / Security-company differences in Part B section 2. |
| Staff (`S-01..S-96`) | **96** | 39 top-level (7 entry/overlay + 32 section pages incl. profile and preferences) + 57 nested detail/tab/form rows. 30 nav destinations, 8 nav groups. |
| Shared & public pages (`P-01..P-74`) | **74** | Includes 9 static HTML/files, 9 website-account views, 6 legal documents, 3 documented-but-MISSING (`P-32` password reset, `P-33` verification, `P-34` session expired) and 2 reference-only rows pointing at client rows. |
| Shared & public states (`ST-01..ST-35`) | **35** | Loading / empty / error / offline / restricted / update / session states. Missing: error boundary, 404, session expired. |
| **Total rows** | **362** (359 tracked pages: 3 guard placeholder rows are marked N/A in the plan tracker) | Role-owned pages: 253 (G+C+S). Shared/public: 109. Some behaviours appear in several rows by design (e.g. website-portal views are listed under the role that reaches them **and** under `P-62..P-70`). |

Role-specific page counts, strictly distinct routable top-level screens: Guard 13 `GuardTab` values (12 destinations + the activation gate), Client 18 `ClientView` screens, Staff 34 `StaffSection` ids (30 nav + 2 account-menu + 2 legacy aliases).

## 3. Platform facts that govern the redesign

1. **No router library.** Routing is a custom URL parser (`src/lib/appNavigation.ts`) driving state in `src/App.tsx` (14,929 lines) plus `GuardDashboard.tsx` (2,040), `ClientDashboard.tsx`, `StaffDashboard.tsx`. Detail views live in query params (`gj`, `cj`, `j`, `g`, `c`, `t`, `ci`, `pf`, `st`, `jc`, ...). Many tabs are **not** in the URL (listed per part).
2. **Three independent surface applications** resolved by `src/surfaces/surfaceKind.ts` (breakpoints 744 / 1180, `?ui=` override). Each surface has its own shell, kit, CSS layer (`surface-mobile|tablet|desktop.css`) and design scale (`surfaceDesign.ts`: min target 48/44/32, body 16/15/14, row 68/60/40). Installed shells (PWA/APK) **never** resolve to desktop.
3. **Who can actually see what (reachability).** From `websiteShellAccess` (`productApps.ts`) and `resolveWebsiteAccess` (`App.tsx`):

| Account | Plain browser tab | Installed shell (Android APK / standalone PWA) |
|---|---|---|
| Guard, active/suspended/blocked | Forced to `/account` (website portal, 8 views). `/guard/*` shows toast "You need the Guard app". | Full `/guard/*` app on **mobile or tablet** surface only. |
| Guard, pending/approved | `/guard/*`, but everything collapses to the Activation screen. | Same inactive gate. |
| Client, active/suspended | Forced to `/account`. | Full `/client/*` on mobile or tablet only. |
| Client, pending | May open a restricted `/client/*` set, including **desktop** surface. | Restricted set. |
| Staff (all seven identities) | **Full `/staff/*` on every surface**, no status check. | Full app; installed = tablet surface at any width. |

   Consequences: **all guard and client `*Desktop` code (including PR1084's desktop map inspector, invoice ledger, messages context column) is unreachable for active accounts in production**; the "desktop website" for guards/clients is the public site, auth, legal, guide and `/account` portal; staff is the only role with a real desktop product. APK manifest forces `screenOrientation=portrait`, so the tablet rail is effectively browser/PWA only.
4. **Backend:** Cloudflare Worker `guardr` (Hono) + Neon Postgres + R2. All data access goes through `POST /api/data/query`. `src/lib/supabase.ts` is a naming shim over this client; 231 "supabase" identifiers remain in `App.tsx`.
5. **Staff navigation is not the guard/client model.** Staff uses `DesktopStaffAdminShell` (misnamed: it is the staff shell on all surfaces) -> `SurfaceAppShell`; mobile is a **hamburger drawer** (no bottom tabs, no More sheet), tablet a rail, desktop a grouped sidebar. Guard/client use `RoleAppShell` (mobile bottom tabs + More sheet).

## 4. Cross-cutting findings that change the redesign scope

Ranked by redesign impact. Security and data-model findings are recorded because they change what "functional verification" must cover; they are **not** fixed here.

| # | Finding | Evidence (part) |
|---|---|---|
| 1 | Desktop UI for guard/client is unreachable in production; PR1084 desktop branches for maps/invoices/messages therefore protect nobody but pending clients and `?ui=desktop`. | Part A §1a, Part B §1a |
| 2 | Security-company clients have **duplicate nav ids** (`roster`, `operations`): the phone bottom bar shows "Live ops" twice and pushes Messages into More; same duplicates on rail, sidebar, shortcuts. Client "Jobs" never highlights (sub-nav dropped by `RoleAppShell`). | Part B §3e |
| 3 | Guard: three different allow-lists decide what an inactive guard can open (dead Guide/Profile links, dead "Edit application details"), and suspended/blocked guards usually see the Activation screen instead of a suspended screen. | Part A §3f |
| 4 | Staff: 11 nav destinations are visible to roles whose pages are blocked; gating styles are inconsistent (hidden+redirect, visible+blocked, visible+silent read-only). Nav notification dots, sidebar create CTA, `StaffSidebarNav`, tablet quick strip are dead code. | Part C2 §3d, C1 §6 |
| 5 | **Identity/permissions are client-asserted:** `/api/data/query` accepts a self-asserted `x-guardr-session` and has no role checks; `/api/auth/signup` has no caller authentication; login ignores account status; legacy rows with no password accept any 4+ character password. Staff permissions are UI-only. Redesigned permission screens must not imply enforcement that does not exist. | Part C2 §2i, Part D §1a |
| 6 | No safety nets: no forgot-password, no verification, **no error boundary**, **no 404 page** (Worker returns the SPA with HTTP 200), no session-expired screen. | Part D §3 |
| 7 | The landing is one component (`MobilityStyleLandingPage`) rendered three ways; the older `LandingSections.tsx` and the Founder/Director homepage messages are dead. "Safety" and "Company" nav items both open sign-in (no pages exist). | Part D §2a, §6 |
| 8 | Website APK download is partly broken: `*.apk` is excluded from the Worker upload and `version.json` `apkUrl` is the relative `/download/guardr.apk`, which the Worker answers with HTML (the GitHub-release direct URLs work). Per-role `/manifests/*.webmanifest` referenced by `sw.js` and `pwaManifests.ts` do not exist. | Part D §3 (`ST-21`), Part E |
| 9 | Data that looks server-side is device-local (guard availability, payout invoice list, shift phase); the crew feature is gone from the UI but remains in docs and 5 nonexistent test entries in `npm test`. | Part A §11 |
| 10 | Test coverage of signed-in UI is zero: 3 e2e specs, all unauthenticated; 39 of 183 test files are not in the `npm test` allow-list; 6 entries in `npm test` point at files that do not exist (5 removed crew tests, `uberBaseTheme`). Screenshot tooling intercepts Supabase URLs (`**/rest/v1/**`, `**/auth/v1/**`) that the app no longer calls. | Part E §E6 |
| 11 | Sensitive internal documents (business plan, company package, `DEV-UPDATES.md`) are bundled into the main JS for every user; staff-only guide sections are in the public `/guide`. | Part C1 §11, `P-15` |

---



## Part A. Guard account type

*Guard account type - source audit (read-only) - FINAL (sections 1-11)*

Repo `/agent/repos/Guardr`, branch `cursor/redesign-audit-plan-a787`. Paths relative to repo root unless absolute.
Method: source only (docs not trusted). `node_modules` absent, nothing executed; nav tables are hand-derived by tracing `GuardDashboard.tsx` -> `RoleAppShell.tsx` -> `src/surfaces/surfaceNavigation.ts` -> `MobileAppShell/TabletAppShell/DesktopAppShell`.
Abbreviations: M/T/D = mobile / tablet / desktop surface. App = Capacitor Android Guard app (same web bundle in a WebView, role baked via `window.__GUARDR_NATIVE_PRODUCT_APP__`; no separate native UI).

---

### 1. Route model (guard)

Custom router in `src/lib/appNavigation.ts` (`parseAppRoute`, `buildAppPath`, `GUARD_TAB_FROM_SLUG`, `GUARD_TAB_TO_SLUG`, `normalizeGuardTabForAccount`). State lives in `src/App.tsx` (`guardTab`, L924; guard branch L14218-14430; `setGuardTab` L1311) and `GuardTab` in `src/components/GuardDashboard.tsx` L276. App.tsx is 14,929 lines; GuardDashboard.tsx 2,040.

| Slug (`/guard/<slug>`, alias `/app/guard/<slug>`) | GuardTab | Notes |
|---|---|---|
| (none) `/guard` | map | default |
| `map` | map | "Field" in nav, title "Map" |
| `activation` | activation | has NO case in `GuardDashboard` render: it is the `AccountPendingScreen` gate (`showPendingGate`) and the App-level inactive gate |
| `my-jobs`, `jobs` | myJobs | nav "Shifts", title "Jobs"; written back as `my-jobs` |
| `earnings`, `pay`, `payments` | earnings | nav "Pay", title "Payments"; written back as `payments` |
| `messages`, `guard-chat` | messages | `guardChat` tab value is an alias, normalised to `messages` in 4 places |
| `support` | support | |
| `profile` | profile | |
| `settings` | settings | |
| `guide` | guide | |
| `preferences` | preferences | nav "Preferences" |
| `performance` | performance | nav "Standing", title "Performance" |
| `availability` | availability | nav "Schedule", title "Availability" |
| `vehicle` | vehicle | nav only if driver's licence on file (`guardVehicleTabVisible`); route works regardless; renders nothing if `onSaveVehicle/onSubmitVehicle` missing |
| `/guard/<anything-else>` | map + `guardId=<slug>` | `AppRoute.guardId` is parsed but never read in `App.tsx` for guards (dead param); unknown slugs silently open map |
| `/messenger?role=guard` | messages, `messengerCompanion` | Messenger companion; `MESSENGER_GUARD_TABS` (`src/lib/messengerCompanion.ts`) = messages, support, settings, profile, guide; `constrainGuardTabToMessenger` maps everything else (incl. activation) to messages. Nav shows only Messages + Support |

Nested query params (guard): `bt` browse/jobs tab `available|scheduled|completed|missed` (`GuardJobsBrowseTab`); `gj` selected job id (kept only on map and myJobs); `jc` job-chat request id; `chat=1` open job chat immediately; `st` support ticket id; `sec` (`support|reports`); `sm` (`compose|report`) support form pages; `pf` performance factor id (`PerformanceFactorId`, only on performance); `tc` team chat id and `mtab` are parsed globally but staff-only (guard UI does not use `tc`). Ephemeral keys stripped on sync: `payment, job_id, deposit, stripe_connect, tip, overtime`. Last route persisted in sessionStorage `guardr_last_app_route` (role-checked).
NOT in URL (lost on reload): activation checklist section / open upload sheet, Profile tab (profile/certs/inventory/timesheet; `GuardProfileTab` type exists in appNavigation.ts but no param parses it), Availability month/day, Preferences job-type sheet, performance modality/job-type metric detail, contract-violation detail, rewards sheet, Stripe Connect sheet, every shift modal (self-audit, briefing gate, end checkpoint, late clock-out, incident, activity log, rating), manual pre-shift briefing sheet (`manualBriefingJobId`), Messages sub-tab (job/team/guardr) beyond `jc/st/sec`, map status filter (`mapStatusFilter`; partially mirrored by `bt`).

Other route families touching guard: `/account[/view]` website account portal (views `home, profile, payouts, downloads, settings, documents, support`; `billing` is client/staff; guard's nav item is `payouts`), `/guide` public guide (browser only; installed shells close it), `/legal/*`, `/?auth=sign-in|sign-up&ar=guard`, native deep-link scheme `guardr-guard://`, appId `com.tmbcworks.guardr.guard` (`src/lib/productApps.ts`).

#### 1a. Where a guard can actually be (browser vs installed) - `websiteShellAccess` (`src/lib/productApps.ts` L291), `resolveWebsiteAccess` (`App.tsx` L2074), `canOpenOperationalRoute` (L764)
| Guard `user_status` | Plain browser tab | Installed shell (Capacitor / baked native flag / standalone PWA) |
|---|---|---|
| `pending`, `approved` (not yet active) | access `activation`: may open `/guard/*`, but every tab except settings/support(approved only) normalises to `activation` (Activation checklist). Default landing `/guard/activation` | access `operations` (installed always), same inactive gate in `App.tsx` |
| `active` | access `account`: forced to `/account` (website portal) with toast "You need the Guard app to use the platform." | full `/guard/*` app, surface = mobile or tablet only (`resolveSurfaceKind` never gives installed shells desktop; PWA `shellKind==='pwa'` also counts) |
| `suspended`, `blocked` | access `account` (`/account`) | `operations`, BUT App-level inactive gate shows the Activation/"Application under review" screen (not the suspended card) except when tab=settings/support/guide, where `GuardDashboard` shows "Account Suspended/Blocked" card |
Consequences: (1) every guard desktop surface (`GuardMyJobsDesktop`, `GuardEarningsDesktop`, desktop map inspector) is reachable only by pending/approved guards in a desktop browser (who see only the Activation screen), by `?ui=desktop` override, or dev preview. Active guards never see guard desktop UI in production. (2) Tablet is the only larger guard surface in production (Android tablet; but manifest forces `screenOrientation=portrait`, see foundation notes).
Staff-as-guard: `isGuardNavUnlocked` / `getGuardUserStatus` have `isStaff` branches, but staff users resolve to `role='staff'` (`appRoleForUser`), `routeMatchesUser` blocks `/guard/*`, and `GuardDashboard variant="embedded"` (props `shiftTab`, CSS `.guard-staff-embedded`) is mounted nowhere. `guardWorkBlockedMessage` returns "Staff accounts cannot work field jobs." Staff-as-guard is therefore dead code.

---

### 2. Gating matrix (guard)

Rows = guard state; cells = what the guard can reach. "Gate" = where enforced. Statuses: `GuardUserStatus` = pending | approved | active | suspended | blocked (`src/lib/accountStatus.ts`; `getGuardUserStatus`). `inactiveGuard` = `isInactiveGuardSession` = guard row exists, not `isStaff`, status != active.

#### 2a. Account-status gating
| State | Field/Jobs/Pay/Messages/Support nav | Reachable tabs | Screen shown | Gate (file) |
|---|---|---|---|---|
| no guard row for session | none | none | card "We could not load your guard profile." | `App.tsx` L14218 guard branch |
| `pending` | none (nav arrays emptied) | settings only (+ guide at App gate, but router rewrites it - see 3f) | `AccountPendingScreen` ("Application under review" / "Upload activation credentials" / "Update your application" when revision requested) | `normalizeGuardTabForAccount` (`appNavigation.ts`), `App.tsx` L14246 gate, `GuardDashboard.accountNeedsActivation` |
| `approved` | none | settings, support (only here), activation | `AccountPendingScreen` with "Contact support" / "Open activation support chat" button (`openGuardActivationSupport`, `App.tsx` L1560) | same |
| `active` | full (3a) unless a sub-gate below applies | all 14 tabs | normal app | `isGuardNavUnlocked` |
| `suspended` | none | settings/support/guide only reach `GuardDashboard` ("Account Suspended" card); every other tab hits the App-level inactive gate and shows the Activation screen | mixed (see 1a, 3f) | `App.tsx` L14246, `GuardDashboard` suspended card |
| `blocked` | none | same as suspended; card "Account Blocked" | mixed | same |
| staff user "as guard" | n/a | impossible (`routeMatchesUser` blocks `/guard/*` for role staff); `guardWorkBlockedMessage` = "Staff accounts cannot work field jobs." | dead code | 1a |
| browser + active/suspended/blocked | n/a | redirect to `/account` | website account portal | `websiteShellAccess` |

#### 2b. Active-guard sub-gates (inside the app)
| Gate | Condition (source) | Effect |
|---|---|---|
| Work-blocked banner on Field | `guardWorkBlockedMessage` (`src/lib/guardQualification.ts` L97): ID not issued in job state, vehicle/insurance block (`guardInsuranceBlockedMessage`), or active guard lost credentials | amber banner on map; job apply/accept disabled (`guardCanWorkFieldJobs`) |
| Credential-expiry restriction | `isGuardCredentialExpiryRestricted` (`guardCredentialExpiryEnforcement.ts`): `credentialExpiryRestricted` flag on guard | Work-blocked text "Account restricted - a required credential expired..." + `GuardCredentialGraceBanner` (GuardDashboard L1372; "Open credentials" -> Profile) |
| Vehicle tab | `guardVehicleTabVisible` = driver's licence ID on file | nav item appears/disappears; route `/guard/vehicle` remains valid |
| Driving performance modality | `guardDrivingPerformanceVisible` (approved vehicle + valid insurance) | Standing/Driving tabs in Performance; driving-only job-type metrics |
| Shift trip lock | `showShiftOverlay` (accepted/in-progress job on Field) | bottom nav + rail hidden (`hideBottomNav`/`hidePrimaryNav`); effect forces tab to map/messages |
| Armed-only jobs | `guardQualification` / `GuardJobDetailContent` qualification checklist (armed status, weapon gear, guard-card scope) | checklist rows red; slide-to-apply disabled; `GuardArmedStatusPill` on Profile |
| Tier / premium priority | `guardTierJobPriority.ts` (`PREMIUM_GUARD_PAY_PER_HOUR`) and `guardPremiumJobPriority.ts` (`PREMIUM_GUARD_PAY_THRESHOLD`) both = $35/h, defined twice | tier changes match score and open-job NOTIFICATION timing only (elite 0 min ... starting 15 min stagger; premium jobs shorter stagger), not visibility; no UI explains it except Performance tier hero + rewards |
| Direct request vs marketplace | `GuardJobDetailContent` | direct request shows Accept/Decline; marketplace shows slide-to-apply; open-contract jobs show `PriceNegotiationPanel` |
| Multi-guard slot | `GuardJobSlotPanel` | team roster, "Team invitation" accept/decline, `TeamGuardInvitePicker`, `SuggestGuardPicker`; schedule-conflict message |
| Pre-shift window | `isPreShiftBriefingWindowOpen` / `canGuardStartEnRoute` / `enRouteBlockedMessage` (`preShiftBriefing.ts`) | en-route slide blocked before window; post-orders ack required |
| Briefing acknowledgement | `guardMustAckBriefingOnSite` (`briefingAck.ts`) | `GuardBriefingAckGate` blocks "start job" if arrived without reading briefing |
| Guard community chat | `canPostToGuardChat` (`guardMessenger.ts`) | read-only until active |
| Messenger-only APK | `messagesOnly` (`messengerCompanion`) | nav = Messages + Support; header copy "Job chats and Guardr support" |
| Tutorial/demo | `tutorialDemoData.ts`, `TutorialExperience` (`guard-welcome`, 15 steps) | demo job card on map; tour; one tour target missing (see 6) |
| Legal gate | `marketplaceLegalGate` (`App.tsx` L13720) | `LegalAcceptanceModal` blocks everything until accepted |
| Forced password change | `ChangePasswordPrompt` (`App.tsx` L13733) | modal driven by `passwordChangePromptOpen` (trigger not traced; presumably temp-password accounts) |
| Stripe payout gate | `GuardStripeConnectSheet` ("Connect your bank" / "Finish bank setup"); `getConnectAccountStatus.payoutsEnabled` | "Send to my bank" disabled until connected; Stripe return triggers `stripe_connect=success|refresh` handler (`App.tsx` L12852) |
| Application lock | `guardIntakeLocked` in `UserProfileScreen` | Profile fields locked after submission ("Application locked" chip); unlocked on "Revision requested" |

---

### 3. Guard navigation per surface (derived)

Source: `GuardDashboard.tsx` L1316-1333 (`GUARD_PRIMARY_NAV`, `GUARD_MESSAGES_NAV`, `GUARD_MANAGEMENT_NAV`), L2007-2035 (`RoleAppShell` props), `RoleAppShell.tsx` (`build()` sections "Field" / "Messages" / "Account"), `surfaceNavigation.ts`. Capacity (`surfaceDesign.ts surfacePrimaryNavCapacity`): mobile 5, tablet 9, desktop unlimited. `mobileTabRanks = {map:1, myJobs:2, messages:3}`; Support has no rank, falls to 4th by list order (index+1000 wins over later items).

#### 3a. Source list (active guard, in order) - ids -> nav label -> page title
| # | Section | id | Nav label | Page title (`GUARD_TAB_TITLES`) | Gating |
|---|---|---|---|---|---|
| 1 | Field | `map` | Field | Map | active |
| 2 | Field | `myJobs` | Shifts | Jobs | active |
| 3 | Messages | `messages` | Messages | Messages | active |
| 4 | Messages | `support` | Support | Support | active |
| 5 | Account | `availability` | Schedule | Availability | active |
| 6 | Account | `preferences` | Preferences | Preferences | active |
| 7 | Account | `performance` | Standing | Performance | active |
| 8 | Account | `vehicle` | Vehicle | Vehicle | active AND driver's licence on file (`guardVehicleTabVisible`) |
| 9 | Account | `earnings` | Pay | Payments | active |
Not in nav (reached via account menu / footer / in-page links): Profile, Settings, Guide, Activation, Notifications, Download app, Sign out; all detail pages.
Rules that blank the nav: `messagesOnly` (Messenger APK) -> only Messages + Support; `accountNeedsActivation` (status != active) -> `navItems=[]`, `overflowNavItems=[]`, `messagesNavItems=[]` (no nav at all; Support is reachable only via the "Contact support" button on the Activation screen for `approved` guards); `showShiftOverlay` (an accepted/in-progress job on Field) -> `hideBottomNav` (tabs hidden, trip lock: effect forces tab back to map/messages).

#### 3b. Mobile (`MobileAppShell`, `mobilePrimaryNav="tabs"`)
| Position | Destination | Notes |
|---|---|---|
| Tab 1 | Field (map) | rank 1 |
| Tab 2 | Shifts (myJobs) | rank 2 |
| Tab 3 | Messages | rank 3 |
| Tab 4 | Support | unranked, wins by list order |
| Tab 5 | More | opens `MobileSheet` "More" |
| More sheet, group "Account" | Schedule, Preferences, Standing, [Vehicle], Pay | in that order; then footer (`SidebarFooterLinks`): "Account settings" + legal links (Terms, Privacy, ICA, Client Agmt, EEO, Conduct) |
Account sheet (avatar in header; bell for notifications): Profile (hidden when `accountNeedsActivation && !revisionOpen`), Notifications, Settings, Guide (extra link), Download/Install app, theme toggle, Sign out. Header title = page title; status line not shown on mobile shell. Hidden during active shift overlay. `More` highlights when active id is one of the overflow ids.
Mobile defects: Pay (money) is two taps deep while Support holds a tab; Profile/Settings/Guide are only in the avatar sheet; Standing/Schedule/Preferences are 3 separate More rows for what are performance/availability/job-type settings.

#### 3c. Tablet (`TabletAppShell`)
Persistent labelled left rail (expanded in landscape, collapsed icon rail in portrait, toggle at foot), sections in order: **Field** (Field, Shifts) / **Messages** (Messages, Support) / **Account** (Schedule, Preferences, Standing, [Vehicle], Pay); rail foot = `SidebarFooterLinks` (Account settings + legal). No quick-switch strip is rendered even though `RoleAppShell` marks Field + Shifts `tabletQuick` (computed, unused). Avatar/account menu in header (`triggerVariant='tablet'`). Rail hidden while shift overlay is active (`hidePrimaryNav`).

#### 3d. Desktop (`DesktopAppShell`) - reachable only per 1a
Grouped sidebar "Field / Messages / Account" with the same destinations, command palette (Ctrl/Cmd+K), `Alt+1..9` shortcuts in source order: Alt1 Field, Alt2 Shifts, Alt3 Messages, Alt4 Support, Alt5 Schedule, Alt6 Preferences, Alt7 Standing, Alt8 Vehicle (or Pay when no vehicle), Alt9 Pay. No `sidebarPrimaryAction` for guard. Sidebar footer links = Account settings + legal.

#### 3e. Pre-active (pending / approved) guards
No destinations on any surface. Standalone gate in `App.tsx` L14248: header with `AccountMenu` (`hideProfile` forced; Settings only), body `AccountPendingScreen`. Allowed tabs at the router level (`normalizeGuardTabForAccount`): `settings` always; `support` only when `approved`; everything else (incl. `guide`, `profile`) -> `activation`.

#### 3f. Nav defects (guard)
- Label drift: Field/Map, Shifts/Jobs, Pay/Payments, Standing/Performance, Schedule/Availability: nav label differs from page title for 5 of 9 destinations; slug names differ again (`my-jobs`, `payments`).
- `guide` and `profile` are exposed in the account menu while inactive (Guide always; Profile when `revisionOpen`) but `normalizeGuardTabForAccount` rewrites both to `activation`: dead links. `guardActivationAllowedTabs` (GuardDashboard L288, allows guide, profile-on-revision) disagrees with `normalizeGuardTabForAccount` (`appNavigation.ts` L166, allows only settings/support) and with the App.tsx gate (L14248, allows settings/support/guide). Three different allow-lists for the same rule. The "Edit application details" button on the Activation screen (`onOpenApplicationProfile`) therefore cannot reach Profile; in the App-level gate it is not even passed.
- `activeNavId` for tabs not in `GUARD_SIDE_NAV_TABS` (profile/settings/guide) is '' - nothing highlighted (the avatar gets `active`).
- Vehicle tab appears/disappears with ID data (no explanation) and `vehicle` slug stays routable when hidden.
- Support is a primary mobile tab but Messenger/Support split lives under one "Messages" section on tablet/desktop.

---

### 4. Registration / activation / approval states (guard)

#### 4a. Sign-up (installed Guard app or web `/?auth=sign-up&ar=guard`)
| Step | Screen / file | Detail |
|---|---|---|
| Role pick | `AuthRoleChoicePage` (`src/components/AuthPage.tsx`) | pick=work ("I want to work": Guard, plus staff-notice). Installed Guard app skips the role choice (`__GUARDR_NATIVE_PRODUCT_APP__='guard'`; e2e `installed-app-auth.spec.ts`) |
| Application form | `AuthPage.tsx` "Guard marketplace application" | name, email, password, phone, hourly rate, years of experience, armed preference, work types, primary city, extra cities, guard-card status, reliable transport, background, availability |
| Result | creates guard row `userStatus:'pending'` (`handleSignUp` in `App.tsx`) | session lands on `/guard/activation` (`defaultActivationPathForRole`); in plain browser access = `activation`, installed = `operations` but inactive gate |
| Legal | `LegalAcceptanceModal` (`marketplaceLegalGate`) | ICA / Terms / Privacy / EEO / Conduct acceptance before anything else |

#### 4b. State machine
| From | To | Trigger | UI the guard sees |
|---|---|---|---|
| (new) | `pending` | sign-up | Activation screen "Application under review"; checklist in read-only/locked state after submit; "Complete application" header (`GUARD_TAB_TITLES.activation`) |
| `pending` | `pending` + revision requested | staff "request revision" (`guardAccountDatabaseErrorMessage` action `revision`) | title "Update your application"; `revisionOpen` unlocks Profile edit; Profile hidden/dead-linked otherwise (3f) |
| `pending` | `approved` | staff approve (staff-side action; roles not traced here) | title "Upload activation credentials" -> "Complete activation credentials"; "Contact support"/"Open activation support chat" appears; Support tab route allowed |
| `approved` | `active` | `guardAutoActivation.ts`: all 5 credentials verified (`canActivate` in `guardAccountActivation.ts`). The Stripe return handler (`App.tsx` L12852) calls `withAutoStaffActivation` but only for profiles with `g.isStaff`, so for guards it only redirects to Pay + toast | app unlocks; nav appears; Activation tab -> map |
| `active` | `active` restricted | `credentialExpiryRestricted` set by `guardCredentialExpiryEnforcement.ts` (mechanism/cron not traced) | `GuardCredentialGraceBanner`; work-blocked banner; must re-upload |
| any | `suspended` / `blocked` | staff | "Account Suspended/Blocked" card (only on settings/support/guide tabs); otherwise Activation screen (2a) |

#### 4c. The five activation credentials (`GuardActivationUploadChecklist`)
| # | Credential | Sheet/Modal | Component |
|---|---|---|---|
| 1 | Government ID (front/back/selfie photos) | `GuardIdDetailModal` | `src/components/profile/GuardIdItemCard.tsx`, `GuardIdentityVerificationPanel.tsx`, `GuardIdPhotoRow.tsx`, `IdVerificationImageModal.tsx` |
| 2 | Certificate of insurance (COI) | `GuardCoiUploadSheet` / `GuardCoiDetailModal` | `src/components/profile/GuardCoiItemCard.tsx` |
| 3 | BSIS guard card | `GuardCardPanel` (`activationFormOnly`) | `src/components/profile/GuardCardPanel.tsx` |
| 4 | PTA / UOF mandatory training | `GuardPtaUofPanel` | `src/components/guard/GuardPtaUofPanel.tsx` |
| 5 | 32-hour CE courses | `GuardThirtyTwoHourPanel` | `src/components/guard/GuardThirtyTwoHourPanel.tsx` |
| opt | Optional credentials | `GuardOptionalCredentialAddSheet` | `src/components/guard/GuardOptionalCredentialAddSheet.tsx` |
Each step status is locked after submission (`beginActivationUploadSession`); `getGuardApplicationProgress` drives the progress bar on `AccountPendingScreen`; `GuardBsisRequirementsReference` is the on-screen BSIS reference; manuals download block at the foot (`UserManualDownloads`).
Inconsistent copy: Activation subtitle says staff "manually activate"; `guardWorkBlockedMessage` and the manual say activation is automatic once all five are verified.

---

### 5. Page inventory (guard)

Legend. Surfaces: M = mobile, T = tablet, D = desktop, App = Capacitor Android Guard app (same bundle). `ok` = renders and is reachable; `D*` = code exists but is unreachable for active guards in production (see 1a); `-` = not applicable. Test column: "unit" = `src/lib/*.test.ts` that covers the logic only (no component/e2e test exists for any guard screen; see section 10); "(not in npm test)" = file exists but is missing from the `package.json` `test` script. Surface-independent CSS guard tests (`src/styles/*SurfaceIndependence.test.ts`, `surfaceDesign.test.ts`) apply to every row and are not repeated.
Page counts: A = 20 entry/gate/activation, B = 22 field & shift, C = 11 jobs, D = 9 messages & support, E = 6 pay, F = 8 profile/settings/guide, G = 5 preferences/availability/vehicle, H = 10 performance, I = 8 website portal + messenger. Dead/not-present pages are listed separately in 5J and 6.

#### 5A. Entry, gates, activation, restricted states
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-01 | Guard sign-in / role choice | `/?auth=sign-in&ar=guard`; installed: forced guard | signed-out | none | role choice (`AuthRoleChoicePage`), sign-in form, forgot password | `src/components/AuthPage.tsx` (1817 lines) | email/password; installed Guard shows "Guard sign in"; website shows "Log in as guard" | unauthenticated; welcome overlap bug covered by e2e | ok / ok / ok / ok | merge three heavy auth forms into role-specific small screens; one shared form pattern | e2e `e2e/installed-app-auth.spec.ts`, `e2e/public.spec.ts` (unsigned only) |
| G-02 | Guard application (sign-up) | `/?auth=sign-up&ar=guard` | signed-out | none | single long form | `AuthPage.tsx` | phone, rate, years, armed pref, work types, primary + extra cities, guard-card status, transport, background, availability | form heavy, all in one scroll | ok / ok / ok / ok | stepper/progress; shorter fields; city picker | `guardApplicationIntake.test.ts` (unit); no UI test |
| G-03 | Legal acceptance gate | modal over any route | all roles except founder (`marketplaceLegalGate`, `App.tsx` L13720) | none | doc list | `LegalAcceptanceModal` | blocks until documents accepted; records acceptances | modal, non-dismissible | ok / ok / ok / ok | align with design system modal | `legalAcceptance.test.ts` |
| G-04 | Change-password prompt | modal | `passwordChangePromptOpen` | none | - | `ChangePasswordPrompt` (App.tsx L13733) | change or dismiss | modal | ok / ok / ok / ok | - | none |
| G-05 | Guard onboarding tour `guard-welcome` | overlay | first run, `tutorialState` | none | 15 steps; demo job card on map | `TutorialExperience`, `src/lib/onboardingTours.ts`, `tutorialDemoData.ts` | spotlight steps over nav/map/profile | targets `[data-tour=...]`; `guard-my-jobs-tabs` target does not exist | ok / ok / D* / ok | re-author targets per surface (3 nav models) | `tutorialSession.test.ts`, `tutorialDemoData.test.ts` |
| G-06 | Activation screen "Application under review / Upload activation credentials / Update your application / Account restricted" | `/guard/activation`; App gate L14246 | pending, approved, suspended, blocked, any inactive; pre-active only | none (no nav) | G-07..G-15, manuals download | `src/components/account/AccountPendingScreen.tsx` (256) | status copy, progress bar (`getGuardApplicationProgress`), BSIS reference, checklist, "Edit application details", Contact support (approved only) | full-page standalone; header with AccountMenu (Profile hidden) | ok / ok / ok (browser only) / ok | single stepper "Application" page; real nav-free layout per surface; fix dead "Edit application details" and wrong state for suspended | `guardAccountActivation.test.ts`, `guardActivationSync.test.ts`; `guardApplicationProgress.test.ts`, `guardAutoActivation.test.ts` (not in npm test); no UI test |
| G-07 | Activation upload checklist | inside G-06 | inactive | G-06 | 5 steps + optional | `src/components/guard/GuardActivationUploadChecklist.tsx` | statuses locked after submit; opens G-08..G-13 | sheets over page | ok / ok / ok / ok | combine with profile credentials (same data, two UIs) | `guardApplicationCredentialSteps.test.ts` (not in npm test) |
| G-08 | Government ID capture/detail | sheet from G-07 / Profile > Credentials | inactive or active | G-07 | photo rows, expiry, state | `GuardIdDetailModal.tsx`, `GuardIdItemCard.tsx`, `GuardIdentityVerificationPanel.tsx`, `GuardIdPhotoRow.tsx`, `IdVerificationImageModal.tsx` (`src/components/profile/`) | upload front/back/selfie; verification status; expired detection | modal | ok / ok / ok / ok | camera-first mobile flow | `idVerificationPhoto`/credential tests partial; none for UI |
| G-09 | COI upload / detail | sheet | same | G-07 | upload, detail | `GuardCoiUploadSheet.tsx`, `GuardCoiDetailModal.tsx`, `GuardCoiItemCard.tsx` | insurance certificate | sheet | ok / ok / ok / ok | - | `guardInsurance.test.ts` (not in npm test) |
| G-10 | BSIS guard card form | inside checklist and Credentials | same | G-07 | `activationFormOnly` variant | `src/components/profile/GuardCardPanel.tsx` | card number, expiry, images | form | ok / ok / ok / ok | - | `certStaffVerification.test.ts` (generic) |
| G-11 | PTA / UOF mandatory training | inside checklist and Credentials | same | G-07 | - | `src/components/guard/GuardPtaUofPanel.tsx` | certificate upload | form | ok / ok / ok / ok | - | `guardBsisActivationRequirements.test.ts` |
| G-12 | 32-hour CE | inside checklist and Credentials | same | G-07 | - | `src/components/guard/GuardThirtyTwoHourPanel.tsx` | course certificates | form | ok / ok / ok / ok | - | same |
| G-13 | Optional credential add | sheet | same | G-07 / Credentials | catalog picker | `src/components/guard/GuardOptionalCredentialAddSheet.tsx` | adds medical/FEMA/industry etc. | sheet | ok / ok / ok / ok | - | `guardCredentialSections.test.ts` |
| G-14 | BSIS requirements reference | inline | inactive | G-06 | links | `GuardBsisRequirementsReference.tsx`, `GuardCredentialResourceLinkList.tsx` | reference links | inline | ok / ok / ok / ok | - | `guardBsisActivationRequirements.test.ts` |
| G-15 | Activation support chat | `/guard/support?sm=...` ticket | approved only (router allow) | G-06 | opens support ticket (G-50) | `openGuardActivationSupport` (`App.tsx` L1560) | creates activation ticket and opens `support` tab; the only way to reach Support when inactive | no nav, only a button | ok / ok / ok / ok | give inactive guards a persistent Support entry | `supportActivation.test.ts` (not in npm test) |
| G-16 | Account suspended / blocked card | `/guard/settings`, `support`, `guide` while suspended/blocked | status | none | - | `GuardDashboard.tsx` (suspended branch) | card with contact-support copy | reachable only from 3 tabs; other tabs show G-06 | ok / ok / ok / ok | make suspended a first-class screen for every tab | none |
| G-17 | Credential grace banner + work-blocked banner | on Field/any active tab | `credentialExpiryRestricted`, `guardWorkBlockedMessage` | Field | "Open credentials" | `GuardCredentialGraceBanner.tsx`, GuardDashboard map overlay | warns of expiring/expired docs | banner | ok / ok / ok / ok | systemize banners | `guardCredentialExpiryEnforcement.test.ts` (not in npm test) |
| G-18 | Application-locked / revision-requested state | Profile | `guardIntakeLocked`, `revisionOpen` | Profile | chips | `UserProfileScreen.tsx` | locked fields, "Revision requested" | profile | ok / ok / ok / ok | - | `guardApplicationIntake.test.ts`, `credentialRevisionHistory.test.ts` |
| G-19 | Notifications inbox | account menu bell (not a tab) | all | Account menu | list, deep links | shared notification panel (`notificationInbox`, `notificationRouting.ts`) | list / mark read / open target | opened from header | ok / ok / ok / ok | give guard its own notification page | `notificationInbox.test.ts`; `notificationRouting.test.ts` (not in npm test) |
| G-20 | Download/Install app | account menu | browser/PWA | Account menu | - | `AccountMenu`, `installSurfaceCopy.ts` | link to APK / PWA install | menu item | ok / ok / ok / - | - | `installSurfaceCopy.test.ts` (not in npm test) |

#### 5B. Field (map) and shift flow
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-21 | Field (Map) home | `/guard/map` (default), nav id `map`, label "Field", title "Map" | active; pre-active -> activation | Field | G-22..G-40 overlays; `gj` selected job; `bt` filter | `src/components/GuardDashboard.tsx` (map branch), `src/components/guard/ShiftMap.tsx`, `src/lib/useGuardLiveLocation.ts`, `useUserLocation.ts` | map of open/scheduled jobs with pins, route, live location, status filter | map-first; mobile no list; tablet rail; desktop inspector | ok / ok / D* / ok | decide per-surface information architecture; remove car-style visuals; map empty states | `mapJobVisibility.test.ts`, `guardJobsBrowse.test.ts`, `siteProximity.test.ts` |
| G-22 | Map browse dock / tablet rail | map | active; tablet shows always, mobile shows only empty message (PR1084) | Field | job rows (`MapBrowseItem`) | `src/components/map/MapBrowseDock.tsx`, `src/lib/mapBrowseItems.ts`, `mapEmptyMessages.ts` | job list beside map; "No open jobs nearby" etc. | M none, T rail `.map-tablet-rail`, D dock | `-`(M empty only) / ok / D* / ok | decide whether mobile needs list entry (Jobs tab fills it) | none (PR1084 changes untested) |
| G-23 | Map selection experience / offer card | map, `gj` | active | Field | open job -> G-24 | `src/components/map/MapSelectionExperience.tsx` | slide-up card (M), bottom sheet (T), right inspector (D) | per-surface | ok / ok / D* / ok | unify with My Jobs detail | none |
| G-24 | Open job detail (apply) | `gj=<id>`; also in My Jobs | active; qualification-gated | Field / Shifts | qualification checklist, direct request Accept/Decline, slide-to-apply, price negotiation (G-43), team slot (G-44), self-audit photos | `GuardJobDetailView.tsx`, `GuardJobDetailContent.tsx`, `GuardJobCard.tsx`, `GuardMatchScoreRow.tsx`, `src/lib/guardQualification.ts` | apply / accept / decline / negotiate | long scroll; used in map sheet, my-jobs detail, tablet pane | ok / ok / D* / ok | rebuild as one job-detail pattern shared with client | `guardQualificationMatching.test.ts`, `guardJobs.test.ts` |
| G-25 | Pin filter stepper + route banner | map | active | Field | - | `src/components/map/MapPinFilterStepper.tsx`, `MapRouteBanner.tsx`, `src/lib/mapRouting.ts` | step through pins; route ETA | overlay | ok / ok / D* / ok | - | none |
| G-26 | Next shift card | map | active, has scheduled job | Field | opens G-27 / pre-shift briefing | `GuardNextShiftCard.tsx`, `src/lib/guardNextShift.ts` | countdown, "view briefing", start en-route | card on map | ok / ok / D* / ok | - | `guardNextShift.test.ts` |
| G-27 | Replacement offer card | map | emergency replacement offer present | Field | accept/decline | `ReplacementOfferCard.tsx`, `src/lib/emergencyReplacement.ts` | offer to cover no-show | card | ok / ok / D* / ok | - | none |
| G-28 | Tutorial demo job card | map | tour active | Field | - | `tutorialDemoData.ts`, GuardDashboard | demo job for the tour | card | ok / ok / D* / ok | - | `tutorialDemoData.test.ts` |
| G-29 | Active shift sheet (phases `upcoming/en-route/arrived/on-duty/complete`) | map overlay (trip mode, nav hidden) | accepted/in-progress job | Field | G-30..G-39 | `GuardActiveShift.tsx` (469), `MapMobileBottomSheet`/`MapDesktopInspector`, `src/lib/shiftWindow.ts`, `shiftGeofence.ts`, phases stored in localStorage (`loadShiftPhase`) | slide "arrive on site" -> "start job" -> hourly check-in -> break -> incident -> activity log -> "complete job" | locks nav; geofence | ok / ok / D* / ok | design shift mode as its own full-screen mode on mobile; fix phase persistence (local only) | `shiftAccountability.test.ts`, `siteProximity.test.ts`, `preShiftBriefing.test.ts` |
| G-30 | Pre-shift briefing (manual sheet) | `manualBriefingJobId` (not in URL) | within briefing window | Field | post-orders ack, site-briefing ack | `GuardPreShiftBriefing.tsx`, `ViewPreShiftBriefingButton.tsx`, `briefingAck.ts`, `postOrdersAck.ts` | read job profile, acknowledge post orders/briefing | `layout='modal'` only; `'map-sheet'` branch unused | ok / ok / D* / ok | - | `preShiftBriefing.test.ts` |
| G-31 | Briefing ack gate | modal | arrived without reading briefing | Field | - | `GuardBriefingAckGate.tsx` | non-dismissible gate before start | modal | ok / ok / D* / ok | - | none |
| G-32 | Self-audit "Start of job package" | modal | on arrival | Field | photos, checklist, "skip audit" | `GuardSelfAuditModal.tsx`, `JobSelfAuditPhotosSection` | selfie/uniform/gear package; slide to start | modal | ok / ok / D* / ok | - | none |
| G-33 | Mid-shift check-in | inline in active shift | on-duty; due every interval (`midShiftCheckInDue`, opens 5 min early) | Field | - | `MidShiftCheckInPanel.tsx` | slide to check in | inline | ok / ok / D* / ok | - | `checkInEscalation.test.ts` |
| G-34 | Break start/end | active shift | on-duty | Field | - | `GuardActiveShift.tsx`, `src/lib/shiftBreaks.ts` | break timer | inline | ok / ok / D* / ok | - | none |
| G-35 | Incident report | modal | on-duty | Field / job detail | report list in job detail | `GuardIncidentReportModal.tsx`, `src/lib/incidentReports.ts` | type, narrative, photos | modal | ok / ok / D* / ok | - | none |
| G-36 | Activity log | modal | on-duty | Field | - | `GuardActivityLogModal.tsx` | timeline notes | modal | ok / ok / D* / ok | - | none |
| G-37 | End-of-shift package | modal | complete | Field | - | `GuardEndShiftCheckpointModal.tsx` | photos + checklist; "Slide to complete shift" | modal | ok / ok / D* / ok | - | none |
| G-38 | Late clock-out prompt | modal | past scheduled end | Field | "When did you leave?" | `LateClockOutPrompt.tsx` | enter actual leave time -> overtime | modal | ok / ok / D* / ok | - | none |
| G-39 | Client rating modal | modal | after complete | Field | - | `GuardRatingModal.tsx` | 1-5 stars (rates the client) | modal | ok / ok / D* / ok | - | none |
| G-40 | Message customer / job chat shortcut | from active shift & job detail | job chat allowed | Field | opens G-47 | `GuardActiveShift.tsx`, `GuardMyJobDetail.tsx`, route `jc`/`chat=1` | jumps to Messages > Jobs | link | ok / ok / D* / ok | - | none |
| G-41 | Stripe Connect return handler | `/?stripe_connect=success|refresh` | any guard | none | toast, tab=earnings | `App.tsx` L12852 | return lands at `getSiteUrl()` (APP_URL) | web-return into app; ignored for browser actives (forced to /account) | partial / partial / - / partial | verify deep-link return into installed app | none |
| G-42 | Shift trip lock | behavior | `showShiftOverlay` | none | - | `GuardDashboard.tsx` effect | nav hidden, tab forced map/messages | - | ok / ok / D* / ok | - | none |

#### 5C. Jobs ("Shifts" nav, title "Jobs")
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-43 | My Jobs list (tabs Available / Scheduled / Completed / Missed) | `/guard/my-jobs?bt=` nav `myJobs` | active | Field | 4 tabs, per-tab empty states, `RosterLoadGate` "Could not load jobs" | `src/components/guard/GuardMyJobsPanel.tsx` (485), `ListFilterTabs`, `src/lib/guardJobsBrowse.ts` | tabs filter list; push detail on mobile | list + push (M), `ListDetailLayout` autoSelectFirst (T), `GuardMyJobsDesktop` (D) | ok / ok / D* / ok | restructure tabs; remove car-silhouette SVG on `JobRow`; drop unused pie/hero code | `guardJobsBrowse.test.ts`, `guardJobs.test.ts` |
| G-44 | My Jobs desktop workbench | same | active, desktop only | Field | stat chips + table | `GuardMyJobsDesktop.tsx` | table of jobs | desktop | - / - / D* / - | decide whether desktop guard even exists | none |
| G-45 | My job detail (scheduled/in-progress/completed/missed) | `gj=<id>` on `my-jobs` | own jobs | Shifts | briefing button, incident list, overtime approval, "Message customer"/"View job chat" | `GuardMyJobDetail.tsx`, `GuardJobDetailView.tsx` | status, pay display, briefing, incidents, overtime | detail | ok / ok / D* / ok | rebuild; `onApplyAsLead`, `onSubmitPriceOffer`, `onAcceptPriceOffer`, `onSuggestGuard` accepted/dead here | `guardJobs.test.ts` |
| G-46 | Price negotiation (open-contract jobs) | inside G-24 | job `openContract` | Jobs | offer/counter | `src/components/jobs/PriceNegotiationPanel.tsx` (used by `GuardJobDetailContent`) | submit/accept price offers | panel | ok / ok / D* / ok | - | none |
| G-47 | Job slot / team panel | inside G-24 | multi-guard job | Jobs | roster, invite, suggest | `GuardJobSlotPanel.tsx`, `TeamGuardInvitePicker.tsx`, `SuggestGuardPicker.tsx`, `src/components/jobs/JobTeamRoster.tsx` | accept/decline "Team invitation"; invite/remove teammates; suggest guard | panel | ok / ok / D* / ok | the only team feature; no standing crew UI | `guardTeamInvite.test.ts` (not in npm test), `jobApplications.test.ts` |
| G-48 | Overtime approval | inside G-45 | overtime pending | Jobs | approve/dispute | `GuardMyJobDetail.tsx` | guard approves overtime | inline | ok / ok / D* / ok | - | `shiftAccountability.test.ts` |
| G-49 | Self-audit photos section | inside G-24/G-45 | job has audit | Jobs | - | `src/components/jobs/JobSelfAuditPhotosSection.tsx` | view start/end package photos | inline | ok / ok / D* / ok | - | none |
| G-50 | Missed shifts tab | `bt=missed` | active | Jobs | - | `GuardMyJobsPanel.tsx` | "No missed shifts" | tab | ok / ok / D* / ok | link to violations/dispute | `noShowDetection.test.ts` |
| G-51 | Completed shifts | `bt=completed` | active | Jobs | - | same | "No completed shifts yet" | tab | ok / ok / D* / ok | - | none |
| G-52 | Scheduled shifts | `bt=scheduled` | active | Jobs | - | same | "No scheduled shifts" | tab | ok / ok / D* / ok | - | none |
| G-53 | Available jobs | `bt=available` | active | Jobs | - | same | "No open jobs nearby" | tab | ok / ok / D* / ok | - | `guardOpenJobNotify.test.ts` |

#### 5D. Messages and Support
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-54 | Messages hub (tabs Chats / Jobs) | `/guard/messages` (alias `guard-chat`) nav `messages` | active (Messenger: allowed) | Messages | Chats, Jobs; `jc`, `chat` | `src/components/guard/GuardMessagesPanel.tsx` (534), `MessagesHubLayout`, `MessagesInboxTabs` | inbox + thread, PR1084 conversation facts | M list+push; T/D split | ok / ok / D* / ok | PR1084 shell; redesign | `guardMessenger.test.ts`, `chatPermissions.test.ts`, `messengerCompanion.test.ts` |
| G-55 | Guard community chat | `messages`, "Guard chat" | read-only until active | Messages | thread | `GuardMessagesPanel.tsx`, `ChatThreadPanel`, `src/lib/guardMessenger.ts` | post/delete messages | thread | ok / ok / D* / ok | - | `guardMessenger.test.ts` |
| G-56 | Job chat thread | `jc=<requestId>` | job has chat | Messages | - | `JobChatPanel` | chat with client | thread | ok / ok / D* / ok | - | `jobChat` tests partial |
| G-57 | Support inbox (tabs Support / Reports) | `/guard/support?sec=` nav `support` | active; approved (via G-15) | Messages | Support, Reports | `GuardMessagesPanel.tsx` (scope `support`), `MessagesQuickActions` | ticket lists | M list+push | ok / ok / D* / ok | `InboxTab` type allows support/reports in `messages` scope, never rendered | `supportDelete.test.ts` |
| G-58 | Support ticket thread | `st=<id>` | owner | Support | - | `ChatThreadPanel` | reply, delete | thread | ok / ok / D* / ok | - | `supportDelete.test.ts` |
| G-59 | Support compose | `?sm=compose` | active/approved | Support | - | `src/components/support/SupportComposePage.tsx` | new ticket | page | ok / ok / D* / ok | - | none |
| G-60 | Report | `?sm=report` | active | Support | - | `SupportReportPage.tsx` | formal report | page | ok / ok / D* / ok | - | none |
| G-61 | Team chat | `tc` param | staff only | none | - | - | guards never get it; `tc` parsed globally | - | - / - / - / - | not present for guard | none |
| G-62 | Messenger companion app (guard) | `/messenger?role=guard`; appId messenger | messagesOnly | Messages | tabs messages/support/settings/profile/guide | `src/lib/messengerCompanion.ts`, `GuardMessagesPanel.tsx` | job chat + support only | stripped nav | ok / ok / - / ok | decide if still a product | `messengerCompanion.test.ts`, e2e `installed-app-auth.spec.ts` (sign-in) |

#### 5E. Pay (nav "Pay", title "Payments", slug `payments`)
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-63 | Pay / Earnings | `/guard/payments` nav `earnings` | active | Account (More sheet on M) | hero "ready to collect", "Send to my bank", Stripe connect banner, completed jobs list (`getShiftPayDisplay`) | `GuardEarningsPanel.tsx` (313), `src/components/payments/PaymentsPage.tsx` (role=guard header "Payments") | earnings overview, request payout invoice (confirm dialog "Send payout invoice?"), count of open Stripe invoices | mobile hero; tablet metrics | ok / ok / D* / ok | build real payout history; show invoice states | `paymentPipeline.test.ts`, `guardEarnings` partial |
| G-64 | Pay desktop | same | desktop | Account | workbench | `GuardEarningsDesktop.tsx` | metrics + table | desktop | - / - / D* / - | - | none |
| G-65 | Stripe Connect sheet | opened from G-63 | active | Pay | "Connect your bank" / "Finish bank setup" | `GuardStripeConnectSheet.tsx`, `src/lib/stripeApi.ts` | creates Express account, opens account link | sheet | ok / ok / D* / ok | verify return in WebView (return URL = `APP_URL`) | none |
| G-66 | Payout invoice confirmation | dialog | eligible jobs | Pay | - | `submitGuardPayoutInvoice` (`App.tsx` L12565), `guardPayoutInvoice.ts`, `guardPayoutInvoiceStorage.ts` (localStorage key `guardr_guard_payout_invoices`, DB write-through) | send invoice to Payments pipeline | AppConfirm | ok / ok / D* / ok | no guard-visible invoice list/history; list lives in localStorage | `paymentPipeline.test.ts` |
| G-67 | Timesheet (read-only clock audit) | Profile > Timesheet | active | Profile | - | `src/components/guard/GuardTimesheetPanel.tsx` | clock-in/out audit | tab | ok / ok / D* / ok | the manual lists it under Profile, not Pay | `guardTimesheet.test.ts` |
| G-68 | Cash payout | n/a | n/a | n/a | - | `handleGuardRequestCashPayout` -> toast "Cash pickup is not supported" | stub | - | - | remove | none |

#### 5F. Profile, Settings, Guide
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-69 | Profile | `/guard/profile` (account menu only; no nav) | active; pre-active only when revision | Account menu | tabs Profile / Credentials / Inventory / Timesheet (`ListFilterTabs`, local state, not in URL) | `src/components/profile/UserProfileScreen.tsx` (679), `ProfileHero.tsx`, `ProfileAvatar.tsx`, `PersonNameFields.tsx` | name, contact, min rate, status, armed pill, locks | tab state lost on reload | ok / ok / D* / ok | URL-addressable tabs; align with web portal | `guardApplicationIntake.test.ts` |
| G-70 | Profile > Credentials | tab | active | Profile | sections guard-card, coi, bsis-pta-uof, bsis-32-hour, bsis-refresher, bsis-permit, bsis-other-training, medical, fema, security-advanced, industry; vehicle insurance; weapon gear | `src/components/profile/GuardCredentialsPanel.tsx`, `GuardCredentialCatalogSectionBlock`, `GuardVehicleInsuranceItemCard.tsx`, `GuardWeaponGearPanel.tsx`, `src/lib/guardCredentialSections.ts` | add/upload/resubmit, statuses, detail | long list | ok / ok / D* / ok | simplify; one credential component for activation + profile | `guardCredentialSections.test.ts`, `certResubmit.test.ts` (not in npm test) |
| G-71 | Credential add / detail sheets | sheet | active | Credentials | add by catalog id, `CertDetailModal` | `AppFormSheet`, `GuardOptionalCredentialAddSheet.tsx`, `src/components/credentials/CertDetailModal.tsx` | add/edit/view | sheet | ok / ok / D* / ok | - | `certUniqueness`, `certImagePolicy` partial |
| G-72 | Profile > Inventory | tab | active | Profile | equipment, uniforms, gear carry | `GuardInventoryPanel.tsx`, `GuardGearCarryPanel.tsx`, `GuardEquipmentGearPanel.tsx`, `GuardWeaponGearPanel.tsx` | list of owned gear | tab | ok / ok / D* / ok | - | `guardInventory.test.ts`, `guardWeaponGear.test.ts` |
| G-73 | Profile > Resume | inside Profile tab | `canBuildResume` = guard and not staff | Profile | headline, summary, experience, education | `GuardResumeEditor.tsx` | resume builder | editor | ok / ok / D* / ok | - | none |
| G-74 | Settings | `/guard/settings` (account menu + footer link) | all states (incl. inactive) | Account menu | Work preferences note, push, app update, manuals, legal, About, Company roster (G-75) | `UserSettingsScreen.tsx`, `PushNotificationsPanel.tsx`, `AppUpdatePanel`, `UserManualDownloads` | settings | page | ok / ok / D* / ok | settings copy points to "Preferences ... Availability in the sidebar" while labels are Preferences/Schedule | `notificationChannel.test.ts` |
| G-75 | Company roster panel | inside Settings | guard has memberships | Settings | list of companies | `GuardCompanyRosterPanel.tsx` | shows client-company memberships | panel; hidden if none | ok / ok / D* / ok | - | none |
| G-76 | Guide | `/guard/guide` (account menu extra link) | active (dead for inactive, 3f) | Account menu | guard guide sections | `src/components/docs/AppGuidePage.tsx` (audience guard), `src/lib/appGuide.ts` | in-app guide from `docs/` markdown | page | ok / ok / D* / ok | - | none |

#### 5G. Preferences, Availability, Vehicle
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-77 | Preferences (job alerts) | `/guard/preferences` nav `preferences` | active | Account | alert profile, per-category toggles, "No alerts enabled yet" banner | `GuardPreferencesScreen.tsx`, `GuardJobPreferencesPanel.tsx`, `src/lib/guardJobPreferences.ts` | choose job types to be notified about | page | ok / ok / D* / ok | rename; merge with Availability? | `guardJobPreferences.test.ts` |
| G-78 | Job type onboarding sheet | sheet from Preferences | enabling a type | Preferences | read-aloud briefing + acknowledgement | `JobTypeOnboardingSheet.tsx`, `guardJobTypeOnboarding.ts` | must acknowledge before enabling a job type | sheet | ok / ok / D* / ok | - | `guardJobTypeOnboarding.test.ts` |
| G-79 | Availability (nav "Schedule") | `/guard/availability` nav `availability` | active | Account | weekly slots | `GuardAvailabilityScreen.tsx`, `GuardAvailabilityCalendar.tsx` | per-weekday windows | page | ok / ok / D* / ok | persists ONLY in localStorage (`guardAvailability.ts`), not server | `guardAvailability.test.ts` |
| G-80 | Availability > specific dates | inside G-79 | active | Availability | date overrides / off days, prune past | `GuardAvailabilityDatesPanel.tsx` | add/remove date overrides | panel | ok / ok / D* / ok | same local-only storage | `guardAvailability.test.ts` |
| G-81 | Vehicle | `/guard/vehicle` nav `vehicle` | active + driver's licence on file | Account | form + insurance upload | `GuardVehiclePanel.tsx`, `src/components/profile/GuardVehicleInsuranceUploadSheet.tsx`, `src/lib/guardVehicle.ts` | save vehicle, submit for approval, insurance required first | page | ok / ok / D* / ok | tab appearance rule invisible | `guardVehicle.test.ts`, `guardJobTypeVehicleRequirements.test.ts` (not in npm test) |

#### 5H. Performance
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-82 | Performance (nav "Standing") | `/guard/performance` nav `performance` | active | Account | tier hero, factors, modality tabs, violations | `GuardPerformanceScreen.tsx` (367), `GuardRatingSection.tsx`, `src/lib/guardPerformance.ts` | tier (starting/rising/professional/elite), score | mobile single column; tablet split; desktop uses mobile layout | ok / ok / D* / ok | rename nav/title; clearer tier rules | `guardPerformance.test.ts` |
| G-83 | Factor drill-down | `pf=acceptance|completion|on-time|quality|client-rating` | active | Performance | - | `GuardPerformanceFactorDetail.tsx` | factor breakdown | detail | ok / ok / D* / ok | - | `guardPerformanceFactorDetail.test.ts` |
| G-84 | Rewards ("My rewards") | local state, not URL | active | Performance | info sheet | `GuardPerformanceRewards.tsx`, `ModalityRewardsInfoSheet.tsx` | rewards by tier | sheet | ok / ok / D* / ok | - | `guardPerformanceRewards.test.ts` |
| G-85 | Modality tabs (Standing / Driving) | local state | active; Driving needs approved vehicle | Performance | - | `GuardModalityPrioritySection.tsx` | priority by modality | tabs | ok / ok / D* / ok | - | `guardPerformance*.test.ts` |
| G-86 | Modality metric detail | local state | active | Performance | - | `GuardModalityMetricDetail.tsx` | metric breakdown | detail | ok / ok / D* / ok | - | `guardJobTypeRatingMetrics.test.ts` |
| G-87 | Contract violations list | local subview `violations` | active | Performance | - | `GuardContractViolationsList.tsx`, `src/lib/guardContractViolations.ts` | list | list | ok / ok / D* / ok | - | `guardContractViolations.test.ts` |
| G-88 | Contract violation detail + dispute | subview `violation-detail` | active | Performance | dispute form | `GuardContractViolationDetail.tsx`, `onDisputeShiftAuditViolation` | submit dispute note | detail | ok / ok / D* / ok | the only live path for shift-audit disputes | `guardContractViolations.test.ts`, `shiftAuditViolations` partial |
| G-89 | Dispute status | subview `violation-dispute-status` | dispute exists | Performance | - | `GuardContractViolationDisputeStatus` (same file) | accepted/rejected view | detail | ok / ok / D* / ok | - | none |
| G-90 | Ratings (tier) hero | in G-82 | active | Performance | - | `GuardRatingSection.tsx` | rating + tier | section | ok / ok / D* / ok | - | `guardPerformance.test.ts` |
| G-91 | 32-hour panel / PTA-UOF panels | see G-11, G-12 | - | Credentials | - | `GuardThirtyTwoHourPanel.tsx`, `GuardPtaUofPanel.tsx` | shared with activation | - | ok / ok / D* / ok | - | - |

#### 5I. Website account portal (guard) and Messenger
| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-92 | Account home | `/account` | `websiteShellAccess`=account (active/suspended/blocked in browser) | Website | tiles | `WebsiteAccountHome.tsx`, `WebsiteAccountShell.tsx` | links to profile, payouts, downloads, settings, documents, support | web shell | ok / ok / ok / - | align with app | `productApps.test.ts` |
| G-93 | Account profile | `/account/profile` | same | Website | - | `UserProfileScreen.tsx` (guard, only `onSave` wired, no credential callbacks) | edit profile | web shell | ok / ok / ok / - | credential upload callbacks not passed | none |
| G-94 | Account payouts | `/account/payouts` | same | Website | text + `OpenAppCta` to `/guard/payments` | `App.tsx` ~L14170 | no payout data, only a CTA | web shell | ok / ok / ok / - | real payout view or drop | none |
| G-95 | Account downloads | `/account/downloads` | same | Website | - | `WebsiteAccountDownloads.tsx` | Guard APK/PWA | web shell | ok / ok / ok / - | - | `productApps.test.ts` |
| G-96 | Account settings | `/account/settings` | same | Website | - | `UserSettingsScreen.tsx` | settings | web shell | ok / ok / ok / - | - | none |
| G-97 | Account documents | `/account/documents` | same | Website | - | `WebsiteAccountDocuments.tsx` | legal docs | web shell | ok / ok / ok / - | - | none |
| G-98 | Account support | `/account/support` | same | Website | - | `src/components/support/SupportScreen.tsx` | tickets | web shell | ok / ok / ok / - | - | `supportDelete.test.ts` |
| G-99 | Open-app CTA | `OpenAppCta` | browser-only | Website | - | `src/components/apps/OpenAppCta.tsx` | "You need the Guard app" | toast + CTA | ok / ok / ok / - | - | none |

#### 5J. Declared in docs/code but NOT present as a guard page
| ID | Item | Evidence |
|---|---|---|
| X-01 | Crews / standing crew / crew join requests / team lead apply | no component; `guard_crew_join_requests` only in `useSupabaseRealtime.ts`; `onApplyAsTeamLead`/`onUpdateCrewProfile` never passed; tests `guardStandingCrew`, `guardCrewArmedCoverage`, `guardCrewJoinRequest`, `guardTeams.standingCrew`, `priorityCrewNotify` listed in `npm test` but files do not exist; `docs/CROSS_PLATFORM.md` L162 lists `GuardCrewHubPanel` as 'Migrated' (file does not exist) |
| X-02 | Guard payout invoice list/history | `GuardEarningsPanel` shows only a count; manual says "track status on Pay until Settled" |
| X-03 | Team chat for guards | `tc` is staff-only |
| X-04 | Guard shift-audit dispute list page | `GuardShiftAuditDisputes.tsx` has no importers (dead); disputes only via G-88 |
| X-05 | Guard "job type metric detail / rating section" | `GuardJobTypeMetricDetail.tsx`, `GuardJobTypeRatingSection.tsx` no importers |
| X-06 | Staff-as-guard embedded dashboard | `GuardDashboard variant="embedded"` mounted nowhere |
| X-07 | Standalone activation checklist view | `GuardActivationChecklistView.tsx` no importers |

Total guard pages counted: 99 rows (G-01..G-99) of which G-61, G-68, G-91 are placeholders/duplicates; 96 distinct live guard screens/sheets/states, plus 7 declared-but-absent items (X-01..X-07). Primary destinations with a nav slot: 9 (Field, Shifts, Messages, Support, Schedule, Preferences, Standing, Vehicle, Pay); account-menu-only: Profile, Settings, Guide, Notifications, Download.

---

### 6. Duplicated / legacy / dead (guard)

| # | Item | Evidence | Note |
|---|---|---|---|
| 1 | `GuardActivationChecklistView.tsx` | no importers | superseded by `GuardActivationUploadChecklist` |
| 2 | `GuardJobsPanelContent.tsx` | no importers; the only user of the compact `GuardJobCard` branch | legacy jobs list |
| 3 | `GuardJobTypeMetricDetail.tsx`, `GuardJobTypeRatingSection.tsx` | no importers | superseded by `GuardModalityMetricDetail` / `GuardModalityPrioritySection` (old job-type metrics; `guardJobTypeRatingMetrics.ts` still tested) |
| 4 | `GuardMessengerPanel.tsx` | no importers | superseded by `GuardMessagesPanel` |
| 5 | `GuardShiftAuditDisputes.tsx` | no importers | logic moved to `GuardContractViolationDetail` |
| 6 | `PostOrdersAckPanel.tsx` | no importers | ack now inside `GuardPreShiftBriefing` |
| 7 | `GuardDashboard variant="embedded"`, `shiftTab`, `.guard-staff-embedded` | mounted nowhere | staff-as-guard dead |
| 8 | `AppRoute.guardId` (`/guard/<unknown>` -> map) | never read for guards | silent fallback hides bad links |
| 9 | `GuardProfileTab` type in `appNavigation.ts` | no parser/serializer | profile tab not in URL |
| 10 | `tabletQuick` on Field/Shifts (`RoleAppShell`, `surfaceNavigation.buildTabletNavigation`) | computed, `TabletAppShell` renders no strip | docs claim a strip |
| 11 | `guardHeaderStatus` (GuardDashboard) | defined, unused | mobile shell has no status line |
| 12 | `pieSegments`, `jobsHeroSubtitle`, `nextScheduled` (`GuardMyJobsPanel`) | computed, not rendered in M/T | |
| 13 | `JobRow` car-silhouette SVG (`GuardMyJobsPanel`) | rideshare leftover | wrong for security jobs |
| 14 | `onApplyAsLead` / `onApplyAsTeamLead` / `onUpdateCrewProfile` | accepted by `GuardMyJobDetail`/`GuardDashboard`, never rendered/passed | crew feature stripped |
| 15 | Premium threshold defined twice | `PREMIUM_GUARD_PAY_PER_HOUR` (`guardTierJobPriority.ts`) and `PREMIUM_GUARD_PAY_THRESHOLD` (`guardPremiumJobPriority.ts`), both 35 | drift risk |
| 16 | Three inactive-guard tab allow-lists | `guardActivationAllowedTabs` (GuardDashboard L288), `normalizeGuardTabForAccount` (`appNavigation.ts` L166), `App.tsx` L14248 | disagree on guide/profile/support |
| 17 | `guardChat` tab alias | normalised in 4 places | |
| 18 | `GuardMyJobsDesktop`, `GuardEarningsDesktop`, desktop map inspector for guards | unreachable for active guards in production (1a) | |
| 19 | `GuardPreShiftBriefing layout='map-sheet'` | GuardDashboard always passes modal | |
| 20 | `handleGuardRequestCashPayout` | toast "Cash pickup is not supported" | stub; `GuardPayoutInvoiceMethod` still generic |
| 21 | Onboarding tour target `[data-tour="guard-my-jobs-tabs"]` | not present in any component | tour step has no anchor |
| 22 | Dual-purpose credential UI | Activation checklist and Profile > Credentials implement the same 5 credentials with different shells | |
| 23 | `InboxTab` includes `support|reports` inside scope `messages` | never rendered in that scope | |
| 24 | `guardPayoutInvoiceStorage` | localStorage key `guardr_guard_payout_invoices` plus DB write-through | local copy is the source for the UI |
| 25 | `filterGuardsForMarketplace` (`guardAvailability.ts`) reads other guards' `localStorage` availability | no importers | would never work cross-device |
| 26 | Two CI workflows (foundation notes) | | |

---

### 7. Loading / empty / error / restricted states (guard)

| Screen | Loading | Empty | Error | Restricted |
|---|---|---|---|---|
| Field/Map | location/permission (`useUserLocation`), map tiles | `mapEmptyMessages.ts` "No open jobs nearby" (mobile `.map-mobile-empty`, tablet rail `.map-browse-empty`) | route banner failure silent | work-blocked banner; credential grace banner |
| My Jobs | `RosterLoadGate` | per tab: "No open jobs nearby", "No scheduled shifts", "No completed shifts yet", "No missed shifts" | `RosterLoadGate` "Could not load jobs" | inactive -> Activation |
| Job detail | n/a | qualification rows | accept/apply errors via `AppToast` | qualification checklist red; armed-only |
| Active shift | n/a | n/a | geofence prompts, `enRouteBlockedMessage` | pre-shift window |
| Messages | n/a | "Select guard chat or a job thread from the inbox" | n/a | guard chat read-only until active |
| Support | n/a | "Select a support chat or report from the inbox" | n/a | approved-only when inactive |
| Pay | n/a | "Complete shifts to start earning - payouts appear here when jobs are settled" (`GuardEarningsPanel` L267) | Stripe errors via toast; `getConnectAccountStatus` failure ignored in return handler | "Connect your bank" until Stripe linked |
| Profile | n/a | credential sections always visible (`ALWAYS_VISIBLE_CREDENTIAL_SECTIONS`) | save errors via toast | "Application locked"/"Revision requested" chips |
| Preferences | n/a | "No alerts enabled yet" banner | n/a | job-type onboarding gate |
| Availability | n/a | default slots | invalid window (`isInvalidAvailabilityWindow`) | none |
| Vehicle | n/a | form empty | rejection reason shown (`status==='rejected'`) | insurance required before submit (`guardVehicleInsuranceOnFile`) |
| Performance | n/a | tier starting, no violations | n/a | Driving tab needs approved vehicle |
| Company roster | n/a | hidden when no memberships | n/a | n/a |
| Whole app | `Loading Guardr` status role (e2e) | no guard profile card "We could not load your guard profile." | n/a | suspended/blocked card / Activation screen |

---

### 8. Documentation claims contradicted by code (guard)

| Doc | Claim | Code reality |
|---|---|---|
| `docs/user-manuals/guard-user-manual.md` L32, L89-98 | Guard app main pages Map, Jobs, Pay, Messages, Support, Profile ... | nav labels are Field, Shifts, Messages, Support, Schedule, Preferences, Standing, [Vehicle], Pay; Pay is behind More on mobile; Profile/Settings/Guide are account-menu only |
| manual L155-159 | "Pay lets you submit a payout request (payout invoice)... Track status on Pay until Settled" | submit exists ("Send to my bank" + confirm); no status/history UI; only a count of open invoices |
| manual L151 | "Pay -> Connect bank account" | sheet titled "Connect your bank" / "Finish bank setup" |
| manual L57, L34 | pending/approved guards use the website activation screen; active guards need the app | matches for browser; but installed shells show activation inside the app too |
| manual ~L82 | account activates automatically once all five verified | Activation screen subtitle still says staff "manually activate" |
| manual L98 | "Preferences / Availability: work style and schedule windows" | Availability is device-local (localStorage), not enforced server-side |
| manual L221-224 | Performance Overall / Standing / Driving | UI has tier hero + Standing/Driving tabs; Driving gated by approved vehicle + insurance (matches) |
| `docs/CROSS_PLATFORM.md` L36 | Tablet "persistent rail + quick-switch strip" | no strip rendered |
| `docs/SURFACES.md` L129 | quick-switch strip of `tabletQuick` destinations | same: computed, unused |
| `docs/CROSS_PLATFORM.md` L162 | "Guard crew hub `GuardCrewHubPanel` Migrated" | component does not exist |
| `docs/CROSS_PLATFORM.md` L161, L204 | "Guard earnings desktop / my jobs desktop migrated" | components exist but are not reachable by active guards in production |
| `docs/SURFACES.md` L8-9 | Guards on tablet via PWA + APK | APK manifest forces portrait (foundation notes) so tablet landscape rail is browser-only |
| `docs/ANDROID-APK.md` | Capacitor loads the Worker origin | matches `capacitor.config.ts`; but Stripe Connect return URL is `APP_URL` (`www.guardr.co` in `wrangler.toml`), which can differ from the WebView origin |
| Settings copy (`UserSettingsScreen`) | "Job alerts ... Preferences ... Availability in the sidebar" | sidebar says Preferences and Schedule |

---

### 9. PR #1084 coverage (guard)

`git diff --name-only 07074aab 03bd8b49` touches these guard-relevant files:
| File | Change | Guard effect | Surface | Test |
|---|---|---|---|---|
| `src/components/GuardDashboard.tsx` (4 lines) | imports `useSurfaceKind`; map dock shown when `surface === 'tablet' || !guardSelectedJobId` | on tablet the job rail stays visible while a job is selected | T | none |
| `src/components/map/MapBrowseDock.tsx` (48) | tablet: `.map-tablet-rail` with job rows; mobile: only an empty-state paragraph; desktop: dock; `bottomOffsetClass` voided | map list now differs per surface | M/T/D | none |
| `src/components/map/MapSelectionExperience.tsx` (13) | `sideInspector = surface==='desktop'`; tablet gets bottom sheet (`map-selection-layer--tablet`) | tablet no longer gets the side inspector (guard + client) | T/D | none |
| `src/components/guard/GuardMessagesPanel.tsx` (18) | adds `context` (`MessagesConversationFacts`) for job/guard-channel/support threads | conversation header facts | M/T/D | none |
| `src/components/messaging/MessagesHubLayout.tsx` (+37) | new `MessagesConversationFacts` | shared | all | none |
| `src/styles/visual-refresh.css` (+854) | global selectors | affects all guard screens | all | `src/styles/*SurfaceIndependence.test.ts` / `surfaceLookIndependence.test.ts` (in npm test) |
| `src/dev/SurfacePreview.tsx`, `src/dev/surfaces/{Map,Messages,Payments,Job,Invoice}PreviewScreen.tsx`, `previewScreenState.ts`, `previewStaffFixtures.ts` | dev-only preview screens | none in production | dev | none |
Guard screens redesigned/changed by PR1084: Field map (dock/selection), Messages. Not touched: Activation, My Jobs, Pay, Profile, Settings, Performance, Preferences, Availability, Vehicle, shift modals, website portal. Notable: the map change assumes desktop = 'desktop' surface, but active guards never reach desktop (1a), so the desktop branch is effectively dead for guards.

---

### 10. Test gaps (guard)

| Gap | Detail |
|---|---|
| No component/e2e for any signed-in guard screen | `e2e/` has only `installed-app-auth.spec.ts`, `public.spec.ts`, `surfaces.spec.ts`; none sign in as a guard |
| Guard nav not tested against real source | `src/surfaces/surfaceNavigation.test.ts` uses a hand-written `GUARD_DESTINATIONS` (map, myJobs, earnings, messages, support, availability, performance, preferences, vehicle, guide; sections Work/Communications/Profile/Help) that differs from real `GuardDashboard` list (sections Field/Messages/Account; Pay not rank 3; no Guide in nav; Support is a tab) |
| Router rules for guards | `appNavigation.test.ts` is in npm test; no test asserts the 3-way allow-list agreement (3f) |
| Guard unit tests exist but are not in `npm test` | `guardAutoActivation.test.ts`, `guardApplicationProgress.test.ts`, `guardApplicationCredentialSteps.test.ts`, `guardCredentialExpiryEnforcement.test.ts`, `guardCredentialUpload.test.ts`, `guardInsurance.test.ts`, `guardJobTypeVehicleRequirements.test.ts`, `guardTeamInvite.test.ts`, `guardContractorNumber.test.ts`, `roleSurfaceMatrix.test.ts`, `supportActivation.test.ts`, `notificationRouting.test.ts`, `certResubmit.test.ts`, `certStatus.test.ts`, `installSurfaceCopy.test.ts` (list from `/tmp/audit/alltests.txt` vs `package.json`) |
| Nonexistent tests listed in `npm test` | `guardStandingCrew`, `guardCrewArmedCoverage`, `guardCrewJoinRequest`, `guardTeams.standingCrew`, `priorityCrewNotify` (`src/lib/`), `platform/uberBaseTheme` - running them fails/skip |
| Untested UI | all shift modals, Stripe Connect return, payout invoice, availability persistence, credentials upload sheets, contract-violation dispute, tier/premium job priority UI |
| Unsupported surface | no test covers a guard on tablet or the Android WebView (portrait lock) |

---

### 11. Top surprises (guard)

1. Active guards in any plain browser are forced to `/account` and installed shells never resolve to desktop, so all guard desktop UI (`GuardMyJobsDesktop`, `GuardEarningsDesktop`, desktop inspector, PR1084 desktop branch, Alt-shortcuts, command palette) is unreachable in production. The tablet rail is effectively browser-only because the APK manifest forces portrait.
2. Three different allow-lists decide what an inactive guard can open; the result is dead account-menu links (Guide, Profile), a dead "Edit application details" button, and suspended/blocked guards seeing the Activation screen instead of the suspended card on most tabs. Inactive guards have no nav at all, Support only through a button when approved.
3. Mobile nav puts Support in a primary tab and Pay (money) behind More; five nav labels differ from page titles (Field/Map, Shifts/Jobs, Pay/Payments, Standing/Performance, Schedule/Availability). The nav test uses a different hand-written destination list than the real app.
4. The crew/standing-crew/join-request feature is gone from the UI but remains in docs (`GuardCrewHubPanel`), realtime, and five nonexistent test files in `npm test`; seven guard components are dead (`GuardActivationChecklistView`, `GuardJobsPanelContent`, `GuardJobTypeMetricDetail`, `GuardJobTypeRatingSection`, `GuardMessengerPanel`, `GuardShiftAuditDisputes`, `PostOrdersAckPanel`).
5. Data that looks server-side is device-local: Availability (weekly slots + date overrides) lives only in localStorage (`guardAvailability.ts`), payout-invoice list uses `guardr_guard_payout_invoices` plus DB write-through, shift phase is in localStorage; there is no guard payout history UI (website payouts page is just an "Open app" CTA); the Stripe return URL uses `APP_URL`, which may differ from the WebView origin.
Also: My Jobs rows still use a car silhouette; the guard tour targets a nonexistent `guard-my-jobs-tabs` element; website-portal Profile for guards passes no credential callbacks.


## Part B. Client account type

*Client account type - source audit (read-only)*

Repo `/agent/repos/Guardr`, branch `cursor/redesign-audit-plan-a787`. All paths relative to repo root unless absolute.
Method: source only (docs not trusted). `node_modules` absent, so nothing was executed; nav tables are hand-derived by tracing `ClientAppLayout.tsx` -> `RoleAppShell.tsx` -> `src/surfaces/surfaceNavigation.ts`.
PR1084 = `git diff origin/main..HEAD` (3 commits). It added no tests (no changes under `e2e/` or `src/lib/`).

Abbreviations: M/T/D = mobile / tablet / desktop surface. App = Capacitor Android Customer app (WebView of the same web bundle, `capacitor.config.ts` `server.url`, role baked via `window.__GUARDR_NATIVE_PRODUCT_APP__` by `scripts/android-role-build.mjs`; there is NO separate native UI). SC = security-company. P/B = personal/business.

---

### 1. Route model (client)

Custom router in `src/lib/appNavigation.ts` (`parseAppRoute`, `buildAppPath`, `CLIENT_VIEW_FROM_SLUG`). State lives in `src/App.tsx` (client branch ~L14440-14710) and `ClientView` in `src/components/ClientDashboard.tsx`.

| Slug (`/client/<slug>`, alias `/app/client/<slug>`) | ClientView | Notes |
|---|---|---|
| (none) / `home` | home | `/client` -> home |
| `profile` | profile | rendered in App.tsx (`UserProfileScreen`) |
| `settings` | settings | rendered in App.tsx (`UserSettingsScreen`, wrapper `data-tour="client-settings"`) |
| `support` | support | `ClientMessagesPanel scope=support` |
| `support-compose` | support-compose | App.tsx `SupportComposePage` |
| `support-report` | support-report | App.tsx `SupportReportPage` |
| `map`, `coverage` | map | `coverage` is a read alias only |
| `request` | request | `RequestSecurityFlow` |
| `direct-request` | direct-request | `DirectGuardRequestFlow` |
| `messages` | messages | |
| `reports` | reports | |
| `invoices`, `payments`, `billing` | invoices | written back as `/client/payments` |
| `requests` | requests | |
| `guards` | guards | |
| `locations`, `sites` | locations | written back as `locations` |
| `roster` | roster | SC only |
| `operations` | operations | SC only |
| `guide` | guide | |
| unknown `/client/x` | null | falls back to default route |

Nested query params (client): `pg` guard profile id; `dr` direct-request guard id; `cj` selected job id; `jt` jobs tab (`open|scheduled|completed|missed`); `inv` invoice id; `jc` job chat request id; `chat=1` open job chat; `st` support ticket id; `sec` (`support|reports`); `sm` (`compose|report`, parsed but client uses dedicated views instead); `auth`, `ar`, `ct` (client type; legacy `ck`), `pick`. Ephemeral keys stripped on sync: `payment, job_id, deposit, stripe_connect, tip, overtime`. Last route persisted in sessionStorage `guardr_last_app_route`.
NOT in URL (lost on reload): request-flow preset (`flowPreset`), request wizard step, edit-request sheet, selected incident (Reports), Reports tab, guard-directory filters, locations editor, tab inside `ClientMessagesPanel` beyond `jc/st/sec`.

Other route families touching client:
- `/account[/view]` website account portal (views `home, profile, billing[payments|invoices|receipts], payouts, downloads, settings, support, documents`).
- `/messenger?role=client` Messenger companion; `constrainClientViewToMessenger` limits to messages, support, support-compose, support-report, settings, profile, guide.
- Native deep link scheme `guardr-client://`, appId `com.tmbcworks.guardr.client` (`src/lib/productApps.ts`).

#### 1a. Where a client can actually be (browser vs installed) - `src/lib/productApps.ts` `websiteShellAccess`, `App.tsx` `resolveWebsiteAccess` (~L2074) / `canOpenOperationalRoute` (~L764)
| Client state | Plain browser tab | Installed shell (Capacitor / baked native flag / standalone PWA) |
|---|---|---|
| status `active` or `suspended` | access `account`: forced to `/account` website shell. `/client/*` redirects with toast "You need the Customer app to use the platform." | access `operations`: full `/client/*` app, surface = mobile or tablet only (resolver never gives installed shells desktop) |
| status `pending` | access `activation`: may open `/client/home` etc. (restricted set, see 4) | same restricted set |
Consequence: every client `*Desktop` component and desktop branch is reachable only by (a) pending clients in a desktop browser, (b) `?ui=desktop` override, (c) dev preview. Active clients never see client desktop UI in production.

---

### 2. Capability matrix (exact, from `src/lib/clientProductModules.ts`, `clientCapabilities.ts`, `clientType.ts`)

`normalizeClientType` default = business. `isOrganizationClientType` = business or SC. Max guards/request: P 4, B 50, SC 50.

| Capability | Personal | Business | Security co. | Checked in UI code? |
|---|---|---|---|---|
| request-security | Y | Y | Y | NO (tests only) |
| one-time-schedule | Y | Y | Y | NO |
| recurring-schedules | Y | Y | Y | yes, but true for all types (home quick action label only) |
| rebook-service | Y | Y | - | NO |
| rehire-guard | Y | Y | - | NO |
| manage-upcoming | Y | Y | Y | NO |
| view-assigned-guards | Y | Y | Y | NO |
| messaging | Y | Y | Y | NO |
| invoices | Y | Y | Y | NO |
| save-locations | Y | Y | Y | NO |
| authorized-contacts | Y | Y | Y | NO |
| personal-protection | Y | Y | - | NO |
| multiple-sites | - | Y | Y | yes (`ClientLocationsPanel`) |
| multiple-users | - | Y | - | NO |
| employee-access | - | Y | - | NO |
| site-requirements | - | Y | - | yes (`ClientLocationsPanel`) |
| site-rosters | - | Y | - | NO |
| multi-guard-requests | - | Y | Y | yes (request flow custom count) |
| staffing-coverage | - | Y | Y | yes (Home coverage tile / live block) |
| business-billing | - | Y | Y | NO |
| company-documents | - | Y | Y | NO |
| reporting | - | Y | Y | yes (Reports view gate, nav, Home "Recent reports") |
| overflow-marketplace | - | - | Y | NO |
| roster-management | - | - | Y | yes (roster view gate/nav) |
| shift-operations | - | - | Y | yes (operations view gate/nav) |

Declared but never checked outside tests: 17 (all marked NO above except recurring-schedules). So "personal vs business" is implemented as label/view gating, not as capability enforcement.
Note: `clientProductModules.ts` header comment says each type is its own lane; `docs/user-manuals/client-user-manual.md` says P and B share one system and that SC is not its audience.

#### 2a. View gating (`isClientViewAllowedForType`; disallowed -> redirect to `home` in `ClientDashboard` effect and `App.tsx` `resolveAllowedClientView`)
| View | Personal | Business | Security co. |
|---|---|---|---|
| home, requests, request, direct-request, messages, support*, invoices, guards, locations, profile, settings, guide | Y | Y | Y |
| map | Y | Y | NO (redirects to home) |
| reports | NO | Y | Y |
| roster | NO | NO | Y |
| operations | NO | NO | Y |

SC dead-ends: `ClientHomeScreen` live tile / `ClientHomeDesktop` "Map" destination / `/client/coverage` all call navigate('map') -> silently bounce to Home for SC. `ClientActiveShift` (live shift overlay) lives only inside `ClientMapScreen`, so SC never gets it (SC uses Live Ops).

#### 2b. Label differences by type (as implemented)
| Concept | Personal | Business | Security co. |
|---|---|---|---|
| Primary tab 2 | Coverage (`requests`) | Jobs | Jobs |
| Primary tab 3 | Activity (`map`) | Activity (`map`) | Live ops (`operations`) + Roster tab 4 |
| Money destination | Payments | Billing | Billing |
| Guards destination | Guards | Guards | Marketplace |
| Locations destination | Locations | Sites | Client sites |
| Post CTA | Request security | Post job offer / Post a job | Post overflow job |
| Rebook CTA | Request again | Hire again | n/a (label differs; capability absent) |
| Authorized contacts roles / title | Family, Emergency, Authorized contact / "Authorized contacts" | Owner, Manager, Employee, Site contact / "Team & authorized users" | same as B |
| Credential catalog (`clientCredentialCatalog.ts`) | 11 types, gov ID always required | 16 types, rep gov ID always required | 4 types: rep gov ID + PPO license required, guard-employer-bond, other |
| Profile Company field | hidden | shown | shown |
| Request guard count | preset buttons <=4, no custom | custom up to 50 | custom up to 50 |
| Reports page / Home "Recent reports" | none | yes | yes |
| Home coverage tile + live block | "Request" tile instead | yes | yes |
| Home "Your guards" | in reports slot | wide panel | wide panel |
| Fee schedule | `resolveClientJobFeeConfig` by type | by type | by type |
| Home quick actions (`clientCapabilities.ts`) | request, guards, locations, schedule, recurring ("Recurring security") | + reports, recurring ("Multi-guard site") | + reports, roster, operations, recurring ("Recurring posts") |
| Settings / Support / Guide | identical | identical | identical |

---

### 3. Client navigation per surface (derived)

Builders: `clientPrimaryNav` / `clientOverflowNav` (`src/lib/clientCapabilities.ts`) -> `ClientAppLayout.tsx` (sections Work / Messages / Manage; `mobileTabRanks = {home:1, requests:2, map:3, operations:3, messages:4}`) -> `RoleAppShell.tsx` -> `buildMobileNavigation / buildTabletNavigation / buildDesktopNavigation`. Capacity (`surfaceDesign.ts surfacePrimaryNavCapacity`): mobile 5, tablet 9, desktop unlimited.

#### 3a. Source lists
| Type | Primary (Work) | Messages section | Overflow (Manage), in order |
|---|---|---|---|
| Personal | Overview(home), Coverage(requests), Activity(map) | Messages, Support | Payments(invoices), Guards, Locations, Settings |
| Business | Overview, Jobs(requests), Activity(map) | Messages, Support | Billing, Guards, Sites, Reports, Settings |
| Security co. | Overview, Jobs, Live ops(operations), Roster(roster) | Messages, Support | Billing, **Roster (dup id)**, **Live ops (dup id)**, Marketplace, Client sites, Reports, Settings |

#### 3b. Mobile (`MobileAppShell.tsx` bottom tabs + More sheet)
| Type | Bottom tabs (5 slots) | More sheet |
|---|---|---|
| Personal | Overview, Coverage, Activity, Messages, More | group "Messages": Support. group "Manage": Payments, Guards, Locations, Settings |
| Business | Overview, Jobs, Activity, Messages, More | Support; Billing, Guards, Sites, Reports, Settings |
| Security co. | Overview, Jobs, Live ops, **Live ops (duplicate React key)**, More | Messages falls into More; Support; Billing; Roster; Marketplace; Client sites; Reports; Settings (duplicates sorted/merged unpredictably) |
| Pending (any type) | Overview, Jobs/Coverage, Activity or Live ops, Messages (no More: overflow emptied) | n/a, plus Support reachable via Messages section |
Account menu (avatar): Profile, Settings, Guide (extra link), Download app, theme, notifications, Sign out. Messenger companion: only Messages + Support.

#### 3c. Tablet (`TabletAppShell.tsx`)
Left rail lists ALL destinations by section Work / Messages / Manage, same order as 3a. No quick-switch strip (the file says so) although `buildTabletNavigation` still computes `quick` and docs claim one. SC rail repeats Roster and Live ops.

#### 3d. Desktop (`DesktopAppShell.tsx` sidebar) - reachable only per 1a
Grouped sidebar Work / Messages / Manage + command palette + Alt+1..9 in source order. Personal: 1 Overview, 2 Coverage, 3 Activity, 4 Messages, 5 Support, 6 Payments, 7 Guards, 8 Locations, 9 Settings. Business: same through 5, then 6 Billing, 7 Guards, 8 Sites, 9 Reports (Settings has no shortcut). SC: shortcuts shift and duplicate. No `sidebarPrimaryAction` for client (no Post CTA in tablet/desktop shell). `headerContext` is a `DirectContextSelect` with a single option (company name) and no behavior.

#### 3e. Nav defects
- Duplicate ids `roster`, `operations` for SC in all shells (mobile bar shows two "Live ops").
- `ClientAppLayout` passes `children` [Today, Future, Past] on the `requests` item; `RoleAppShell.build()` drops them (`RoleNavItem` has no children). `navHighlightView` returns `requests-today|future|past`, which matches no destination id, so Jobs/Coverage is never highlighted. Sub-labels (Today/Future/Past) also do not match real tabs (Open/Scheduled/Completed/Missed, `JOB_TALLY_LABELS`).
- Pending clients: invoices view is allowed but nav hides it (overflow emptied).
- Nav label "Activity" vs Home desktop destination "Map" vs title "Map".
- Page titles (`VIEW_TITLES`): requests -> "Today's jobs / Future jobs / Past jobs" (missed -> "Past jobs"); request -> "Post job offer"; `PaymentsPage` title is static "Payments" even for business/SC (nav says Billing).
- Dev preview (`?ui-preview=1`) has no client nav shell (fake guard/staff shell "Marcus Trent").

---

### 4. Registration, application intake, approval states

| Step | Where | Source |
|---|---|---|
| Entry | `/?auth=sign-up&pick=path` -> `pick=client` -> kind picker (personal / business / security-company; `ct` param; legacy `ck`) | `src/components/auth/AuthRoleChoicePage.tsx`, `SIGNUP_CLIENT_KIND_OPTIONS`, `AppRoute.authClientType` |
| Sign-in | Guard / Customer / Staff; Customer then asks the same 3 kinds (also in installed Customer app: `installedAuthEntry` -> 'client-kind'). `clientKind` in `AuthPage.tsx` is used by signup and copy only; no sign-in check against stored `clientType` found (picker looks cosmetic at sign-in) | `src/components/AuthPage.tsx` |
| Intake form | `ClientSignupIntake` dispatches `PersonalClientSignupIntake`, `BusinessClientSignupIntake`, `SecurityCompanyClientSignupIntake`; shared `ClientSignupSharedSections.tsx` | `src/components/auth/clientSignup/*` |
| Sections by type (`src/lib/clientApplicationIntake.ts`) | Personal: contact, coverage-needs, service-area, prior-security-experience, referral. Business: organization, business-profile, contact, coverage-needs, service-area, prior-security-experience, referral. SC: organization, ppo-license, contact, coverage-needs, service-area, referral | |
| Options | `src/lib/clientSignupOptions.ts` (SERVICE_TYPE, SECURITY_COMPANY_SERVICE_TYPE, PROPERTY_TYPE, INDUSTRY, ENGAGEMENT_TYPE, BUSINESS_TYPE, HOW_HEARD) | |
| Validation | organization types need company name; SC needs BSIS PPO license number; `checkCityAccessForRole(serviceCity,'client')` | `AuthPage.tsx` ~L523-560 |
| Result | user created `approved:false`, `accountStatus:'pending'`, signed in immediately | |
| Pending UI | `getClientAccountStatus` -> pending/active/suspended (`src/lib/accountStatus.ts`). Pending: allowed views home, profile, settings, messages, guide, invoices, support, support-compose, support-report (`ClientDashboard` + `handleClientNavigate`); others render `AccountPendingScreen`. Overflow nav emptied. Home tiles muted + banner; all Home actions except messages route to Profile. `handlePostRequest` blocks with toast "pending Guardr approval" | `src/components/account/AccountPendingScreen.tsx`, `ClientHomeScreen.tsx`, `ClientHomeDesktop.tsx` |
| Revision requested | staff `handleRequestClientApplicationRevision`; client sees "Update your application", intake unlocked, relocked after save | `src/lib/applicationIntakeLock.ts`, `CLIENT_APPLICATION_INTAKE_LOCKED_MESSAGE` |
| Suspended | `approved===false` with no status maps to suspended. NO restricted UI in any client component; installed-shell suspended clients see the full app; the post-job toast wording ("pending approval") is wrong for them. Browser suspended clients go to `/account` like active ones | `src/lib/accountStatus.ts` |
| Credentials after signup | Profile -> `ClientCredentialsSection`, `ClientAuthorizedContactsSection` | |

---

### 5. Page inventory (one row per page/screen/tab/detail view)

Design-condition key. "Global only" = restyled only through shared selectors in `src/styles/visual-refresh.css` (`.app-screen-title`, `.app-page-lead-title`, `.app-button-primary`, `.adm-btn--primary`, `.app-item-card`, `.wf-list-card`, `.adm-card`) - type scale / button size / card radius per surface; no layout change. PR1084 client-relevant source changes: `ClientInvoiceScreen.tsx`, `ClientMapScreen.tsx`, `MapBrowseDock.tsx`, `MapSelectionExperience.tsx`, `ClientMessagesPanel.tsx`, `MessagesHubLayout.tsx`, `AppGuidePage.tsx`, `OfflineBanner.tsx`, `main.tsx` (imports CSS).

Testing key: UT = unit test run by `npm test` allow-list (package.json); UT* = unit test file exists but is NOT in the `npm test` allow-list; none = nothing. There are no component tests and no authenticated client e2e. e2e files: `e2e/public.spec.ts`, `e2e/installed-app-auth.spec.ts`, `e2e/surfaces.spec.ts` (unauthenticated only).

#### 5a. Entry, approval and website-account pages

| ID | Page name | Route / nav id | Permission / gating (P vs B) | Parent nav group | Child pages / tabs / detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C-01 | Client kind picker (sign-up and Customer sign-in) | `/?auth=sign-up&pick=client`, `/?auth=sign-in&pick=client`, `ct`; installed: `client-kind` | public; P/B/SC chosen here | Auth | 3 option cards | `src/components/auth/AuthRoleChoicePage.tsx` | Chooses personal / business / security company | Partially redesigned (visual-refresh.css role-choice rules: tablet grid/min-height, auth role-choice page) | M ok / T ok / D ok (hero) / App ok | Re-spec desktop; drop or enforce sign-in kind (cosmetic) | e2e public.spec (kind picker, sign-up shows/hides company), installed-app-auth.spec |
| C-02 | Client sign-up intake form | `/?auth=sign-up&ar=client&ct=<type>` | P: no company fields; B: company + business profile; SC: company + PPO license | Auth | Personal / Business / SC intake variants; sections per type | `src/components/AuthPage.tsx`, `src/components/auth/clientSignup/{ClientSignupIntake,PersonalClientSignupIntake,BusinessClientSignupIntake,SecurityCompanyClientSignupIntake,ClientSignupSharedSections}.tsx`, `src/lib/clientApplicationIntake.ts`, `src/lib/clientSignupOptions.ts` | Collects application, creates pending account | Outdated (not touched; AuthPage is 1k+ lines, inline) | M ok / T ok / D ok (no per-surface variants beyond CSS) | Redesign as stepper per type; share sections; per-surface layout | UT* clientApplicationIntake.test.ts, applicationSubmissionSnapshot.test.ts; e2e only company-field visibility |
| C-03 | Client sign-in form | `/?auth=sign-in&ar=client` | all types | Auth | Messenger-flavoured copy variant | `src/components/AuthPage.tsx`, `AuthRoleChoicePage.tsx` | Email/password sign-in | Outdated | M / T / D / App (Customer APK entry) | Restyle with auth system | e2e installed-app-auth.spec (picker only) |
| C-04 | Account pending approval screen | state (not routed): any non-allowed view while status `pending` | pending clients only | Gate inside `ClientDashboard`/`App.tsx` | "View profile" button, manual downloads, title "Account pending approval" | `src/components/account/AccountPendingScreen.tsx`, `ClientDashboard.tsx`, `App.tsx handleClientNavigate` | Blocks operational views while pending | Outdated | M / T / D (desktop browser only) | Design pending state as first-class page; unify with Home banner | none |
| C-05 | Application revision requested | same screen, `revisionOpen` branch ("Update your application") + Profile unlock | pending + staff requested revision | Gate / Profile | Intake re-edit in Profile, relock after save | `AccountPendingScreen.tsx`, `UserProfileScreen.tsx`, `src/lib/applicationIntakeLock.ts` | Resubmit application | Outdated | M / T / D | Design resubmission flow | UT* applicationIntakeLock.test.ts |
| C-06 | Website account - Home (Account) | `/account` | active/suspended clients in browser (and signed-in everywhere via URL) | Website account nav | Account summary, "Get Customer app" CTA, OpenAppCta | `src/components/website/WebsiteAccountShell.tsx`, `WebsiteAccountHome.tsx`, `src/lib/productApps.ts` | Browser landing for clients | Outdated (own `.website-account*` CSS in `product-apps.css`, outside the 3 surface layers) | M own nav / T / D / App n/a | Fold into surface system or intentionally separate | UT productApps.test.ts; e2e: signed-out redirect only |
| C-07 | Website account - Profile | `/account/profile` | same | Website account nav | Reuses profile screen | `WebsiteAccountShell.tsx`, `UserProfileScreen.tsx` | Edit profile | Outdated | M / T / D | same as C-52 | none |
| C-08 | Website account - Billing | `/account/billing` (aliases payments, invoices, receipts) ; `payouts` is guard-only | client | Website account nav | Reuses `ClientInvoiceScreen` | `WebsiteAccountShell.tsx`, `ClientInvoiceScreen.tsx`, `PaymentsPage.tsx` | Browser invoice payment | Partially redesigned (shares PR1084 invoice screen) | M / T / D | Verify desktop ledger inside website shell | none |
| C-09 | Website account - Downloads | `/account/downloads` | client; item hidden unless `canDownloadApks` | Website account nav | APK/AAB links | `WebsiteAccountDownloads.tsx` | Customer app download | Outdated | M / T / D | Restyle | none |
| C-10 | Website account - Settings | `/account/settings` | client | Website account nav | Reuses settings | `WebsiteAccountShell.tsx`, `UserSettingsScreen.tsx` | Settings | Outdated | M / T / D | same as C-55 | none |
| C-11 | Website account - Documents | `/account/documents` | client | Website account nav | Legal / company docs | `WebsiteAccountDocuments.tsx` | Documents list | Outdated | M / T / D | Restyle; wire `company-documents` capability (never checked) | none |
| C-12 | Website account - Support | `/account/support` | client | Website account nav | Two-section inbox tickets/reports (`initialSection`) | `src/components/support/SupportScreen.tsx` (used ONLY here) | Support inbox (second implementation) | Duplicated (parallel to in-app `ClientMessagesPanel scope=support`) | M / T / D | Merge with in-app support | `supportActivation.test.ts`, `supportDelete.test.ts` (UT, lib only) |

#### 5b. Operational pages (installed shells; desktop only for pending/override)

| ID | Page name | Route / nav id | Permission / gating (P vs B) | Parent nav group | Child pages / tabs / detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C-13 | Home / Overview | `/client/home`; nav `home` | all; P gets "Request" tile, B/SC get coverage tile + live block + Recent reports; pending: muted tiles + banner | Work (tab 1) | Quick actions (type-dependent), metric tiles, upcoming/active jobs, Your guards, Recent reports, recurring entry | `src/components/client/ClientHomeScreen.tsx` (M and T variants inline), `ClientHomeDesktop.tsx`, `src/lib/clientCapabilities.ts` | Dashboard + launch pad | Outdated (global only). Desktop ignores `homeQuickActions` and hard-codes Jobs/Billing/Guards/Map: SC loses Roster/Live ops/Reports and Map bounces | M ok / T ok (inline) / D ok but D unreachable for active users / App ok | Redesign per type; remove hard-coded desktop destinations; Home metrics per type | UT clientCapabilities.test.ts (quick actions) only |
| C-14 | Map / Activity | `/client/map` (`coverage` alias); nav `map`; `jc`, `chat` | P, B only (SC redirected home) | Work (tab 3 for P/B) | Browse dock / tablet rail, selection experience (sheet vs inspector), post-job FAB menu, empty message, active-shift overlay (C-15) | `src/components/client/ClientMapScreen.tsx`, `ClientMapBrowseDock.tsx` (only `ClientMapPostMenu` used), `src/components/map/MapBrowseDock.tsx`, `MapSelectionExperience.tsx`, `ShiftMap` | Live map of own jobs | Partially redesigned in PR1084 (tablet rail `.map-tablet-rail*`, `.client-map-layout`, `.map-selection-layer--tablet/desktop`; dev MapPreview uses staff items, not client) | M ok / T redesigned / D redesigned (unreachable for active) / App ok | Client preview fixtures; desktop inspector review; SC alternative | UT mapJobVisibility; no client map test |
| C-15 | Active shift tracking overlay | map overlay when a tracked job is selected | P, B only (lives inside map; SC never sees it) | Map child | Phases on-duty / on-site / etc.; start/end verification entry | `src/components/client/ClientActiveShift.tsx` | Live guard status | Outdated (single layout, no surface variants) | M ok / T uses mobile layout / D uses mobile layout | Per-surface layout; expose to SC via Live Ops | UT clientShift.test.ts |
| C-16 | Request security / Post job (9-step wizard) | `/client/request`; no nav id (home/FAB/CTA); preset NOT in URL | all; step options differ by type (P preset counts <=4; B/SC custom <=50; `site-requirements` gate on Requirements) | Work (action) | Steps: Service, Location, Schedule, Guards, Rate, Requirements, Post orders, Site briefing, Review; presets one-time / recurring / schedule | `src/components/client/RequestSecurityFlow.tsx`, `JobCertRequirementsPicker.tsx`, `src/lib/clientRequestFlow.ts` | Create a job offer | Outdated (global only) | M ok / T same / D same | Full redesign; URL step state; per-type copy | UT* clientRequestFlow.test.ts; jobEditRules UT |
| C-17 | Direct guard request (8 steps) | `/client/direct-request?dr=<guardId>` | all; missing guard -> redirect to guards | Guards child | 8-step wizard targeting one guard | `src/components/client/DirectGuardRequestFlow.tsx` | Hire a specific guard | Duplicated (near-copy of C-16) | M / T / D | Merge into C-16 with guard preset | none |
| C-18 | Jobs list (Requests) | `/client/requests?jt=`; nav `requests` | all; label Coverage (P) / Jobs (B,SC) | Work (tab 2) | Tabs C-19..C-22; hero summary, tally chart, `RosterLoadGate` error | `src/components/client/ClientRequestsList.tsx` (M/T), `ClientRequestsDesktop.tsx` | List and manage jobs | Outdated (global only; `data-tour="client-jobs"`) | M / T share one file / D separate file | Redesign list + master/detail | UT jobTallies, jobStatusTone; appNavigation.test covers `jt/cj` |
| C-19 | Jobs tab: Open | `jt=open` | all | Jobs tab | postings awaiting guards | same | open postings | Outdated | M/T/D | same | same |
| C-20 | Jobs tab: Scheduled | `jt=scheduled` | all | Jobs tab | confirmed upcoming | same | scheduled | Outdated | M/T/D | same | same |
| C-21 | Jobs tab: Completed | `jt=completed` | all | Jobs tab | finished jobs; review/tip entry | same | history | Outdated | M/T/D | same | same |
| C-22 | Jobs tab: Missed | `jt=missed` | all | Jobs tab | missed/unfilled | same | missed | Outdated | M/T/D | same | same |
| C-23 | Job detail | `/client/requests?cj=<id>` (also opened from map) | all | Jobs child | Action hub C-24..C-34; hides header (`clientHideHeader`) | `src/components/client/ClientJobActionsPanel.tsx` (1157 lines), `src/components/jobs/*` (`JobListingProfile`, `JobBillingSummary`) | Single-job command center | Outdated (monolith) | M push / T split / D split | Decompose; define detail layout per surface | UT jobScheduleChange, jobEditRules |
| C-24 | Applicant / guard approval, suggestions, team slots | inside C-23 (open jobs) | all; multi-guard slots B/SC | Job detail | Approve/deny applicants, ranked applicants, suggested guards, team slots / full-team approval | `ClientJobActionsPanel.tsx`, `src/lib/guardSuggestions.ts` | Pick guards | Outdated | M/T/D | Dedicated approvals UX | none |
| C-25 | Price negotiation / open contract | inside C-23 | all | Job detail | counter-offer | `src/components/jobs/PriceNegotiationPanel.tsx` | Rate negotiation | Outdated | M/T/D | review | none |
| C-26 | Edit request | sheet from C-23 | all; max guards = `caps.maxGuardsPerRequest` | Job detail | form | `src/components/client/EditRequestForm.tsx`, `src/components/client/jobs/EditRequestSheet.tsx` | Edit open job | Outdated (duplicates wizard fields) | M sheet / T sheet / D sheet | Reuse wizard sections | UT jobEditRules |
| C-27 | Shift start verification + self-audit confirm | inside C-23 | all | Job detail | verify / flag start checkpoint | `ClientShiftStartVerification.tsx`, `src/lib/selfAuditPhotos.ts` | Confirm guard arrival | Outdated | M/T/D | review | UT clientShift |
| C-28 | Shift end verification | inside C-23 | all | Job detail | verify / flag end checkpoint | `ClientShiftEndVerification.tsx` | Confirm guard departure | Outdated | M/T/D | review | UT clientShift |
| C-29 | Replacement request | inside C-23 | all | Job detail | request replacement, offers, assigned | `ReplacementRequestPanel.tsx`, `src/lib/emergencyReplacement.ts` | Replace guard | Outdated | M/T/D | review | none |
| C-30 | Schedule-change approval / extension payment | inside C-23 | all | Job detail | approve/reject/pay | `ClientJobActionsPanel.tsx`, `src/lib/jobScheduleChange.ts` | Approve staff schedule changes | Outdated | M/T/D | review | UT jobScheduleChange |
| C-31 | Overtime review | inside C-23; `?overtime` ephemeral | all | Job detail | approve / dispute / pay | `ClientJobActionsPanel.tsx` | Overtime approval | Outdated | M/T/D | review | none |
| C-32 | Job payment (Stripe / Square checkout) | inside C-23; `payment`, `job_id`, `deposit` ephemeral params | all | Job detail | deposit/balance checkout | `ClientJobActionsPanel.tsx`, `src/lib/shiftBilling.ts` | Pay job | Outdated | M/T/D | review | none |
| C-33 | Review + tip | inside C-23 (`?tip` ephemeral) | all | Job detail | star review, tip | `ClientJobActionsPanel.tsx`, `src/lib/clientTips.ts` | Rate guard / tip | Outdated | M/T/D | review | UT clientTips |
| C-34 | Violation report (job incident) | sheet from C-23 | all | Job detail | file violation | `ClientViolationReportSheet.tsx`, `src/lib/clientViolations.ts` | Report guard misconduct | Outdated | M/T/D | review; do not confuse with C-40 | UT* clientViolations.test.ts |
| C-35 | Messages hub | `/client/messages` ; `jc`, `chat=1`; nav `messages` | all | Messages (mobile tab 4 for P/B; More for SC) | List, C-36, C-37 | `ClientMessagesPanel.tsx`, `src/components/messages/MessagesHubLayout.tsx`, `src/lib/messagesInbox.ts` | Inbox | Partially redesigned in PR1084 (desktop context column `.desktop-messages-workbench/context`, `MessagesConversationFacts`; tablet split) | M ok / T ok / D redesigned (unreachable for active) / App ok | Verify tablet; client preview (dev preview uses generic fixture) | UT clientMessenger, messengerCompanion |
| C-36 | Job chat thread | `jc=<id>` | all | Messages child | per-job chat with guards | `ClientMessagesPanel.tsx` | Chat | Partially redesigned | M/T/D | same | same |
| C-37 | Guardr / client channel chat | inside C-35 (client-channel view) | all | Messages child | channel thread | `ClientMessagesPanel.tsx` | Chat with Guardr | Partially redesigned | M/T/D | same | same |
| C-38 | Support inbox | `/client/support`; `st`, `sec`; nav `support` | all; pending allowed | Messages (More) | Ticket list, C-41 | `ClientMessagesPanel.tsx scope=support`, `src/lib/support.ts` | Tickets + reports | Partially redesigned (shares hub layout) | M/T/D | merge with C-12 | UT supportActivation |
| C-39 | Contact support (compose) | `/client/support-compose` | all; pending allowed | Support child | form; hides header | `src/components/support/SupportComposePage.tsx`, `App.tsx closeClientSupportForm` (ignores its section arg) | New ticket | Outdated | M/T/D | review | none |
| C-40 | File a report (support-report) | `/client/support-report` | all; pending allowed | Support child | form; hides header | `src/components/support/SupportReportPage.tsx` | Platform report | Outdated | M/T/D | review | none |
| C-41 | Support ticket thread | `st=<id>` | all | Support child | thread | `ClientMessagesPanel.tsx` | Ticket conversation | Partially redesigned | M/T/D | review | none |
| C-42 | Reports | `/client/reports`; nav `reports` | B, SC only (`reporting`); P redirected home | Manage | Tabs incl. Invoices tab (C-44) | `ClientReportsScreen.tsx` (M/T), `ClientReportsDesktop.tsx` | Incident/shift reports | Outdated | M/T share / D separate | Redesign; do not shadow clientRecord | none |
| C-43 | Incident report detail | local state `selectedIncidentId` (no URL) | B, SC | Reports child | detail | `ClientReportsScreen.tsx` | View incident | Outdated | M/T/D | add URL param | none |
| C-44 | Reports -> Invoices tab | inside C-42 | B, SC | Reports child | local-state invoices via `buildInvoiceFromJob` | `src/components/client/ClientInvoicePanel.tsx` | Second invoice view | Duplicated (of C-45) | M/T/D | Remove; link to C-45 | UT* clientInvoiceStorage.test.ts |
| C-45 | Payments / Billing / Invoices | `/client/payments` (aliases invoices, billing); nav `invoices` | all; label Payments (P) / Billing (B,SC); pending: view allowed but nav hidden; renders Home if `clientRecord` missing | Manage | Invoice list, C-46, checkout | `src/components/payments/PaymentsPage.tsx` (static title "Payments"), `ClientInvoiceScreen.tsx` | Invoices and payment | Partially redesigned in PR1084 (desktop ledger + checkout `.invoice-desktop*`, `.app-full-page-detail`; tablet `ListDetailLayout` kept; dev InvoicePreview via `?page=invoices` only) | M list/detail / T split / D new ledger (unreachable for active) / App ok | Title per type; verify M/T against D; pending nav | UT* clientInvoiceStorage; none for screen |
| C-46 | Invoice detail / payment | `inv=<id>` | all | Billing child | line items, Stripe/Square checkout, loading states | `ClientInvoiceScreen.tsx` | Pay/view invoice | Partially redesigned | M/T/D | same | none |
| C-47 | Guards directory (Guards / Marketplace) | `/client/guards`; nav `guards` | all; SC label "Marketplace" (`overflow-marketplace` never checked) | Manage | Filters, desktop table, list | `GuardDirectoryScreen.tsx` | Browse/hire guards | Outdated | M list / T split panel / D `WorkbenchFlatSplit` | Redesign; SC marketplace semantics | none |
| C-48 | Guard profile | `pg=<guardId>`; hides header | all | Guards child | hire, direct request, rehire | `GuardProfileScreen.tsx` | Guard detail | Outdated | M push / T panel / D panel | Redesign | none |
| C-49 | Locations / Sites / Client sites | `/client/locations` (`sites` alias); nav `locations`; Home fallthrough if `clientRecord`/`onSaveClientLocation` missing | all; P: single/simple list; B/SC (`multiple-sites`): multiple sites; B only (`site-requirements`): site instructions | Manage | List, editor | `ClientLocationsPanel.tsx` | Saved sites | Outdated | M / T / D branches inline | Redesign; per-type | none |
| C-50 | Company Roster | `/client/roster`; nav `roster` | SC only (`roster-management`) | Work tab 4 for SC AND Manage (duplicate) | Roster guards, empty state | `SecurityCompanyRosterScreen.tsx` | Manage own guards | Outdated (one phone-style layout) | M / T / D same | Build all 3 surfaces; fix duplicate nav | none |
| C-51 | Live Operations | `/client/operations`; nav `operations` | SC only (`shift-operations`) | Work tab 3 for SC AND Manage (duplicate) | Live shifts, empty state | `SecurityCompanyOperationsScreen.tsx` | Live shifts of own guards | Outdated (one layout) | M / T / D same | Build all 3 surfaces | none |
| C-52 | Profile | `/client/profile`; avatar menu | all; Company field hidden for P; pending allowed | Account menu | Application intake / revision, C-53, C-54 | `src/components/profile/UserProfileScreen.tsx` (shared with guard/staff), `App.tsx` | Edit profile | Outdated | M / T / D branches | Redesign | none |
| C-53 | Authorized contacts / team users | section of C-52 | all; roles differ by type | Profile child | list/add contacts | `ClientAuthorizedContactsSection.tsx`, `src/lib/clientAuthorizedContacts.ts` | Contacts | Outdated | M/T/D | Redesign | UT clientAuthorizedContacts |
| C-54 | Client credentials | section of C-52 | catalog by type (11 / 16 / 4) | Profile child | upload/required docs | `ClientCredentialsSection.tsx`, `src/lib/clientCredentialCatalog.ts` | Docs/ID | Outdated | M/T/D | Redesign | UT clientCredentials |
| C-55 | Account settings | `/client/settings`; nav `settings`; pending allowed | all | Manage | push, app update, manuals, legal, about | `src/components/profile/UserSettingsScreen.tsx` | Settings | Outdated | M/T/D | Redesign | none |
| C-56 | Guide | `/client/guide`; extra link in avatar menu; pending allowed | all | Account menu | sections; tutorial launcher | `src/components/docs/AppGuidePage.tsx audience=client` | In-app manual | Partially redesigned in PR1084 (section reorder, `.adm-guide-*`); content says P and B only | M/T/D | Add SC content | none |
| C-57 | Guided tour (client-welcome) + tutorial demo job | overlay; navigates clientView home/requests/map/guards/messages/invoices/settings | all types (not type-aware) | Guide | 13 steps; demo requests | `src/lib/onboardingTours.ts`, `src/lib/tutorialDemoData.ts`, `data-tour` hooks | Onboarding | Outdated; SC steps navigate to `map` (bounces) and invoices step targets `client-settings` | M/T/D | Per-type tours | none |
| C-58 | Messenger companion (client) | `/messenger?role=client` | all | Messenger shell | messages, support, compose, report, settings, profile, guide | `constrainClientViewToMessenger` in `appNavigation.ts`, `RoleAppShell.tsx` | Chat-only app | Outdated | M mostly | review | UT messengerCompanion, clientMessenger; e2e installed Messenger welcome |

**Total client pages counted: 58** (C-01..C-58): 12 entry/approval/website-account, 46 operational (of which 8 are Jobs tabs/children of C-18, 12 are C-23 sub-actions, 3 Messages children, 4 profile/support pieces).
Counting alternative: distinct routable `ClientView` screens = 18 (home, map, request, direct-request, messages, reports, invoices, requests, guards, locations, roster, operations, profile, settings, support, support-compose, support-report, guide).

---

### 6. Duplicated / legacy / dead

| Item | Evidence |
|---|---|
| `src/components/client/ClientSelfAuditConfirm.tsx` | DEAD: imported nowhere; self-audit confirm runs via `onVerifyStartCheckpoint \|\| onConfirmSelfAudit` -> `ClientShiftStartVerification` in `ClientJobActionsPanel.tsx` |
| `ClientMapBrowseDock` export in `ClientMapBrowseDock.tsx` | only `ClientMapPostMenu` imported (by `ClientMapScreen`); wrapper component unused |
| `ClientInvoicePanel.tsx` (Reports -> Invoices tab) | local-state duplicate of `ClientInvoiceScreen` |
| `SupportScreen.tsx` vs `ClientMessagesPanel scope=support` | two support inboxes (website vs app) |
| `DirectGuardRequestFlow.tsx` vs `RequestSecurityFlow.tsx` | near-duplicate wizards |
| `EditRequestForm.tsx` / `EditRequestSheet.tsx` vs wizard | duplicated field sets |
| `ClientHomeDesktop` destinations vs `homeQuickActions` | two sources of truth; desktop one ignores gating |
| `useLayoutFormFactor()` | alias of `useSurfaceKind()` |
| `SurfaceSwitch`, `SurfacePage`, `SurfaceListDetail` (`src/surfaces`) | used by no real screen; client screens branch inline via ternaries. Only Home, Requests, Reports have per-surface files (`*Desktop`) |
| `buildTabletNavigation().quick` / `tabletQuick` | computed, no tablet quick strip renders |
| `requests` nav `children` [Today, Future, Past] | built in `ClientAppLayout`, dropped by `RoleAppShell`; `navHighlightView` ids match nothing |
| Stub `clientRecord` in Reports branch of `ClientDashboard` | shadows real record, lacks `clientType` |
| `sm` route param for client | parsed, client uses dedicated views |
| Legacy URL `ck`, `coverage`/`sites`/`billing` slugs, `patrol` service id | legacy aliases kept |
| 17 unchecked capabilities (section 2) | dead gating surface |
| `closeClientSupportForm(section)` | ignores its argument |
| `ClientDashboard.tsx` fallthroughs | `locations` / `invoices` render Home silently if `clientRecord`/handler missing |
| Android | no native client UI; only role APK baking of the same WebView; Gradle flavors are only sideload/play |

---

### 7. Loading / empty / error / restricted states used by client pages

| State | Where | Component |
|---|---|---|
| Error + retry (load failure) | Jobs list | `RosterLoadGate` (`src/components/ui/app/RosterLoadGate.tsx`) via `AppRequestState` - ONLY client use |
| Global offline / data-load banner | all | `OfflineBanner` (touched in PR1084), `dataLoadStatus` |
| Messages unavailable | `ClientDashboard` | `AppStatusBanner` "Messages are temporarily unavailable" |
| Restricted: pending | non-allowed views | `AccountPendingScreen`; Home banner + muted tiles; toast on post |
| Restricted: capability | disallowed view | silent redirect to Home (no explanation) |
| Restricted: suspended | none | no UI (gap) |
| Restricted: browser | active client at `/client/*` | redirect to `/account` + toast |
| Empty | Billing "No payments/invoices yet"; Reports "No reports yet"; Jobs "No scheduled coverage", "No open offers"; Roster "No roster guards yet"; Live ops "No live shifts"; Map `CLIENT_MAP_BROWSE_EMPTY_MESSAGE`; `WorkbenchEmpty`; `sft-empty` | `AppEmptyState` etc. |
| Loading | Stripe/Square checkout spinners (Invoice, JobActions: `Loader2`); no skeletons in client; no route-level Suspense/loading state found in client files | |
| Error boundary | none anywhere in `src/` (no `componentDidCatch` / `getDerivedStateFromError`) | gap |
| Tutorial demo | demo banner + demo jobs | `tutorialDemoData.ts` |
| Dev preview `?state=empty|error` | InvoicePreview, Payments, Map, Messages previews | `src/dev/previewScreenState.ts` |

---

### 8. Docs claims contradicted by code

| Doc claim | Reality |
|---|---|
| `docs/user-manuals/client-user-manual.md`: audience is personal and business; SC is not an audience | Full SC lane: signup intake, PPO validation, Roster, Live Ops, Marketplace label, 4-type credential catalog |
| Manual: P and B share one client system | `clientProductModules.ts` comment: each type is its own lane; 17 caps differ, 8 enforced |
| Manual: Reports is business only | SC also has Reports |
| `docs/SURFACES.md` / `CROSS_PLATFORM.md`: tablet quick-switch strip | `TabletAppShell.tsx` has none |
| SURFACES.md: "nothing is ever silently dropped" (reachability test) | SC duplicate ids; pending nav hides invoices though allowed |
| CROSS_PLATFORM.md ~L301 "GuardrDrawerShell tablet merge shell" | production tablet uses `TabletAppShell` |
| Docs list clients on desktop surface | active clients are redirected to `/account` in a browser; installed shells never resolve to desktop |
| Nav label "Jobs/Coverage" | page title "Today's jobs/Future jobs/Past jobs"; tabs Open/Scheduled/Completed/Missed |
| Nav "Billing" for B/SC | `PaymentsPage` title "Payments" |
| `docs/ANDROID-APK.md` role APKs | consistent with `android-role-build.mjs`; but the app is a WebView of the remote origin, not a native UI |

---

### 9. PR1084 coverage of client pages

Touched (source): C-14/C-15 area (Map), C-35..C-38/C-41 (Messages hub), C-45/C-46/C-08 (invoice desktop ledger), C-56 (Guide order), OfflineBanner (global).
Global-only (CSS selectors): every page using `.app-screen-title`, `.app-page-lead-title`, primary buttons, `.app-item-card`/`.wf-list-card`, `.adm-card`.
`visual-refresh.css` (854 lines) otherwise targets: legal-document pages, landing, auth role-choice, dev-preview-only classes (`.pay-surface*`, `.messages-preview*`, `.map-preview`, `.invoice-preview`, `.job-surface-table-wrap`). `visual-refresh.css` is NOT covered by the surface-independence CSS tests (`mobileSurfaceIndependence`, `tabletSurfaceIndependence`, `desktopSurfaceIndependence`, `surfaceLookIndependence`).
Untouched: Home, Jobs list/detail and all job actions, Request flows, Guards directory/profile, Locations, Reports, Roster, Operations, Profile, Settings, Support forms, auth/signup intake, account pending, website account (except billing), Messenger.
Dev preview (`src/dev/surfaces/*`) client-relevant: InvoicePreviewScreen (real `ClientInvoiceScreen`, `?page=invoices`, no nav entry), PaymentsPreviewScreen, MapPreviewScreen (staff items), MessagesPreviewScreen (generic hub). No Home, Jobs, Request flow, Guards, Locations preview.

---

### 10. Test gaps

- `npm test` is an explicit allow-list. Client tests NOT in it: `src/lib/clientApplicationIntake.test.ts`, `clientInvoiceStorage.test.ts`, `clientProductModules.test.ts`, `clientRequestFlow.test.ts`, `clientViolations.test.ts`, `applicationIntakeLock.test.ts`, `applicationSubmissionSnapshot.test.ts`, `notificationRouting.test.ts`, `roleSurfaceMatrix.test.ts` (covers client view gating).
- In the list: `clientType`, `clientCapabilities`, `clientAuthorizedContacts`, `clientCredentials`, `clientMessenger`, `clientTips`, `clientShift`, `appNavigation`, `productApps`, `messengerCompanion`, `jobEditRules`, `jobScheduleChange`, `jobTallies`, `jobStatusTone`, `assignmentMode`, `surfaceNavigation`, `surfaceKind`, `surfaceDesign`, CSS independence tests.
- No test: guard directory, locations, coverage, incident reports, emergency replacement, guard suggestions, shift billing, accounts status, support screens, any component. `appNavigation.test.ts` does not cover `pg`, `dr`, `inv`, `jc`, or support params for client.
- No authenticated client e2e; `e2e/surfaces.spec.ts` only checks unauthenticated surface resolution.
- No test asserts unique destination ids (would have caught SC duplicates).

---

### 11. Top surprises
1. Active clients in any browser tab are hard-redirected to `/account`; installed shells never resolve to desktop. All client `*Desktop` UI (incl. the PR1084 invoice ledger and messages context column) is effectively unreachable in production except for pending clients or `?ui=desktop`.
2. Security-company nav has duplicate ids (`roster`, `operations`): mobile bar shows "Live ops" twice and pushes Messages into More; same duplicates in tablet rail, desktop sidebar and shortcuts. SC also dead-ends to Home from every "map" CTA.
3. Jobs/Coverage never highlights: the Today/Future/Past sub-nav is dropped by `RoleAppShell` and highlight ids match nothing.
4. 17 of 25 capabilities are never checked; personal vs business is mostly labels plus 8 enforced capabilities; suspended clients have no restricted UI; no error boundary exists; `ClientSelfAuditConfirm` is dead; `ClientInvoicePanel` duplicates Billing inside Reports.
5. PR1084 touched only Map, Messages, Billing and Guide among client pages; most `visual-refresh.css` is legal/landing/dev-preview. Five client lib tests and `roleSurfaceMatrix` are outside `npm test`, and there is no authenticated client e2e.


## Part C. Staff account type

*Two source audits are combined: **C1** = page inventory (rows `S-01..S-96`), **C2** = routes, permission model, navigation per role, lifecycle.*

### C1. Staff pages

*Staff account type - source audit (read-only)*

Repo `/agent/repos/Guardr`, branch `cursor/redesign-audit-plan-a787`. Paths relative to repo root. Source only (docs not trusted). Nothing in the repo was modified or executed; `node_modules` absent.
Companion file `/tmp/audit/staff-perms.md` (another agent) holds the role x permission matrix, nav per role, lifecycle. This file does NOT repeat it; "Permission / gating" below gives the minimum level / function name actually enforced in code for that page.
PR1084 = `git diff --name-only 07074aab 03bd8b49` (staff-relevant: `StaffMessagesPanel`, `StaffSupportPanel`, `StaffOpsMapScreen`, `messaging/MessagesHubLayout`, `AppGuidePage`, dev previews, `visual-refresh.css`).

Abbreviations: Sup/Mod/Adm/Mgr/Dir/Fnd = Support/Moderator/Administrator/Manager/Director/Founder (`PlatformRole` `owner` = Founder). Fin = Finance desk seat (`role='finance'`). M/T/D = mobile/tablet/desktop surface. App = Capacitor Android Staff APK (WebView of the same bundle; installed shell resolves to the TABLET surface at any width; manifest portrait-locked; Messenger APK = Messages + Support only).

---

#### 1. Route model (staff) - short

`/staff/<slug>` (alias `/app/staff/<slug>`), `/dispatch` -> jobs, `/messenger?role=staff` -> messages. `StaffSection` (`src/lib/staffOps.ts`) has 34 ids = 30 in nav (`staffNavGroups.ts` `STAFF_NAV_GROUPS`, 8 groups) + 2 account-menu only (`profile`, `preferences`) + 2 legacy aliases (`team-chat`, `job-chats` -> messages). Nested state is in query params (`g c j t ci edit gtab pf jc tc st sec mtab aq`); tabs inside lists (applications queue, payments tabs, stats tabs, analytics tabs, messages tab, team-detail tab, profile tab) are NOT in the URL. Staff is the only role that gets `/staff/*` in a browser tab on every surface. Shell for all three surfaces is `StaffDashboard.tsx` -> `staff/StaffOpsLayout.tsx` -> `layouts/desktop/DesktopStaffAdminShell.tsx` (misnamed: it is the staff shell on M/T/D; mobile = hamburger drawer, tablet = rail + quick row, desktop = grouped sidebar) -> `StaffOpsPageShell.tsx` (per-surface toolbar/body). Full route/permission tables: see `/tmp/audit/staff-perms.md`.

Two gating mechanisms coexist in `StaffDashboard.tsx` (~L640-700 flags, `useEffect` redirect at ~L682, `renderSection` switch) plus `src/lib/staffNavAccess.ts` and `StaffOpsLayout` nav flags:
- HIDDEN + silent REDIRECT to `overview` (nav item hidden via `financeOnly/managementOnly/disputesOnly/citiesOnly/permissionsOnly`; deep link redirects via `isStaffNavSectionAccessible`): payments, platform-fees, agreements, audit-log, dev-updates, management, business-plan, company-package, disputes, cities, permissions, and every non-allowed section for finance-desk-only seats. The `AppBlockedAccessScreen` branches for these in `renderSection` are unreachable fallbacks.
- VISIBLE but BLOCKED SCREEN (`AppBlockedAccessScreen`, nav item still shown, no redirect): Statistics (`canViewStats`, Support blocked) and Analytics (`canViewAnalytics`, Support and Moderator blocked). Messages / Support / Incidents / Violations are Support-level and never blocked for ladder roles.
- VISIBLE and OPEN, actions gated inside the panel: Credentials (verify = `canVerifyCredentials` Adm+, Support/Moderator get a read-only roster), Locations (`canReviewJobRequests` Adm+ to edit; `onSaveJobLocation` is always supplied so the page itself never blocks), Jobs, Guards, Customers, Staff, Applications, Settings, Integrations.
All gating is client-side. `worker/routes/data.ts` `authorize()` + `ALLOWED_TABLES` has NO role/permission check, so any signed-in user can query staff tables through `/api/data/query` regardless of UI gating (see 11).

---

#### 5. Page inventory (one row per page/screen/tab/detail view)

Design-condition key. "Global only" = restyled only through shared selectors in `src/styles/visual-refresh.css` (`.app-screen-title`, `.app-page-lead-title`, `.app-button-primary`, `.adm-btn--primary`, `.app-item-card`, `.wf-list-card`, `.adm-card`) - type scale / button size / card radius per surface; no layout change. "Pre-PR1084 per-surface" = has `useLayoutFormFactor`/`useSurfaceKind` branches or `body[data-surface]` CSS (`styles/desktop-app.css`, `desktop-command.css`, `gr-mobile-overview.css`, `surface-mobile.css`, `tablet-app.css`) written BEFORE PR1084 and not touched by it. "PR1084 source" = the component file itself was changed by PR1084. Staff look is the `adm-*` / `staff-*` class family (`ListDetailLayout` + `useSplitListDetail` for list/detail pages).

Testing key: UT = a unit test run by the `npm test` allow-list covers the underlying lib logic (component itself untested); UT* = test exists but is NOT in the `npm test` allow-list; none = nothing. There are no component tests (only `StaffListFilterTabs.test.ts`, UT*), no authenticated staff e2e. e2e: `e2e/public.spec.ts` (staff sign-up checkbox scroll; `/staff/overview` signed-out redirect), `e2e/installed-app-auth.spec.ts` (staff APK shows "Log in as staff").

Surface column wording: "ok" = renders and has a surface-specific layout; "same" = one layout, only CSS scaling; "n/a" = not reachable.

##### 5a. Entry, activation and overlay screens

| ID | Page name | Route / nav id | Permission / gating | Parent nav group | Child pages / tabs / detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-01 | Staff sign-up ("Apply to work at Guardr") | `/?auth=sign-up&ar=staff`; installed `staff` | public; requested role select excludes Founder; creates PENDING staff (Director reviews) | Auth | role picker, ID/consent checkboxes | `src/components/auth/AuthPage.tsx` (staff branch ~L379-440), `AuthRoleChoicePage.tsx` | Application form with requested role, email, phone, password | Partially redesigned (shared auth role-choice CSS only) | M ok / T ok / D ok / App ok | Re-spec staff apply flow per surface; clarify requested-role vs granted-role | e2e public.spec (checkbox scroll); lib `staffAccountApproval`, `staffEmail` UT |
| S-02 | Staff sign-in | `/?auth=sign-in&ar=staff` | public; wrong-role accounts get "This is a staff account. Use Log in as staff." | Auth | - | `AuthPage.tsx` | Role-specific login | Same as S-01 | M ok / T ok / D ok / App ok | Same as S-01 | e2e installed-app-auth.spec |
| S-03 | Staff activation / pending / reactivation screen | in-dashboard (no route); `staffNeedsCredentialCompletion` | any staff whose gov ID or Stripe payout is missing; Mgr/Dir/Fnd exempt; Fin seat follows same rule | Entry | progress bar, checklist (application / government ID / Stripe payout), 3 titles (Staff activation, Finish onboarding, Complete credential verification), staff manual downloads | `staff/StaffAccountPendingScreen.tsx`, `lib/staffAccountActivation.ts` | Blocks ALL ops pages (no nav, no messages, no support) until ID verified + Stripe payouts enabled | Outdated (own `adm-pending-page` page; global only) | M ok / T ok / D ok / App ok | Redesign as guided onboarding; allow Messages/Support while pending | UT `staffAccountActivation` |
| S-04 | Activation: government ID upload | embedded in S-03 | self | Entry | front / back / selfie, rejected-resubmit state | `GuardIdentityVerificationPanel` (guard component, compact variant) via `StaffAccountPendingScreen.tsx` | Same panel as guards | Global only | same | Share with guard redesign | none (UT `staffAccountActivation` covers rules only) |
| S-05 | Activation: Stripe payout bank connect | embedded in S-03 | self | Entry | Stripe Connect sheet | `GuardStripeConnectSheet` via `StaffAccountPendingScreen.tsx` | Connect account, status poll | Global only | same | Share with guard redesign | none |
| S-06 | Staff legal agreements modal (overlay) | `LegalAcceptanceModal role='staff'` | every staff except Founder (`!isFounder`) | Overlay | agreement list, open-document links | `App.tsx` `marketplaceLegalGate` (~L13720), `components/legal/*` | Blocks dashboard until staff agreements accepted | Global only | same | Include in onboarding redesign | UT `legalAcceptance` |
| S-07 | Staff product tour (overlay) | `STAFF_ONBOARDING_TOUR` id `staff-welcome` (`data-tour="staff-*"` anchors) | owner/director/manager/administrator/moderator/support; Fin seat gets NO tour (`getTourForRole`) | Overlay | ~15 steps across overview, map, jobs, applications, credentials, locations, messages, support | `lib/onboardingTours.ts`, `TutorialExperience`, anchors in `StaffDashboard.tsx` / panels | Step tour that navigates sections via `onStaffSection` | Outdated (not surface-aware) | M ok / T ok / D ok / App ok | Re-anchor after layout redesign | none |

##### 5b. Top-level staff pages (the 30 nav destinations + 2 account-menu pages)

| ID | Page name | Route / nav id | Permission / gating | Parent nav group | Child pages / tabs / detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-08 | Overview | `/staff/overview`; `overview` (default; alias `design-qa`) | any staff incl. Fin (finance-desk allowed) | Dashboard | 3 layouts (mobile / tablet / desktop), KPI tiles, queue cards, SLA, charts, tier progress bars, quick shortcuts | `staff/StaffOverview.tsx` (pass-through) -> `StaffOverviewDesktop.tsx` -> `staff/overview/StaffOverviewLayouts.tsx`, `StaffOverviewShellParts.tsx`, `OverviewCharts.tsx`, `PerformanceTierProgressBars.tsx`; config `lib/staffOverviewConfig.ts` | Ops snapshot; tile clicks jump to roster pages | Pre-PR1084 per-surface (3 explicit layouts, `gr-mobile-overview.css`, `desktop-app.css`) | M ok / T ok / D ok / App tablet | Redesign tiles, align with new nav; drop dead `weeklyTrend`/`staffName` props | UT `staffOps`, `staffStats`; `staffOverviewConfig` none |
| S-09 | Map | `/staff/map`; `map` (shell goes bleed) | no page gate (all staff); approve/deny pin actions `canReviewJobRequests` (Adm+) | Dashboard | pin filters, browse dock, selection drawer -> S-41 job detail | `staff/StaffOpsMapScreen.tsx` (PR1084 source), `MapBrowseDock.tsx`, `MapSelectionExperience.tsx` (PR1084) | Live job pins, filter, open job panel | Partially redesigned (PR1084 source) | M ok / T ok / D ok / App tablet | Finish desktop map redesign; staff-specific pin states | none (dev preview `MapPreviewScreen`) |
| S-10 | Jobs | `/staff/jobs` (`?j=`); aliases `live-jobs`, `crews`, `/dispatch` | view all staff; create `canManageCompanyOperations` (Mgr+); approve/deny `canReviewJobRequests` (Adm+) | Operations | list + filters; detail S-41..S-46; create form S-45; bulk bar (dead) | `staff/StaffJobsPanel.tsx`, `StaffJobDetailPanel.tsx`, `StaffJobActionsBar.tsx` | Roster of jobs, approval queue, schedule-change queue, job offers | Pre-PR1084 per-surface (ListDetailLayout) | M ok / T ok / D ok / App tablet | Redesign list + master/detail; fix always-visible Approve/Cancel (see 11) | UT `jobScheduleChange`, `jobEditRules`, `staffApprovalsFeed` |
| S-11 | Locations | `/staff/locations`; `locations` | page open to all staff; edit/approve `canReviewJobRequests` (Adm+) (`StaffLocationsPanel` `canManage`; `handleSaveJobLocation` throws otherwise) | Operations | tabs All/Active/(pending), location detail S-47 | `staff/StaffLocationsPanel.tsx` | Review client locations, coordinates | Global only | M ok / T ok / D ok / App tablet | Redesign list/detail | UT `jobLocation`, UT* `jobLocations` |
| S-12 | Applications | `/staff/applications`; `applications` (alias `approvals`) | Mod+ (`canApproveGuards \|\| canManageGuards \|\| canManageClients \|\| canApproveStaffAccounts`); staff apps `canApproveStaffAccounts` (Mgr+ by default perms) | Operations | queues guard / client / staff / all (state only), review panels S-48..S-50, add forms S-51/S-52, one-role holds S-53, credential modal S-54 | `staff/StaffApplications.tsx` | Single inbox for new accounts | Global only | M ok / T ok / D ok / App tablet | Redesign queue + review; persist queue in URL | UT `staffApprovalsFeed`, `staffAccountApproval`, UT* `applicationIntakeLock`, `applicationSubmissionSnapshot` |
| S-13 | Credentials | `/staff/credentials` (`?ci=`); `credentials` | page open to all staff (read-only roster); verify/reject/request-update `canVerifyCredentials` (Adm+; `moderator.review_certifications`) | Operations | list by type; detail S-55..S-60; add credential S-61 | `staff/StaffCredentials.tsx` | Review queue for guard/staff/client credentials | Global only | M ok / T ok / D ok / App tablet | Redesign; unify with S-12 review | UT `staffCredentialRules`, `certStaffVerification` |
| S-14 | Guards | `/staff/guards` (`?g=`); `guards` | view all staff; edit `canManageGuards` (Mod+); suspend `canSuspendUsers` (Adm+); trusted `canSetTrustedStatus` (Mgr+) | Operations | roster + filters; detail S-62..S-68 | `staff/StaffGuardsPanel.tsx`, `StaffGuardDetailPanel.tsx`, `GuardRosterStatusBadges.tsx` | Guard directory and profile admin | Global only | M ok / T ok / D ok / App tablet | Redesign master/detail | UT `staffGuardEligibility`, `staffListFilters`, `staffGuardAccountActions` |
| S-15 | Customers (nav id `clients`) | `/staff/clients` (`?c=`); `clients` | view all staff; edit `canManageClients` (Mod+); trusted `canSetTrustedStatus` (Mgr+) | Operations | roster, detail S-69 | `staff/StaffClientsPanel.tsx`, `StaffClientDetailPanel.tsx` | Client directory + admin | Global only | M ok / T ok / D ok / App tablet | Redesign | UT `staffListFilters` |
| S-16 | Staff (nav id `team`) | `/staff/team` (`?t=`); `team` | view all staff; peers/lower only (`isStaffMemberVisibleToViewer`); add `canProposeStaffAccounts` (Adm+); approve/role `canManageStaffAccounts` (Mgr+) | Operations | roster (Sup/Mod/Adm tier), detail S-70/S-71, add staff S-72 | `staff/StaffTeamPanel.tsx` (tier prop), `StaffTeamDetailPanel.tsx` | Staff roster | Global only | M ok / T ok / D ok / App tablet | Redesign | UT `staffOps`, `staffProfile`, UT* none |
| S-17 | Management | `/staff/management`; `management` | `canViewManagementRoster` (Mgr+); else redirect to overview | Operations | same panel as S-16 with tier = management (Mgr/Dir/Fnd), detail S-70/S-71 | `staff/StaffTeamPanel.tsx`, `StaffTeamDetailPanel.tsx` | Management roster | Global only | same as S-16 | Merge or differentiate vs S-16 | as S-16 |
| S-18 | Messages | `/staff/messages` (`/messenger?role=staff`); aliases `team-chat`, `job-chats` | `canAccessStaffMessages` (Sup+) | Communications | tabs Team (S-73) / Jobs (S-74); nested conversations (`tc`, `jc`) | `staff/StaffMessagesPanel.tsx` (PR1084 source), `components/messaging/MessagesHubLayout.tsx` (PR1084) | Staff/guard/client community channels + job chat monitoring | Partially redesigned (PR1084 source) | M ok / T ok / D ok / App ok (Messenger APK) | Align with client/guard hub; add conversation preview | UT `guardMessenger`, `messengerCompanion`; UT* `staffOpsNavNotifications` |
| S-19 | Support | `/staff/support` (`?st=`, `sec=`); `support` | `canAccessSupportInbox` (Sup+) | Communications | tabs Support / Reports (`sec=reports`) (S-75/S-76), status filter Open/All, ticket detail | `staff/StaffSupportPanel.tsx` (PR1084 source), `MessagesHubLayout.tsx` | Ticket inbox + user reports | Partially redesigned (PR1084 source) | M ok / T ok / D ok / App ok | Same as S-18 | none (support ticket logic untested) |
| S-20 | Incidents | `/staff/incidents`; `incidents` | `canViewIncidents` (Sup+) | Issues | list + detail S-77 | `staff/StaffIncidentsPanel.tsx` | Review incident reports | Global only | M ok / T ok / D ok / App tablet | Redesign | none (`incidentReports` untested) |
| S-21 | Violations | `/staff/violations`; `violations` | view `canViewViolations` (Sup+); resolve `canHandleDisputes` (Adm+) | Issues | filter tabs Open / All / Resolved, detail S-78 | `staff/StaffViolationsPanel.tsx` | Guard violation list + resolve | Global only | same | Redesign | UT* `clientViolations` only |
| S-22 | Disputes | `/staff/disputes`; `disputes` | `canHandleDisputes` (Adm+); nav item hidden + deep link redirects to overview for Sup/Mod | Issues | filters Open/Closed/All and type All/Overtime; detail S-79 | `staff/StaffDisputesPanel.tsx` | Dispute queue + resolve actions | Global only | same | Redesign | UT `staffOps` (buildDisputes) |
| S-23 | Statistics | `/staff/stats`; `stats` | `canViewStats` (Mod+); else BLOCKED | Insights | tabs Overview / Guards / Compare / Violations (S-80..S-83) | `staff/StaffStatsPanel.tsx` | Guard performance stats, CSV-style columns | Global only | same | Redesign | UT `staffStats`, `guardPerformance*` |
| S-24 | Analytics | `/staff/analytics`; `analytics` | `canViewAnalytics` (Adm+); financial block `canAccessFinancialControls` (Mgr+) | Insights | tabs SLA & operations (S-84) / Platform analytics (S-85) | `staff/StaffAnalyticsInsightsPanel.tsx`, `StaffAnalyticsPanel.tsx`, `StaffSlaDashboard.tsx` | Platform analytics | Global only | same | Redesign charts per surface | none |
| S-25 | Payments & invoices | `/staff/payments`; `payments` | `canAccessFinancialControls` (Mgr+ or Fin seat); executive controls `hasExecutivePaymentControls` (Mgr+) | Finance | tabs Needs action / All / Invoices, detail S-86..S-88 | `staff/StaffPaymentsPanel.tsx` (+ shared `PaymentsPage` wrapper) | Marketplace payment pipeline, payouts, invoices | Global only | M ok / T ok / D ok / App tablet | Redesign (money UX) | UT `paymentPipeline`; invoice/payout none |
| S-26 | Platform fees | `/staff/platform-fees`; `platform-fees` (alias `payment-settings`) | view `canAccessFinancialControls` (Mgr+); edit `hasExecutivePaymentControls` (Mgr+) | Finance | fee schedule editor | `staff/StaffPlatformFeesPanel.tsx`, `PlatformFeeScheduleEditor.tsx`, `staffFinanceSettingsControls.tsx` | Fee schedule | Global only | same | Redesign | UT `platformFees`, `platformSettings` |
| S-27 | Staff compensation | `/staff/staff-compensation`; `staff-compensation` (alias `staff-pay`) | view `canViewStaffCompensation` (any staff); manage / confirm payout (Dir+); adjust time `canAdjustStaffTimeEntries` (Mgr+) | Finance | sub-views S-89..S-91 | `staff/StaffCompensationPage.tsx`, `StaffCompensationPanel.tsx` | Staff hourly/revenue-share payouts | Global only | same | Redesign | UT `staffCompensation`, `staffTimeTracking` |
| S-28 | Agreements | `/staff/agreements`; `agreements` | `canAccessFinancialControls` (Mgr+) | Finance | single page: legal compliance table | `StaffDashboard.tsx` -> `staff/StaffLegalCompliancePanel.tsx` | Who accepted which agreements | Global only | same | Redesign | UT `legalAcceptance` |
| S-29 | Audit log | `/staff/audit-log`; `audit-log` | any finance permission (code message says "audit log permission" but gate = `canAccessFinancialControls`, Mgr+) | Finance | single list | `staff/StaffAuditLogPanel.tsx` | Read-only action log | Global only | same | Redesign (filters/search) | none |
| S-30 | Service areas (nav id `cities`) | `/staff/cities`; `cities` | view `canViewCityMarkets` (Mgr+); manage `canManageCityMarkets` (Dir+); recommend only role `manager` | Platform | status/sort filters, city detail S-92 | `staff/StaffCitiesPanel.tsx` | City markets open/closed/waitlist/recommend | Global only | same | Redesign | UT `platformCities`, `staffCityAccess` |
| S-31 | Permissions | `/staff/permissions`; `permissions` | `canAccessStaffPermissions` (Mgr+); else redirect | Platform | role tabs, S-93, S-94 | `staff/StaffPermissionsPanel.tsx` | Edit role -> permission grants | Global only | same | Redesign matrix per surface | none (`permissions.ts` has only `financeSideRole` test) |
| S-32 | Public information (nav id `settings`) | `/staff/settings`; `settings` | view: all staff (`showSettings` hard-coded true); placard `hasExecutivePaymentControls` (Mgr+); broadcast Dir+ | Platform | sections S-95 | `staff/StaffSettingsPanel.tsx`, `StaffCompanyPlacardPanel.tsx` | Company info, homepage message, broadcast | Global only | same | Rename (titled "Public Information", not Settings) | UT `platformSettings`, `companyPlacard` |
| S-33 | Integrations | `/staff/integrations`; `integrations` | view all staff; edit `canManageStaffPlatformContent` (Adm+) | Platform | provider cards | `staff/StaffIntegrationsPanel.tsx` | Integration status/config | Global only | same | Redesign | none |
| S-34 | Guide | `/staff/guide`; `guide` | any staff | Resources | roles reference S-96 | `components/docs/AppGuidePage.tsx` (PR1084 source), `staff/RolePermissionsGuide.tsx` | In-app guide | Partially redesigned (PR1084 order change) | M ok / T ok / D ok / App ok | Refresh content; staff tutorial links | none |
| S-35 | Development updates | `/staff/dev-updates`; `dev-updates` | `showFinance` (Mgr+) | Resources | markdown changelog | `components/docs/DevNotesPage.tsx` (raw `DEV-UPDATES.md` in main bundle) | Release notes | Global only | same | Decide keep/drop (see 6) | none |
| S-36 | Business plan | `/staff/business-plan` | `canViewManagementRoster` (Mgr+) | Resources | markdown + PDF | `components/docs/BusinessPlanPage.tsx` | Internal plan | Global only | same | Move out of public bundle (see 11) | none |
| S-37 | Company package | `/staff/company-package` | `canViewManagementRoster` (Mgr+) | Resources | markdown + PDF | `components/docs/CompanyPackagePage.tsx` | Company package | Global only | same | as S-36 | none |
| S-38 | Profile | `/staff/profile`; `profile` (account menu only) | self | Account | tabs Profile / Timesheets (not in URL) | `components/profile/UserProfileScreen.tsx`, `staff/StaffTimesheetsPanel.tsx` | Own profile, own timesheet | Global only | M ok / T ok / D ok / App | Redesign with shared profile | UT `staffProfile`, `staffTimeTracking` |
| S-39 | Settings (nav id `preferences`) | `/staff/preferences`; `preferences` (account menu only) | self | Account | notification, tutorial, theme | `components/settings/UserSettingsScreen.tsx` | Preferences, tutorial restart | Global only | same | Redesign with shared settings | none |

##### 5c. Nested pages, tabs, detail views and forms

| ID | Page name | Route / nav id | Permission / gating | Parent nav group | Child pages / tabs / detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-40 | Map selection drawer | Map pin tap | as S-09 | Dashboard > Map | embeds S-41 | `StaffOpsMapScreen.tsx` -> `MapSelectionExperience` | Peek at job on map | PR1084 source | M ok / T ok / D ok | Unify with S-41 | none |
| S-41 | Job detail | `/staff/jobs?j=<id>` | view all staff; edit title/location `canEditJobListingDetails`; coords edit any staff | Operations > Jobs | S-42..S-46 | `staff/StaffJobDetailPanel.tsx` | Full job record, payment summary, applicants | Pre-PR1084 per-surface | M sub-screen / T / D split | Redesign | UT `jobEditRules` |
| S-42 | Job approval controls (approve / deny request, schedule-change review) | within S-41 / list | Adm+ (`canReviewJobRequests`); button shown to everyone, handler `undefined` for non-reviewers | Jobs | approve, deny, cancel, schedule-change accept/deny | `staff/StaffJobActionsBar.tsx`, `StaffJobDetailPanel.tsx` | Approval workflow | Global only | same | Fix visibility; redesign | UT `jobScheduleChange` |
| S-43 | Job listing edit | within S-41 | `canEditJobListingDetails` (Adm+ / Mgr+ override) | Jobs | title, location, coordinate fields | `StaffJobDetailPanel.tsx` | Inline edit | Global only | same | Redesign form | UT `jobEditRules` |
| S-44 | Applicant ranking (read-only) | within S-41 | any staff | Jobs | ranked applicant list ("clients approve directly") | `StaffJobDetailPanel.tsx` | Reference only; approve/deny props plumbed but never rendered (see 6) | Global only | same | Decide product intent | none |
| S-45 | Create job form | toolbar button on S-10 | `canManageCompanyOperations` (Mgr+) | Jobs | form | `staff/StaffCreateJobForm.tsx`, `useStaffCreateFormOpen.ts` | Staff-created job | Global only | M ok / T ok / D ok | Redesign | none |
| S-46 | Job approval settings | in S-31 | Mgr+ | Platform > Permissions | per-role approval toggles | `staff/StaffJobApprovalSettings.tsx` | Who approves jobs | Global only | same | Redesign | UT `platformSettings` |
| S-47 | Location detail / review | `/staff/locations` selection | view all; approve/edit Adm+ | Operations > Locations | approve location, edit coords | `StaffLocationsPanel.tsx` (3 shells at L661/714/775) | Location review | Global only | same | Redesign | UT `jobLocation` |
| S-48 | Guard application review | S-12 selection (`g`) | Mod+ approve | Applications | summary, activation checklist, account access, credential viewer | `staff/StaffGuardApplicationReviewPanel.tsx`, `StaffGuardApplicationSummary.tsx`, `StaffGuardActivationChecklistView.tsx` | Approve / reject guard account | Global only | same | Merge with S-62 | UT `staffGuardEligibility` |
| S-49 | Client application review | S-12 selection (`c`) | Mod+ approve | Applications | personal / business / security-company summaries | `staff/StaffClientApplicationReviewPanel.tsx`, `StaffClientApplicationSummary.tsx`, `StaffPersonalClientApplication.tsx`, `StaffBusinessClientApplication.tsx`, `StaffSecurityCompanyApplication.tsx` | Approve / reject client | Global only | same | Redesign | none |
| S-50 | Staff application review | S-12 selection | `canApproveStaffAccounts` | Applications | summary, requested role | `staff/StaffStaffApplicationReviewPanel.tsx`, `StaffStaffApplicationSummary.tsx` | Approve staff + assign role | Global only | same | Redesign | UT `staffAccountApproval` |
| S-51 | Add guard form | S-12 toolbar | `canManageGuards` (Mod+) | Applications | form | `staff/StaffAddGuardForm.tsx` | Staff-created guard | Global only | same | Redesign | none |
| S-52 | Add client form | S-12 toolbar | `canManageClients` (Mod+) | Applications | form | `staff/StaffAddClientForm.tsx` | Staff-created client | Global only | same | Redesign | none |
| S-53 | One-role holds | in S-12 | Mod+ | Applications | list of accounts held by one-role policy | `staff/StaffOneRoleHolds.tsx` | Resolve role conflicts | Global only | same | Redesign | UT `oneRolePolicy` |
| S-54 | Application credential viewer (modal) | modal in S-12/S-48 | Mod+ | Applications | document preview | `staff/StaffApplicationCredentialViewModal.tsx` | View uploaded doc | Global only | same | Redesign | none |
| S-55 | Credential review: certification | `?ci=<id>` | view all; actions Adm+ | Credentials | approve / reject / request update | `staff/StaffCertReviewDetail.tsx`, `StaffCredentialReviewDetail.tsx` | Cert review | Global only | same | Redesign | UT `certStaffVerification` |
| S-56 | Credential review: COI | `?ci=<id>` | Adm+ | Credentials | - | `staff/StaffCoiReviewDetail.tsx` | Insurance review | Global only | same | Redesign | none |
| S-57 | Credential review: government ID | `?ci=<id>` | `canVerifyCredentials` (Adm+) | Credentials | front/back/selfie slots | `staff/StaffGovIdReviewDetail.tsx`, `StaffIdReviewSection.tsx` | ID review (also in S-62) | Global only | same | Redesign | UT `staffAccountActivation` |
| S-58 | Credential review: vehicle | `?ci=<id>` | Adm+ | Credentials | - | `staff/StaffVehicleReviewSection.tsx` | Vehicle review | Global only | same | Redesign | none |
| S-59 | Credential review: client credential | `?ci=<id>` | Adm+ | Credentials | - | `staff/StaffClientCredentialReviewDetail.tsx` | Client doc review | Global only | same | Redesign | UT `clientCredentials` |
| S-60 | Credential review: staff activation | `?ci=<id>` | Adm+ | Credentials | gov ID + Stripe status | `staff/StaffActivationReviewDetail.tsx` | Approve staff activation ID | Global only | same | Redesign | UT `staffAccountActivation` |
| S-61 | Add credential for guard | S-13 / S-62 | `canManageGuardAccounts` (Mod+), page itself Adm+ | Credentials | wizard | `staff/StaffCredentialAddForGuardForm.tsx`, `StaffGuardCredentialAddWizard.tsx` | Staff uploads on behalf | Global only | same | Redesign | none |
| S-62 | Guard detail: Profile tab | `/staff/guards?g=<id>&gtab=profile` | view all; edit `canManageGuards` | Guards | S-68 account controls | `staff/StaffGuardDetailPanel.tsx`, `StaffDetailProfileHeader.tsx` | Guard profile | Global only | same | Redesign | UT `staffGuardEligibility` |
| S-63 | Guard detail: Certs tab | `gtab=certs` | as S-62 | Guards | cert list, missing-credential badges | `StaffGuardDetailPanel.tsx` | Certs | Global only | same | Redesign | none |
| S-64 | Guard detail: Inventory tab | `gtab=inventory` | as S-62 | Guards | equipment | `StaffGuardDetailPanel.tsx` | Guard inventory | Global only | same | Redesign | none |
| S-65 | Guard detail: Performance tab | `gtab=performance` (`pf=<factor>`) | as S-62 | Guards | factor drill-down | `staff/StaffGuardPerformancePanel.tsx` | Score + factors | Global only | same | Redesign | UT `guardPerformance*` |
| S-66 | Guard detail: Timesheet tab | `gtab=timesheet` (guard only, `!guard.isStaff`) | as S-62 | Guards | - | `StaffGuardDetailPanel.tsx` | Guard timesheet | Global only | same | Redesign | UT `guardTimesheet` |
| S-67 | Guard edit mode | `?edit=1` | `canManageGuards` | Guards | edit form | `StaffGuardDetailPanel.tsx` | Edit guard fields | Global only | same | Redesign | none |
| S-68 | Guard account controls | in S-62 | suspend Adm+; trusted Mgr+; delete Mod+ | Guards | suspend, reinstate, trusted, delete, ID actions | `staff/StaffGuardAccountControls.tsx`, `StaffAccountAccessSection.tsx` | Account admin | Global only | same | Redesign with confirm UX | UT `staffGuardAccountActions` |
| S-69 | Client detail | `/staff/clients?c=<id>` | edit Mod+ | Customers | account access section, trusted | `staff/StaffClientDetailPanel.tsx` | Client profile admin | Global only | same | Redesign | none |
| S-70 | Team member detail: Profile tab | `/staff/team?t=<id>` (tab not in URL) | rank strictly below viewer (`canModerateStaffMember`) | Staff / Management | edit details, role, account access | `staff/StaffTeamDetailPanel.tsx`, `StaffDetailProfileHeader.tsx`, `StaffAccountAccessSection.tsx` | Staff profile admin | Global only | same | Redesign | UT `staffProfile`, `staffOps` |
| S-71 | Team member detail: Timesheets tab | tab in S-70 | Mgr hint | Staff / Management | timesheet + manager hint | `staff/StaffTimesheetsPanel.tsx` | Review staff hours | Global only | same | Redesign | UT `staffTimeTracking` |
| S-72 | Add staff form | S-16 toolbar | `canProposeStaffAccounts` (Adm+); roles below own rank | Staff | form, operations access picker | `staff/StaffAddStaffForm.tsx`, `StaffOperationsAccessPicker.tsx` | Create / propose staff | Global only | same | Redesign | UT `staffOps` |
| S-73 | Messages: Team tab | S-18 (`tc`) | Sup+ | Communications > Messages | staff / guard / client community channels | `StaffMessagesPanel.tsx` | Broadcast channels | PR1084 source | same | Align | UT `guardMessenger` |
| S-74 | Messages: Jobs tab | S-18 (`jc`) | Sup+ | Communications > Messages | job conversations list + thread | `StaffMessagesPanel.tsx` | Job chat monitoring | PR1084 source | same | Align | none |
| S-75 | Support: Support tab | S-19 (`st`) | Sup+ | Communications > Support | status Open/All, ticket thread, status change | `StaffSupportPanel.tsx` | Ticket handling | PR1084 source | same | Align | none |
| S-76 | Support: Reports tab | S-19 (`sec=reports`) | Sup+ | Communications > Support | user reports | `StaffSupportPanel.tsx` | Report triage | PR1084 source | same | Align | none |
| S-77 | Incident detail | S-20 selection | Sup+ | Issues | - | `StaffIncidentsPanel.tsx` | Incident review | Global only | same | Redesign | none |
| S-78 | Violation detail + resolve | S-21 selection | resolve Adm+ | Issues | - | `StaffViolationsPanel.tsx` | Resolve violation | Global only | same | Redesign | none |
| S-79 | Dispute detail + resolution | S-22 selection | Adm+ | Issues | hold funds / approve payout / side actions | `StaffDisputesPanel.tsx` | Resolve dispute | Global only | same | Redesign | none |
| S-80 | Stats: Overview tab | S-23 | Mod+ | Insights | KPIs | `StaffStatsPanel.tsx` | - | Global only | same | Redesign | UT `staffStats` |
| S-81 | Stats: Guards tab | S-23 | Mod+ | Insights | table, open guard (sets gtab=performance) | `StaffStatsPanel.tsx` | Guard stat table | Global only | same | Redesign | UT `staffStats` |
| S-82 | Stats: Compare tab | S-23 | Mod+ | Insights | compare guards | `StaffStatsPanel.tsx` | - | Global only | same | Redesign | UT `staffStats` |
| S-83 | Stats: Violations tab | S-23 | Mod+ | Insights | "Open violations inbox" link | `StaffStatsPanel.tsx` | Duplicates S-21 summary | Global only | same | Drop or merge | none |
| S-84 | Analytics: SLA & operations tab | S-24 | Adm+ | Insights | SLA tiles | `staff/StaffSlaDashboard.tsx` | SLA dashboard | Global only | same | Redesign | none |
| S-85 | Analytics: Platform analytics tab | S-24 | Adm+; financial block Mgr+ | Insights | charts | `StaffAnalyticsPanel.tsx`, `StaffMgmtSection.tsx` | Platform analytics | Global only | same | Redesign | none |
| S-86 | Payment detail (job payment row / shift details) | S-25 selection | Mgr+ / Fin | Finance | payment summary, shift details | `staff/JobPaymentRow.tsx`, `JobPaymentShiftDetails.tsx`, `StaffPaymentSummary.tsx` | Per-job payment | Global only | same | Redesign | UT `paymentPipeline` |
| S-87 | Payout invoice row / invoices tab | S-25 tab Invoices | Mgr+ / Fin | Finance | invoice rows | `staff/StaffPayoutInvoiceRow.tsx` | Payout invoices | Global only | same | Redesign | none |
| S-88 | Financial controls (hold / release / executive actions) | in S-25 / S-26 | `hasExecutivePaymentControls` (Mgr+) | Finance | - | `StaffPaymentsPanel.tsx`, `staffFinanceSettingsControls.tsx` | Payment controls | Global only | same | Redesign | none |
| S-89 | Compensation: own earnings / timesheets | S-27 | any staff | Finance | - | `StaffCompensationPage.tsx`, `StaffTimesheetsPanel.tsx` | View own comp | Global only | same | Redesign | UT `staffCompensation` |
| S-90 | Compensation: pay rules / settings | S-27 | Mgr+ view, Dir+ manage | Finance | - | `StaffCompensationSettings.tsx`, `StaffMgmtSection.tsx` | Pay configuration | Global only | same | Redesign | UT `staffCompensation` |
| S-91 | Compensation: time adjustments + payout confirmation | S-27 | adjust Mgr+; confirm Dir+ | Finance | - | `StaffCompensationPanel.tsx`, `StaffTimeAdjustmentsPanel.tsx` | Adjust entries, confirm payouts | Global only | same | Redesign | UT `staffTimeTracking` |
| S-92 | City detail / edit | S-30 selection | manage Dir+; recommend Mgr (role `manager`); cap edit Fnd | Platform | credential links editor, city manager picker, status | `StaffCitiesPanel.tsx`, `CityCredentialLinksEditor.tsx`, `CityManagerPicker.tsx` | City markets admin | Global only | same | Redesign | UT `platformCities` |
| S-93 | Permissions: role tab editor | S-31 | Mgr+ | Platform | role tabs (default Moderator) | `StaffPermissionsPanel.tsx` | Edit grants | Global only | same | Redesign | none |
| S-94 | Permissions: client credential library | S-31 | `isExecutiveOpsRole` (Mgr+) | Platform | library editor | `staff/ClientCredentialLibraryEditor.tsx` | Defines client credential types | Global only | same | Redesign | UT `clientCredentials` |
| S-95 | Public information: company placard + homepage + broadcast | S-32 sections | placard Mgr+; broadcast Dir+ | Platform | placard panel | `StaffSettingsPanel.tsx`, `StaffCompanyPlacardPanel.tsx` | Public info | Global only | same | Redesign | UT `companyPlacard` |
| S-96 | Guide: staff role permissions reference | S-34 section | any staff | Resources | roles table | `RolePermissionsGuide.tsx` (`StaffRolesReference`) in `AppGuidePage.tsx` | Role explainer | PR1084 source | same | Verify vs staff-perms.md | none |

---

#### Counting

Top-level (non-nested): 7 entry/overlay (S-01..S-07: 3 screens + 2 embedded + 2 overlays) + 32 section pages (S-08..S-39: 30 nav + profile + preferences) = 39 rows. Nested: S-40..S-96 = 57 rows. Total rows: 96.
Alternative strict count: 32 section pages + 3 entry screens (sign-up, sign-in, activation) = 35 top-level screens; everything else (61) nested/overlay.
`StaffSection` ids: 34 (30 + 2 account + 2 legacy alias).

---

#### 6. Duplicated / legacy / dead

| Item | Evidence |
|---|---|
| DEAD `staff/StaffReportsPanel.tsx` | imported nowhere; superseded by `StaffIncidentsPanel` / Support reports tab |
| DEAD `staff/StaffJobChatsPanel.tsx`, `staff/StaffMessengerPanel.tsx` | imported nowhere; superseded by `StaffMessagesPanel` (Team / Jobs tabs); `team-chat` and `job-chats` ids remain only as legacy aliases |
| DEAD `staff/StaffBulkActionsBar.tsx` | imported nowhere (no bulk actions anywhere in staff UI) |
| DEAD `staff/GuardMissingCredentialsBadge.tsx`, `staff/CityStaffAccessPicker.tsx`, `staff/StaffActivationCredentialSection.tsx` | imported nowhere |
| DEAD `staff/StaffSidebarNav.tsx` (component) | nav is rendered by `DesktopStaffAdminShell`/`SurfaceAppShell`; file only exports the `StaffNavItem` type still used elsewhere |
| Sidebar create-CTA plumbing | `StaffShellCreateContext.tsx` / `useStaffSidebarPrimaryAction(s)`, `STAFF_CREATE_ACTION_LABELS`, `staffSectionCreateAction`, `sidebarPrimaryAction(s)` props of `DesktopStaffAdminShell` never supplied; `hideTrigger`/`showInlineTriggerOnDesktop` effectively ignored |
| DEAD docs `components/docs/DevUpdatesPage.tsx` | `DevNotesPage` renders the same `DEV-UPDATES.md`; route uses `DevNotesPage` |
| Pass-through `StaffOverview.tsx` | wrapper over `StaffOverviewDesktop`; props `weeklyTrend`, `staffName` accepted and dropped; `StaffOverviewDesktop` name is misleading (serves M/T/D) |
| `DesktopStaffAdminShell` name | actual shell for all surfaces |
| S-16 vs S-17 | same `StaffTeamPanel` with tier prop |
| Dead props | `onApproveGuardApplication` / `onDenyGuardApplication` plumbed `StaffDashboard` -> Jobs/Map -> `StaffJobDetailPanel` but never rendered; `StaffJobsPanel` `onApproveRequest` required prop but dashboard passes `undefined` for non-reviewers |
| `StaffStatsPanel` Violations tab | duplicates S-21 summary + link |
| `StaffGuardApplicationReviewPanel` vs `StaffGuardDetailPanel` | overlapping profile/credential/account-control UI; ID review in both `StaffCredentials` and guard detail |
| Nav defined 3x | `StaffOpsLayout` navItems (30), `STAFF_NAV_GROUPS`, `staffNavAccess` visibility; plus `SECTION_TITLES` in `StaffDashboard` |
| Label vs id | `clients` = "Customers", `team` = "Staff", `cities` = "Service Areas", `settings` = "Public Information", `preferences` = "Settings" |
| Unused permission helpers | ~10 exports in `src/lib/permissions.ts` have no callers (see staff-perms.md for the matrix); Manager default grants contradict code comments saying "Director/Founder only" (trusted status, staff approval) |

---

#### 7. Loading / empty / error / restricted states used by staff pages

| State | Where | Component |
|---|---|---|
| Blocked screen, nav item visible (reachable) | Statistics (Support), Analytics (Support, Moderator) | `AppBlockedAccessScreen` (`StaffDashboard.tsx` L1233, L1263) + copy in `STAFF_SECTION_ACCESS_MESSAGES` |
| Blocked screen, unreachable fallback (redirect fires first) | management, business-plan, company-package, payments, platform-fees, agreements, audit-log, dev-updates, disputes, cities, permissions | same; `STAFF_SECTION_ACCESS_MESSAGES` copy for these is effectively dead UI text |
| Blocked screen, only if handler/permission missing | incidents, violations, messages, support, staff-compensation (`canViewStaffCompensation`) | same |
| Silent redirect to Overview (no toast) | the hidden sections above, finance-desk seat outside `FINANCE_DESK_ALLOWED_SECTIONS`; `payments` without `showFinance` -> `staff-compensation` | `StaffDashboard` `useEffect` (~L682) |
| Read-only open page | Credentials (Sup/Mod), Locations (Sup/Mod), Settings, Integrations | per-panel flags, no banner explaining read-only |
| Pending / reactivation | S-03 | `StaffAccountPendingScreen` |
| Global offline / data-load banner | all | `OfflineBanner` (PR1084), `dataLoadStatus` |
| Error + retry (load failure) | Applications list only | `RosterLoadGate` (`StaffApplications.tsx`, 5 refs) via `AppRequestState` |
| Empty list states | each roster panel has its own text; overview has `emptyAttentionCopy` per role | per panel, `staffOverviewConfig.ts` |
| Loading skeletons | none found in staff components (data comes from global state) | - |
| Stale string | "Live Supabase connection is healthy." in shell status text although backend is Neon | `DesktopStaffAdminShell.tsx` |
| Moderator overview copy | focus line says "Credential review..." and quick links include Credentials, but Moderator cannot verify (Adm+); Applications (which Moderator can approve) is not a quick link | `staffOverviewConfig.ts` (moderator block) |
| Suspended staff | no restricted UI; see staff-perms.md lifecycle | - |

---

#### 8. Docs claims contradicted by code (`docs/user-manuals/staff-ops-manual.md`, `docs/guardr.md`)

| Claim (docs) | Code reality |
|---|---|
| Applications includes a job-offer queue | Job offers and schedule changes map to Jobs (`staffSectionFromApprovalQueue`); Applications = guard / client / staff accounts only |
| Moderator can view credential and location queues | CONSISTENT: pages open read-only; verify/edit are Adm+ (not a contradiction) |
| Director verifies staff government ID | `handleApproveGuardIdentityVerification` (`App.tsx` ~L8004) allows any `canVerifyCredentials` (Adm+) incl. staff members |
| Trusted status is Director-level | `canSetTrustedStatus` = `hasExecutivePaymentControls` = Mgr+ (code comment also says Directors only) |
| Staff may place a guard for dispute/safety (Director+) | No placement UI in `StaffJobDetailPanel`; handlers plumbed but unrendered; ranking is "reference only" |
| Separate "Payment settings" page | alias only; page is Platform fees (S-26) |
| Settings/Integrations are Administrator pages | Visible to all staff (view-only); edit Adm+ |
| Messages = job and staff chat | Also guard and client community channels (S-73) |
| Staff APK for tablet admins | Manifest is portrait-locked; tablet layout is browser/PWA only |
| `docs/guardr.md` | Almost no staff-surface claims; consistent where it mentions staff verifying guard licences and incident review |

---

#### 9. PR1084 coverage of staff pages

Touched (source): S-09/S-40 Map (`StaffOpsMapScreen`, `MapBrowseDock`, `MapSelectionExperience`), S-18/S-73/S-74 Messages (`StaffMessagesPanel`, `MessagesHubLayout`), S-19/S-75/S-76 Support (`StaffSupportPanel`), S-34/S-96 Guide (`AppGuidePage`), dev previews (`src/dev/surfaces/*`), `main.tsx`/`visual-refresh.css` import.
Global-only (CSS selectors): every other staff page using `.app-screen-title`, `.app-page-lead-title`, primary buttons, `.app-item-card`, `.wf-list-card`, `.adm-card`. `visual-refresh.css` otherwise targets legal pages, landing, auth role-choice and dev-preview classes; it is NOT covered by surface-independence CSS tests.
Untouched: Overview (3 layouts), Jobs and all job panels, Locations, Applications, Credentials and all review details, Guards, Customers, Staff, Management, Incidents, Violations, Disputes, Stats, Analytics, all Finance pages, Platform pages, profile, preferences, activation screen, auth.
Staff dev previews: Map and generic Messages only; none for Overview, Jobs, Applications, Credentials, Guards, Finance.

---

#### 10. Test gaps

- `npm test` is an explicit allow-list. Staff-related tests NOT in it: `src/lib/staffOpsNavNotifications.test.ts`, `staffOpsInboxNotifications.test.ts`, `staffMarketplaceCap.test.ts`, `staffPlatformScope.test.ts`, `roleSurfaceMatrix.test.ts`, `src/components/staff/StaffListFilterTabs.test.ts`, `jobLocations.test.ts`, `notificationRouting.test.ts`, `applicationIntakeLock.test.ts`, `applicationSubmissionSnapshot.test.ts`.
- In the allow-list: `staffOps`, `staffStats`, `staffCompensation`, `staffTimeTracking`, `staffApprovalsFeed`, `staffAccountActivation`, `staffAccountApproval`, `staffCityAccess`, `platformCities`, `companyPlacard`, `staffGuardAccountActions`, `staffGuardEligibility`, `staffCredentialRules`, `staffListFilters`, `staffProfile`, `staffBadgeNumber`, `staffEmail`, `oneRolePolicy`, `certStaffVerification`, `permissions.financeSideRole`, `paymentPipeline`, `platformFees`, `platformSettings`, `legalAcceptance`, `jobScheduleChange`, `jobEditRules`.
- No test at all: `permissions.ts` main logic (only finance side role), `staffNavAccess`, `staffNavGroups`, `appNavigation` staff params (`pf`, `tc`, `sec`, `edit`), incident reports, violations, disputes UI, audit log, support tickets, payouts/invoices, cities UI, every staff component.
- e2e: only signed-out redirect and staff sign-up checkbox; no authenticated staff flow, no per-role nav check, no APK flow.
- No test asserts nav items vs `STAFF_NAV_GROUPS` vs `staffNavAccess` consistency (would catch the "visible but blocked" mismatches).

---

#### 11. Top surprises

1. `worker/routes/data.ts` `/api/data/query` has no role checks: every staff permission is UI-only.
2. Business plan, company package and `DEV-UPDATES.md` are bundled (`?raw`) into the main JS for every user; PDFs are public static files.
3. Three inconsistent gating styles: hidden + silent redirect (finance, management, disputes, cities, permissions; their blocked-screen copy is dead UI), visible + blocked screen (only Stats and Analytics), visible + read-only with no explanation (Credentials, Locations). Jobs shows Approve/Cancel to everyone while the approve handler is `undefined` for non-reviewers.
4. Seven dead staff components + dead `StaffSidebarNav`, `DevUpdatesPage`, sidebar create-CTA plumbing, unrendered guard-placement props, ~10 unused permission helpers; Manager default grants contradict "Director/Founder" comments and docs.
5. PR1084 touched only Map, Messages, Support and Guide among staff pages; most staff pages are `Global only` or pre-existing per-surface layouts; staff lib tests (nav notifications, platform scope, marketplace cap, roleSurfaceMatrix) are outside `npm test`; no authenticated staff e2e; Fin seat gets no tour and the shell still says "Supabase".


### C2. Staff routes, permissions, navigation, lifecycle

*Staff account type - routes, permission model, navigation, lifecycle (source audit, read-only)*

Repo `/agent/repos/Guardr`, branch `cursor/redesign-audit-plan-a787`. Paths relative to repo root. Source only (docs not trusted).
Role/nav tables were generated by executing the real `src/lib/permissions.ts` + `staffNavAccess.ts` + `staffNavGroups.ts` from a COPY under `/tmp/audit/ws` (repo untouched).
Abbrev: Sup/Mod/Adm/Mgr/Dir/Fnd = Support/Moderator/Administrator/Manager/Director/Founder; Fin = Finance desk seat (`role='finance'`, null ladder). M/T/D = mobile/tablet/desktop surface.

#### 0. Hierarchy names in code vs brief

| Brief | `StaffRole` (types.ts) | `PlatformRole` | Rank (`STAFF_ROLE_RANK`) | Differences |
|---|---|---|---|---|
| Support | `Support` | `support` | 1 | - |
| Moderator | `Moderator` | `moderator` | 2 | - |
| Administrator | `Administrator` | `administrator` | 3 | legacy `legacyRole==='staff'` also maps to administrator; `'auditor'` -> moderator (`resolvePlatformRole`) |
| Manager | `Manager` | `manager` | 4 | "city manager": exactly 1 city (`MANAGER_MAX_CITIES`) |
| Director | `Director` | `director` | 5 | - |
| Founder | `Founder` | **`owner`** | 6 | UI label `ROLE_LABELS.owner='Founder'`; code names `isOwner` (deprecated alias of `isFounder`), `owner.*` permission keys, DB legacy value `Owner` normalized by `normalizeStaffRole`; `StaffRole` comment says "@deprecated Use PlatformRole" |
| (not in brief) | none (`StaffSideRole='Finance'`) | **`finance`** | `platformStaffRank()` = null | 7th staff identity: "Finance desk" seat; also an overlay `sideRole:'Finance'` on any ladder role |

Other facts: `isStaffRole(role)` = the 6 ladder roles + finance. `STAFF_OPERATIONS_ROLES` = Sup/Mod/Adm ("Staff" roster); `MANAGEMENT_STAFF_ROLES` = Mgr/Dir/Fnd ("Management" roster). `SessionUser` carries `role`, `staffRole` (deprecated), `sideRole`. Staff rows live in table `staff` (and legacy `guards` rows with `is_staff`, `migrated_to_staff_at`).

---

#### 1. Route model

##### 1a. Slugs (`src/lib/appNavigation.ts` `parseAppRoute`; `src/lib/staffOps.ts` `StaffSection`, `normalizeStaffSection`, `resolveStaffSection`, `resolveStaffRouteSection`)

`/staff` -> overview. `/staff/<slug>` (alias `/app/staff/<slug>`) -> `normalizeStaffSection(slug)`; unknown slug falls through (`parseAppRoute` returns null -> default route).
`StaffSection` has 34 members; 30 are in nav, 2 legacy (`team-chat`, `job-chats`), 2 are account-menu only (`profile`, `preferences`).

| Slug | Section | Nav group | Notes |
|---|---|---|---|
| overview | overview | Dashboard | default; also `design-qa` alias |
| map | map | Dashboard | `isStaffOpsMapSection`; shell goes `bleed` |
| jobs | jobs | Operations | aliases `live-jobs`, `crews`; `/dispatch` -> jobs |
| locations | locations | Operations | |
| applications | applications | Operations | alias `approvals` |
| credentials | credentials | Operations | |
| guards | guards | Operations | |
| clients | clients | Operations | label "Customers" |
| team | team | Operations | label "Staff" |
| management | management | Operations | label "Management" |
| messages | messages | Communications | aliases `team-chat`, `job-chats`; `/staff/messages` |
| support | support | Communications | |
| incidents / violations / disputes | same | Issues | |
| stats / analytics | same | Insights | |
| payments | payments | Finance | label "Payments & invoices" |
| platform-fees | platform-fees | Finance | alias `payment-settings` |
| staff-compensation | staff-compensation | Finance | alias `staff-pay` |
| agreements / audit-log | same | Finance | |
| cities | cities | Platform | label "Service Areas" |
| permissions / settings / integrations | same | Platform | `settings` titled "Public Information" |
| guide / dev-updates / business-plan / company-package | same | Resources | |
| profile / preferences | same | none (AccountMenu) | titles "Profile", "Settings" |

Legacy/odd routes:
- `staffSectionFromApprovalQueue`: `/staff/approvals?aq=<queue>` -> `job-offers|schedule-changes` -> jobs; `credentials` -> credentials; `guard-accounts|client-accounts|accounts|staff-accounts|applications|all` -> applications. `aq` is parsed but `setStaffSection` never writes it back (`buildAppRoute` call in App.tsx ~L1685 omits `staffApprovalQueue`), so queue tab is not URL-persistent.
- `staffSectionFromMessageTab(_tab)` ignores its argument and always returns `'messages'` (param unused; `mtab` is stripped from the route for staff). `mtab=team` is only used to decide that `jc=<id>` becomes `teamChatRequestId`.
- `/messenger?role=staff` -> `{staffSection:'messages', messengerCompanion:true}`; Messenger shell restricts staff to `messages, support, profile, preferences, guide` (`MESSENGER_STAFF_SECTIONS`, `constrainStaffSectionToMessenger`), nav shows only Messages + Support (`StaffOpsLayout messagesOnly`).
- `/dispatch` is a pure alias to `jobs`. `STAFF_PLATFORM_PURPOSE` (`staffPlatformScope.ts`) says staff do NOT do dispatch / live post command, yet nav has Map, Jobs, "Live" overview and openAppCta copy says "Dispatch ... run here in the browser" (`productApps.ts openAppCtaCopy`).

##### 1b. Nested params (`parseNestedRoute` / `buildNestedQuery`)

| Param | Route field | Used by section | Persisted by `setStaffSection`? |
|---|---|---|---|
| `g` | staffGuardId | guards, applications, credentials (guard filter) | yes |
| `c` | staffClientId | clients, applications | yes |
| `j` | staffJobId | jobs | yes |
| `ci` | staffCredentialItemId | credentials | yes |
| `t` | staffTeamId | team, management | yes |
| `edit=1` | staffEdit | guards (guard edit mode) | only if section is guards + guard selected |
| `gtab` | staffGuardTab (`profile|certs|inventory|performance|timesheet`) | guards | handled by `setStaffGuardTab` |
| `pf` | performanceFactorId | guards/performance drill-down | setStaffPerformanceFactorId |
| `jc` / `tc` | jobChatRequestId / teamChatRequestId (`jc`+`mtab=team` -> tc) | messages | kept only on messages |
| `st` / `sec` | supportTicketId / supportSection | support | kept only on support |
| `aq` | staffApprovalQueue | applications (legacy) | parsed, never emitted |
| `mtab` | staffMessageTab | legacy | parsed, stripped |
| `auth, ar` | auth | n/a | n/a |
| (no param) | `StaffProfileTab` (`profile|timesheets`), `StaffTeamDetailTab` | profile, team detail | types exist in appNavigation.ts, NO URL param - tab lost on reload |

NOT in URL: applications queue tab and filters, job list filters, incidents/disputes selection, stats/analytics ranges, payments sub-tabs, cities selection, permissions role tab.

##### 1c. How /staff/* is reached (website vs installed)

| Context | Result | Source |
|---|---|---|
| Browser tab, signed-in staff (any of 7 identities) | `websiteShellAccess` returns `operations` unconditionally for role staff (no status check) -> full `/staff/*` | `productApps.ts websiteShellAccess`, `App.tsx resolveWebsiteAccess` (~L2074, `role` staff branch passes no status), `canOpenOperationalRoute` |
| Installed (Capacitor / baked flag / standalone PWA) | `operations` | same |
| Plain browser, signed out `/staff/*` | auth redirect (e2e public.spec) | `readAppRouteFromWindow`, `consumePostAuthPath` |
| Guard/Client at `/staff/*` | `routeMatchesUser` false -> not opened | `App.tsx canOpenOperationalRoute` |
| Staff deep links | `guardr-staff://`, `https://(www.)guardr.co/staff` | capacitor/Android manifest (foundation notes) |
| Messenger APK | `/messenger?role=staff` | `messengerCompanion` |

`websiteAccountViewsForRole('staff')`: home, profile, **billing**, downloads, settings, documents, support (staff gets a "Billing" account view; `/account` is reachable but not forced).
Staff status (pending/suspended) is NOT part of `websiteShellAccess`; pending-ness is handled inside the dashboard branch (see section 4).

##### 1d. Which shell staff really gets

| Surface | Condition (`resolveSurfaceKind`) | Shell actually rendered |
|---|---|---|
| Mobile | viewport < 744px (browser or installed) | `StaffDashboard` -> `StaffOpsLayout` -> `DesktopStaffAdminShell` -> `SurfaceAppShell` -> `MobileAppShell` with `mobilePrimaryNav="drawer"` = **hamburger drawer, NOT bottom tabs / More sheet** |
| Tablet | 744-1179px; OR installed shell of any width; OR touch-only wide browser | `TabletAppShell` (labelled side rail, starts collapsed in portrait) |
| Desktop | >= 1180px, browser only, fine pointer | `DesktopAppShell` (grouped sidebar, command palette, Alt+1..9) |
| `?ui=desktop|tablet|mobile` / localStorage `guardr_surface_override` | wins | |

Staff NEVER uses `RoleAppShell` (client/guard shells) - confirmed: `StaffOpsLayout` imports `DesktopStaffAdminShell` which renders `SurfaceAppShell` directly. Despite its name `DesktopStaffAdminShell` is the staff shell for all three surfaces. APK: manifest forces portrait (foundation notes) so tablet layout is effectively reachable only via PWA/browser.

---

#### 2. THE PERMISSION MODEL

##### 2a. How it is built (layers, in evaluation order)

| # | Layer | Code | What it does |
|---|---|---|---|
| 1 | Identity -> `PlatformRole` | `permissions.ts resolvePlatformRole`; worker copy `lib/accountSessionAuth.ts resolvePlatformRole` | `staff_role` string -> `support/moderator/administrator/manager/director/owner`; no ladder + `side_role='Finance'` -> `finance`. Sign-up via worker `/api/auth/signup` uses `legacyRole:'staff'` -> **`administrator`** (JWT role claim), see 2i |
| 2 | Default permission catalog per role | `permissions.ts ROLE_PERMISSIONS` (cumulative arrays: SUPPORT < MODERATOR < ADMINISTRATOR < MANAGER < DIRECTOR < OWNER; `FINANCE_SIDE_PERMISSIONS` separate) | 41 staff keys; see 2b |
| 3 | Per-role overrides | `platformSettings.staffRolePermissions` (DB `platform_settings.staff_role_permissions`) -> `setStaffRolePermissionOverrides()` module-global in `permissions.ts`; edited on Permissions page | An override REPLACES that role's whole list (`getEffectiveRolePermissions`) |
| 4 | Finance side-role overlay | `getEffectiveRolePermissions(role, ov, sideRole)` merges `FINANCE_SIDE_PERMISSIONS` (payouts, fees, financial data, audit log) into any non-finance role with `sideRole==='Finance'` | |
| 5 | Hard-coded role/rank checks that ignore layers 2-4 | `isExecutiveOpsRole` (Manager+), `isDirectorTierRole` (Director+), `role==='manager'`, `role==='owner'`, `platformStaffRank` | see 2c column "source" |
| 6 | Nav visibility + route guard | `staffNavAccess.ts` (`isStaffNavItemVisible`, `getStaffNavAccessNotice`, `FINANCE_DESK_ALLOWED_SECTIONS`) used by `DesktopStaffAdminShell` (nav) and `StaffDashboard` effect (redirects to `overview`; `payments` without finance -> `staff-compensation`) | covers only 11 sections: payments, platform-fees, agreements, audit-log, dev-updates (finance); permissions; cities; disputes; management/business-plan/company-package (management); finance-desk lockdown |
| 7 | Panel-level gates | `StaffDashboard.renderSection` (`AppBlockedAccessScreen` per section) and inside panels (`canReview`, `canVerifyCredentials`, `canEdit`, ...) | the other 19 sections |
| 8 | Handler-level checks | `App.tsx handle*` (e.g. `canSuspendUsers`, `canModerateStaffMember`, `canAssignStaffRole`, `canApproveStaffAccounts`, `canSetTrustedStatus`) | sampled, not every handler checks (2j) |
| 9 | Server | only `lib/http/routes/stripe/payments.ts` (`verifyFinanceStaffSession`), `admin/apply-schema.ts` (Director/Owner or secret), push broadcast helpers | everything else goes through `/api/data/query` with NO role check (2i) |

##### 2b. Default permission keys by role (executed from `ROLE_PERMISSIONS`; Y = granted by default)

Cat = key appears in `STAFF_PERMISSION_CATALOG` (toggle on Permissions page). Fin = `role:'finance'` list.

| Permission key | Cat | Sup | Mod | Adm | Mgr | Dir | Fnd | Fin | Consumed by |
|---|---|---|---|---|---|---|---|---|---|
| moderator.review_reports | Y | Y | Y | Y | Y | Y | Y | . | `canViewIncidents` (Incidents) |
| moderator.monitor_activity | Y | Y | Y | Y | Y | Y | Y | . | **nothing** (dead toggle) |
| moderator.access_support_inbox | Y | Y | Y | Y | Y | Y | Y | . | `canAccessSupportInbox` (Support, delete resolved ticket) |
| moderator.access_messages | Y | Y | Y | Y | Y | Y | Y | . | `canAccessStaffMessages` (Messages) |
| moderator.view_violations | Y | Y | Y | Y | Y | Y | Y | . | `canViewViolations` |
| guard.* (10 keys) | - | . | Y | Y | Y | Y | Y | . | `MODERATOR_PERMISSIONS` spreads `GUARD_PERMISSIONS` (Moderator+ hold guard.* keys; Support does not); not consumed by any staff UI |
| moderator.approve_guards | Y | . | Y | Y | Y | Y | Y | . | `canApproveGuards` |
| moderator.approve_clients | Y | . | Y | Y | Y | Y | Y | . | `canApproveClients` |
| admin.view_stats | Y | . | Y | Y | Y | Y | Y | . | `canViewStats` |
| moderator.review_certifications | Y | . | . | Y | Y | Y | Y | . | `canVerifyCredentials` (+ `canActivateGuardAccounts`) |
| moderator.review_job_requests | Y | . | . | Y | Y | Y | Y | . | `canReviewJobRequests` (approve/deny jobs, locations) |
| moderator.handle_disputes | Y | . | . | Y | Y | Y | Y | . | `canHandleDisputes` |
| moderator.suspend_users | Y | . | . | Y | Y | Y | Y | . | `canSuspendUsers` |
| moderator.issue_warnings | Y | . | . | Y | Y | Y | Y | . | **nothing** (dead toggle) |
| admin.manage_users | Y | . | . | Y | Y | Y | Y | . | `canManageGuards/Clients`, `canProposeStaffAccounts` |
| admin.manage_settings | Y | . | . | Y | Y | Y | Y | . | `canAccessStaffSettings`, `canManageStaffPlatformContent` |
| admin.view_analytics | Y | . | . | Y | Y | Y | Y | . | `canViewAnalytics` |
| admin.manage_content | Y | . | . | Y | Y | Y | Y | . | `canManageStaffPlatformContent` |
| admin.manage_platform_config | Y | . | . | Y | Y | Y | Y | . | **nothing** (dead toggle) |
| admin.manage_integrations | Y | . | . | Y | Y | Y | Y | . | `canManageStaffPlatformContent` |
| admin.manage_locations | Y | . | . | Y | Y | Y | Y | . | `canManageLocations` (but Locations panel checks `canReviewJobRequests`, not this) |
| admin.view_staff_roster | Y | . | . | Y | Y | Y | Y | . | `canViewStaffRoster` |
| admin.manage_payouts | Y | . | . | . | Y | Y | Y | Y | `canAccessFinancialControls` (collapses with next 3) |
| admin.manage_fees | Y | . | . | . | Y | Y | Y | Y | same |
| director.view_all_financial_data | Y | . | . | . | Y | Y | Y | Y | same |
| director.access_audit_logs | Y | . | . | . | Y | Y | Y | Y | same |
| director.manage_company_operations | Y | . | . | . | Y | Y | Y | . | `canManageCompanyOperations` (create jobs) |
| director.recommend_city_open | Y | . | . | . | Y | Y | Y | . | `canViewCityMarkets` (Service Areas page) |
| director.manage_administrators | Y | . | . | . | Y | Y | Y | . | `canManageStaffAccounts` / `canApproveStaffAccounts` |
| director.manage_moderators | Y | . | . | . | Y | Y | Y | . | same; `canToggleStaffRole` |
| director.override_restrictions | Y | . | . | . | Y | Y | Y | . | `hasDirectorStaffOverride` |
| director.manage_city_markets | Y | . | . | . | . | Y | Y | . | `canManageCityMarkets`, `canAssignStaffCityAccess`, `canAssignCityManager` |
| owner.manage_directors | Y | . | . | . | . | . | Y | . | `canManageDirectorAccounts`, `canManageStaffAccounts` |
| owner.manage_owners | Y | . | . | . | . | . | Y | . | **nothing** (dead toggle) |
| owner.platform_governance | Y | . | . | . | . | . | Y | . | `canManagePlatformSettings` |
| client.* (12) | - | . | . | . | . | . | . | . | client lists only |

Observations: Manager == Director == Founder in every non-hard-coded ops permission except three keys (`manage_city_markets` Dir+, `manage_directors`/`manage_owners`/`platform_governance` Fnd). Moderator cannot verify credentials, review jobs, handle disputes or suspend. 4 catalog toggles are dead (`monitor_activity`, `issue_warnings`, `manage_platform_config`, `manage_owners`); 4 finance keys collapse into one boolean. "Director (+ all administrator)" comments: Administrator list is built from MODERATOR (which includes all `guard.*`), so Administrator/Manager/... also carry `guard.*` keys.

##### 2c. Capability functions by role (executed; Y = true). "Source" = where the rule is encoded.

| Capability (function in `permissions.ts` unless noted) | Sup | Mod | Adm | Mgr | Dir | Fnd | Fin | Source |
|---|---|---|---|---|---|---|---|---|
| Finance area (`canAccessFinancialControls`) | . | . | . | Y | Y | Y | Y | any of 4 finance keys OR Finance side role |
| Record cash payments / override payout hold (`canRecordCashPayments`) | . | . | . | Y | Y | Y | Y | hard-coded `isExecutiveOpsRole` OR Finance side |
| Mark guard/client trusted (`canSetTrustedStatus`) | . | . | . | Y | Y | Y | . | hard-coded Manager+; error toast says "Only Directors and Founders" |
| Create job for a client (`canManageCompanyOperations`) | . | . | . | Y | Y | Y | . | key; error text "Only directors" |
| Edit job listing (`canEditJobListingDetails`) | . | . | Y | Y | Y | Y | . | hard-coded (override OR administrator) |
| Approve/deny job, schedule change (`canReviewJobRequests`) | . | . | Y | Y | Y | Y | . | key |
| Edit job map coordinates (`jobEditRules.canStaffEditJobMapCoordinates`) | Y | Y | Y | Y | Y | Y | Y | any non-client/guard (comment says Moderator+; code lets Support and Finance) |
| Approve guard applications (`canApproveGuards`) | . | Y | Y | Y | Y | Y | . | key |
| Approve customer applications (`canApproveClients`) | . | Y | Y | Y | Y | Y | . | key |
| Manage/delete guard & customer accounts (`canManageGuards/Clients`) | . | Y | Y | Y | Y | Y | . | approve key OR `admin.manage_users`; handler `handleDeleteClientAccount` has no permission check (UI-gated only) |
| Verify credentials (`canVerifyCredentials`) | . | . | Y | Y | Y | Y | . | key |
| Activate guard account (`canActivateGuardAccounts`) | . | . | Y | Y | Y | Y | . | = verify credentials |
| Suspend/block users (`canSuspendUsers`) | . | . | Y | Y | Y | Y | . | key |
| Disputes (`canHandleDisputes`) | . | . | Y | Y | Y | Y | . | key |
| Incidents / Violations / Messages / Support inbox | Y | Y | Y | Y | Y | Y | . | keys |
| Stats (`canViewStats`) | . | Y | Y | Y | Y | Y | . | key |
| Analytics (`canViewAnalytics`) | . | . | Y | Y | Y | Y | . | key |
| Locations (`canManageLocations`; panel uses `canReviewJobRequests`) | . | . | Y | Y | Y | Y | . | key |
| View staff roster (`canViewStaffRoster`) | . | . | Y | Y | Y | Y | . | key OR `canManageStaffAccounts` |
| See Management (executive) roster (`canViewManagementRoster`) | . | . | . | Y | Y | Y | . | rank >= Manager |
| Propose new staff (`canProposeStaffAccounts`) | . | . | Y | Y | Y | Y | . | `admin.manage_users`; creates `pending` |
| Add staff active / approve or reject pending staff (`canApproveStaffAccounts`) | . | . | . | Y | Y | Y | . | keys `manage_administrators/moderators/directors`; UI copy says "Director" |
| Change a staff member's role (`canModerateStaffMember` + `getAssignableStaffRoles`) | - | Support | Support/Moderator | Support..Administrator | Support..Manager | Support..Director | - | strictly below own rank; nobody can assign Founder; self-edit blocked |
| Assign/clear Finance side role (`canAssignStaffSideRole`) | . | . | . | . | Y | Y | . | rank >= Director |
| Toggle staff role / manage Director accounts | . | . | . | toggle Y / dir . | toggle Y / dir . | toggle Y / dir . | . | `canToggleStaffRole`; `canManageDirectorAccounts` = Founder only (key) |
| Permissions page (`canAccessStaffPermissions`) | . | . | . | Y | Y | Y | . | hard-coded Manager+ |
| Service Areas page (`canViewCityMarkets`) | . | . | . | Y | Y | Y | . | key `recommend_city_open` |
| Change city open/closed/waitlist, assign city access/manager (`canManageCityMarkets`) | . | . | . | . | Y | Y | . | key |
| Recommend a city to Directors (`canRecommendCityMarket`) | . | . | . | Y | . | . | . | `role==='manager'` only |
| Public Information edit (`canAccessStaffSettings`/`canManageStaffPlatformContent`) | . | . | Y | Y | Y | Y | . | keys; Founder message `role==='owner'`, Director message owner/director, placard edit = Manager+ (`hasExecutivePaymentControls`) |
| Integrations edit (`canManageStaffPlatformContent`) | . | . | Y | Y | Y | Y | . | keys (page visible to all) |
| Platform payment-method settings (`canManagePlatformSettings`) | . | . | . | . | . | Y | . | `isFounder` or `owner.platform_governance` |
| Broadcast push/inbox to all users (`canBroadcastToAllUsers`) | . | . | . | . | Y | Y | . | hard-coded Director+ |
| Adjust tracked staff time, hourly pay rates (`canAdjustStaffTimeEntries`, `canEditStaffHourlyPayRates`) | . | . | . | Y | Y | Y | . | hard-coded Manager+ (Finance desk cannot) |
| Staff compensation settings + confirm payout (`canManageStaffCompensation`) | . | . | . | . | Y | Y | . | hard-coded Director+ |
| View own compensation (`canViewStaffCompensation`) | Y | Y | Y | Y | Y | Y | Y | any staff (message says "active staff accounts" - not checked) |
| One-role holds review (`oneRolePolicy.canReviewOneRoleHolds`) | . | . | Y | Y | Y | Y | . | hard-coded role list (administrator, manager, director, owner) |
| Company placard edit, credential-library edit (`hasExecutivePaymentControls` / `isExecutiveOpsRole`) | . | . | . | Y | Y | Y | . | hard-coded Manager+ |

Naming mismatches to fix in the redesign: functions named `hasExecutivePaymentControls`, `hasDirectorStaffOverride`, `isDirector` imply Director but include Manager; user-facing strings in `App.tsx` ("Only Directors can create jobs", "Only Directors and Founders can set trusted / override payout holds", "Only Directors and above can approve staff accounts", `AuthPage` "awaiting Director approval") do not match the code (Manager+).

##### 2d. SECTION x ROLE matrix (what each role actually gets)

Legend: **Y** = in nav and fully usable; **O** = in nav but opens a "no access" screen (nav gate missing, panel gate present); **ro** = usable read-only / reduced actions; **X** = hidden from nav; opening the URL shows an alert (if reached via nav) or silently redirects to Overview (`StaffDashboard` effect); **FD** = finance-desk seat (`role='finance'`, or `sideRole=Finance` with no `staffRole` on the session). Nav gate = `staffNavAccess`/`DesktopStaffAdminShell`; page gate = `StaffDashboard.renderSection` or panel.

| Section (slug) | Nav gate | Page / action gate | Sup | Mod | Adm | Mgr | Dir | Fnd | Fin |
|---|---|---|---|---|---|---|---|---|---|
| overview | none | content variant per role (`staffOverviewConfig.ts`): Support/Mod compact, Admin standard, Mgr/Dir/Fnd executive, Fin compact | Y | Y | Y | Y | Y | Y | Y |
| map | none (FD hides) | approve/deny/edit actions need `canReviewJobs` / `canEditJobListing` | ro | ro | Y | Y | Y | Y | X |
| jobs | none | list for all; approve/deny/schedule-change = `canReviewJobRequests`; create = `canManageCompanyOperations`; edit = `canEditJobListingDetails` | ro | ro | Y (no create) | Y | Y | Y | X |
| locations | none | `canReviewJobRequests` in panel (read-only list otherwise) | ro | ro | Y | Y | Y | Y | X |
| applications | none | `canReview` = approve guards OR manage guards/clients OR approve staff; staff tab Manager+ only; one-role holds Admin+ | O | Y (guards+customers) | Y | Y (+staff apps) | Y | Y | X |
| credentials | none | `canVerifyCredentials` | O | O | Y | Y | Y | Y | X |
| guards | none | list for all; `canManage` Mod+; verify/ID actions Adm+; suspend Adm+; trusted Mgr+ | ro | ro (manage, no verify/suspend) | Y | Y | Y | Y | X |
| clients ("Customers") | none | list for all; `canManage` Mod+; trusted Mgr+ | ro | ro (manage) | Y | Y | Y | Y | X |
| team ("Staff") | none | roster for all; edit/role-change need `canManageStaff` (Mgr+) + strictly-below rank; Admin can only propose | ro | ro | ro (propose) | Y | Y | Y | X |
| management | `managementOnly` (rank >= Manager) | `showManagement` (shows `AppBlockedAccessScreen` otherwise) | X | X | X | Y | Y | Y | X |
| messages | none | `canAccessStaffMessages` | Y | Y | Y | Y | Y | Y | X (FD hides; page gate would block anyway) |
| support | none | `canAccessSupportInbox` | Y | Y | Y | Y | Y | Y | X |
| incidents | none | `canViewIncidents` | Y | Y | Y | Y | Y | Y | X |
| violations | none | `canViewViolations`; resolve action needs `canHandleDisputes` | ro | ro | Y | Y | Y | Y | X |
| disputes | `disputesOnly` | `canHandleDisputes` | X | X | Y | Y | Y | Y | X |
| stats | none | `canViewStats` | O | Y | Y | Y | Y | Y | X |
| analytics | none | `canViewAnalytics`; financial tiles need `showFinance` | O | O | Y (no financials) | Y | Y | Y | X |
| payments | `financeOnly` + `showPayments` | `showPayments` (= finance) | X | X | X | Y | Y | Y | Y |
| platform-fees | `financeOnly` | `showFinance` | X | X | X | Y | Y | Y | Y |
| staff-compensation | none | `canViewStaffCompensation`; settings/payout confirm = Director+; time adjust + hourly rates = Manager+ | Y | Y | Y | Y | Y | Y | Y |
| agreements | `financeOnly` | `showFinance` | X | X | X | Y | Y | Y | Y |
| audit-log | `financeOnly` | `showFinance` | X | X | X | Y | Y | Y | Y |
| cities ("Service Areas") | `citiesOnly` | `showCities`; status edit Director+; manager recommend = Manager only; cap edit Founder | X | X | X | ro (view+recommend, own city) | Y | Y | X |
| permissions | `permissionsOnly` | `showPermissions` (Manager+) | X | X | X | Y | Y | Y | X |
| settings ("Public Information") | none (`showSettings` hard-coded true) | page open to all; edits per 2c | O (read) | O (read) | Y | Y | Y | Y | X |
| integrations | none | page open to all; edit = `canManageStaffPlatformContent` | O (read) | O (read) | Y | Y | Y | Y | X |
| guide | none | all (FD allowed) | Y | Y | Y | Y | Y | Y | Y |
| dev-updates ("Dev notes") | `financeOnly` | `showFinance` | X | X | X | Y | Y | Y | Y (nav shows? see note) |
| business-plan | `managementOnly` | `showManagement` | X | X | X | Y | Y | Y | X |
| company-package | `managementOnly` | `showManagement` | X | X | X | Y | Y | Y | X |
| profile | account menu only | own profile; guard `staffNeedsCredentialCompletion` lock applies globally | Y | Y | Y | Y | Y | Y | Y |
| preferences | account menu only | own settings | Y | Y | Y | Y | Y | Y | Y |

Notes: (1) `dev-updates` is `financeOnly` in `staffNavAccess` but `FINANCE_DESK_ALLOWED_SECTIONS` omits it, so the Finance desk seat does not get it while a ladder role + Finance side role does. (2) Alt+N counts for FD: Overview, Payments, Platform fees, Staff compensation, Agreements, Audit log, Guide (7 nav items). (3) Ladder + Finance side role (e.g. Support+Finance): `isFinanceDeskOnly` false (session `staffRole` set) -> keeps all ops nav AND gains payments, platform-fees, agreements, audit-log, dev-updates (Support+Fin: 24 nav items; Admin+Fin: 25). If the session ever lacks `staffRole` (field is `@deprecated` on `SessionUser`), the same account collapses to the 7-item desk. (4) 11 sections have nav-visible-but-panel-blocked outcomes for lower roles (marked O): dead-ends the nav does not warn about, because `isStaffNavItemVisible` has no flags for credentials/applications/stats/analytics/settings/integrations/locations.

##### 2e. Finance side role, one-role, city scope, pending/suspended - rules

| Topic | Rule | Code |
|---|---|---|
| Finance desk seat | `role='finance'` (null ladder) or `sideRole='Finance'` with no ladder; badge prefix `FIN-`; nav limited to 7 items; can record cash payments, see payouts/fees/audit; no ops, no messages, no Map; Director+ manages the seat (`canModifyStaffMember` null-ladder branch) | `isFinanceDeskOnly`, `FINANCE_DESK_ALLOWED_SECTIONS`, `staffBadgeNumber.ts`, `AuthPage` self-signup role picker lists Support/Moderator/Administrator/Manager/Director (no Founder, no Finance); Finance seats are created only by Director+ in the Team panel |
| Finance overlay on ladder role | merges 4 finance keys; nav gains finance group; cash payments allowed | `getEffectiveRolePermissions` |
| One-role policy | one email/phone/device cannot be Guard+Customer+Staff; holds listed under Applications for Admin+; Admin+ ignore or block both accounts; sign-in returns `one_role_hold`/`one_role_violation`/`device_account_blocked` | `oneRolePolicy.ts`, `authService.finishSignInWithProfile`, `StaffOneRoleHolds.tsx`, `App.tsx handleIgnoreOneRoleCase/handleBlockOneRoleCase` (`canReviewOneRoleHolds`) |
| City scope (the "operations access pickers") | `StaffOperationsAccessPicker` = checkbox/radio list of open Service Areas cities; Manager = exactly 1 city (`MANAGER_MAX_CITIES`), Support/Moderator/Administrator = many, Director/Founder = none (global). `managedCities` stored on staff row; Director+ edit (`CityStaffAccessPicker`, `CityManagerPicker`, `StaffAddStaffForm`, `StaffTeamDetailPanel`) | `staffCityAccess.ts`, `platformCities.ts staffCanManageCity/filterCitiesForStaffActor` |
| What city scope actually filters | ONLY the Service Areas page (Manager sees only own city; `filterCitiesForStaffActor`) and the per-city staff capacity cap (`staffMarketplaceCap.ts enforceStaffCityCapacityForMember`). No other section (jobs, guards, clients, applications, payments) is filtered by `managedCities` - verified by grep: no consumer outside those files | grep `managedCities` |
| Pending staff | statuses `pending -> approved -> active` (+ `suspended`, `blocked`); non-management staff with status pending/approved, or active without verified government ID, see `StaffAccountPendingScreen` instead of the dashboard (`staffNeedsCredentialCompletion`). Management (Mgr/Dir/Fnd) are exempt and get the full dashboard even while pending/approved | `staffAccountActivation.ts`, `App.tsx` ~L14720 |
| Gate bypass | the lock only runs if the roster row for the user has loaded (`guards.find(...)`); if not found the user falls through to the full `StaffDashboard` | `App.tsx` ~L14721 |
| Suspended / blocked staff | `blocked` is rejected at sign-in (`finishSignInWithProfile`, `profile.guard.userStatus==='blocked'`). `suspended` is NOT rejected anywhere on the sign-in path; `staffNeedsCredentialCompletion` returns false for suspended/blocked, so they get the FULL dashboard; no session re-check, no `/api/auth/login` status check in worker | `authService.ts`, `worker/routes/auth.ts` |
| Status transitions | Admin+ can suspend/block (`handleUpdateGuardUserStatus` -> `canSuspendUsers` + `canModerateStaffMember`), cannot self-modify, cannot touch same/higher rank | `App.tsx` ~L6391 |

##### 2f. Rank & moderation rules (exact)

| Rule | Code |
|---|---|
| Rank: Support 1, Moderator 2, Administrator 3, Manager 4, Director 5, Founder 6; Finance null | `STAFF_ROLE_RANK` |
| Assignable roles = strictly below actor rank (Founder can assign up to Director; nobody can assign Founder) | `getAssignableStaffRoles`, `canAssignStaffRole` |
| May modify a staff member only if actor rank > member rank; finance-only seats need Director+; self excluded | `canModifyStaffMember`, `canModerateStaffMember`, `canEditStaffProfile` (own profile always editable) |
| Management roster hidden below Manager; individual management members hidden from lower viewers (redirect to `team`) | `isStaffMemberVisibleToViewer`, `staffSectionForStaffMember`, `canViewManagementRoster` |
| Staff badge prefixes OWN/DIR/MGR/ADM/MOD/SUP/FIN, "STF" forbidden | `staffBadgeNumber.ts` - but `AuthPage` self-signup generates `STF-#####` |

##### 2g. Permission-override hazards (Permissions page)

| Hazard | Evidence |
|---|---|
| Manager+ may toggle ANY catalog permission for ANY of the six role tabs, including their own role and Director/Founder; no rank check, no confirm | `StaffPermissionsPanel.tsx StaffRolePermissionsEditor`, `handleUpdateStaffPermissions` (only `canManageStaffPermissions`) |
| An override list REPLACES defaults; a tab with one toggle changed writes the whole list (`persistRolePermissions`) | `permissions.ts getEffectiveRolePermissions` |
| Overrides live in a module-global and in `platform_settings` + localStorage; there is no per-user audit of the change in this handler | `setStaffRolePermissionOverrides`, `savePlatformSettingsToStorage` |
| Many gates ignore overrides (hard-coded rank in 2c) so some toggles appear to work but do not (`trusted`, cash, time adjust, compensation, broadcast, permissions page) | 2c "Source" column |
| Dead toggles (no consumer) | 2b |

##### 2h. Hard-coded personal names in staff UI
`StaffSettingsPanel.tsx`: labels "Founder message (Markeith White)" and "Director message (Tyrone Johnson)" (gated by role, text is person-specific).

##### 2i. Server-side enforcement (what the Worker really checks)

| Endpoint | Check |
|---|---|
| `POST /api/data/query` (`worker/routes/data.ts`) | table allow-list of 41 tables (incl. `staff`, `guards`, `platform_settings`, `audit_log`, `staff_time_entries`, `staff_compensation_payouts`); `authorize()` returns a session but the handler never reads `session.platformRole`; any authenticated caller can select/insert/update/delete any row of any allowed table with arbitrary eq/neq/in filters. Staff permissions above are therefore UI-only |
| `x-guardr-session` header | `{userId,email,role}` JSON from localStorage; `verifyAccountSession` only checks that a row with that id+email exists (no password/token) - a caller who knows a staff id+email is accepted |
| `POST /api/auth/login` | verifies password hash; does NOT check `user_status` (pending/suspended/blocked staff all get a JWT) |
| `POST /api/auth/signup` | trusts `profileKind`/`profileId` from the body, writes `password_hash` onto row `profileId` of staff/clients/guards (no check that the row exists, is pending, or belongs to the email), only rejects an email already in `users`; JWT role = `resolvePlatformRole({legacyRole:'staff'})` = `administrator` (staff_role not consulted; `/api/auth/login` does consult it) |
| `GET stripe payments` (`lib/http/routes/stripe/payments.ts`) | `verifyFinanceStaffSession` (Manager+/Finance) |
| `admin/apply-schema` | secret or Director/Founder session |
(Observed in source; not exercised against the live worker.)

---

#### 3. NAVIGATION PER SURFACE

Single source: `STAFF_NAV_GROUPS` (`staffNavGroups.ts`) x `navItems` (`StaffOpsLayout.tsx`, 30 items) x `isStaffNavItemVisible` (`staffNavAccess.ts`) -> `DesktopStaffAdminShell` builds `SurfaceDestination[]` -> `SurfaceAppShell` picks Mobile/Tablet/Desktop shell. `DesktopStaffAdminShell.MENU_GROUPS` is a copy of `STAFF_NAV_GROUPS` ("keep in sync" comment). Staff passes `mobilePrimaryNav="drawer"`, so there is NO bottom tab bar and NO "More" sheet for staff on any surface (the 5-tab + More model belongs to Guard/Client `RoleAppShell`). Executed output (`m4.ts`) below.

##### 3a. Destinations: group, order, Alt index, gating (visible = in nav)

Alt = `Alt+N` index for a Manager+ user (index is by visible position, so it shifts for lower roles: see 3b). Level columns show "in nav" (Y), "in nav but page blocked" (O), hidden (.).

| # | Group | id | Label | Nav-hidden when (staffNavAccess flag) | Sup | Mod | Adm | Mgr | Dir | Fnd | Fin desk | Alt (Mgr+) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Dashboard | overview | Overview | never | Y | Y | Y | Y | Y | Y | Y | 1 |
| 2 | Dashboard | map | Map | finance desk | Y | Y | Y | Y | Y | Y | . | 2 |
| 3 | Operations | jobs | Jobs | finance desk | Y | Y | Y | Y | Y | Y | . | 3 |
| 4 | Operations | locations | Locations | finance desk | Y | Y | Y | Y | Y | Y | . | 4 |
| 5 | Operations | applications | Applications | finance desk | O | Y | Y | Y | Y | Y | . | 5 |
| 6 | Operations | credentials | Credentials | finance desk | O | O | Y | Y | Y | Y | . | 6 |
| 7 | Operations | guards | Guards | finance desk | Y | Y | Y | Y | Y | Y | . | 7 |
| 8 | Operations | clients | Customers | finance desk | Y | Y | Y | Y | Y | Y | . | 8 |
| 9 | Operations | team | Staff | finance desk | Y | Y | Y | Y | Y | Y | . | 9 |
| 10 | Operations | management | Management | `managementOnly` (< Manager) | . | . | . | Y | Y | Y | . | none |
| 11 | Communications | messages | Messages | finance desk | Y | Y | Y | Y | Y | Y | . | none |
| 12 | Communications | support | Support | finance desk | Y | Y | Y | Y | Y | Y | . | none |
| 13 | Issues | incidents | Incidents | finance desk | Y | Y | Y | Y | Y | Y | . | none |
| 14 | Issues | violations | Violations | finance desk | Y | Y | Y | Y | Y | Y | . | none |
| 15 | Issues | disputes | Disputes | `disputesOnly` (< Administrator) | . | . | Y | Y | Y | Y | . | none |
| 16 | Insights | stats | Stats | finance desk | O | Y | Y | Y | Y | Y | . | none |
| 17 | Insights | analytics | Analytics | finance desk | O | O | Y | Y | Y | Y | . | none |
| 18 | Finance | payments | Payments & invoices | `financeOnly` (no finance access) | . | . | . | Y | Y | Y | Y | none |
| 19 | Finance | platform-fees | Platform fees | `financeOnly` | . | . | . | Y | Y | Y | Y | none |
| 20 | Finance | staff-compensation | Staff compensation | never (in desk allow-list) | Y | Y | Y | Y | Y | Y | Y | none |
| 21 | Finance | agreements | Agreements | `financeOnly` | . | . | . | Y | Y | Y | Y | none |
| 22 | Finance | audit-log | Audit log | `financeOnly` | . | . | . | Y | Y | Y | Y | none |
| 23 | Platform | cities | Service Areas | `citiesOnly` (needs `recommend_city_open`) | . | . | . | Y | Y | Y | . | none |
| 24 | Platform | permissions | Permissions | `permissionsOnly` (< Manager) | . | . | . | Y | Y | Y | . | none |
| 25 | Platform | settings | Public Information | finance desk | O | O | Y | Y | Y | Y | . | none |
| 26 | Platform | integrations | Integrations | finance desk | O | O | Y | Y | Y | Y | . | none |
| 27 | Resources | guide | Guide | never | Y | Y | Y | Y | Y | Y | Y | none |
| 28 | Resources | dev-updates | Dev notes | `financeOnly`; also not in desk allow-list | . | . | . | Y | Y | Y | . | none |
| 29 | Resources | business-plan | Business plan | `managementOnly` | . | . | . | Y | Y | Y | . | none |
| 30 | Resources | company-package | Company package | `managementOnly` | . | . | . | Y | Y | Y | . | none |

Visible count (executed): Support 19, Moderator 19, Administrator 20, Manager/Director/Founder 30 (identical lists), Finance desk 7, Support+Finance 24, Administrator+Finance 25.

##### 3b. Per role: exact visible order with Alt indexes (executed `m4.ts`)

| Role | Count | Alt+1..9 | After Alt+9 (no shortcut) |
|---|---|---|---|
| Support / Moderator | 19 | overview, map, jobs, locations, applications, credentials, guards, clients, team | messages, support, incidents, violations, stats, analytics, staff-compensation, settings, integrations, guide |
| Administrator | 20 | same 9 | messages, support, incidents, violations, disputes, stats, analytics, staff-compensation, settings, integrations, guide |
| Manager / Director / Founder | 30 | same 9 | management, messages, support, incidents, violations, disputes, stats, analytics, payments, platform-fees, staff-compensation, agreements, audit-log, cities, permissions, settings, integrations, guide, dev-updates, business-plan, company-package |
| Finance desk | 7 | overview, payments, platform-fees, staff-compensation, agreements, audit-log, guide | (none) |
| Messenger-only (`/messenger?role=staff`, `messagesOnly`) | 2 | messages, support | - |

Group item counts (Dashboard/Operations/Communications/Issues/Insights/Finance/Platform/Resources): Support 2/7/2/2/2/1/2/1; Admin 2/7/2/3/2/1/2/1; Mgr+ 2/8/2/3/2/5/4/4; Finance desk 1/0/0/0/0/5/0/1 (empty groups are dropped, so the desk shows 3 groups).

##### 3c. Surface behaviour

| Surface | Nav control | Content | Code |
|---|---|---|---|
| Mobile (<744px, or installed Capacitor/PWA on phone) | Hamburger -> left drawer (`MobileDrawerNav`) listing every visible destination grouped under the 8 group headings, in `STAFF_NAV_GROUPS` order; no bottom tabs; no More sheet; header avatar -> AccountMenu bell/Profile/Settings/Download/Sign out/Theme; drawer rows show `badge` if set but staff destinations never set one | scrolls; Map/Messages sections are full-bleed | `MobileAppShell` (`mobilePrimaryNav='drawer'`) |
| Tablet (744-1179px; every installed shell regardless of width) | persistent labelled left rail, same groups (expanded in landscape, icon-only collapsed in portrait, toggle available); the quick-switch strip was removed (file comment), so `TABLET_QUICK`/`tabletQuick` has no visible effect | | `TabletAppShell`, `surfaceNavigation.ts` |
| Desktop (>=1180px, pointer device, not installed) | fixed sidebar (collapse toggle `mod+b`, state in localStorage `guardr_desktop_sidebar_open`) with the same 8 groups + footer (Settings, legal); top bar with command-palette trigger (`mod+k`), shortcuts `?`, account menu | | `DesktopAppShell` |
| Command palette | `mod+k`; lists every visible destination (keywords = group title + id) plus ONE staff-only action "Database: connected/offline" (alert body says "Live Supabase connection is healthy", but the app now runs on Neon/Worker) | | `DesktopStaffAdminShell commands` |
| Shortcuts | `Alt+1`..`Alt+9` = first nine visible destinations (`desktopShortcutMap`); `mod+k`, `mod+b`, `?`. No letter/chord shortcuts, no "go to section by name" | | `DesktopAppShell`, `useKeyboardShortcuts` |
| Overflow | none: no overflow menu/collapse; drawer, rail and sidebar all scroll; 30 items for Manager+ | | - |
| Create button | `primaryAction` slot exists in all three shells, but nothing feeds it (see defects) | | `DesktopStaffAdminShell primaryAction={sidebarPrimaryAction ?? sidebarPrimaryActions?.[0]}`, `StaffShellCreateContext.useStaffSidebarPrimaryAction(s)` unused |
| Account menu items | Profile (`/staff/profile`), Settings (`/staff/preferences`), Download app (`onOpenDownload`), Sign out, Theme, notification bell | `AccountMenu` | |
| Notifications | bell in AccountMenu fed by `accountNotifications` -> `staffOpsInboxNotifications` (open violations, disputes, incidents and the other `StaffNotifiableSection`s: applications, credentials, guards, clients, jobs, support, messages, payments; "handled elsewhere" resolution) built in `StaffDashboard` L762 and merged with persisted notifications + generic user notifications; `notifications={undefined}` is passed to `SurfaceAppShell`, so per-nav-item dots/counts from `computeStaffNavNotifications` (`staffOpsNavNotifications.ts`) are not rendered anywhere (only referenced by its own test) | | |

##### 3d. Nav defects

| # | Defect | Evidence |
|---|---|---|
| N1 | Staff mobile is a hamburger drawer, not 5 tabs + More; docs/redesign assumptions about "RoleAppShell for staff" are wrong | `DesktopStaffAdminShell` -> `SurfaceAppShell`; `RoleAppShell` has no staff caller |
| N2 | Nav per-item notification dots/counts are dead code | `notifications={undefined}`; `computeStaffNavNotifications` no caller |
| N3 | Sidebar "create" CTA (Create job / Add customer / Add guard / Add staff / Add location / Add credential) is dead: provider + openers register but `useStaffSidebarPrimaryAction(s)` is never called and the shell only reads props that nobody passes | grep |
| N4 | `StaffSidebarNav.tsx` component is dead (file is imported only for the `StaffNavItem` type); `TABLET_QUICK` is inert | grep `StaffSidebarNav` |
| N5 | 11 destinations visible to roles that cannot use them (O cells): Support: applications, credentials, stats, analytics, settings, integrations; Moderator: credentials, analytics, settings, integrations. Overview quick links include them too (executed `m5.ts`: `blockedQuick` empty for every role) | `staffNavAccess.ts` lacks flags for these |
| N6 | Notifications are built with no role filter, so Support/Moderator get "Dispute needs review"/payment items that route to a blocked or redirected page | `staffOpsInboxNotifications.ts` builder takes `staffId` only |
| N7 | `StaffSection` has 34 members; 4 are not destinations (`team-chat`, `job-chats` normalise to `messages`; `profile`, `preferences` only via AccountMenu); `staffSectionFromMessageTab` maps `team-chat`/`job-chats`/`support`; no id appears twice in `STAFF_NAV_GROUPS` (no duplicate ids found) and every group id has a `navItems` entry (no orphan) | executed id diff |
| N8 | Alt shortcuts are positional: the same Alt+7 is Guards for everyone but Alt indexes shrink for the Finance desk (Alt+2 = Payments); nothing reaches Messages, Support, Incidents, Finance, Platform pages by keyboard besides the palette | `desktopShortcutMap` |
| N9 | Stats and Analytics share the `BarChart3` icon; `staff-compensation` is outside `financeOnly` so Support/Moderator see a "Finance" group containing only Staff compensation | `StaffOpsLayout.navItems` |
| N10 | Group `Operations` mixes people (Applications, Credentials, Guards, Customers, Staff, Management) with work (Jobs, Locations); desktop sidebar has 8 groups / up to 30 rows with no collapse | |
| N11 | Manager's Service Areas entry only shows their `managedCities` city; nav label for `settings` is "Public Information" while the section slug and `SECTION_TITLES` differ in naming ("settings" vs tile "Settings" for `preferences`) - two different things called Settings (`/staff/settings` vs `/staff/preferences`) | `SECTION_TITLES` |

---

#### 4. STAFF REGISTRATION, SIGN-IN, INVITE, APPROVAL, ACTIVATION

##### 4a. Entry points

| Path | How | Result |
|---|---|---|
| Self-service application | Auth page: Sign up -> work path -> Staff (`AuthRoleChoicePage`) or `StaffSignupNotice` button on guard/customer sign-up ("Apply to work at Guardr (staff)"); staff app/site entry shows the Staff sign-in tab | `AuthPage` creates a `staff` row: `isStaff`, `staffRole:'Support'`, `requestedStaffRole` (picker: Support/Moderator/Administrator/Manager/Director - not Founder, not Finance), `userStatus:'pending'`, `idVerificationStatus:'not_submitted'`, `managedCities:[primary city]`, badge `STF-#####` |
| Fields collected | first/middle/last name, email, password, phone (required), years of experience 0-60, primary work city (required), work-history summary (>=20 chars), availability notes (>=10), referred-by, equal-opportunity notice | `AuthPage.tsx` L379-445 |
| Staff-add by management ("invite") | Team panel `StaffAddStaffForm`: Administrator+ may PROPOSE (status `pending`, `canProposeStaffAccounts`); Manager+ create active (`canApproveStaffAccounts`). Assignable role = strictly below actor; Finance seat (side role) Director+; city access via `StaffOperationsAccessPicker` (Director+). Admin sets the password; `mustChangePassword` is stored on the row; no invite-email step found in the code read | `StaffAddStaffForm`, `handleAddStaffProfile` |
| Sign-in | same `AuthPage` sign-in with role choice Staff; `authService.signIn` -> worker `/api/auth/login`; `finishSignInWithProfile` rejects `blocked`, `one_role_hold`/`one_role_violation`, `device_account_blocked`; role-tab mismatch ("this is a guard account") | `authService.ts` |
| Installed/APK | staff web shell is `operations` for any installed shell; Capacitor Android treats staff like web (no Guard-only gate) | `productApps.websiteShellAccess` |

##### 4b. Account-status state machine (staff)

| State (`user_status`) | How reached | Can sign in | What they see | Code |
|---|---|---|---|---|
| `pending` | self-signup; proposed by Admin | yes (worker never checks status) | non-management: `StaffAccountPendingScreen` (checklist Application / Government ID / Payout bank (Stripe Connect)); management: full dashboard | `staffNeedsCredentialCompletion`, `StaffAccountPendingScreen` |
| `approved` | Manager+ `handleApproveStaffAccount` (does NOT change `staffRole` from Support to the requested role) | yes | pending screen until ID verified AND Stripe payouts enabled; auto-promoted to `active` + `verified:true` on the next check (`staffReadyForAutoActivation`, `withAutoStaffActivation`) | `staffAutoActivation.ts` |
| `active` | auto-activation, or created active by Manager+ | yes | full dashboard per role; if government ID not "effectively verified" -> sent back to pending screen (ID re-activation) except management | `staffNeedsIdReactivation` |
| `suspended` | Admin+ `handleUpdateGuardUserStatus` (rank rules 2f) | yes (not blocked at sign-in; no session re-check) | full dashboard (the lock function returns false for suspended/blocked) | `staffNeedsCredentialCompletion` |
| `blocked` | Admin+ or one-role case "block" | no at sign-in; an already-open session is not revoked | n/a | `finishSignInWithProfile` |
| rejected application | Manager+ `handleRejectStaffAccount` | row deleted/blocked (see handler) | n/a | not traced end-to-end |

Self-service ID/Stripe: pending staff can upload ID and connect Stripe from the pending screen (`staffCanUploadIdFromProfile` allows Profile upload for active staff or approved management). Who reviews a STAFF member's ID: not located in `StaffApplications` staff tab; `StaffApplications` staff tab only approves/rejects the account (open question for the redesign).

Approval permission copy mismatch: gate = `canApproveStaffAccounts` (Manager+); toasts/UI copy say "Directors and above" / "Director review".

##### 4c. Staff profile and preferences

| Item | Detail | Code |
|---|---|---|
| Profile route | `/staff/profile` (AccountMenu only; not in nav) -> `UserProfileScreen` with staff variant; tabs: Profile, Timesheets | `UserProfileScreen` |
| Editable | first/middle/last name, phone, avatar, personal email, headline, short intro (summary), about, focus-area chips (`STAFF_FOCUS_OPTIONS`) | `buildPayload` staff branch, `StaffProfileSection` |
| Read-only | work email, Staff ID (`staffBadgeNumber`), role label | |
| Government ID | upload shown when `staffCanUploadIdFromProfile` | |
| Timesheets tab | `StaffTimesheetsPanel(staffId)` own tracked hours | |
| Preferences | `/staff/preferences` -> `UserSettingsScreen` ("Notifications, manuals, updates, and legal"); contains no staff-specific code (same component as other roles) plus theme in AccountMenu | `UserSettingsScreen`, `AccountMenu` |
| Staff list / roster card | name, badge, role, status label (`getStaffRosterStatusLabel`), city access | `StaffTeamDetailPanel` |

##### 4d. Staff time tracking

| Aspect | Behaviour | Code |
|---|---|---|
| Model | `StaffTimeEntry{clockInAt,lastActivityAt,clockOutAt,source:'automatic'|'manual',adjusted*}`; no manual clock-in button | `staffTimeTracking.ts` |
| Automatic start | when the tab/app is visible (presence), not at login; applies to every staff role incl. pending, suspended and finance seats whose roster row loaded (`staffActivityTarget`) | `useStaffActivityTimeTracker`, `App.tsx` L865 |
| Counts as work | audit-logged ops, messages, forms, interactive staff UI clicks (debounced 8s), travel (section navigation) | `staffWorkActivity.ts` |
| Ends | 15 min idle (`STAFF_ACTIVITY_IDLE_MS`), tab hidden beyond 2 min grace, close; hours end at `lastActivityAt` not "now" | |
| Persist | local storage + upsert to `staff_time_entries` every 30 s; the hook loads ALL staff entries (`select('*')` no staff filter) and upserts the whole array each flush | `staffTimeTrackingStorage.ts` |
| Visibility | own hours: Profile -> Timesheets and Staff compensation ("Your compensation"); Director+ (`canManageStaffCompensation`) see all staff; filtering is client-side only | `StaffCompensationPanel` |
| Adjustment | Manager+ add/adjust/delete entries with note (`canAdjustStaffTimeEntries`) in `StaffTimeAdjustmentsPanel`; hourly rates edit Manager+; compensation settings + payout confirm Director+ | `permissions.ts` |

---

#### 5. DEFECTS, CONTRADICTIONS, TEST GAPS

##### 5a. Security / correctness

| # | Defect | Evidence |
|---|---|---|
| S1 | Staff permissions are UI-only: `/api/data/query` allows select/insert/update/delete on 41 tables (incl. `staff`, `guards`, `platform_settings`, `audit_log`, `payments`, `staff_time_entries`) for any authenticated session, without checking `platformRole` | `worker/routes/data.ts` (`authorize` returns session; handler never inspects it) |
| S2 | Session header is self-asserted: `x-guardr-session {userId,email,role}` accepted if a staff row with that id+email exists; no token | `lib/accountSessionAuth.ts verifyAccountSession` |
| S3 | `/api/auth/signup` binds a password to any `profileId` from the body and mints a JWT with role `administrator` (legacy 'staff'), without validating the row; `/api/auth/login` ignores `user_status`, so pending/suspended staff authenticate | `worker/routes/auth.ts` |
| S4 | Suspended staff (and already-signed-in blocked staff) keep full dashboard access; no re-check of status on session restore | `staffNeedsCredentialCompletion`, `App.tsx` ~L14720 |
| S5 | Pending lock depends on the roster row having loaded; before/without it, a pending Support seat falls through to the full dashboard | `App.tsx` L14721 |
| S6 | Any Manager+ can edit every role's permission list, including Director/Founder and their own, with no rank check or audit entry in the handler | `handleUpdateStaffPermissions`, `StaffRolePermissionsEditor` |
| S7 | `handleDeleteClientAccount` has no permission check (Moderator+ UI gate only); Moderator can delete guard and customer accounts via UI (`canManageGuards` = approve or manage_users) | `App.tsx` L8455, L8427 |
| S8 | Time tracker loads/overwrites all staff rows each flush (race with Manager adjustments; every staff client holds everyone's time data) | `staffTimeTrackingStorage.ts` |
| S9 | Approving a pending staff does not set the requested role; role remains Support until a separate edit | `handleApproveStaffAccount` |
| S10 | City scope (`managedCities`) filters only Service Areas and capacity caps; city-scoped managers see all jobs/guards/customers/payments platform-wide | grep `managedCities` |
| S11 | `isFinanceDeskOnly` depends on deprecated `SessionUser.staffRole`; a session without it turns a ladder + Finance seat into the 7-item desk | `staffNavAccess.ts` |
| S12 | Staff password restored with `setStoredPassword(..., role:'guard')` on approval (`member.password` kept on roster row in memory) | `App.tsx` L6802 |

##### 5b. Contradictions between names/copy and code

| Item | Copy says | Code does |
|---|---|---|
| Approve staff / create jobs / set trusted / override payout holds | "Directors (and Founders/above)" | Manager and above |
| `isDirector`, `hasExecutivePaymentControls`, `hasDirectorStaffOverride` | Director | Manager+ |
| Moderator guard.* keys | Moderator "approves guards" | holds all 10 `guard.*` keys (not consumed) but cannot verify credentials |
| `canStaffEditJobMapCoordinates` comment | Moderator+ | any non-client/guard (Support, Finance too) |
| Sign-up copy "Director reviews" / "Support until a Director assigns your ladder role" | Director | Manager+ approves; Director+ only for side role/city access |
| Badge prefix | `staffBadgeNumber` forbids STF | `AuthPage` generates `STF-#####` |
| Command palette DB alert | "Supabase" | backend is Worker + Neon |
| Hierarchy names | Support, Moderator, Administrator, Manager, Director, Founder | same six + `finance` platform role; Founder is stored as `Owner`/`Founder` DB role and `owner` platform role; `StaffRole` union and `STAFF_ROLES_ORDERED` include Founder; self-signup excludes Founder |
| Dead catalog toggles | `monitor_activity`, `issue_warnings`, `manage_platform_config`, `manage_owners` | no consumers |

##### 5c. Test coverage gaps
Tests exist for: `permissions` (role ladders), `staffNavAccess`, `roleSurfaceMatrix`, `staffAccountActivation`, `surfaceNavigation`, `staffOpsNavNotifications`, `staffTimeTracking`. Not covered: `StaffDashboard.renderSection` gate parity with nav flags (the 11 O cells), `handleDeleteClientAccount`, suspended-staff session behaviour, worker data-route authorization, signup/login status handling, permission-override edit hierarchy.

---

#### 6. TOP SURPRISES (for the redesign brief)

1. Staff permissions are UI-only: `/api/data/query` has no role/row checks and the session header is self-asserted (S1-S3).
2. Staff never gets bottom tabs + More: all surfaces use `DesktopStaffAdminShell` -> `SurfaceAppShell` with a hamburger drawer / tablet rail / desktop sidebar; nav dots, the create CTA, `StaffSidebarNav` and `TABLET_QUICK` are dead (N1-N4).
3. Pending/suspended staff can sign in; pending lock only applies to non-management staff once the roster row loads; suspended/blocked staff keep the full dashboard (4b, S3-S5).
4. Manager+ can rewrite any role's permission list (including Director/Founder/own) with no hierarchy guard; 4 toggles are dead, 4 finance toggles collapse into one flag, many gates ignore overrides (2b, 2g).
5. Names vs code: "Director" copy/functions are actually Manager+; Founder is `owner`; a seventh `finance` identity exists; Moderator holds `guard.*` but cannot verify credentials; 10 nav entries are visible to roles whose pages are blocked; city scope filters only Service Areas (2c, N5, S10).


## Part D. Shared and public account area

*SHARED + PUBLIC pages, screens and states - source audit (read-only)*

Repo `/agent/repos/Guardr`, branch `cursor/redesign-audit-plan-a787` (tree == main after PR1084). Source only; nothing executed (no `node_modules`). Companion files: `/tmp/audit/client.md` (format source, C-01..), `/tmp/audit/foundation-notes.md`, `/tmp/audit/shared.md` (worker route map - not repeated). Paths relative to repo root.

Legend. M/T/D/App = mobile / tablet / desktop surface / installed Capacitor-or-PWA shell (APK = WebView of the same bundle; no native UI). `ok` = renders and has per-surface treatment, `same` = one layout stretched, `n/a` = never reachable there, `MISSING` = should exist and does not. Design-condition vocabulary: **Redesigned (PR1084)** = file in `git diff --name-only 07074aab 03bd8b49`; **Partially redesigned** = shares PR1084 CSS/global selectors only; **Outdated** = untouched, pre-refresh look; **Static HTML** = own inline CSS, outside the design system; **Dead** = no importer. Testing: UT = in `npm test` allow-list; UT\* = test file exists but not in `npm test`; E2E = `e2e/*.spec.ts` (only public.spec, installed-app-auth.spec, surfaces.spec exist, all unauthenticated); none.

Account type (in gating column): `Public` (signed out), `Any` (guard/client/staff), `G` guard, `C-P/C-B/C-SC` client personal/business/security-company, `S` staff (all ladder roles), `Founder-only` etc.

---

### 1. How a shared/public URL is resolved

| Input | Signed out, browser | Signed out, installed (PWA/APK) | Signed in | Source |
|---|---|---|---|---|
| `/` | `HomePage` -> Desktop/Tablet/Mobile landing, all three wrap ONE `MobilityStyleLandingPage` | `AppHomeScreen` (welcome + Sign in / Sign up dock) | redirect to `defaultRouteForUser`: browser guard/client active = `/account`; pending guard = `/guard/activation`; pending client = `/client/home`; staff = `/staff/overview`; installed = role home | `App.tsx` L13990, L13980, `productApps.ts defaultPathForSignedInUser` |
| `/?auth=sign-in|sign-up&pick=role|path|client|work` | `AuthRoleChoicePage` | same page via `installedAuthEntry` (guard/staff app skips it; customer app goes straight to client-kind) | auth-only route -> redirected to role home | `appNavigation.ts readAuthChoiceFromUrl` |
| `/?auth=...&ar=guard|client|staff[&ct=personal|business|security-company]` (legacy `ck`) | `AuthPage` (page presentation) | `AuthPage`, role locked to baked app | redirect to role home | `parseNestedRoute` |
| `/guide` | `AppGuidePage audience=all` (browser, signed-out only) | disabled: handler closes it and rewrites URL to `/` | ignored for rendering (URL stays `/guide`, app renders) | `navigateFromLocation` L2156-2176 |
| `/legal/{terms,privacy,ica,client-agreement,guard-conduct,equal-opportunity}` | `LegalPage` | `LegalPage` | `LegalPage` with `AccountMenu`; back returns to role route | `readLegalPageFromUrl` |
| `/legal/<anything else>` | `parseAppRoute` returns null -> `HomePage` at the bad URL | `AppHomeScreen` | role home | `parseAppRoute` L368-372 |
| `/account`, `/account/{home,profile,billing,payouts,downloads,settings,support,documents}` (`payments|invoices|receipts` -> billing; unknown slug -> home) | stored as post-auth path, `AuthPage` sign-in (role `client`), URL rewritten to `/?auth=sign-in&ar=client` | same | `WebsiteAccountShell` for any role (staff too); installed shells also reach it by URL | `App.tsx` L2228-2236 |
| `/client/*`, `/guard/*`, `/staff/*`, `/dispatch`, `/app/{client,guard,staff}/*`, `/messenger[/*]` with a valid slug | stored via `persistPostAuthPath`, `AuthPage` sign-in with role from path (guard/staff/client; `/messenger?role=`) | same | route applied if `routeMatchesUser`; wrong role -> toast "X is for a different role. Opening Y instead." + default route; browser guard/client active -> toast "You need the Customer/Guard app to use the platform." + `/account` | `App.tsx` L2239-2252, L2303-2347 |
| `/client/<bad-slug>`, `/staff/<bad>`, `/guard/<id>` | slug not matched -> null -> `HomePage` at the bad URL, no redirect to sign-in. (`/guard/<unknown>` is treated as `guardId`) | `AppHomeScreen` | role home | `parseAppRoute` |
| `/download/`, `/download/register.html`, `/download/version.json`, `/stakeholder/`, `/marketing/*.html`, `/offline.html`, `/manuals/*.pdf`, `/version.json`, `/manifest.json`, `/sw.js` | static assets served by Worker `ASSETS` (SPA not involved) | same | same | `worker/index.ts`, `wrangler.toml [assets]` |
| any other path (`/foo`, `/manuals`, `/download` w/o slash handled by assets, `/api/unknown`) | `ASSETS` 404 -> Worker re-fetches `/index.html` -> **HTTP 200** SPA -> landing. There is NO 404 page, ever | same | role home | `worker/index.ts` L37-44 + `not_found_handling = single-page-application` |
| `*.apk` (`/guardr.apk`, `/download/guardr.apk?v=235`) | `.assetsignore` strips `*.apk` from the upload -> falls into the same SPA fallback -> returns the HTML app with status 200 | n/a | n/a | `public/.assetsignore`, `public/download/version.json` `apkUrl` |

#### 1a. Auth flow (verified in source)

| Step | What happens | Source |
|---|---|---|
| Sign-in | Client calls `POST /api/auth/login` (email+password) -> Worker reads `users.password_hash`, PBKDF2-SHA256 100k iterations (`pbkdf2:iter:salt:hash`), builds role via `resolvePlatformRole`, returns HS256 JWT (7-day TTL, no refresh) + `{id,email,role,name}` | `worker/routes/auth.ts`, `src/lib/auth/passwordHash.ts`, `lib/auth/jwt.ts` |
| Client fallback | If the Worker rejects, `signInWithCredentials` looks up the profile in the preloaded roster and compares `profile.password` (plaintext) or `password_hash` on the CLIENT; legacy rows with NO stored password accept ANY password of 4+ characters (`verifyAccountPassword`) | `src/lib/auth/authService.ts` L531-616, `src/lib/accountPasswords.ts` |
| Session storage | JWT in `localStorage['guardr_api_jwt']`; `localStorage['guardr_current_user']` = `{id,email,role,...}`; route in `sessionStorage['guardr_last_app_route']`; post-auth deep link in `sessionStorage['guardr_post_auth_path']` | `guardrClient.ts`, `App.tsx`, `appNavigation.ts`, `productApps.ts` |
| Request auth | `/api/data/query` accepts EITHER a valid JWT OR an `x-guardr-session` header `{userId,email,role}` that is only checked against the DB (id + email match), no secret/signature. The client sends that header from `guardr_current_user` on every query | `worker/routes/data.ts authorize()`, `lib/accountSessionAuth.ts verifyAccountSession`, `guardrClient.ts` L108-132 |
| Sign-up | Client creates the profile row itself (client-generated ids `randomId`, `staff-${Date.now()}`, badge numbers), then `POST /api/auth/signup {email,password,profileKind,profileId}`; Worker sets `password_hash` on that profile id and inserts `users` row with NO caller authentication and no email ownership proof | `AuthPage.tsx` L379-640, `worker/routes/auth.ts` L81-123 |
| Sign-out | removes local token/session/route; `POST /api/auth/logout` returns `{ok:true}` and revokes nothing (stateless JWT) | `App.tsx handleSignOut` L4350, `auth.ts` |
| Password rules | sign-up: >= 4 chars (`AuthPage` L352); change prompt: `minLength=8`; staff-provisioned default password `#Qwerty12345` is a hardcoded constant in the client bundle; signing in with it triggers `ChangePasswordPrompt` ("Yes, change now" / "Do it later") | `accountPasswords.ts`, `ChangePasswordPrompt.tsx` |
| Missing | NO forgot-password, reset, email verification, phone verification, OTP, magic link, 2FA, "remember me", session-expiry screen, or token refresh anywhere in `src/` or `worker/` (grep). Only mapping: `userFacingError` turns "unauthorized/jwt" into the string "Your session expired. Sign in again to continue." shown in toasts | grep |
| Sign-in outcomes shown | `invalid_password` "Invalid password."; `not_found` "Account not found. Please sign up or check your email address."; `blocked` "Account blocked. Contact administration." (guard-like profiles only); `role_mismatch` "This is a staff/guard/customer account. Use Log in as ..."; `one_role_hold` lock message; `device_account_blocked`; offline: "Still connecting to Guardr..." / "Unable to verify your account right now..."; `pending_approval` "Your staff account is awaiting Director approval." is **never produced** (no `return { status: 'pending_approval' }` anywhere in `authService.ts`) | `AuthPage.tsx` L663-710 |
| Device binding / one-role | (1) one-person-one-role cases keyed by email/phone/device (`oneRolePolicy.ts`, table `one_role_cases`), shown at sign-in as an error string, staff review in `StaffOneRoleHolds` (Applications); (2) one device, one account (`deviceBindingStore`, `resolveDeviceId` = Capacitor id or `localStorage guardr_device_id_v1`) -> sign-in error `ONE_ROLE_DEVICE_ACCOUNT_MESSAGE`; (3) one role APK per device (`deviceRoleClaim`, `useDeviceDownloadPolicy`) -> download cards say "X blocked on this device"; (4) "no switch account" tooltip on Sign out (`WebsiteAccountShell`). No dedicated screen for any of them | files listed |

---

### 2. Page inventory (shared and public)

IDs `P-nn` = pages/screens/tabs/detail views; `S-nn` (section 3) = loading / empty / error / restricted states. Client-owned pages are referenced by their `C-nn` id from `client.md` and not re-specified. Guard/Staff-owned role pages are out of scope; shared screens they reuse are listed.

#### 2a. Public website: landing (browser, signed out)

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-01 | Homepage - mobile | `/` (surface=mobile, browser) | Account type: Public only. Signed-in users are redirected away | Public site | P-04..P-13 sections; fixed dock | `src/components/HomePage.tsx` -> `landing/mobile/MobileLandingPage.tsx` -> `landing/mobility/MobilityStyleLandingPage.tsx` | Marketing + entry to auth. Hero "Post coverage. Hire licensed guards." with only text + login link (no booking fields, no hero visual) | Redesigned (PR1084: `MobilityStyleLandingPage`, `MobilityLandingChrome`, `MobilityExploreGrid`, `gr-landing.css` +213) | M ok / T n/a / D n/a / App n/a (installed shows P-14) | Keep; add theme toggle, Safety/Company destinations, real copy; remove "your area" placeholder | E2E public.spec 'homepage loads with Guardr branding'; surfaces.spec 'a phone viewport loads the mobile application' |
| P-02 | Homepage - tablet | `/` (surface=tablet) | Public only | Public site | same sections, tablet variants: split hero, board visual, `startbar` booking row, tab strip nav, 2-col mosaic explore, tablet login band | `landing/tablet/TabletLandingPage.tsx` -> same `MobilityStyleLandingPage formFactor=tablet` | as P-01 + booking bar (read-only inputs that open client sign-up) | Redesigned (PR1084) | M n/a / T ok / D n/a | Booking bar is non-functional decoration; tablet nav omits Manuals / Company package (only in footer) | E2E surfaces.spec 'tablet landing is its own page, not scaled desktop or mobile' |
| P-03 | Homepage - desktop | `/` (surface=desktop) | Public only | Public site | same + bento explore (feature card), sheet visual, "Now or later" pill, command-palette aside | `landing/desktop/DesktopLandingPage.tsx` (+ `dsk-landing-palette` aside) -> same `MobilityStyleLandingPage formFactor=desktop` | as P-02 + keyboard hint "Ctrl+K opens the command palette after you sign in" | Redesigned (PR1084) | D ok | `docs/SURFACES.md` claims an "operations-centre site" distinct from mobile/tablet; code is the same component with CSS variants | E2E surfaces.spec 'desktop landing uses the merged mobility homepage pattern' (asserts the same merge that SURFACES.md denies) |
| P-04 | Landing nav (header, mobile menu, tablet tab strip) | part of P-01..03 | Public | Landing | Links below in 2a-links | `landing/mobility/MobilityLandingChrome.tsx MobilityLandingNav` | Logo -> `/`; For clients, For guards, Safety, Company, Help (guide), Manuals PDF, Company package (new tab), Log in, Sign up; mobile hamburger drawer; no theme toggle | Redesigned (PR1084, 512-line diff) | M drawer / T tab strip / D inline nav | `Safety` and `Company` both just open sign-in (no pages exist); hard-coded `#ffffff` text on a black bar; theme props are accepted and ignored | none |
| P-05 | Landing hero + booking fields | part of P-01..03 | Public | Landing | `BookingFields` (stack/bar), `HeroActions` (Post a job / Find work as a guard), login text link, hero visual (`board` tablet, `sheet` desktop) | `MobilityLandingChrome.tsx MobilityLandingHero`, `MobilityLandingVisuals.tsx MobilityLandingHeroVisual` | CTA hero; inputs are `readOnly` and any focus/click opens client sign-up | Redesigned (PR1084) | M poster / T split / D split | Replace fake inputs; real preview imagery | none |
| P-06 | Landing trust strip | part of P-01..03 | Public | Landing | 4 chips: Licensed guards only, Map-first browsing, Direct pay, Shift tracking | `MobilityStyleLandingPage.tsx TrustStrip` | static copy | Redesigned (PR1084) | ok | Static claims need legal review | none |
| P-07 | Landing explore grid | part of P-01..03 | Public | Landing | 6 cards from `EXPLORE_SERVICES` (Post coverage, Schedule shifts, Browse jobs, Live operations, Multi-guard jobs, Earnings); mobile list / tablet mosaic / desktop bento | `MobilityExploreGrid.tsx`, `mobilityLandingData.ts` | Each card -> `onNavigateToAuth(role ?? 'client','sign-up')` (Multi-guard has no role -> client) | Redesigned (PR1084) | ok | Security-company lane not represented anywhere on the landing | none |
| P-08 | Landing login band | part of P-01..03 | Public | Landing | Log in / Sign up buttons + login visual | `MobilityExploreGrid.tsx MobilityLoginBand`, `MobilityLandingVisuals.tsx MobilityLandingLoginVisual` | `onNavigateToAuth(undefined,'sign-in'|'sign-up')` | Redesigned (PR1084) | ok | - | none |
| P-09 | Landing app-download CTA | part of P-01..03 | Public; hidden on Capacitor | Landing | "Sign up on this website" + Sign up / Log in | `landing/LandingAppDownloads.tsx` | Explains APKs are private until activation; no download link (by design) | Outdated (untouched; own styling) | ok | Merge copy with `/download/` page; no actual download path from public site | E2E public.spec 'public website publishes the website product app' (asserts text 'Android APKs are private') |
| P-10 | Company public placard | part of P-01..03; conditional | Public; renders only when staff-published `companyPlacardDocuments` exist | Landing | modal viewer for each public doc (licence, insurance...) | `src/components/public/CompanyPublicPlacard.tsx`, `src/lib/companyPlacard.ts` | Shows company licence/insurance docs published by Founder | Outdated | ok | Needs empty-state decision (currently renders nothing) | UT companyPlacard.test.ts (npm test) |
| P-11 | Landing footer | part of P-01..03 | Public | Landing | (c) entity name, Manuals (combined PDF), Company package (`/stakeholder/`), 6 legal links (`LegalFooterLinks`), EEO notice | `MobilityStyleLandingPage.tsx`, `legal/LegalFooterLinks.tsx`, `legal/EqualOpportunityNotice.tsx` | links | Redesigned (PR1084 touched file) | ok | No Contact / Support / Download link; no social | none |
| P-12 | Landing mobile action dock | part of P-01 | Public, mobile surface only | Landing | "Post a job" (client sign-up), "Find work" (guard sign-up) | `MobilityStyleLandingPage.tsx` (`uber-landing-dock`) | fixed bottom bar | Redesigned (PR1084) | M only | Overlaps `InstallPrompt` banner (both fixed bottom) - verify | none |
| P-13 | Landing command-palette aside | part of P-03 | Public, desktop only | Landing | one sentence | `DesktopLandingPage.tsx` | tells signed-out visitors about Ctrl+K | Outdated (no PR1084 change) | D only | Remove or move post-login | none |
| P-14 | Installed-app welcome | `/` when `isAppExperience()` (PWA standalone, APK, baked role app) | Public (signed out) | Installed shell | Hero (copy per `shellKind`/product app), `AppWelcomeSignInDock` (Sign in / Sign up / legal), shell badge, backdrop art, `ThemeToggle` | `src/components/AppHomeScreen.tsx`, `src/components/app/AppWelcomeChrome.tsx` | The only signed-out screen inside Guard/Customer/Staff/Messenger apps | Outdated (not in PR1084) | M ok / T ok (row layout) / D n/a (installed never desktop) / App ok | Redesign per app flavour; confirm tablet landscape (APK manifest forces portrait) | E2E installed-app-auth.spec 'Guard welcome does not overlay copy with Sign in' |
| P-15 | Public guide | `/guide` (signed out, browser only); `syncGuidePage` | Public. Signed-in role guides are separate (in role dashboards) | Public site | audience tabs (All/client/guard/support/moderator/administrator/director/founder), section list, stakeholder docs panel, manuals panel, section detail; desktop split / tablet split / mobile list | `src/components/docs/AppGuidePage.tsx` (+ `MarkdownDoc.tsx`, `src/lib/appGuide.ts`, `docs/guardr-general-guide.md?raw`) | Reads the 1,5k-line markdown guide bundled in the JS | Redesigned (PR1084: 8-line reorder of manuals/stakeholder panels) | M list / T split / D split | Public guide exposes staff-only role guides (Director/Founder sections) to anonymous users; tutorial panel hidden when public | none |
| P-16 | Legal - Terms of Service | `/legal/terms` | Any (public + signed in) | Legal | sections, sibling links, desktop rail "Documents / On this page", tablet document nav | `src/components/legal/LegalPage.tsx`, `src/lib/legalContent.ts LEGAL_TERMS` | Static legal text, v2026-06-22; required acceptance for all roles | Redesigned (PR1084: `LegalPage.tsx` + `visual-refresh.css` legal block) | M sheet / T paper / D rail | Back label always "Back to Home" even when signed in | E2E public.spec 'legal terms page is reachable' |
| P-17 | Legal - Privacy Policy | `/legal/privacy` | Any | Legal | same | same, `LEGAL_PRIVACY` v2026-06-22 | required for all roles | Redesigned (PR1084) | same | same | none |
| P-18 | Legal - Independent Contractor Agreement | `/legal/ica` | Any; required for G | Legal | same | `LEGAL_ICA` v2026-06-25 | required acceptance for guards | Redesigned (PR1084) | same | - | none |
| P-19 | Legal - Client Agreement | `/legal/client-agreement` | Any; required for C-P/B/SC | Legal | same | `LEGAL_CLIENT_AGREEMENT` v2026-06-25 | required acceptance for clients | Redesigned (PR1084) | same | - | none |
| P-20 | Legal - Guard Code of Conduct | `/legal/guard-conduct` | Any; required for G | Legal | same | `LEGAL_GUARD_CONDUCT` v2026-06-25 | required acceptance for guards | Redesigned (PR1084) | same | - | none |
| P-21 | Legal - Equal Opportunity Notice | `/legal/equal-opportunity` | Any; not a required acceptance | Legal | same | `LEGAL_EQUAL_OPPORTUNITY` v2026-08-27 | informational, linked from footer and sign-up | Redesigned (PR1084) | same | - | E2E public.spec 'equal opportunity page is reachable without employer language'; UT appNavigation.test.ts |
| P-22 | Marketplace agreements gate (modal) | overlay on any signed-in role screen | Any except Founder/owner (`isFounder` exempt); staff need terms+privacy only | Gate | one checkbox per missing document, "Accept and continue" | `src/components/legal/LegalAcceptanceModal.tsx`, `LegalAcceptanceCheckbox.tsx`, `LegalDocumentLink.tsx`, `src/lib/legalAcceptance.ts`, `App.tsx marketplaceLegalGate` | non-dismissable modal; documents open full-page and return | Outdated (`legal-accept.css`, not PR1084) | M/T/D same modal | Re-accept on version bump does not work (see section 7); no per-surface layout | UT legalAcceptance.test.ts (npm test) |

#### 2b. Sign in, registration, account-type selection

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-23 | Sign in - role chooser | `/?auth=sign-in&pick=role` | Account type: Public. Hidden in baked role APKs (they jump to P-26) | Auth | 3 cards Guard / Customer / Staff, Home back, Sign up link; messenger variant copy ("Job chats and Guardr support...") | `src/components/auth/AuthRoleChoicePage.tsx`, `AuthFormChrome.tsx`, `styles/auth-role-choice.css` | Picks which account type signs in. Choosing Customer then opens the Personal / Business / Security company step before the form (e2e-asserted) | Partially redesigned (only `visual-refresh.css` tablet fill rule) | M ok / T ok (PR1084 CSS) / D hero panel / App ok; theme toggle prop deliberately ignored (`_onChangeTheme`) | Align to landing visual language; theme toggle | E2E public.spec: 'auth deep link opens sign-in', 'role picker deep link survives refresh', 'customer sign-in uses the same hiring options as sign-up' |
| P-24 | Sign up - path chooser | `/?auth=sign-up&pick=path` | Public | Auth | "I need security" / "I want to work" | same | splits client vs work | Partially redesigned | ok | - | E2E public.spec 'sign-up uses three selection pages' |
| P-25 | Sign up - client-kind chooser | `?auth=sign-up&pick=client` | Public | Auth | Personal / Business / Security company | same | choice sets `ct` | Partially redesigned | ok | Reference only: C-01 / C-02 | E2E public.spec 'sign-up uses three selection pages' |
| P-26 | Sign up - work chooser | `?auth=sign-up&pick=work` | Public | Auth | "I'm a licensed guard (contractor)" / "Apply to work at Guardr" (staff) | same | -> guard or staff sign-up forms | Partially redesigned | ok | - | E2E public.spec 'sign-up uses three selection pages' |
| P-27 | Sign-in form (guard / customer / staff, one `AuthPage`) | `/?auth=sign-in&ar=guard|client|staff` (also baked app entry, `/account`, `/client/*` deep links) | Public. Account type decides role copy; `role_mismatch` blocks wrong type; installed role app locks the role | Auth | email + password (show/hide), Sign in, "Switch to sign up", Guide icon, ThemeToggle, legal links; desktop 2-panel hero / tablet sheet / mobile page; presentation `sheet` (modal code path exists but both call sites pass `presentation="page"`, App.tsx L13913, L13971, so it is dead) | `src/components/AuthPage.tsx` (1,817 lines), `auth-mobile-sheet.css`, `desktop-auth.css`, `lib/auth/authService.ts` | PBKDF2 Worker login with client-side fallback; every error is one red text block (`errorMsg`) | Outdated (not in PR1084) | M ok / T ok / D split hero / App ok (Guide icon inside an installed app dumps the user back to the welcome screen - see section 10) | Full redesign; no "forgot password"; show inline field errors; add loading/disabled states | E2E installed-app-auth.spec ('Work Sign in opens the guard form', 'Customer Sign in asks personal, business, or security company'); UT passwordHash.test.ts (npm test), authPath.test.ts (UT*); no authService test file exists |
| P-28 | Guard sign-up (application intake step 1) | `/?auth=sign-up&ar=guard` | Public. Account type: G | Auth | name, email, phone, password, home city, years experience, resume summary, availability, legal checkboxes; "Apply to work at Guardr" notice | `AuthPage.tsx` L915-1135, `auth/StaffSignupNotice.tsx` | creates `guards` row client-side (badge id, `userStatus:'pending'`), then `POST /api/auth/signup`; then onboarding continues in guard dashboard (credentials, ID, Stripe) | Outdated | M/T/D same form | Redesign; email verification absent; split long form into steps | E2E public.spec 'sign-up terms checkbox is tappable on mobile' |
| P-29 | Staff sign-in / sign-up | `/?auth=sign-in|sign-up&ar=staff` (sign-up reached from guard sign-up notice or `pick=work`) | Public. Account type: S (new staff default `staffRole` set by form, `userStatus:'pending'`) | Auth | name, email, phone, city, years, experience, availability; success text "Application submitted..." displayed in the **error** slot | `AuthPage.tsx` L838-912, `StaffSignupNotice.tsx` | creates `staff-${Date.now()}` row + `/api/auth/signup`; **does not sign the user in** | Outdated | ok | Dedicated success screen; staff-vs-guard form split | E2E public.spec 'staff sign-up checkbox does not scroll page on tap' |
| P-30 | Client sign-up forms (3 kinds) | `?auth=sign-up&ar=client&ct=...` | Public. Account type: C-P / C-B / C-SC | Auth | Personal, Business, Security-company intake + shared sections | `auth/clientSignup/*` (6 files), `AuthPage.tsx` | see client.md **C-01 / C-02** | Outdated | see client.md | see client.md | E2E public.spec 'personal client sign-up hides company fields', 'business client sign-up shows company fields' |
| P-31 | Change-default-password dialog | overlay after any sign-in whose password == default | Any (provisioned staff/clients) | Auth | "Change password" (min 8) / "Do it later" | `auth/ChangePasswordPrompt.tsx` | one-off modal; no entry point afterwards (not in Settings) | Outdated | modal | Add Security section in Settings (change password, sessions) | none |
| P-32 | Forgot password / reset | - | - | Auth | - | MISSING | Does not exist in UI or Worker | n/a | MISSING all | Design + implement (email provider needed; none wired for auth) | - |
| P-33 | Email / phone verification, OTP, 2FA | - | - | Auth | - | MISSING | Does not exist; email deliverability is never checked (Resend/email is used for notifications only) | n/a | MISSING all | Out of scope unless product decides | - |
| P-34 | Session expired / sign-in-again screen | - | - | Auth | - | MISSING | Expired JWT after 7 days: data calls fail -> toast text only; user stays "signed in" in localStorage (see ST-18) | n/a | MISSING | Design a session-expired state | - |

#### 2c. Pending approval, activation, onboarding, tutorial

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-35 | Guard / client pending-activation screen | `/guard/activation` (G); client uses `/client/home` pending state | Account type: G pre-active, C-P/B/SC pending | Onboarding | progress bar, checklist (ID, credentials, Stripe, review), "Revision requested" banner, manuals panel, legal docs | `account/AccountPendingScreen.tsx` (used by `GuardDashboard.tsx` L1936, `ClientDashboard.tsx` L442) | Gate for tabs outside `guardActivationAllowedTabs` / client allowed views | Outdated | M ok / T same / D same / App ok | Shared design for guard + client; reconcile with C-xx / guard doc | none (no accountStatus test file) |
| P-36 | Staff activation / reactivation screen | `/staff/*` (blocks ops) | Account type: S pending / approved-not-active / needs ID | Onboarding | ID front/back/selfie upload, Stripe bank connect, progress; copy variants: "Complete your staff application", "Finish onboarding", "Complete credential verification" | `staff/StaffAccountPendingScreen.tsx` | Same intent as P-35 for staff; copy says "Sign in anytime ..." while sign-in code branch `pending_approval` (ST-14) is dead | Outdated | M/T/D same | Merge with P-35 | none |
| P-37 | Guard "Account suspended / blocked" | in guard dashboard when `userStatus` suspended or blocked | G | Restricted | static card "Account Suspended/Blocked - Contact Guardr support to restore access." (no button, no sign-out) | `GuardDashboard.tsx` L1272-1285 | Only guards have this screen. Clients and staff with `suspended` status have no equivalent (client suspended = same as pending; staff suspended = nothing) | Outdated | same | Create one shared restricted-access screen with Contact support + Sign out | none |
| P-38 | Onboarding tour / tutorial overlay | overlay over role dashboards; starts after first sign-in, restart from the signed-in Guide page tutorial panel (`AppGuidePage` `onStartTutorial`; Settings does not render it) | Any (tour per role: guard 15, client 13, staff 15 steps) | Onboarding | start / decline prompt, step card with spotlight + Next / Back / End, completion | `onboarding/OnboardingTour.tsx` (`TutorialExperience`), `lib/onboardingTours.ts`, `lib/tutorialSession.ts` | persisted per user in localStorage; steps navigate role dashboards (`onGuardTab` ...) and may use demo data (`tutorialSession` lifecycle) | Outdated | M ok / T / D rely on same card | Redesign card; re-verify every step target still exists after redesign | UT tutorialSession.test.ts (npm test); no onboardingTours test |
| P-39 | Tutorial demo data session | within P-38 | Any | Onboarding | demo jobs/requests/threads | `lib/tutorialSession.ts` | not a separate screen | n/a | - | Keep demo data aligned with new layouts | none |

#### 2d. Shared profile, settings, notifications, account menu, support

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-40 | Profile screen (shared shell) | guard `pg=profile`, client profile, staff profile, `/account/profile` | Account type: Any; fields/tabs vary by role (G tabs, C-P/B/SC fields, S tabs) | Profile | Guard tabs: Profile / Credentials / Inventory / Timesheet; Staff tabs: Profile / Timesheets; client: single page with kind-specific blocks; "Application locked" / "Revision requested" banners; Government ID zone | `profile/UserProfileScreen.tsx` (679 lines), `ProfileHero.tsx`, `ProfileAvatar.tsx`, `PersonNameFields.tsx`, `StaffProfileSection.tsx` | edit contact, avatar, business/company blocks, ID submission | Outdated | M ok / T ok / D ok (one component, `ResponsivePage`) | One shared redesign for 3 roles; client rows: reference client.md profile row | none |
| P-41 | Guard credentials tab | profile tab `certs` | G (non-staff guards only: `canBuildResume`) | Profile | Guard card, credentials list, ID item + detail modal, COI item + detail modal + upload sheet, vehicle-insurance card + upload sheet, identity-verification panel, ID photo row, ID image modal | `profile/GuardCredentialsPanel.tsx`, `GuardCardPanel.tsx`, `GuardIdItemCard/DetailModal/PhotoRow`, `GuardCoi*`, `GuardVehicleInsurance*`, `GuardIdentityVerificationPanel`, `IdVerificationImageModal` | document capture + expiry | Outdated | ok | Guard-owned; list only | UT guardCredentialSections.test.ts (npm test) |
| P-42 | Guard inventory tab | profile tab `inventory` | G | Profile | Equipment, Uniforms (lists + forms), gear-carry panel, weapon gear, equipment gear panel | `profile/GuardInventoryPanel.tsx` (+ `inventory/GuardInventoryEquipment{Card,Form}`, `GuardInventoryUniform{Card,Form}`), `GuardGearCarryPanel.tsx`, `GuardWeaponGearPanel.tsx`, `GuardEquipmentGearPanel.tsx`, `GuardResumeEditor.tsx` | independent equipment / uniform inventory | Outdated | ok | Guard-owned | UT guardInventory.test.ts (npm test) |
| P-43 | Settings screen | guard `pg=settings`, client/staff settings, `/account/settings` | Account type: Any | Settings | Work-preferences pointer (G only), Push notifications panel, App update panel, User manuals, Legal cards, About. **No theme, no password, no device, no sign-out, no account deletion** | `profile/UserSettingsScreen.tsx` (87 lines), `PushNotificationsPanel.tsx` (587), `app/AppUpdatePanel.tsx`, `docs/UserManualDownloads.tsx`, `legal/LegalInfoCards.tsx` | Web-push subscribe/unsubscribe + test, native APK update check | Outdated | M ok / T ok / D ok | Add Appearance (theme currently only in Account menu), Security (password, devices), Tutorial restart (props exist but not rendered here) | none |
| P-44 | Account menu | avatar button in every shell header / mobile drawer | Any | Navigation | Profile, Notifications (sub-page), Settings, extra links (Guide, Download, role-specific), theme toggle, Sign out | `components/layouts/AccountMenu.tsx`, `MobileDrawerIdentity.tsx`, `MoreMenuSheet.tsx`, `SidebarFooterLinks.tsx` | popover desktop, sheet mobile | Outdated | M sheet / T / D popover | Redesign per shell | none |
| P-45 | Notification bell + inbox | Account menu -> Notifications; client/guard/staff headers | Any | Notifications | list, mark all read, item click deep-links (job, thread, invoice), empty "No notifications yet" | `notifications/NotificationBellMenu.tsx`, `NotificationInboxSection.tsx`, `lib/notificationInbox.ts`, `lib/userNotificationStore.ts`, `lib/useUserNotificationsRealtime.ts` | two near-duplicate renderers (popover vs inline) | Outdated | ok | Merge; no filter/unread tabs; no "notification centre" page exists | UT notificationInbox.test.ts (npm test), notificationRouting.test.ts (UT*) |
| P-46 | Support screen (Support + Reports tabs) | `/account/support`, guard/client support nav | Any (staff has a separate inbox) | Support | Tabs Support / Reports; "Contact support", "Your support chats", "File a report", "Your reports"; ticket thread | `support/SupportScreen.tsx`, `SupportComposePage.tsx`, `SupportReportPage.tsx` | tickets via `supportTickets`; staff inbox = StaffSupportPanel (touched by PR1084) | Partially redesigned (thread uses `MessagesHubLayout`, touched in PR1084) | ok | No public/anonymous support page; no help center, no contact form on landing | none |

#### 2e. Download / install / update

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-47 | App download screen (full page) | in-app overlay `downloadPageOpen` (installed shells), not a URL | Account type: Any signed-in; `canDownloadApks` = active account or staff | Download | "This app" card (version Installed / Update available), cards per role APK (Guard, Customer, Staff, Messenger) with blocked state "X blocked on this device", Install / Update button (native installer) | `app/AppDownloadScreen.tsx`, `hooks/useAppDownloadStatus.ts`, `lib/downloadVersion.ts`, `lib/bundledDownloadManifest.ts`, `hooks/useDeviceDownloadPolicy.ts`, `lib/platform/apkUpdate.ts` | install-latest APK via plugin; compares `public/download/version.json` (bundled copy) | Outdated | M ok / T / D | Redesign; note APK link 404s on Worker (ST-21) | UT bundledDownloadManifest.test.ts, githubApkRelease.test.ts (npm test) |
| P-48 | Website account - Downloads | `/account/downloads` | Account type: Any; locked copy until account is active | Website account | locked text OR embedded P-47 | `website/WebsiteAccountDownloads.tsx` | | Partially redesigned | ok | - | none |
| P-49 | PWA install prompt / guide | fixed banner on every browser screen incl. landing, auth, legal, dashboards | Any; hidden when installed/standalone/native | Install | banner (Add to Home Screen on iOS / Install), dismiss (sessionStorage), `PwaInstallGuide` sheet (iOS steps) | `components/InstallPrompt.tsx`, `hooks/usePwaInstallPrompt.ts`, `landing/PwaInstallGuide.tsx`, `lib/pwaManifests.ts`, `lib/installSurfaceCopy.ts` | `beforeinstallprompt` capture; `pwaInstallCopy('website')` always | Outdated | M ok / T / D banner | Position vs dock; only 'website' copy used | UT pwaManifests.test.ts (npm test), installSurfaceCopy.test.ts (UT*) |
| P-50 | App install banner (role shells) | top of role shell in browser | Any | Install | "Get <Role app>" banner | `apps/AppInstallBanner.tsx` (in `layouts/RoleAppShell.tsx`) | | Outdated | ok | merge with P-49 | none |
| P-51 | Open-app CTA | website account views, restricted features | Any | Install | card "This feature is available in Customer / Guard / Operations" + action | `apps/OpenAppCta.tsx`, `lib/productApps.ts openAppCtaCopy` | | Partially redesigned | ok | - | none |
| P-52 | Update panel (Settings) | inside P-43 | Any in native; copy changes for Play Store builds | Settings | "Checking for updates...", "You are on the latest version", "Install update (vX)", Play Store text | `app/AppUpdatePanel.tsx` | | Outdated | App only meaningful | - | none |

#### 2f. Static HTML and files in `public/` (not SPA)

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-53 | Download page | `/download/` (`public/download/index.html`, served by Worker assets) | Public | Static | Browser view: "Android apps are private" + Sign up / Log in. Native/Android-WebView view only: "App update" panel with Install update link (`version.json apkUrl` = `/download/guardr.apk?v=235`, which the Worker cannot serve, see ST-21) | `public/download/index.html` | There is no public download; page is an explainer and an in-app updater | Static HTML (own CSS) | responsive | Rebuild inside SPA or align tokens; fix APK source | none |
| P-54 | Install-register page | `/download/register.html` | Public (loaded in hidden iframe by `installRegistry.ts`) | Static | none (script sets cookie via `/api/install/register`) | `public/download/register.html` | | Static HTML | n/a | no UI | none |
| P-55 | Version manifest | `/download/version.json`, `/version.json` | Public | Static | JSON: `webVersion`, `apkVersion` 1.0.135, `apkVersionCode` 235, `apkUrl`, `apkDirectUrl` + `apkApps` (GitHub release v1.1.0-cf-beta), `appsZipUrl` | `public/download/version.json`, `public/version.json` | The two files differ (`diff` reports different content); `src/lib/bundledDownloadManifest.ts` is a third copy | n/a | n/a | Single source | none |
| P-56 | Offline fallback page | `/offline.html` (served by `sw.js` when network fails for navigations) | Public | Static | "You're offline" + Try again | `public/offline.html` | | Static HTML (hard-coded dark theme, not PR1084) | ok | align with ST-02 | none |
| P-57 | Marketing - business card | `/marketing/business-card.html` | Public (unlinked) | Static | digital card, Book now -> `https://www.guardr.co` | `public/marketing/business-card.html` | external font + absolute domain | Static HTML | ok | decide keep/remove | none |
| P-58 | Marketing - promo banner | `/marketing/promo-banner.html` | Public (unlinked) | Static | meta-refresh to P-57 | `public/marketing/promo-banner.html` | redirect only | Static HTML | - | delete | none |
| P-59 | Company package page | `/stakeholder/` | Public (linked from landing footer) | Static | Executive Summary PDF, Company Information Package PDF, Legal Counsel Intake Form (PDF + fillable HTML) | `public/stakeholder/index.html`, `Guardr-Counsel-Intake-Form.html` | Investor-grade documents are world-readable PDFs; **same list is re-implemented in React** (`StakeholderDocumentDownloads`) | Static HTML | ok | Pick one implementation | UT stakeholderDocuments.test.ts (npm test) |
| P-60 | Manuals PDFs | `/manuals/*.pdf` (combined + per role) | Public | Static | files | `public/manuals/`, `lib/userManuals.ts` | Linked from landing nav/footer, guide, settings, website documents | n/a | n/a | - | UT userManuals.test.ts (npm test) |
| P-61 | PWA files | `/manifest.json`, `/sw.js`, `/service-worker.js`, `/native-product-app.js` | Public | Static | - | `public/` | `sw.js` network-first, cache `guardr-cache-v1-0-135`, precache list includes `/manifests/{client,guard,staff,messenger}.webmanifest`, which are not in `public/` (Worker answers with `index.html` 200, so the cache holds HTML as a manifest); `service-worker.js` is only `importScripts('/sw.js?v=235')` and is what `lib/push.ts` registers; `native-product-app.js` sets product-app hints before React | n/a | - | Collapse to one SW; add icons | E2E (SW unregister only) |

#### 2g. Website account portal `/account/*` (Account type: Any signed-in; browser only for guard/client, staff may use it too)

Shell: `website/WebsiteAccountShell.tsx` (sidebar on desktop/tablet, bottom nav on mobile, header "Get <app>" button + Sign out). Active roles (guard/client) in a browser are forced here; staff reach it via `/account` URL. Views come from `productApps.ts websiteAccountViewsForRole`.

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-62 | Website account shell | `/account*` | Any signed-in; `resolveWebsiteAccess` = `operations` (staff), `activation` (pending), `account` | Website account | nav: Account, Profile, Billing (C, S) or Payouts (G), Downloads, Settings, Documents, Support | `website/WebsiteAccountShell.tsx`, `AccountMenu` | | Outdated (`product-apps.css`) | M bottom nav / T,D sidebar | Redesign with landing language | UT productApps.test.ts (npm test); E2E public.spec 'account and app URLs send signed-out visitors to sign-in' |
| P-63 | Account home | `/account` (`home`) | Any | Website account | hero (welcome, "Get <app>" / "Continue application" / "Open operations"), 3 metrics (Account, Billing/Payouts, Alerts), cards | `website/WebsiteAccountHome.tsx` | status label: client Active / Pending review, guard Active / Activation required, staff Staff | Outdated | ok | | none |
| P-64 | Account profile | `/account/profile` | Any | Website account | = P-40 | `UserProfileScreen` | | Outdated | ok | | none |
| P-65 | Account billing | `/account/billing` (aliases payments, invoices, receipts) | C: invoice list (`ClientInvoiceScreen` inside `PaymentsPage`); S: open-app CTA to `/staff/payments`. Not available to G (G sees Payouts) | Website account | invoice list + detail | `client/ClientInvoiceScreen.tsx` (PR1084), `payments/PaymentsPage` | invoices only, no payment methods despite home copy "Invoices and payment methods" | Partially redesigned | ok | reference client.md invoices row | none |
| P-66 | Account payouts | `/account/payouts` | G only | Website account | "Connect Stripe... in the Guard app" + Open Guard app CTA | App.tsx inline | placeholder | Outdated | ok | | none |
| P-67 | Account downloads | `/account/downloads` | Any; locked until active | Website account | = P-48 | | | Partially redesigned | | | none |
| P-68 | Account settings | `/account/settings` | Any | Website account | = P-43 | | | Outdated | | | none |
| P-69 | Account documents | `/account/documents` | Any | Website account | stakeholder docs (public), user manuals by role, legal cards | `website/WebsiteAccountDocuments.tsx` | | Outdated | | | none |
| P-70 | Account support | `/account/support` | Any | Website account | = P-46 | | | Partially redesigned | | | none |

#### 2h. Messenger companion, dev harness, global chrome

| ID | Page name | Route / nav id | Permission/gating | Parent nav group | Child pages/tabs/detail views | Component file(s) | Existing functionality | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-71 | Messenger companion app | `/messenger`, `/messenger/*?role=` (Messenger APK / PWA) | Any signed-in; sign-in copy variant | Messenger | Role-resolved inbox: client/guard/staff messages panels in a `MessengerCompanionBar` frame; sign-in page uses messenger copy | `lib/messengerCompanion.ts`, `messenger/MessengerCompanionBar.tsx`, `MessengerCompanionContext.tsx`, `layouts/RoleAppShell.tsx`, `staff/StaffOpsLayout.tsx`, `AuthRoleChoicePage` messenger copy | one-way: companion shows only messages/support, jobs open main app | Partially redesigned (message panels touched in PR1084: `ClientMessagesPanel`, `GuardMessagesPanel`, `StaffMessagesPanel`, `MessagesHubLayout`) | M ok / T / D | Confirm unread badge + Open-main-app flow | E2E installed-app-auth.spec 'welcome is messages and support, then a role pick'; UT messengerCompanion.test.ts (npm test) |
| P-72 | Dev preview harness | `/?ui-preview=1` (`main.tsx` L131-142; gated on `import.meta.env.DEV`, so dev server only) | Developer only | Dev | Surface preview screens: Invoice, Job, Map, Messages, Payments + staff fixtures | `src/dev/SurfacePreview.tsx`, `dev/surfaces/*`, `dev/previewScreenState.ts` | design review harness with fixtures, no data calls | Partially redesigned (PR1084 +66 / 5 new screens) | M/T/D | Dynamic import so it is not in the prod bundle; covers only Invoice, Job, Map, Messages, Payments - extend it (or replace with Storybook-style screens) to landing, auth, legal, guide, account portal, states | none (`surfaces.spec` uses `/?ui=mobile|desktop`, the surface override, not this harness) |
| P-73 | Loading screen | root loading + auth boot + dashboard Suspense | Any | Global | spinner + "This is taking longer than usual." + Try again | `components/LoadingScreen.tsx` | uses `--uber-*` vars, inline styles | Outdated | ok | merge with skeleton set | none |
| P-74 | Offline banner | global fixed bar | Any | Global | "You're offline. Saved work will sync when you reconnect." / `loadIssue` text | `components/OfflineBanner.tsx` (PR1084 +11: sets `data-offline-banner`) | amber bar; pushes page chrome via `visual-refresh.css` | Redesigned (PR1084) | ok | | none |

---

### 3. States: loading, empty, error, offline, restricted, update, session

Every state found in `src/`, `public/` and `worker/` that is not owned by one role dashboard. `Where` = render site. `Design condition` as in the legend.

| ID | State | Where used / trigger | Component file(s) | Account type / gating | Existing behaviour | Design condition | M / T / D / App | Required redesign work | Testing |
|---|---|---|---|---|---|---|---|---|---|
| ST-01 | Pre-hydration blank page | every first load before React mounts | `index.html` (`<div id="root">` only, no `<noscript>`, no inline splash) | Public | blank screen (white/black flash); no per-route `<title>`/meta (canonical is `https://guardr.co/` for every route incl. `/legal/*`) | Outdated | all | Inline splash + noscript; per-route titles for legal/guide | none |
| ST-02 | Static offline page | SW returns it for failed navigations only when `/offline.html` cached | `public/offline.html`, `public/sw.js` | Public | "You're offline - Guardr can't reach the network right now. Reconnect and try again - your session is still saved." + Try again; hard-coded black | Static HTML | all | Match ST-10 | none |
| ST-03 | Root loading screen | `loading` flag at boot, auth restore, data fetch | `components/LoadingScreen.tsx` (`--uber-*` vars, inline styles) | Any | spinner; after delay: "This is taking longer than usual." + Try again | Outdated | all | Rebuild with tokens; unify with ST-04 | none |
| ST-04 | Surface shell skeleton | lazy surface shell Suspense | `surfaces/SurfaceAppShell.tsx` `SurfaceFallback` -> Mobile/Tablet/DesktopSkeletonScreen | Any signed-in | per-surface skeleton while chunk loads | Partially redesigned | M/T/D each own skeleton | Keep; extend to landing (landing is eager) | surfaces.spec |
| ST-05 | `GuardrSkeleton` | none (exported, no importer) | `components/baseui/GuardrSkeleton.tsx` | n/a | dead | Dead | - | delete or adopt | none |
| ST-06 | Error boundary / crash screen | **does not exist** (grep `ErrorBoundary`, `componentDidCatch`, `getDerivedStateFromError` = 0 hits). `lib/sentry.ts` `captureError` has **zero callers**; `@sentry/react` init only if `VITE_SENTRY_DSN` | `lib/sentry.ts` | all | any render error blanks the entire app (white screen) | MISSING | all | Design a crash screen + "Reload" + report | none |
| ST-07 | 404 / unknown route | unknown path on any host | none. `parseAppRoute` null -> landing or role home; Worker SPA fallback returns HTTP 200 | all | no 404 page, no "page not found", wrong `/client/xyz` shows landing at that URL | MISSING | all | Design 404; make worker return 404 status for non-route paths | none |
| ST-08 | Unsupported role fallback | signed-in user whose role matches none of guard/client/staff | `App.tsx` L14906-14925 "This account role is not supported." + Sign out | Any | plain card | Outdated | all | Fold into shared restricted-access screen | none |
| ST-09 | Offline / load-issue banner | `useOnlineStatus()` false, or `dataLoadStatus` issue set | `components/OfflineBanner.tsx` (`main.tsx` L122), `lib/dataLoadStatus.ts`, `hooks/useOnlineStatus` | Any | amber fixed bar: "You're offline. Saved work will sync when you reconnect." or the load-issue text (`userFacingError`, e.g. "Could not load Guardr. Check your connection and try again.") | Redesigned (PR1084, `visual-refresh.css` pushes chrome down via `data-offline-banner`) | ok | Keep | UT dataLoadStatus.test.ts (npm test) |
| ST-10 | Request/roster error + retry | roster fetch failed and 0 items | `ui/app/RosterLoadGate.tsx` (6 uses, 3 files) -> `AppRequestState status=error` "Retry" = `window.location.reload()` | Any role lists | full page reload as retry | Outdated | ok | Real retry, preserve state | none |
| ST-11 | `AppRequestState` loading/error blocks | list panels | `ui/app/AppPrimitives.tsx` (4 uses, 3 files) | Any | generic | Outdated | ok | - | none |
| ST-12 | Empty state primitive | 32 uses in 20 files (lists, inboxes, rosters) | `AppEmptyState` (`ui/app/AppPrimitives.tsx`) + `app-empty-state-icon` | Any | icon, title, message, optional action | Outdated | ok | One redesigned primitive covers all 32 | none |
| ST-13 | Empty notifications | Account menu inbox | `NotificationBellMenu.tsx` ("No notifications yet", uses `AppEmptyState`), `NotificationInboxSection.tsx` (bare "No notifications yet." text) | Any | two different empty visuals | Outdated | ok | merge | none |
| ST-14 | `pending_approval` sign-in result | `AuthPage` L669 "Your staff account is awaiting Director approval." | `AuthPage.tsx`, `authService.ts` type `SignInAttemptResult` | S | **Dead branch**: `authService` never returns it. Pending staff sign in and land on P-36 | Dead | - | Remove or implement | none |
| ST-15 | Sign-in error messages | failed sign-in | `AuthPage.tsx` L663-710 (`errorMsg` red text) | Public | strings in section 1a table, incl. `role_mismatch` "This is a staff/guard/customer account. Use Log in as ..." | Outdated | ok | Inline errors, aria-live | none (no authService test) |
| ST-16 | Wrong-role deep-link redirect | `navigateFromLocation` | `App.tsx` L2303-2347 | Any | toast "X is for a different role. Opening Y instead." / "You need the Customer/Guard app to use the platform." | Outdated | ok | - | UT appNavigation.test.ts; E2E 'account and app URLs send signed-out visitors to sign-in' (signed-out only) |
| ST-17 | One-role hold / device account blocked | sign-in | `oneRolePolicy.ts`, `AuthPage` error text | Public | `ONE_ROLE_LOCK_MESSAGE`, `DEVICE_OTHER_ROLE_APP_MESSAGE`, `ONE_ROLE_DEVICE_ACCOUNT_MESSAGE` as error strings | Outdated | ok | Dedicated screen with Contact support | UT oneRolePolicy.test.ts (npm test) |
| ST-18 | Session expired | JWT 7-day TTL ends; data calls 401 | none | Any | **no screen**: toast "Your session expired. Sign in again to continue." (only through `userFacingError` mapping); stale `guardr_current_user` keeps user "signed in"; `x-guardr-session` header keeps working without JWT | MISSING | all | Design + detect 401 globally -> sign-out + return-to path | none |
| ST-19 | Guard account suspended / blocked | `GuardDashboard.tsx` L1272 | `GuardDashboard.tsx` | G | static card, no actions | Outdated | same | shared restricted screen (P-37) | none |
| ST-20 | Pending / activation gate | see P-35, P-36 | `AccountPendingScreen`, `StaffAccountPendingScreen` | G, C, S | | Outdated | | | none |
| ST-21 | APK not served | `/download/guardr.apk`, `/guardr.apk`, any `*.apk` | `public/.assetsignore` (`*.apk`), `public/guardr.apk` = Git-LFS pointer (~104 MiB), `version.json apkUrl` | Public / Any | Worker returns the SPA HTML (200) so "Install update" downloads an HTML file called `guardr.apk`; real files live on GitHub releases (`apkDirectUrl`, `apkApps`) | Static / bug | App | Point `apkUrl` at GitHub or R2; return 404 for `.apk` | none |
| ST-22 | App blocked on device (download policy) | `AppDownloadScreen` card | `useDeviceDownloadPolicy.ts`, `deviceRoleClaim.ts` | Any | "X blocked on this device" card state | Outdated | App | - | UT deviceBindingStore.test.ts (npm test) |
| ST-23 | Download locked until active | `/account/downloads` | `WebsiteAccountDownloads.tsx` | Any (pending) | text only | Partially redesigned | ok | - | none |
| ST-24 | App update available / checking / current / failed | Settings, download screen | `AppUpdatePanel.tsx`, `AppDownloadScreen.tsx` ("Update available", "Update failed"/"Install failed" dialog) | Any, native | states: "Checking for updates...", "Install update (vX)", "You are on the latest version", Play-Store text | Outdated | App | - | none |
| ST-25 | PWA auto-update | `initPwaAutoUpdate` polls, activates waiting SW, `location.reload()` after 1.2 s | `lib/pwaAutoUpdate.ts`, `lib/pwaUpdateToast.ts` | Any | silent reload loses unsaved form state; the "Updating Guardr..." toast uses CommonJS `require(...)` inside an ESM bundle so it throws and is swallowed - **toast never appears** | Dead (toast) | all | Real update prompt ("Update available - Reload") | UT pwaAutoUpdate.test.ts (npm test; covers activation helpers, not the toast) |
| ST-26 | Legal acceptance gate | `marketplaceLegalGate` modal | `LegalAcceptanceModal.tsx` | Any except Founder | blocking modal; shows `(version X)` but acceptance check ignores version (section 7) | Outdated | modal | - | UT legalAcceptance.test.ts (npm test) |
| ST-27 | Default-password prompt | after sign-in | `ChangePasswordPrompt.tsx` | Any | modal | Outdated | modal | - | none |
| ST-28 | Blocked section placeholder | 21 uses: `StaffDashboard` (10), `StaffApplications`, `StaffCredentials` | `ui/app/AppBlockedAccess.tsx` `AppBlockedAccessScreen`, `AppNoticeChip` | S (permission by platform role) | locked rows -> popup `openAppNotice(title, message)` | Outdated | ok | Staff-owned, redesign as one pattern | none |
| ST-29 | Permission denied toasts | 20 `appToast('You do not have permission to ...')` in `App.tsx` + `userFacingError` "You do not have permission to do that." | `App.tsx`, `lib/userFacingError.ts` | S, C | toast only | Outdated | ok | - | UT userFacingError.test.ts (npm test) |
| ST-30 | Application locked / revision requested banners | profile + pending screens | `UserProfileScreen` ("Application locked", "Revision requested"), `AccountPendingScreen` | G, C | `AppStatusBanner` | Outdated | ok | - | none |
| ST-31 | Push notification states | Settings | `PushNotificationsPanel.tsx` (unsupported, denied "enable notifications in browser settings", subscribed, error "Unauthorized") | Any | | Outdated | ok | - | none |
| ST-32 | Toasts / app notice | everywhere | `ui/AppToast.tsx`, `AppNotice` | Any | transient | Outdated | ok | - | none |
| ST-33 | Tutorial / onboarding overlay states | start prompt, active step, declined, completed | `OnboardingTour.tsx` | Any | | Outdated | | | UT tutorialSession.test.ts (npm test) |
| ST-34 | Dev preview states | `previewScreenState.ts` (loading / empty / error variants for the 5 preview screens) | `dev/` | developer only | the only place a "state matrix" exists | Partially redesigned (PR1084) | | extend | none |
| ST-35 | Staff auth screen: "Application submitted" in error slot | staff sign-up success | `AuthPage.tsx` | Public | success message rendered in `errorMsg` styling and user is not signed in | Outdated | ok | success screen | none |

---

### 4. Landing link map (all three variants, one component)

Source: `MobilityLandingChrome.tsx` L31-34, L86-121, L156-210; `MobilityStyleLandingPage.tsx` L145-215; `MobilityExploreGrid.tsx`.

| Element | Mobile | Tablet | Desktop | Destination |
|---|---|---|---|---|
| Logo | yes | yes | yes | `/` |
| For clients | drawer | tab | nav | sign-up as client (`?auth=sign-up&ar=client` through `openAuthChoice`) |
| For guards | drawer | tab | nav | sign-up as guard |
| Safety | drawer | tab | nav | **sign-in chooser** (no safety page) |
| Company | drawer | tab | nav | **sign-in chooser** (no company page) |
| Help | drawer | tab | nav | `/guide` (P-15) |
| Manuals | drawer link | footer only | nav + footer | `/manuals/Guardr-User-Manuals-Combined.pdf` (exists in `public/manuals/` with Client, Guard, Quick-Start, Staff PDFs) |
| Company package | drawer link | footer only | nav + footer | `/stakeholder/` (P-59, new tab) |
| Log in | header text | header text | header text | `?auth=sign-in&pick=role` |
| Sign up pill | header | header | header | `?auth=sign-up&pick=path` |
| Hero: Post a job / Find work as a guard | stack | split | split | client / guard sign-up |
| Hero text link "Log in" | yes | yes | yes | sign-in |
| Explore cards (6) | list | mosaic | bento | role-specific sign-up (client default) |
| Login band | yes | yes | yes | sign-in / sign-up |
| App downloads CTA | yes | yes | yes | sign-up / sign-in only (no APK link) |
| Footer legal (6) | yes | yes | yes | `/legal/*` |
| EEO notice | yes | yes | yes | `/legal/equal-opportunity` |
| Mobile dock | Post a job / Find work | - | - | client / guard sign-up |

Never linked from landing: `/download/`, `/account`, `/messenger`, support, security-company signup, any contact address.

---

### 5. What serves what (Cloudflare Worker)

`wrangler.toml`: `[assets] directory = ./dist, binding = ASSETS, not_found_handling = single-page-application`, no `run_worker_first`; `worker/index.ts` routes `/api/*` to Hono and everything else to `ASSETS`; PR1084 added `[previews.vars]` (preview `APP_URL`/`VITE_APP_URL` pinned to one `workers.dev` host) and `[[previews.r2_buckets]] FILES -> guardr-files-preview`. `worker/index.ts` L37-44 re-fetches `/index.html` when `ASSETS` gives 404 for navigation. Anything under `public/` is served as-is (Vite copies it to `dist/`); `public/.assetsignore` (`*.apk`) keeps the 104 MiB LFS APK out. `public/download/apk-qr.png` has no reference in `src/` or `public/` html (orphan).

---

### 6. Duplicated / legacy / dead

| Item | Evidence | Impact |
|---|---|---|
| Three landing components -> one | `DesktopLandingPage`, `TabletLandingPage`, `MobileLandingPage` each just render `MobilityStyleLandingPage formFactor=...` | docs claim three distinct pages; any redesign is one file set |
| `landing/shared/LandingSections.tsx` + `landingData.ts` | no importer; imports `PublicLandingHeader`/`PublicPageChrome` | ~whole old landing is dead, including the Founder/Director **homepage message** block |
| `baseui/layout/PublicLandingHeader.tsx`, `PublicPageChrome.tsx` | only imported by the dead `LandingSections` | dead |
| `components/baseui/GuardrSkeleton.tsx` | no importer | dead |
| Landing `ownerMessage` / `directorMessage` | `HomePage` props still accept them; `MobilityStyleLandingPage` ignores them; only dead `LeadershipMessages` rendered them | Founder "Settings -> Founder message" (guide L1005) has **no visible effect** |
| Theme toggle | exists in `AuthPage`, `AppHomeScreen`, `AccountMenu`; not on landing, not on `AuthRoleChoicePage` (prop renamed `_onChangeTheme`), not on legal, not in Settings | inconsistent theme control |
| `AuthPage presentation="sheet"` + `auth-mobile-sheet.css` (486 lines) | both call sites pass `"page"` | sheet branch dead |
| `AppInstallBanner` + `InstallPrompt` + landing `LandingAppDownloads` + `/download/` page | four install messages, different copy | consolidate |
| Stakeholder documents | static `/stakeholder/` page and React `StakeholderDocumentDownloads` list the same PDFs | two sources of truth |
| `public/version.json` vs `public/download/version.json` vs `bundledDownloadManifest.ts` | three copies, the two JSON files differ | stale-version risk |
| `service-worker.js` vs `sw.js` | wrapper vs implementation | fine but confusing; push registers wrapper, PWA auto-update registers? (`pwaAutoUpdate` uses `/sw.js`; verify both registrations do not race) |
| `marketing/promo-banner.html` | meta-refresh to business card | dead |
| `pwaUpdateToast.ts` `require` | see ST-25 | dead |
| `pending_approval` sign-in status | see ST-14 | dead |
| `/api/auth/logout` | returns `{ok:true}` only | no server-side session revocation |
| Per-role PWA manifests | `/manifests/*.webmanifest` referenced by `sw.js` / `pwaManifests.ts`, absent in `public/` | SPA fallback serves HTML as manifest |

---

### 7. Documentation claims contradicted by code

| Claim (doc) | Reality |
|---|---|
| `docs/SURFACES.md` L277: `DesktopLandingPage` is an "operations-centre site (ink nav, workspace preview, command-palette strip). Mobile and tablet keep the mobility homepage." | Desktop renders the same mobility homepage; only a one-line Ctrl+K aside remains |
| `docs/CROSS_PLATFORM.md` L125-138 (three distinct landings + `LandingSections.tsx`) | one component; `LandingSections` dead |
| `guardr-general-guide.md` L67: "**Download** / **Manuals** in nav and footer" | no Download link anywhere on the landing; Manuals present on desktop nav/footer, drawer, tablet footer only |
| guide L86, L1005, L1100: Founder controls "homepage messages" (Settings -> Founder message) | message is never rendered on the live landing |
| guide L21-24 sign-up paths list only Personal/Business | UI has third kind, Security company |
| guide L67 "install at /download" | `/download/` says "Android apps are private"; APK link not servable (ST-21) |
| Legal pages show a version and "accept and continue" implies re-acceptance on updates | `hasAcceptedLegalDocument` matches `userId:docId:` prefix with any version; bumping `CURRENT_LEGAL_VERSIONS` never re-prompts |
| UI `AuthPage` "pending_approval" message "awaiting Director approval" | never returned |
| `lib/sentry.ts` header "Sentry error monitoring scaffold" | scaffold only: no caller |
| guide L1153: "Open this guide: Homepage **Guide** ... or account menu -> **Guide**" | landing label is **Help**; `accountMenuExtras` (`App.tsx` L10804) carries only download, theme and notification props, so the Guide link depends on each role shell passing its own `links` (not verified per role) |

---

### 8. PR1084 coverage (`git diff --name-only 07074aab 03bd8b49`: 31 files, +2,297 / -331)

| File | Lines | Shared/public page it affects | Covered? |
|---|---|---|---|
| `landing/mobility/MobilityLandingChrome.tsx` | +308/-204 | P-04, P-05, P-12 | Yes |
| `landing/mobility/MobilityExploreGrid.tsx` | +34/-20 | P-07, P-08 | Yes |
| `landing/mobility/MobilityLandingVisuals.tsx`, `MobilityStyleLandingPage.tsx` | +14/-8 each | P-05, P-06, P-11 | Yes |
| `styles/gr-landing.css` | +208/-5 | P-01..P-13 | Yes |
| `legal/LegalPage.tsx` | +46/-6 | P-16..P-21 | Yes (plus `visual-refresh.css` legal rules) |
| `docs/AppGuidePage.tsx` | +4/-4 | P-15 | Only panel order |
| `OfflineBanner.tsx` | +11 | ST-09 | Yes |
| `styles/visual-refresh.css` (new, imported last in `main.tsx`) | +854 | global overrides: offline banner offset, booking-row input fill, guide layout, auth role-choice tablet fill, billing metrics, legal | Yes, cross-cutting |
| `public/.assetsignore`, `wrangler.toml` | +3, +10 | ST-21 / preview config | infra |
| `src/dev/*` (7 files) | +~570 | P-72 | dev only |
| Message / map / invoice files (`ClientInvoiceScreen`, `ClientMessagesPanel`, `GuardMessagesPanel`, `StaffMessagesPanel`, `MessagesHubLayout`, `StaffSupportPanel`, `Map*`, `GuardDashboard`) | role-owned | P-46, P-65, P-71 partly | role docs |

**Not touched by PR1084 (still pre-refresh):** every row P-14, P-22 (legal gate), P-23..P-34 except CSS (sign-in/up/chooser/forms), P-31, P-35..P-45, P-47..P-52, P-53..P-61 (all static HTML), P-62..P-70 (account portal shell/home/documents/downloads), P-73, ST-01..ST-08, ST-10..ST-13 (primitives), `index.html`, `manifest.json`, `sw.js`, `offline.html`.

---

### 9. Test gaps

| Area | Current | Gap |
|---|---|---|
| `npm test` | explicit allow-list in `package.json` (`lib/push/*.test.ts` glob + named files; 145 of 182 test files listed) | 39 test files never run in `npm test` (UT* in this file) |
| E2E | `e2e/public.spec.ts` (16 tests), `surfaces.spec.ts` (10), `installed-app-auth.spec.ts` (5); Playwright, unauthenticated only: landing per surface, auth chooser and forms, legal terms/EEO, signed-out `/account` and `/client/home` redirect to sign-in, installed welcome | none of: sign-up submit, sign-in success, role-mismatch redirect, signed-in `/account/*`, pending screens, legal gate, settings, notifications, support, download screen, offline banner, 404 behaviour, `/guide`, `/messenger` deep link, static HTML pages |
| Unit | `appNavigation`, `productApps`, `legalAcceptance`, `oneRolePolicy`, `passwordHash`, `accountSessionAuth`, `pwaManifests`, `userFacingError`, `tutorialSession` tests are in `npm test`; `authPath`, `installSurfaceCopy`, `notificationRouting` tests exist but are NOT in the allow-list (39 of 182 test files are unlisted); no `authService`, `onboardingTours`, `accountStatus` test file exists | no test asserts the version-bump re-acceptance (it would fail), no test for `pending_approval`, `session expiry`, `x-guardr-session` forgery on `/api/data/query` |
| Static pages | none | `public/download/*.html`, `offline.html`, `stakeholder/`, `marketing/` have no link/lint test; broken `/manuals/...Combined.pdf` and `/download/guardr.apk` would not be caught |
| Dev harness | covers 5 screens | no landing/auth/legal/guide/account-portal/state matrix; nothing for visual regression |
| Surfaces | `*SurfaceIndependence.test.ts` (3 CSS-selector tests, UT*) | assert CSS isolation only |

---

### 10. Top surprises

1. **Identity trust is client-asserted**: `/api/data/query` accepts an unsigned `x-guardr-session` JSON header (checked only against the DB), `/api/auth/signup` has no caller auth and sets `password_hash` for any existing profile id, and sign-in falls back to client-side comparison where legacy rows with no password accept any 4+ char password. Anyone who knows an email/id can take over an account.
2. **No safety nets**: no forgot-password, no email/phone verification, no error boundary (Sentry `captureError` never called), no 404 page (Worker serves the SPA with 200 for everything), no session-expired screen.
3. **Landing is one component in three costumes**, the old `LandingSections.tsx` is dead, and the Founder/Director **homepage messages** the guide documents no longer render anywhere.
4. **The APK path is broken on the website**: `.assetsignore` strips `*.apk`, `version.json apkUrl` still points at `/download/guardr.apk?v=235`, the Worker answers with HTML, and `/download/` is just an "Android apps are private" explainer. Likewise the per-role `/manifests/*.webmanifest` files that `pwaManifests.ts` and `sw.js` reference exist nowhere (not in `public/`, not generated by any script).
5. **Legal re-acceptance and update UX silently fail**: bumping a legal version never re-prompts (acceptance check ignores version) and the PWA "Updating Guardr..." toast uses `require` in an ES bundle so it never shows while the page reloads itself.

Also worth knowing: installed-app Guide button navigates away from the sign-in form (`openPublicGuide` closes auth view but the guide only renders outside `isAppExperience()`), the Settings screen has no theme, password or sign-out, the staff sign-up success message renders in the error slot, and `?ui-preview=1` is dev-only (not a production risk).

---

### 11. Counts

| Group | Count |
|---|---|
| Pages / screens / views (P-01..P-74, incl. 3 MISSING rows P-32, P-33, P-34 and 2 reference-only rows P-30, P-64) | 74 |
| of which static HTML/files (P-53..P-61) | 9 |
| of which website-account views (P-62..P-70) | 9 |
| of which legal documents (P-16..P-21) | 6 |
| States (ST-01..ST-35, incl. MISSING ST-06, ST-07, ST-18 and DEAD ST-05, ST-14) | 35 |
| Total shared + public items | 109 |


## Part E. Foundation inventories

Everything below is code-derived. Where a doc disagrees with code, the code won and the disagreement is in E8.

### E1. Surface and routing foundation

| Item | Where | Facts |
|---|---|---|
| Surface resolution | `src/surfaces/surfaceKind.ts`, `src/lib/platform/device.ts` | Bounds: mobile <744, tablet 744-1179, desktop >=1180. Override `?ui=mobile|tablet|desktop` or `localStorage.guardr_surface_override`. Installed shells (standalone PWA / Capacitor) are capped at tablet. |
| Design scales | `src/surfaces/surfaceDesign.ts` (+ test) | Min touch target 48 / 44 / 32 px, body 16 / 15 / 14 px, row height 68 / 60 / 40 px. |
| Shell layer | `SurfaceAppShell.tsx` lazy-loads `mobile/MobileAppShell`, `tablet/TabletAppShell`, `desktop/DesktopAppShell`; each has a `kit/` folder. `SurfacePage.tsx`, `SurfaceProvider.tsx`. | Staff goes `StaffOpsLayout` -> `DesktopStaffAdminShell` -> `SurfaceAppShell`. Guard/client go `RoleAppShell` -> `SurfaceAppShell`. |
| Nav config | `src/surfaces/surfaceNavigation.ts`, `src/lib/staffNavGroups.ts`, `src/lib/staffNavAccess.ts`, `src/lib/clientCapabilities.ts` (`getClientNavItems`), guard nav in `GuardDashboard.tsx`, `src/lib/guardActivation.ts` | Mobile bottom nav: 5 tabs + More sheet (guard, client). Staff: drawer. See Parts A-C. |
| URL grammar | `src/lib/appNavigation.ts` (`parseAppRoute`, `buildAppPath`) | Root paths `/guard /client /staff /account /guide /legal /privacy /terms /download /install`, plus `?auth=` / `ar=` for sign in/up; nested params listed in the role parts. |
| Surface independence tests | `src/styles/{mobile,tablet,desktop}SurfaceIndependence.test.ts`, `surfaceLookIndependence.test.ts` (all in `npm test`) | They assert CSS isolation per surface AND hard-code token values (e.g. `--look-canvas` `#ffffff/#f0f0f0/#e8e8e8`, card radius `18/16/6px`). **A token change in `surface-look.css` will fail these tests; the tests must be changed in the same commit.** |

### E2. Design tokens, CSS layers, themes, typography

**CSS import order (`src/main.tsx` L25-55, last wins):** `index.css` (24,086 lines: Tailwind `@theme` + legacy rules, 93 `@media`) -> `gr-typography` -> `guardr-design-tokens` -> `surface-foundation` -> `surface-mobile` -> `surface-tablet` -> `surface-desktop` -> `desktop-command` -> `gr-tokens` -> `gr-surfaces` -> `gr-mobility` -> `gr-direct-desktop` -> `gr-landing` -> `auth-role-choice` -> `gr-global` -> `gr-workbench` -> `auth-mobile-sheet` -> `staff-credential-review` -> `staff-management-flat` -> `gr-mobile-overview` -> `platform-optimizations` -> `gr-in-app` -> `gr-data` -> `gr-forms` -> `gr-text-case` -> `legal-accept` -> `surface-look` -> `product-apps` -> **`visual-refresh`** (PR1084, last). 33 files in `src/styles/` = 27,276 lines, plus `app-native.css app-pwa.css desktop-app.css desktop-auth.css desktop-workspace.css tablet-app.css`, which are `@import`ed from the top of `index.css` (not from `main.tsx`).

| Layer | File(s) | Role / defects |
|---|---|---|
| Spacing, type scale 11-56, radius, shadow tokens | `guardr-design-tokens.css` (205 lines) | The only genuine token sheet; 4px grid. |
| Brand/colour tokens | `gr-tokens.css` (158; `--uber-*` black/white/greys + `--brand-*` bridge), `surface-foundation.css` (177; brand only) | `--uber-*` naming is a leftover from the Uber-style direction; monochrome only. |
| Per-surface "look" (canvas, card radius/border, input radius) | `surface-look.css` (965) | Test-locked values (E1). |
| Per-surface layout | `surface-mobile.css` 3,146 · `surface-tablet.css` 1,032 · `surface-desktop.css` 1,811 · `tablet-app.css` 2,385 · `desktop-command.css` 1,354 · `gr-direct-desktop.css` 1,213 | Selector prefixes `sfm-`, `sft-`, `sfd-`, plus `gr-`, `adm-` (staff), `app-`. |
| In-app screens | `gr-in-app.css` 2,216 · `gr-mobile-overview.css` 1,873 · `gr-workbench.css` · `gr-data.css` · `gr-forms.css` · `product-apps.css` | Where most page-level styling lives. Mixed with 24k lines of `index.css`. |
| Landing | `gr-landing.css` (648; +213 in PR1084), `gr-mobility.css` | Landing + public header. |
| **PR1084 layer** | `visual-refresh.css` (854 lines, 71 `data-surface` selectors) | Offline-banner offsets, overflow/sizing hygiene, per-surface type and control sizes, legal documents (phone sheet / tablet paper / desktop rail), signed-in maps (phone sheet / tablet rail / desktop inspector). It is a **patch layer** loaded last, not a token system. |
| Tailwind | `@theme` in `index.css` (Tailwind 4, `@tailwindcss/vite`) | Utility classes appear in many components next to the `sf*-` classes. |
| Base Web theme | `src/theme/guardrBaseTheme.ts` (light/dark), `guardrAccentPalette.ts` (monochrome ramps), `typography.ts`, `motionTokens.ts`; `src/components/baseui/*` wrappers; `baseui` + `styletron` packages | Base Web components are used for inputs, modals, tabs, toasts via `src/components/baseui`. |
| Themes | `src/lib/platform/theme.ts`, `themeBranding.ts` | Only `light` and `dark` exist (legacy `grey` is migrated to light). Defaults: light on the website, dark for native Guard/Customer, light for native Staff. Per-surface `data-surface` / `data-theme` attributes on `body`. |
| Typography | `gr-typography.css`, `src/theme/typography.ts`, fonts `public/fonts/*.woff2` | Family name "Guardr Sans" = self-hosted Inter variable. `FONT_TEXT` stacks list proprietary "Uber Move / Uber Move Text" first (not shipped, silently falls back). `@fontsource-variable/inter` is a dependency but is **not imported anywhere**; `index.html` still preconnects to Google Fonts. `assets/marketing/fonts/Inter-*.woff2` are for generated marketing posts. |
| Icons in UI | `lucide-react` (274 files import it) + inline SVG | One icon family; no custom icon system. |
| Images | `public/marketing/{business-card,promo-banner}.html`, `public/screenshots/{narrow,wide}.png` (not referenced by the manifest), `assets/marketing/posts/*` (Instagram/landscape source art); there is no `src/assets` | Landing visuals in `MobilityLandingVisuals.tsx` are code-drawn. |
| Stale design docs | `docs/guardedesign.md` (claims a sage-green accent `#4A6B4E/#7AAE7F`), `docs/design-patterns.md` (stock Base Web), `docs/SURFACES.md` (accurate on surfaces) | Code is monochrome black/white/grey. Do not design from `guardedesign.md`. |

### E3. Website icon and branding assets (current state)

Everything the website icon/branding work needs to know, and what it must **not** touch.

**Browser/PWA surface (web icon work lives here)**

| Asset | Path | Spec | Referenced from |
|---|---|---|---|
| Favicon (SVG) | `public/favicon.svg`, `public/logo.svg`, root `/logo.svg` (identical) | Black Guardr mark on transparent; CSS `prefers-color-scheme:dark` inverts it to white. Still **a base64 PNG wrapped in an SVG** (raster, not true vector). Added by PR #1085 (merged after #1084). | `index.html` `rel=icon type=image/svg+xml href=/favicon.svg` |
| Favicon (PNG/ICO) | `public/favicon.ico` (PNG-in-ICO, 16/32/48), `public/favicon-16x16.png`, `public/favicon-32x32.png` (black field, white shield), plus `public/icons/favicon-{dark,light,grey}.png` (64px) | #1085. `index.html` links ico, svg, 16, 32 and the 64px `-dark`; `themeBranding.ts` still swaps the 64px by mode at runtime | `index.html`, `src/lib/platform/themeBranding.ts` |
| Apple touch icon | `public/apple-touch-icon.png` (180) and `public/icons/apple-touch-icon-{dark,light,grey}.png` | `index.html` now has a static `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` (#1085); `themeBranding.ts` additionally swaps in the themed variant at runtime | `index.html`, `themeBranding.ts` |
| Manifest | `public/manifest.json` | `id https://guardr.co/`, `display standalone`, `orientation portrait-primary`, `background_color/theme_color #000000`; icons `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png`; no `screenshots`, no `shortcuts` | `index.html` L15 |
| Manifest icon files | `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | generated | manifest |
| Theme-color | `index.html` L6-8 | Three `<meta name=theme-color>`; all `#000000` (light and dark identical). Runtime values in `themeBranding.ts`: staff light `#6B6B6B`, guard light `#FFFFFF`. | `index.html`, `themeBranding.ts` |
| Logos | `public/logo.png`, `logo-{64,128,256}.png`, `logo.jpg` (512 JPEG, black field, used as `og:image` and Twitter card), `logo-wordmark{,-128,-256}.png`, `badge-72.png` | generated | landing/header/OG |
| Role icons | `public/icons/{client,guard,staff,messenger}-{192,512,maskable-512}.png`, theme sets `icon-{dark,light,grey}-{192,512}.png`, `maskable-{...}-512.png` | generated; "grey" is a removed theme | **Role manifests `/manifests/*.webmanifest` are referenced by `pwaManifests.ts` and `sw.js` but do not exist**; `pwaManifestIdFromLocation` always returns `website` |
| Service workers | `public/sw.js` (cache `guardr-cache-v1-0-135-brand-black-icon-1`; the suffix is `CACHE_ASSET_REV` in `scripts/generate-download-version.mjs`, bump it whenever precached brand assets change because icons are cache-first), `public/service-worker.js` (`importScripts('/sw.js?v=235')`, registered by `lib/push.ts`), `public/offline.html` | two files, one importing the other | PWA |
| `og:image` | `https://guardr.co/logo.jpg` | 512x512, now white shield on black (#1085); no 1200x630 social card | `index.html` |
| Masters | `assets/logos/icon-source.png`, `assets/logos/wordmark-source.png` | **Shared masters for web AND native icons** | generators |

**How the files are produced (critical):** `npm run build` runs `prebuild` -> `generate:logos` -> `scripts/generate-logo-assets.mjs`, which **rewrites every PNG/SVG/ICO in the table above** (`public/logo*.png`, `public/icons/*`, `public/icon-*.png`, `public/apple-touch-icon.png`, `public/logo.jpg`, `public/logo.svg`, `public/favicon.svg`, `public/favicon.ico`, `public/favicon-{16x16,32x32}.png`, root `logo.svg`, `badge-72.png`) from `assets/logos/*-source.png` via `sharp` on every build. **Hand-edited icons in `public/` will be overwritten.** Icon work must change the generator or its inputs.

**Native app icons (do NOT touch from the web icon workstream)**

| Asset | Path | Notes |
|---|---|---|
| Launcher icons | `android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher{,_round,_foreground}.png`, `mipmap-anydpi-v26/ic_launcher{,_round}.xml` (adaptive) | generated by `scripts/generate-android-icons.mjs` (`npm run generate:android-icons`, **not** part of prebuild) |
| Adaptive background | `values/colors.xml` `ic_launcher_background` (staff `#6B6B6B`, guard `#FFFFFF`, else `#000000`) selected by `-PguardrProductApp`; `drawable/ic_launcher_background.xml` (legacy teal `#26A69A` grid vector, overridden) | per-role |
| Splash | `drawable/splash.png`, `drawable-{port,land}-*/splash.png`; `capacitor.config.ts` `SplashScreen backgroundColor #000000`, `launchAutoHide false` | |
| Play Store | `scripts/generate-play-store-assets.mjs` -> `assets/play-store/*` | |
| Role chrome | `scripts/branded-icon.mjs` (+ `.test.mjs`): `guard` white bg/black mark, `client` black/white, `staff` `#6B6B6B`/white, `messenger` black/black-mark; no text on any icon | **Imported by `generate-logo-assets.mjs`, `generate-android-icons.mjs`, `generate-play-store-assets.mjs`, `android-role-build.mjs`.** Editing it changes native output. |
| App identity | `capacitor.config.ts`: `appId com.tmbcworks.guardr`, `appName Guardr`; role ids `com.tmbcworks.guardr.{client,guard,staff,messenger}`; flavors `sideload`/`play` | |

**Already done by #1085 (merged after #1084):** the website icon set is now black field + white shield (rasters) and a black-mark SVG that flips to white in dark colour scheme; static favicon.ico and apple-touch links; SW cache bumped; `scripts/web-branding.test.mjs` (in `npm test`) asserts the SVG mark is pure black and the website rasters contain no brand colour, so **any palette change in Phase 8 must update that test**. **Still open for Phase 8:** a true vector mark (the SVG is a wrapped PNG), 1200x630 social card, `theme-color` still `#000000` x3, manifest `screenshots`/`shortcuts`, the missing role manifests, maskable safe-zone check, retire the `grey` set.

**Independence rule for the icon workstream:** leave `android/**`, `assets/play-store/**`, `scripts/generate-android-icons.mjs`, `scripts/generate-play-store-assets.mjs`, `scripts/android-role-build.mjs`, `scripts/branded-icon.mjs`, `assets/logos/icon-source.png` and `assets/logos/wordmark-source.png` unchanged. Add a separate web master (e.g. `assets/logos/web-icon-source.svg`) and a separate generator or flag in `generate-logo-assets.mjs` that stops importing `branded-icon.mjs` for web outputs. The one coupling is that `generate-logo-assets.mjs` also writes `public/icons/{client,guard,staff,messenger}-*.png`; those role icons are consumed only by the non-existent role manifests, so they can be retired without touching native.

### E4. PWA and install

| Item | Facts |
|---|---|
| Install surfaces | `/download`, `/install` (SPA pages, see D `P-47..P-52`), static `public/download/index.html`, `register.html`, `version.json`, `apk-qr.png`. |
| APK delivery | `public/guardr.apk` is a Git-LFS pointer and `public/.assetsignore` excludes `*.apk` from the Worker upload (25 MiB asset limit). `public/download/version.json` still sets `apkUrl` to the relative `/download/guardr.apk?v=235`, which the Worker answers with the SPA HTML (HTTP 200); the `*DirectUrl` / `apkApps` entries point at GitHub release assets and are the working path. Verify which URL each install page uses before redesigning the download flow. |
| Offline | `public/offline.html` (static, own CSS), `sw.js` precache list, `OfflineBanner.tsx` (PR1084 redesigned). |
| Push | `public/service-worker.js`, `src/lib/push*.ts`, Worker `push/*`; native uses `@capacitor/push-notifications`. |
| Manuals | `public/manuals/*.pdf` (5 PDFs, linked from staff/guard/client docs), sources in `docs/user-manuals`. |

### E5. Native app (Capacitor) and desktop packaging

| Item | Facts |
|---|---|
| Android | Capacitor 7.2, `webDir dist`, `server.url = VITE_APP_URL || https://guardr.themarkkbrandoncollective-2d9.workers.dev` (a **workers.dev** URL while production is `guardr.co`; `wrangler.toml` `APP_URL` is `https://www.guardr.co`). Plugins: app, camera, device, geolocation, push-notifications, splash-screen, status-bar. minSdk 23, target 35. Version 1.0.135 (code 235), messenger 1.1.2 (233). Deep links: `guardr`, `guardr-client`, `guardr-guard`, `guardr-staff` schemes and `https://guardr.co|www.guardr.co` for `/client /guard /staff /account /app`. **`screenOrientation=portrait` is forced** in `AndroidManifest.xml`. |
| "Dedicated mobile app" reality | The app is the website bundle inside a WebView; there is no native screen to redesign. Phase 6 = installed-shell behaviour (safe areas, status bar, splash, orientation, deep links, push, install prompts), not new screens. |
| iOS | `@capacitor/ios` is a dependency but there is **no `ios/` project**. No iOS app exists. |
| **Desktop-native** | **None.** No Electron, Tauri or Capacitor-Electron in `package.json`, scripts, workflows or docs. `docs/CROSS_PLATFORM.md` and `surfaceKind.ts` state an installed shell never resolves to desktop. "Dedicated desktop app" (Phase 7) therefore requires a product decision first: installable desktop PWA (cheapest, needs the missing manifest work), or a new Tauri/Electron wrapper (new project, signing, update channel). |
| Native release workflows | `.github/workflows/android-apk.yml` (APK build; the Android job failed on PR1084 for reasons unrelated to the docs) and `cf-android-release.yml` (triggers on the stale branch `cloudflare-neon-migration`). |

### E6. Testing, CI and tooling

| Item | Facts |
|---|---|
| Unit tests | 183 test files tracked; `npm test` is a hand-written allow-list naming 146 files plus the `lib/push/*.test.ts` glob; 39 existing files never run; 6 entries point at files that do not exist (5 removed crew-feature tests and `uberBaseTheme.test.ts`). Runner: `node --import tsx --test`. No component/DOM tests. |
| E2E | `e2e/public.spec.ts`, `e2e/surfaces.spec.ts`, `e2e/installed-app-auth.spec.ts`. Chromium only (`playwright.config.ts`), all **unauthenticated** (no signed-in guard/client/staff coverage). `webServer` = `npm run build && npm run preview` (wrangler dev) on 4173. Still passes obsolete `VITE_SUPABASE_*` env. |
| CI | `.github/workflows/ci.yml` and `guardr-ci.yml` duplicate each other (lint = `tsc --noEmit`, test, build, e2e). Cloudflare Workers Builds preview on PRs. |
| Screenshot/QA scripts | `scripts/viewport-audit.mjs`, `capture-ui.mjs`, `ui-shots.mjs`, `ui-tier-shots.mjs`, `mobile-shots.mjs`, `tablet-shots.mjs`, `audit-layout.mjs`, fixtures `mobile-fixtures.mjs`, `tablet-qa-fixtures.mjs`. **`mobile-shots` / `tablet-shots` intercept `**/rest/v1/**` and `**/auth/v1/**` (Supabase URLs); the app now talks to `/api/data/query` and `/api/auth/*`, so the fixtures are stale and signed-in shots need rewriting.** `viewport-audit` references `supabase/investor_demo_accounts.sql` and demo accounts that no longer exist after the 2026-11-09 data wipe. |
| Dev harness | `/?ui-preview=1` (dev server only; `main.tsx`), `src/dev/SurfacePreview.tsx` + `src/dev/surfaces/*`: Mobile/Tablet Shifts, Desktop Operations, Staff Profile, Job, Payments, Map, Messages, Invoice (PR1084 added Invoice and extended the others). Fixture-driven, no network. This is the best base for deterministic visual QA. |

### E7. Infrastructure (verified live, read-only)

| Item | Verified value |
|---|---|
| Cloudflare Worker | `guardr` (account `92d9592953c4d46474ae07993913f710`, shared with unrelated projects), custom domains `guardr.co` and `www.guardr.co` (production), workers.dev subdomain with previews enabled, last modified 2026-11-09 21:15Z |
| R2 | `guardr-files` (prod), `guardr-files-preview` |
| Cron | `*/5 * * * *` (missed check-ins, pre-shift briefings), `0 14 * * *` (company placard expiry) |
| Neon | project "Guardr" (`gentle-firefly-57124649`), Postgres 18, aws-us-west-2; branches `production` (default) and `backup-pre-wipe-2026-11-09`; 44 public tables; data was wiped 2026-11-09 ~20:54Z, so demo accounts must be re-seeded for authenticated QA |
| Worker routing | `worker/index.ts`: `/api/*` -> Hono app (`worker/app.ts`: health, install/register, messages, admin/apply-schema, stripe, square, push, cron; `routes/{auth,data,files,sync}`), everything else -> static assets then SPA fallback to `/index.html` (so unknown URLs return HTTP 200 with the app) |
| Obsolete | Supabase (`docs/legacy`, `src/lib/supabase.ts` name only, `VITE_SUPABASE_*` in CI/Playwright); `README.md` says the live app is the workers.dev URL |

### E8. Documentation contradicted by code (aggregate)

| Doc | Claim | Code reality |
|---|---|---|
| `README.md` | Live app is the workers.dev URL | Production is `guardr.co` (workers.dev is previews and the APK `server.url`) |
| `docs/guardedesign.md` | Sage-green accent `#4A6B4E` / `#7AAE7F` | Monochrome black/white/grey |
| `docs/design-patterns.md` | Stock Base Web patterns | Custom `sf*-` surface kits + Tailwind |
| `docs/CROSS_PLATFORM.md` L162 | `GuardCrewHubPanel` migrated | Component does not exist; crews removed |
| `docs/CLOUDFLARE-NEON-MIGRATION.md` | API URL workers.dev | `guardr.co` |
| Surface docs/code | "Staff bottom tabs on mobile" | Staff mobile is a hamburger drawer |
| Role parts A-D | Further per-role contradictions | See each part's "Doc contradictions" section |
