# Guardr Staff Control Center: Architecture Plan

**Prepared:** Fri Sep 25, 2026, about 4:30 PM PT · **For:** Markeith White (Founder) · **Type:** planning only. No code, PRs, issues, pushes, or messages.
**Code read:** `TheMarkkBradonCollective/Guardr` `main` @ **`c243968`** ("Merge pull request #1032 … staff-list-names", committed **Sep 16, 2026, 1:30 PM PT**). I read the local copy at `/workspace/Guardr`. `/workspace/guardr-full` is at the same commit. `git fetch` failed on this box because it has no GitHub credentials. I checked GitHub read-only and `main` is still `c243968`, so the local copy is current.
**Built on:** `GAP-ANALYSIS.md` (sections A2, A3, and 4.3), `PAGE-INVENTORY.md`, `DEFECTS.md`, and `FIX-PLAN.md`, all in this folder.
**Live testing:** none. `https://www.guardr.co` returns Vercel `402 DEPLOYMENT_DISABLED`. Everything below comes from reading the code and the SQL files.

Labels: **[verified]** = I read it in the code. **[unverified]** = I inferred it or couldn't check it (for example, live database policies or the Vercel plan). **new** = doesn't exist yet.

---

## Plain-English summary

- **The good news:** Guardr already has most of a Staff Control Center. Staff sign in on the **website** and get a full `/staff/...` workspace with about 34 sections: Guards, Customers, Staff team, Jobs, Applications, Credentials, Payments, Audit log, Permissions, Cities, and more. It has a desktop layout with a data table, command palette, and drag-and-drop board already built. There's a permission catalog, a role-permission editor, an `audit_log` table, live updates (Supabase Realtime), and push notifications. We extend this. We don't rebuild it.
- **The real problem is underneath.** Every business action (assign a guard, suspend a customer, release a payout) runs **inside the user's browser**. It writes straight to the database with a public key, and permissions are checked only in the browser. The same browser code runs in the Guard and Customer apps, which are the same web bundle wrapped by Capacitor. So today there's no server "source of truth" to hang real permissions or a trustworthy audit log on.
- **The plan in one line:** first finish **FIX-PLAN Wave 1** (real server login plus locked database rules). Then move business actions into **one shared server layer** (`lib/services/*`, exposed through one `api/hq/...` router). The website Control Center and the apps both call that layer. It checks granular permissions and writes the audit log itself. Apps keep getting updates through the realtime feed and push notifications they already use.
- **What staff get:** record pages (customer, guard, staff member, job) with context-aware action buttons that only appear if you're allowed to use them. Real "Assign guard / Change status / Suspend / Message" actions. An audit viewer with before and after values. A built-in spreadsheet area that works two ways: live views over real tables, where edits go through the same server rules, and imported CSV/Excel "datasets" with version history.
- **The app side stays as it is.** No app screens are removed or redesigned. The one recommended app change is invisible to users: behind the scenes, a few app handlers (for example, a customer approving a guard) call the same server function staff use, so "assign guard" exists once.
- **Order of work:** Wave 1 (security) → HQ-1 server foundation and audit → HQ-2 permissions (RBAC) → HQ-3 the jobs/assignment service → record pages and sections → data sheets. There are 16 PR-sized phases, listed in section 7.

---

## 1. Current-state inventory (grounded in files)

### 1.1 Shape of the codebase [verified]
- **One React 19 + Vite single-page app** (`src/`, `index.html`, `vite.config.ts`). It serves the public website, the `/account` area, the Guard app, the Customer app, and the Staff app. `src/App.tsx` is **14,837 lines**. It holds all state and about 170 `handle*` action handlers, and it passes them down to `GuardDashboard.tsx`, `ClientDashboard.tsx`, and `StaffDashboard.tsx` (1,459 lines).
- **UI kit:** Tailwind v4 plus Uber Base Web (`baseui`, `styletron-*`), `lucide-react` icons, and Guardr's own `src/surfaces/*` system. There are three independent shells (mobile, tablet, desktop), described in `docs/SURFACES.md`. The staff desktop shell is `src/components/layouts/desktop/DesktopStaffAdminShell.tsx`.
- **Apps:** Capacitor 7 (`capacitor.config.ts`, `webDir: 'dist'`) wraps **the same `dist` bundle** for the Android APK. The PWA is the same bundle too. `src/lib/productApps.ts` defines the "product apps" `website | client | guard | staff`. The comment there says the website covers "full staff ops" and the Staff APK is optional.
- **Server:** Vercel serverless functions in `api/` (33 route files, not counting `_`-prefixed helpers or tests). There's shared server code in root `lib/`, and an Express mirror for local dev (`server.ts` → `server/createApp.ts`, which registers only the Stripe, push, and cron routes). Crons are in `vercel.json` (`missed-checkins` and `pre-shift-briefings` every 5 minutes, `company-placard-expiry` daily). Precedent: `lib/push/*.ts` already imports pure domain modules from `src/lib/*` (for example `lib/push/guardTierResolve.ts` → `src/lib/guardPerformance.ts`), so server code can reuse browser domain rules.
- **Database:** Supabase Postgres. The schema is in `supabase/complete_schema_setup.sql` (2,331 lines), plus 17 migrations in `supabase/migrations/` and a hard-coded URL and public key in `src/lib/supabase.ts`.
- **Tests:** node `--test` unit tests (the long list in `package.json` `test`), plus Playwright e2e in `e2e/`. CI hasn't run since Aug 26 (FIX-PLAN blocker).

### 1.2 Authentication today [verified]
| Piece | Where | What it does |
|---|---|---|
| Sign-in | `src/lib/auth/authService.ts` `signInWithCredentials` | **Runs in the browser.** It looks up the profile in guard, client, and staff lists that the browser has already downloaded (`select('*')`, including `password` / `password_hash`), then checks the password locally (`verifyStoredPassword`). If the profile has `auth_user_id`, it also tries `supabase.auth.signInWithPassword`, giving `authMode: 'supabase'`. Otherwise it falls back to `authMode: 'legacy'`. |
| Weak fallback | `src/lib/accountPasswords.ts` | Accounts with no stored password accept any password of 4+ characters (GAP A2). |
| Session | `src/App.tsx` ~line 762 | `localStorage 'guardr_current_user'` (editable JSON). |
| Partial Supabase Auth | `auth_user_id UUID` on `guards`, `clients`, `staff` (schema lines 1734–1736); SQL helpers `auth_guard_id()`, `auth_client_id()`, `auth_staff_id()`, `is_staff_user()` (~line 2030); `api/auth/bridge.ts` (secret-protected, creates Supabase Auth users for legacy accounts) | The groundwork for real auth exists but isn't used everywhere. |
| "Server session" check | `lib/accountSessionAuth.ts` `verifyAccountSession` + `lib/apiRequestSession.ts` `parseSessionCredentials` | APIs trust a **caller-supplied `{userId, email, role}`** and only confirm those match a database row. **This isn't proof of identity.** Anyone who knows a staff member's ID and email can pass. Used by `api/stripe/payments.ts`, `api/messages/*`, and `api/push/*`. |

### 1.3 Supabase tables relevant to the Control Center [verified from SQL, live DB unverified]
| Area | Tables | Notes |
|---|---|---|
| Users – guards | `guards` (+ `certifications`, `experience`, `education`, `guard_insurance_policies`, `guard_vehicle_profiles`, `guard_vehicle_insurance_policies`) | `user_status` pending/approved/active/suspended/blocked. `password`, `password_hash`, `auth_user_id`. Legacy staff can also live here (`is_staff`, `staff_role`, `migrated_to_staff_at`). |
| Users – customers | `clients` (+ `client_locations`, `client_invoices`) | `account_status`, `approved`, client type personal/business/security company (migrations `20260818010000`, `20260903100000`). Credentials and authorized contacts are stored as JSON on the row. |
| Users – staff | `staff` | `staff_role` Founder/Owner/Director/Manager/Administrator/Moderator/Support, `side_role` Finance, `user_status`, `managed_cities` JSONB, `assigned_manager_ids` JSONB, `auth_user_id`. Plus `staff_time_entries`, `staff_compensation_payouts`. |
| Jobs / requests | `security_requests` | This is the job. `status`, `assigned_guard_id`, `pending_guard_id`, `applicants[]`, `payment_status`, and about 80 extra columns. Timeline and shift data are embedded as JSONB: `activity_log`, `reports`, `check_in_audit`, `check_out_audit` (incidents live here), `shift_audit_violations`, `replacement_request`, and more. |
| Assignments | `security_requests.assigned_guard_id` / `pending_guard_id`; `job_guard_slots` (multi-guard jobs, status open/invited/pending_staff/crew_confirmed/pending_client/approved/declined/expired/withdrawn) | There's no separate assignments table. |
| Schedules | The job's `start_date`/`end_date`; `guard_availability`, `guard_availability_date_overrides` (exist, but the app writes availability to `localStorage`: `src/lib/guardAvailability.ts` ~line 140, GAP B1); `recurring_shift_templates` (unused, GAP B3) | There's no shifts table. |
| Messages | `support_tickets`, `support_messages`, `job_chat_threads`, `job_chat_messages`, `team_chat_threads`, `team_chat_messages`, `staff_messages`, `guard_messages`, `client_messages`, `message_reactions`, `chat_read_receipts`, `user_notifications` | |
| Files | No file table and **no Supabase Storage**. Images are base64 data URLs stored in columns (`certifications.image_url`, `company_public_documents.image_url`, ID photos, avatars; `src/lib/documentPhoto.ts` "persisting as base64"). | |
| Payments | `payments` (pending/paid/held/released/failed/refunded), `guard_payout_invoices`, payment columns on `security_requests`, `platform_settings.fee_config` | |
| Incidents | Embedded in `security_requests.check_out_audit.incidentReports` (read by `src/lib/incidentReports.ts`) | There's no incidents table, so no status or owner. |
| Audit | `audit_log` (id, actor_id, actor_email, actor_role, action, entity_type, entity_id, details JSONB, ip_address, created_at) | See 1.8. |
| Settings / other | `platform_settings` (includes `staff_role_permissions` JSON overrides), `platform_cities`, `job_locations`, `one_role_cases`, `compliance_alerts`, `company_public_documents`, `push_subscriptions` | |

**Database rules today:** the core tables (`guards`, `staff`, `clients`, `security_requests`, `payments`, messages, `platform_settings`, …) get `SELECT/INSERT/UPDATE/DELETE USING (true)` (schema ~lines 1592–1615, and `staff` at ~line 190). Newer tables use `… OR NOT is_authenticated_user()`, which **lets every anonymous caller through**. Since most sessions are "legacy" (no Supabase JWT), that's everyone. `audit_log` insert is `WITH CHECK (is_authenticated_user() OR true)`, which means anyone can insert. It has no update or delete policies, so with RLS on, updates and deletes are blocked.

### 1.4 Existing APIs under `api/` [verified by reading; "auth" = what the handler checks]
| Route | What it does | Auth today |
|---|---|---|
| `api/health.ts`, `api/stripe/health.ts`, `api/payments/health.ts`, `api/integrations/health.ts` | Config and health status (integrations only report whether env keys are set) | none (read-only) |
| `api/auth/bridge.ts` | Creates a Supabase Auth user for a legacy profile and links `auth_user_id` | `AUTH_BRIDGE_SECRET` bearer |
| `api/install/register.ts` | Records the APK/PWA install version in a cookie | none |
| `api/messages/staff.ts`, `guards.ts`, `clients.ts` (+ `chatDeleteAuth.ts`) | GET/POST/DELETE for staff, guard community, and customer group chat, using the service role | weak `{userId,email,role}` check (role logic is **copied inline** in each file) |
| `api/push/subscribe|unsubscribe|test|send|events|vapid-public-key.ts` | Web push and FCM. `events` authorizes by event type (`lib/push/eventAuth.ts`) | weak session check. Built from `api/_push/entries/*` by `scripts/bundle-push-handlers.mjs` |
| `api/cron/missed-checkins|pre-shift-briefings|company-placard-expiry.ts` | Scheduled push reminders | cron |
| `api/stripe/checkout/create-session.ts` | Client checkout. **Amount comes from the browser** (GAP A3). | none found |
| `api/stripe/checkout/overtime-charge|schedule-change-charge|tip-charge.ts` | Extra charges | none found by grep |
| `api/stripe/checkout/cash-deposit.ts` | Stub ("Cash payments removed") | n/a |
| `api/stripe/payment/hold.ts`, `refund.ts` | Hold, and **full refund of any payment intent** | none (A3) |
| `api/stripe/payout/release.ts` | Guard payout. Accepts `force`, a caller-chosen destination, rate, and hours. | none (A3) |
| `api/stripe/payments.ts` | Lists all payments | weak check plus finance role |
| `api/stripe/connect/*` | Guard Stripe Connect onboarding and status | none found |
| `api/stripe/webhook.ts` | Handles `checkout.session.completed`, `payment_intent.succeeded`, `transfer.*` | Stripe signature |
| `api/square/checkout/create-payment.ts` | Square checkout (alternate rail) | none found |

**No API exists for** jobs, assignments, account status, guards/customers/staff CRUD, credentials, settings, cities, or the audit log. All of that runs as direct Supabase writes from `src/App.tsx` (182 `from('…')` calls in `App.tsx` alone).

### 1.5 Staff roles and permission enforcement today [verified]
- **Ladder:** `src/lib/permissions.ts` `STAFF_ROLES_ORDERED` = Support < Moderator < Administrator < Manager < Director < Founder (`Owner` is a legacy synonym for Founder). **Finance** is a side seat (`FINANCE_SIDE_PERMISSIONS`). Platform roles `client` and `guard` also have permission lists.
- **Permission keys:** 56 string keys (for example `moderator.approve_guards`, `admin.manage_payouts`, `director.manage_city_markets`, `owner.platform_governance`). Each ladder role inherits the one below it (`ROLE_PERMISSIONS`). `STAFF_PERMISSION_CATALOG` lists 34 of them as toggles.
- **Editable per role:** the `/staff/permissions` page (`StaffPermissionsPanel.tsx`) saves per-role overrides to `platform_settings.staff_role_permissions`. `App.tsx` calls `setStaffRolePermissionOverrides()` (~lines 878, 9376, 9441). **There are no per-user overrides.**
- **Other rules:** you can only assign or modify roles **strictly below** your own (`getAssignableStaffRoles`, `canModifyStaffMember`). Non-executive staff are **city-scoped** through `staff.managed_cities`, and Managers get exactly one city (`src/lib/staffCityAccess.ts`). Section visibility comes from `src/lib/staffNavAccess.ts`.
- **Enforcement:** **browser only.** About 54 `canX(user)` helpers in `permissions.ts` hide buttons and sections. The database accepts any write (1.3). The only server role checks are the weak ones in 1.4.
- **Product principle to note:** `src/lib/staffPlatformScope.ts` says staff are "Platform trust … — not security operations dispatch" and `staffOverseesShiftOperations()` returns `false`. The owner's request (staff assign guards and manage schedules) partly reverses this. See Open Decision D2.

### 1.6 What the existing Staff app already does, per section [verified; details in `PAGE-INVENTORY.md` "Staff app"]
| Section (route) | Already works (wired in the browser) | Gaps relevant here |
|---|---|---|
| Overview `/staff/overview` | SLA and queue metrics, click-through to sections (`StaffOverviewDesktop.tsx`) | — |
| Applications `/staff/applications?aq=` | Approve, deny, request revision, or revoke guard, customer, and staff applications; one-role holds | Holds don't stick (AUD-008). Nine queues crammed into one page. |
| Credentials `/staff/credentials` | Verify, reject, or request resubmit for guard certs, insurance, and ID; customer credentials | No upload-on-behalf or waive for customers (AUD-009) |
| Jobs `/staff/jobs?j=` | Create a job (can assign a guard at creation), approve or decline a posting, approve or reject a schedule change, edit the listing, cancel | **No assign or reassign on an existing job (B13)**, no expire (A7), no status override, no history view |
| Map `/staff/map` | Live ops map | Map key (A11) |
| Guards `/staff/guards?g=&gtab=` | Profile / certs / inventory / performance / timesheet tabs; edit; activate / deactivate / block / restore; trusted; background-check toggle; reset violations; delete | Delete doesn't cascade (AUD-011). No schedule tab. No activity tab. |
| Customers `/staff/clients?c=` | Approve, restore, suspend, trusted, delete, open job | No activity or messages tab. Delete doesn't cascade. |
| Staff team `/staff/team?t=`, `/staff/management` | Add staff, approve or deny, deactivate / block / restore, change role (below own rank), city access, managers, timesheets | Director can't be assigned except by the Founder (AUD-012, by design) |
| Incidents `/staff/incidents` | List plus "Open job" | No status, owner, or escalation (B5) |
| Messages / Support `/staff/messages`, `/staff/support` | Support inbox: reply, change status, delete resolved; staff team chat | No "create ticket for user" (B18, not wired) |
| Payments `/staff/payments` | Release payout, full refund, export payouts CSV, mark invoice completed | **Unsafe endpoints (A3).** No mark paid or waive (A4). No partial refund. |
| Platform fees, Staff compensation, Agreements | Edit fee schedule, compensation, time entries | — |
| Violations, Disputes | Resolve audit violations. Overtime disputes waive / uphold / adjust. | General dispute buttons move no money (B4) |
| Stats, Analytics | View only | No export (C3) |
| Audit log `/staff/audit-log` | Last 200 rows plus a realtime feed (`StaffAuditLogPanel.tsx`, `useAuditLogRealtime.ts`) | No filters, no before/after, no export |
| Cities, Locations | Open or close markets, city manager, credential links; locations CRUD | Staff cap isn't editable (A13) |
| Permissions, Settings, Integrations | Role permission toggles, job review mode, broadcast, placard, integration toggles | Integrations are status-only |
| Dead code | `StaffReportsPanel`, `StaffBulkActionsBar`, `RolePermissionsGuide`, `StaffJobChatsPanel`, `StaffMessengerPanel` (PAGE-INVENTORY Appendix A) | Can be revived |

### 1.7 How the Guard and Customer apps read and write data [verified]
- **Same code, same data path as staff.** On load, `App.tsx` (~line 2631) fetches whole tables with `select('*')` (`guards`, `staff`, `clients`, `security_requests`, …) using the public key, for **every** role.
- **Writes:** direct Supabase `update` / `insert` / `delete` from handlers in `App.tsx` and a few `src/lib/*Db.ts` helpers (`guardTeamDb.ts`, `platform/offlineSync.ts`). There's optimistic UI plus `beginLocalMutation` (`src/lib/dbMutationGuard.ts`).
- **Realtime:** `src/lib/useSupabaseRealtime.ts` subscribes to about 35 tables (`SYNC_TABLES`). **Any change triggers a debounced full reload.** So a server-side change already reaches open apps within seconds, *as long as the subscription can see the row* (this matters after RLS; see 2.6).
- **Push:** the browser calls `/api/push/events` (`reportPushEvent`) after an action, and `lib/push/delivery.ts` `sendNotificationToUser` fans out to web push and FCM. Server code can call `sendNotificationToUser` directly.
- **Example of the duplication risk:** `assignGuardToJob` (`App.tsx` ~line 10497) already takes `assignmentSource: 'self' | 'client' | 'staff'`. It does eligibility, schedule-conflict, and pay checks, updates `security_requests`, sends two pushes, builds the service agreement, and opens the job chat. **All of it runs in whichever browser clicked.** This is the function to move server-side first.

### 1.8 Existing audit and activity logs [verified]
- `audit_log` table (1.3), written by `src/lib/auditLog.ts` `writeAuditLog()` **from the browser**. It also keeps a local copy in `localStorage 'guardr_audit_log'`. There are 35 action types (`sign_in`, `job_approved`, `guard_activated`, `payout_released`, `settings_updated`, …). About 27 calls in `App.tsx` plus 6 elsewhere, so roughly one in six handlers audit. There are **no before and after values**, and `ip_address` is never filled in.
- There are per-job timelines in `security_requests.activity_log` / `reports` JSONB (shift events), plus `user_notifications` (inbox), plus `staff_time_entries` (staff time tracking from website actions, `src/lib/staffWorkActivity.ts`).
- Weaknesses: anyone can insert fake rows (policy `OR true`), the actor is whatever the browser says, and many actions are unlogged.

### 1.9 File storage [verified]
There are no Supabase Storage buckets, and no `storage.from` anywhere in `src/`, `lib/`, `api/`, or the SQL. Uploads are resized in the browser and stored as base64 in table columns. This bloats every `select('*')` and means files can't have their own permissions or signed URLs.

### 1.10 Table and grid components [verified]
- `src/components/baseui/GuardrDataTable.tsx`: sortable columns, row click, and a card layout on narrow screens. It's used by the staff Guards, Customers, Applications, Credentials, and Disputes lists, and by client and guard desktop pages.
- `src/surfaces/desktop/kit/DesktopDataTable.tsx` (334 lines): sort, **hover row actions**, checkbox multi-select, keyboard navigation, **sticky footer for totals**. Right now it's only used in the dev preview (`src/dev/surfaces/DesktopOperationsScreen.tsx`).
- Also in `src/surfaces/desktop/kit/`: `DesktopCommandPalette`, `DesktopDragBoard` / `DesktopReorderList`, `DesktopPanelGroup` / `DesktopInspector` / `DesktopDialog`, `DesktopToolbar`, `DesktopFilterChips`, `DesktopTabs`.
- CSV: only `src/lib/payoutExport.ts` (hand-rolled). There are **no grid, CSV, or Excel libraries** in `package.json`.

### 1.11 Routing [verified]
- A hand-built router in `src/lib/appNavigation.ts` (`parseNestedRoute`). Paths are `/staff/:section`, and sub-state goes in about 26 query parameters (`g`, `c`, `j`, `t`, `ci`, `gtab`, `aq`, `edit`, `mtab`, …). `vercel.json` rewrites every non-API path to `index.html`.
- Website access: `websiteShellAccess()` in `productApps.ts` gives **staff `'operations'` on the website**. Guards and customers get `'account'` after activation and are sent to the app (`canOpenOperationalRoute`, `App.tsx` ~line 747 and ~line 2315).

### 1.12 Reuse / harden / missing
| Reuse as-is | Needs server-side hardening | Missing |
|---|---|---|
| `/staff/*` website workspace, `DesktopStaffAdminShell`, desktop kit (data table, palette, drag board, panels) | Login and session (Wave 1) | Shared server business-logic layer |
| Permission key catalog plus role ladder, rank rule, city scoping (as the *seed* for RBAC) | Every business write currently done from `App.tsx` | Permission tables, per-user overrides, server enforcement |
| `audit_log` table (extend it) | `audit_log` insert policy; server-side writing only | Before/after capture, immutability trigger, review UI with filters |
| Realtime sync (`useSupabaseRealtime.ts`) and push (`lib/push/*`) | Money endpoints (A3) | Job assign / reassign / status override / expire endpoints |
| Pure domain rules in `src/lib/*` (`guardSchedule.ts`, `guardAssignmentCore.ts`, `jobEditRules.ts`, `platformFees.ts`, `staffCityAccess.ts`, …) | `api/messages/*` duplicated inline auth | Incidents table/workflow, file storage, datasets/spreadsheet, saved views |
| `GuardrDataTable`, `payoutExport.ts` | Full-table `select('*')` including password hashes | Server-paginated list endpoints for large tables |

---

## 2. Target architecture (extends the existing stack)

### 2.1 The flow

```
 Website: Staff Control Center (/staff/* on desktop web, also the Staff PWA/APK)
 Guard app / Customer app (same bundle, Capacitor + PWA)
        │  writes: fetch('/api/hq/...') or '/api/app/...' with Supabase JWT
        │  reads:  Supabase client under RLS (+ server list endpoints for big grids)
        ▼
 api/hq/[...route].ts  and  api/app/[...route].ts   (one Vercel function each)
        │  requireSession(JWT) → loadEffectivePermissions → requirePermission(key, scope)
        ▼
 lib/services/*  ← THE one place business logic lives
   jobs.assignGuard(), jobs.changeStatus(), accounts.suspend(), payments.markPaid() …
        │  uses pure rules from src/lib/* (conflict checks, pay calc, edit rules)
        │  writes DB with service role, in one transaction/RPC where it matters
        │  audit.record(before, after, actor, reason)   ← same call, every time
        │  notify.user() → lib/push/delivery.ts + user_notifications row
        ▼
 Supabase Postgres (RLS locked)  ──realtime──►  every open app/website reloads
```

### 2.2 Where the Control Center lives
- **Reuse `/staff/*` on the website.** Don't create a separate app. It already is the website's staff operations surface (`productApps.ts`), with its own desktop shell and nav groups (`src/lib/staffNavGroups.ts`). Optionally add **`/hq` as an alias** that redirects to `/staff/overview`, for branding. That's one line in `appNavigation.ts` and needs no Vercel change, because the rewrite already catches it.
- **Record pages get path-style routes** so they can be linked and bookmarked: `/staff/clients/:id/(profile|activity|jobs|messages|files|billing)`, `/staff/guards/:id/(profile|schedule|jobs|activity|credentials|performance|timesheet|permissions)`, `/staff/jobs/:id/(overview|assignment|history|messages|payments)`, `/staff/team/:id/...`. **Keep the existing `?c=` / `?g=` / `?j=` links working** by parsing both forms in `parseNestedRoute`.
- New sections: `/staff/accounts`, `/staff/schedules`, `/staff/files`, `/staff/reports` (revives `StaffReportsPanel`), `/staff/data` (sheets). Existing sections keep their slugs (`clients` stays the code slug, "Customers" the label).
- Desktop is the main target (`docs/SURFACES.md`: desktop = staff ops). Tablet and mobile staff surfaces get the same actions through their existing list and detail patterns. The spreadsheet area is **desktop only** (mobile shows a read-only summary with "Open on desktop").

### 2.3 The shared server business-logic layer
- **Location:** root **`lib/services/`**, next to the existing server code (`lib/accountSessionAuth.ts`, `lib/platformFees.ts`, `lib/push/*`). One module per domain: `jobs.ts`, `assignments.ts`, `schedules.ts`, `accounts.ts`, `guards.ts`, `customers.ts`, `staff.ts`, `credentials.ts`, `messages.ts`, `files.ts`, `payments.ts`, `incidents.ts`, `settings.ts`, `datasets.ts`, `audit.ts`, `rbac.ts`, `notify.ts`.
- **Command shape (every mutation):** `service.command(ctx, input)`, where `ctx = { session, permissions, db, requestMeta }`. Each command:
  1. Validates input.
  2. Checks permission and scope (city, rank).
  3. Loads the "before" row.
  4. Applies domain rules. Reuse **pure** functions from `src/lib/*`: `guardScheduleConflictError` (`guardSchedule.ts`), `isAwaitingClientGuardApproval` (`guardAssignmentCore.ts`), `resolveGuardPayForJob`, `jobEditRules.ts`, `platformFees.ts`. The precedent is `lib/push/guardTierResolve.ts`. Each import has to be checked for browser-only dependencies [unverified per module].
  5. Writes. Multi-row changes go through a Postgres function (RPC) so they're atomic.
  6. Writes the audit row.
  7. Notifies (push plus `user_notifications`).
  8. Returns the updated record.
- **Row mappers:** the database-row ⇄ `src/types.ts` mapping currently lives inline in `App.tsx` (for example ~line 3126 for jobs). Extract it to `src/lib/mappers/*.ts` so the browser and the server share one mapping.
- **HTTP entry points (few Vercel functions):** `api/hq/[...route].ts` (staff Control Center) and `api/app/[...route].ts` (guard and customer actions that must share logic). Each is **one catch-all function** with an internal route table. That's because the repo already has 33 function files, and Vercel Hobby caps plain `api/` projects at 12 functions per deployment (Vercel docs, checked today). The 5-minute crons also need Pro. So the project was presumably on Pro before the 402 [unverified]. Catch-all routers keep the function count flat whichever plan is chosen. Mount the same router in `server/createApp.ts` for local dev.
- **Business logic exists once.** For example, "assign guard" is `lib/services/assignments.ts#assignGuard`. Staff call `POST /api/hq/jobs/:id/assign`. The customer's "Approve guard" and a guard's instant pick-up call `POST /api/app/jobs/:id/confirm-guard`, which runs the same function with `source: 'client' | 'self'`. `App.tsx#assignGuardToJob` becomes a thin `fetch` wrapper with the same signature, so **no app UI changes**.
- **Old code paths:** the browser handlers in `App.tsx` stay until their server version ships. Then each handler's body is swapped for an API call in its own PR. No big-bang rewrite. This also delivers part of FIX-PLAN Wave 3 ("split App.tsx") safely.

### 2.4 Read path vs write path
- **Writes that change business state always go through `lib/services`.** After Wave 1, RLS denies direct writes to core tables from browsers. There are narrow exceptions for user-owned low-risk rows, like the user's own notification read-state.
- **Reads:** keep direct Supabase reads under RLS where they're small and realtime matters (the apps' own jobs, messages). Add server list endpoints (`GET /api/hq/list/:resource?filter&sort&page`) for staff grids and exports, so the Control Center stops downloading whole tables. **Sensitive columns** (`password`, `password_hash`, ID photos) come out of any table the browser can read. After Wave 1 they're dropped or moved to server-only tables.

### 2.5 How the apps pick up changes (no new mechanism)
1. **Realtime** (`useSupabaseRealtimeSync`): the server's write lands in Postgres, and every subscribed session reloads. This needs Wave 1 to give apps a Supabase JWT so RLS lets them *see* their rows (2.6).
2. **Push** (`lib/push/delivery.ts`): the service calls `sendNotificationToUser` and inserts a `user_notifications` row. The same notification types are already defined in `lib/push/types.ts` (`assignment`, `dispute_update`, `support_ticket_status`, …). This replaces the browser's `reportPushEvent` call for server-side actions.
3. No app release is needed for staff-side features. New notification wording is text-only.

### 2.6 Sequencing with FIX-PLAN Wave 1 (explicit prerequisite)
**Real RBAC isn't possible until Wave 1 Task 1 lands.** Permissions checked on the server mean nothing while (a) the server can't prove who is calling, since today it trusts `{userId,email,role}` from the request, and (b) anyone with the public key can write to the database directly and skip the server. So the Control Center sequence is:
1. **Wave 1 Task 1** (FIX-PLAN): every account signs in with Supabase Auth. APIs verify the Supabase JWT (`Authorization: Bearer <access_token>`, checked with `supabase.auth.getUser(token)` or JWKS) and map `auth.uid()` → `staff` / `guards` / `clients` through `auth_user_id`. RLS gets locked down. Money endpoints are secured. **Watch out:** once RLS is locked, realtime subscriptions without a JWT stop getting rows. So the migration order must be (1) every client gets a JWT, then (2) policies tighten. Otherwise apps silently stop updating.
2. **Wave 1 Task 2** (cron for expiry and auto-payout). Its payout logic should land as `lib/services/payments.ts` so HQ reuses it. FIX-PLAN already asks for "payout logic in a shared server module".
3. Then HQ-1 onward (section 7). The Wave 2 and 3 items that overlap HQ phases are listed there so nothing gets built twice.

### 2.7 What doesn't change
The Guard and Customer app screens, navigation, branding, and design scales. Capacitor config. The existing Stripe, push, and cron routes (they get wrapped or secured, not replaced). Database tables (extended with columns or new tables. Nothing is dropped except sensitive columns after migration, which is a separate decision). Existing URLs.

---

## 3. RBAC design

### 3.1 Mapping the existing ladder onto the requested roles
The requested names are a good **tier vocabulary**, but renaming stored roles would break DB CHECK constraints (`staff_staff_role_check`), role-aware unit tests (at least 10 `src/lib/*.test.ts` files), docs, and staff habits. It also collides with the existing "Administrator", which ranks *below* Manager. **Recommendation:** keep the stored role names, show the requested tier as a badge, and add one new role.

| Requested role | Maps to existing | Why |
|---|---|---|
| **SUPER ADMIN** | **Founder** (legacy `Owner`) | Already "platform governance", and the only role that can manage Directors or Founders. |
| **ADMIN** | **Director** | Global (all cities), manages everyone below, city markets. It's the practical "admin of the whole business". |
| **MANAGER** | **Manager** | Same meaning. City-scoped (one city), finance and audit access. |
| **STAFF** | **Administrator, Moderator, Support** (three preset bundles) | These are the working staff tiers. Keeping the three presets preserves today's defaults (credentials vs approvals vs support desk). |
| *(side seat)* | **Finance** (`side_role`) | Stays as an add-on bundle that can be combined with any ladder role or used alone. |
| **VIEW ONLY** | **new `Viewer`** role (rank 0) | Read-only across the sections it's granted. Useful for auditors, investors, and counsel. Legacy `auditor` currently maps to Moderator in `resolvePlatformRole`, which isn't read-only, so don't reuse that. Needs a DB CHECK update. |
| **GUARD** | `guard` platform role | Not staff. **No Control Center access.** Their permissions stay the existing `guard.*` keys and govern app-side service calls. |
| *(not listed)* CUSTOMER | `client` platform role | Same as guard, for `client.*`. Business and PPO team logins (B15) could later reuse `rbac_user_overrides` scoped to a client account. |

### 3.2 Schema (new migration, sketch)
```sql
create table rbac_roles (
  key text primary key,                 -- 'founder','director','manager','administrator','moderator','support','viewer','finance','guard','client'
  label text not null, tier_label text, -- tier_label: 'Super Admin','Admin','Manager','Staff','View only'
  rank int,                              -- ladder rank; null for side/platform roles
  is_staff boolean not null, is_side_role boolean not null default false,
  is_system boolean not null default true -- system roles can't be deleted
);
create table rbac_permissions (
  key text primary key,                  -- 'jobs.assign'
  resource text not null, action text not null,
  label text not null, description text,
  risk text not null default 'normal' check (risk in ('normal','sensitive','critical')),
  legacy_keys text[] not null default '{}' -- e.g. {'moderator.review_job_requests'} for compatibility
);
create table rbac_role_permissions (
  role_key text references rbac_roles(key) on delete cascade,
  permission_key text references rbac_permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);
create table rbac_user_overrides (
  id text primary key,
  staff_id text not null references staff(id) on delete cascade,
  permission_key text not null references rbac_permissions(key),
  effect text not null check (effect in ('grant','deny')),   -- deny wins
  scope jsonb not null default '{}'::jsonb,                   -- e.g. {"cities":["Sacramento"]}
  reason text not null, granted_by text not null,
  expires_at timestamptz, created_at timestamptz not null default now()
);
-- staff.staff_role CHECK gains 'Viewer'; staff.managed_cities stays the city scope source.
```
Seed `rbac_role_permissions` from today's `ROLE_PERMISSIONS` **plus** the saved `platform_settings.staff_role_permissions` overrides, so day-one behavior is identical. Only the server (service role) writes these tables. Staff can read their own effective set.

### 3.3 Permission keys (full list)
Risk: **S** = sensitive (asks for a reason), **C** = critical (asks for a reason plus confirmation, Manager+ by default).

| Resource | Keys |
|---|---|
| customers | `customers.view`, `customers.view_pii`, `customers.create`, `customers.edit`, `customers.approve`, `customers.suspend`(S), `customers.restore`, `customers.set_trusted`, `customers.delete`(C), `customers.verify_credentials`, `customers.message`, `customers.export`(S) |
| guards | `guards.view`, `guards.view_pii`, `guards.create`, `guards.edit`, `guards.approve`, `guards.activate`, `guards.manage` (deactivate/block/restore)(S), `guards.set_trusted`, `guards.background_check`, `guards.verify_credentials`, `guards.reset_violations`, `guards.view_performance`, `guards.message`, `guards.delete`(C), `guards.export`(S) |
| staff | `staff.view`, `staff.create`, `staff.edit`, `staff.approve`, `staff.manage` (deactivate/block/restore)(S), `staff.assign_role`(C), `staff.manage_permissions`(C), `staff.manage_city_access`(S), `staff.view_timesheets`, `staff.adjust_time`(S), `staff.delete`(C) |
| accounts | `accounts.view`, `accounts.reset_password`(S), `accounts.force_sign_out`(S), `accounts.unlock`, `accounts.resolve_one_role_hold`(S), `accounts.link_auth`(C), `accounts.delete_cascade`(C) |
| jobs | `jobs.view`, `jobs.create`, `jobs.edit`, `jobs.review` (approve/decline posting), `jobs.assign`, `jobs.unassign`(S), `jobs.change_status`(S), `jobs.cancel`(S), `jobs.expire`, `jobs.approve_schedule_change`, `jobs.contact_customer`, `jobs.view_history`, `jobs.export` |
| schedules | `schedules.view`, `schedules.create`, `schedules.edit`, `schedules.delete`(S), `schedules.manage_availability` (edit a guard's availability) |
| messages | `messages.support_view`, `messages.support_reply`, `messages.support_manage` (status/assign/delete), `messages.create_ticket_for_user`, `messages.job_chats_view`(S), `messages.direct_view`(S), `messages.send_as_staff`, `messages.delete`(S), `messages.broadcast`(C) |
| files | `files.view`, `files.view_sensitive` (IDs, SSN-bearing docs)(S), `files.upload`, `files.replace`, `files.delete`(S), `files.download` |
| reports | `reports.view`, `reports.export`, `incidents.view`, `incidents.manage` (status/owner/escalate), `violations.view`, `violations.resolve`, `analytics.view` |
| financial | `financial.view`, `financial.export`(S), `financial.edit` (mark paid / waive)(C), `financial.refund`(C), `financial.refund_partial`(C), `financial.release_payout`(C), `financial.force_payout`(C), `financial.manage_fees`(C), `financial.manage_staff_comp`(S), `disputes.view`, `disputes.resolve`(S) |
| audit | `audit.view`, `audit.view_all` (all actors; otherwise own actions plus your city), `audit.export`(S) |
| settings | `settings.view`, `settings.edit_platform`(C), `settings.edit_integrations`(C), `settings.edit_cities`(C), `settings.edit_city_caps`(C), `settings.edit_locations`, `settings.edit_content` |
| data | `data.view`, `data.edit_live` (edit cells in live views; still needs the underlying resource key), `data.import`, `data.edit_dataset`, `data.delete_dataset`(S), `data.write_back`(C), `data.manage_views`, `data.share_views`, `data.export`(S) |

### 3.4 Default grants (starting point, preserves today's behavior where it existed)
| Role | Default bundle |
|---|---|
| Viewer | `*.view` for granted sections only (none by default; the Founder picks), `reports.view`. No PII unless granted. |
| Support | `customers.view`, `guards.view`, `jobs.view`, `messages.support_*`, `messages.create_ticket_for_user`, `incidents.view`, `violations.view`, `files.view`, `audit.view` (own only) |
| Moderator | Support + `guards.approve`, `customers.approve`, `accounts.resolve_one_role_hold`, `analytics.view` (today's `admin.view_stats`) |
| Administrator | Moderator + `*.verify_credentials`, `jobs.review/edit/assign/unassign/change_status/cancel/expire/approve_schedule_change`, `guards.manage/activate/set_trusted/background_check/reset_violations`, `customers.suspend/restore/set_trusted`, `schedules.*`, `disputes.*`, `incidents.manage`, `violations.resolve`, `settings.edit_locations/edit_integrations`, `staff.view`, `data.view`, `data.edit_live` |
| Manager | Administrator + `financial.*` except `force_payout`, `audit.view_all`, `audit.export`, `staff.create/edit/approve/manage/assign_role` (below own rank), `staff.manage_permissions` (below own rank), `data.import/edit_dataset/manage_views`, `accounts.*` except `link_auth`. **Scoped to their city.** |
| Director | Manager, all cities, + `settings.edit_cities`, `settings.edit_city_caps`, `settings.edit_platform`, `financial.force_payout`, `data.write_back` |
| Founder | Everything, including managing Directors and Founders and `accounts.link_auth` |
| Finance (side) | `financial.*` except `force_payout`, `audit.view_all`, `disputes.view`, `data.view`/`data.export` for finance views |

### 3.5 Scopes and guardrails (enforced in `lib/services/rbac.ts`)
- **City scope:** non-executive staff act only on records in their `staff.managed_cities`. A job's city is `security_requests.state`. A guard's city comes from service areas. A customer's city comes from locations [exact field mapping unverified]. Directors and Founders are global.
- **Rank rule:** `staff.*` actions only apply to targets strictly below your rank (today's `canModifyStaffMember`). The Founder is the exception for peers (AUD-012 stays by design unless Markeith decides otherwise, D7).
- **No self-escalation:** you can't grant a permission you don't hold, and you can't edit your own overrides.
- **Deny beats grant. Expired overrides are ignored.**

### 3.6 The server-side enforcement point
`requirePermission(ctx, 'jobs.assign', { city: job.state, targetRank })` inside every `lib/services/*` command, **not** in the HTTP router alone. So the same check applies whether the call comes from `/api/hq`, `/api/app`, a cron, or a data-sheet cell edit. Denials return `403 { code: 'forbidden', permission }` and write an audit row with `outcome = 'denied'`. RLS is the second wall: browsers can't write core tables at all.

### 3.7 Hiding unauthorized actions in the UI
- `GET /api/hq/me` returns `{ staff, roles, tier_label, permissions: string[], scopes }`. It's cached in a `PermissionsProvider`, and `usePermission('jobs.assign')` plus `<Can perm="jobs.assign">` wrap buttons.
- Every contextual action is declared once in `src/lib/hqActions.ts` as `{ id, label, permission, visibleWhen(record), confirm?: 'reason' | 'danger' }`. The `ContextActionBar` component renders only the permitted, applicable ones. Unauthorized actions are **hidden**, not greyed out. Disabled-with-tooltip is only for "allowed but not right now" (for example, "Assign guard" on a completed job).
- Keep today's `canX(user)` helpers but re-implement them over the effective permission set, so existing screens keep working during the migration. Map each old key through `rbac_permissions.legacy_keys`.
- The Permissions page (`StaffPermissionsPanel.tsx`) becomes a role × permission matrix grouped by resource, plus a per-staff "Overrides" tab on `/staff/team/:id/permissions`. Every change is audited.

---

## 4. Section-by-section Control Center spec

Format for each section: pages, then a table of contextual actions → required permission → what backs it (existing handler, table, or API; "new" = build in `lib/services`) → what the guard or customer app shows afterwards. In every case the action runs **server-side through `lib/services`** once its phase ships. The "existing" column names the browser logic being moved.

### 4.1 Customers (`/staff/clients`)
Pages: list (search, filter by type personal/business/PPO, status, city, trusted, unpaid; saved views; export), detail `/staff/clients/:id/{profile,activity,jobs,messages,files,billing}`.

| Action | Permission | Backed by | Customer / guard app sees |
|---|---|---|---|
| View Profile | `customers.view` (+`view_pii` for phone/email/IDs) | `clients` row; `StaffClientDetailPanel.tsx` | — |
| Edit | `customers.edit` | `handleUpdateClientProfile` → `customers.update` (new service) | Profile fields update live (realtime) |
| View Activity | `customers.view` + `audit.view` | `audit_log` by entity or actor + job `activity_log` + `user_notifications` (new query) | — |
| View Requests | `jobs.view` | `security_requests where client_id` | — |
| Message | `customers.message` | new staff→customer DM: a `support_tickets` thread with `kind='chat'` (reuses support tables) plus push `support_message` | New conversation in Customer app Messages/Support, plus push |
| Suspend / Restore | `customers.suspend` / `customers.restore` | Suspend/restore logic in `App.tsx` (~line 4177 writes `account_status`) → `accounts.setStatus` | Customer is signed out of operations and sees the suspended screen. Open jobs follow D9 (cancel or hold). |
| Approve / Request revision / Revoke | `customers.approve` | `handleApproveClient`, `handleRequestClientApplicationRevision`, `handleRejectClient` | Activation screen advances, plus push |
| Verify / Reject credential, **Upload on behalf / Waive** | `customers.verify_credentials` | `handleApproveClientCredential` / `handleRejectClientCredential`; upload-on-behalf and waive are **new** (AUD-009) | Business gate clears (A5) |
| Set trusted | `customers.set_trusted` | `handleSetClientTrusted` | Jobs auto-publish per `jobReviewMode` |
| Delete (cascade) | `customers.delete` | `handleDeleteClientAccount` (doesn't cascade today, AUD-011) → `accounts.deleteCascade` RPC (new) | Account gone. Linked jobs anonymized per the retention rule. |
| Export | `customers.export` | new list endpoint → CSV/XLSX | — |

### 4.2 Guards (`/staff/guards`)
Pages: list (status, city, armed, tier, credential expiring, availability today), detail `/staff/guards/:id/{profile,schedule,jobs,activity,credentials,performance,timesheet,permissions}`.

| Action | Permission | Backed by | Guard / customer app sees |
|---|---|---|---|
| View Profile | `guards.view` (+`view_pii`) | `guards` + cert tables; `StaffGuardDetailPanel.tsx` | — |
| Schedule | `schedules.view` (edit: `schedules.manage_availability`) | `guard_availability*` tables (**server copy is new**. Today it's device-only, B1) plus assigned jobs | Guard's "Schedule" page reads the server copy once B1 is fixed |
| Jobs | `jobs.view` | `security_requests` by `assigned_guard_id`/`applicants` | — |
| Activity | `guards.view` + `audit.view` | `audit_log` + job `activity_log` + check-ins | — |
| Edit | `guards.edit` | `handleUpdateGuardProfile` → `guards.update` | Profile updates live |
| Permissions (the "Permissions" button the owner asked for) | `guards.manage` | Per-guard flags: armed eligibility, job types, trusted, tier override. **This isn't staff RBAC.** Backed by existing columns plus a new `guard_restrictions` JSON [design choice] | Job board eligibility changes |
| Approve / Activate / Deactivate / Block / Restore | `guards.approve` / `guards.activate` / `guards.manage` | `handleStaffApproveGuardApplication`, `handleApproveGuardAccount`, `handleUpdateGuardUserStatus` (`StaffGuardAccountControls.tsx`) | Activation advances, or guard is locked out with push |
| Verify / Reject credential | `guards.verify_credentials` | `handleApproveCert`, `handleRejectCert`, insurance, ID, and vehicle handlers | Credential badge updates; activation progress |
| Background check toggle | `guards.background_check` | `handleUpdateBackgroundChecked` | — |
| Reset violations | `guards.reset_violations` | `handleResetAuditFailures` | Standing page updates |
| Message | `guards.message` | Staff→guard DM (support thread, as for customers) | Guard app Messages plus push |
| Delete (cascade) | `guards.delete` | `handleDeleteGuardAccount` → cascade RPC (new) | — |

### 4.3 Staff (`/staff/team`, `/staff/management`)
| Action | Permission | Backed by | Effect |
|---|---|---|---|
| View / Edit details | `staff.view` / `staff.edit` | `StaffTeamDetailPanel.tsx`, `staff` table | — |
| Add staff | `staff.create` | `handleAddStaffProfile` (today inserts with the public default password `#Qwerty12345`, per GAP A2) → `staff.invite` sends a Supabase Auth invite (new) | New staff gets an invite email (needs email provider, A9) |
| Approve / Deny application | `staff.approve` | `handleApproveStaffAccount` / `handleRejectStaffAccount` | — |
| Deactivate / Block / Restore | `staff.manage` | `handleUpdateUserStatus` (`StaffTeamDetailPanel.tsx`) | Signed out (server revokes sessions) |
| Change role | `staff.assign_role` (rank rule) | `handleUpdateStaffRole` | Nav changes on next `/me` refresh (realtime on `rbac_*` / `staff`) |
| Permissions (overrides) | `staff.manage_permissions` | **new** `rbac_user_overrides` UI | Same |
| City access / managers | `staff.manage_city_access` | `handleUpdateStaffCityAccess`, `assigned_manager_ids` | — |
| Timesheets / adjust time | `staff.view_timesheets` / `staff.adjust_time` | `staff_time_entries`, `StaffTimeAdjustmentsPanel.tsx` | — |

### 4.4 Accounts (`/staff/accounts`, new; the login side of every person)
Pages: a unified list over guards, customers, and staff (name, type, email, auth-linked yes/no, status, last sign-in, holds), and an account detail.

| Action | Permission | Backed by | Effect |
|---|---|---|---|
| View account | `accounts.view` | union view over `guards`/`clients`/`staff` + `auth.users` metadata (server only) | — |
| Send password reset | `accounts.reset_password` | **new**: Supabase Auth `resetPasswordForEmail` / admin `generateLink` (A9) | User gets a reset email |
| Force sign-out | `accounts.force_sign_out` | **new**: Supabase admin sign-out / refresh-token revoke [API detail unverified] | App returns to sign-in |
| Unlock / clear lockout | `accounts.unlock` | **new** | — |
| One-role holds: Ignore permanently / Block both | `accounts.resolve_one_role_hold` | `handleIgnoreOneRoleCase` / `handleBlockOneRoleCase` + `one_role_cases`. The fix for AUD-008 (a trusted-device or allow-list so Ignore sticks) moves server-side. | Held accounts unlock |
| Link / migrate to Supabase Auth | `accounts.link_auth` | `api/auth/bridge.ts` logic → `accounts.linkAuth` | — |
| Delete (cascade, Google Play) | `accounts.delete_cascade` | **new** RPC (A12, AUD-011) | Account removed |

### 4.5 Jobs / Requests (`/staff/jobs`)
Pages: list (status tabs including a new **Expired**, city, date range, unpaid, unassigned, multi-guard), detail `/staff/jobs/:id/{overview,assignment,history,messages,payments}`.

| Action | Permission | Backed by | Guard / customer app sees |
|---|---|---|---|
| View | `jobs.view` | `security_requests` | — |
| Edit | `jobs.edit` | `handleStaffEditJobListing` + rules in `src/lib/jobEditRules.ts` → `jobs.update` | Job card updates live |
| Approve / Decline posting | `jobs.review` | `handleApproveRequest` / `handleDenyRequest` | Customer: status Open, plus push. Guards: job appears on the board (`job_open_to_guards` push). |
| **Assign guard** | `jobs.assign` | `assignGuardToJob(…, {assignmentSource:'staff'})` (`App.tsx` ~line 10497) → **`assignments.assignGuard`**. Multi-guard jobs go through `job_guard_slots` (`guardTeamFlow.ts`). | Guard: job in Shifts → Scheduled, push "Staff assigned you to …" (existing copy). Customer: status "Picked up" (`JOB_STATUS_LABELS.accepted`), push "Guard confirmed", job chat opens. |
| Unassign / Reassign | `jobs.unassign` (+`jobs.assign`) | **new** (B13) | Old guard: removed, push. New guard: as above. Customer: guard changes, push. |
| Change status (override) | `jobs.change_status` | **new** state machine in `lib/services/jobs.ts` using `JOB_STATUS_FLOW` (`src/lib/jobStatus.ts`) plus a new `expired` status (A7). Asks for a reason. | Both apps show the new status; push for significant transitions |
| Cancel | `jobs.cancel` | `handleCancelRequest` → `jobs.cancel` (refund per policy → payments service) | Both: Canceled, push |
| Expire now | `jobs.expire` | Same code as the Wave 1 Task 2 cron | Customer: "Expired", can't pay |
| Approve / Reject schedule change | `jobs.approve_schedule_change` | `handleApproveScheduleChange*` / `handleRejectScheduleChange` | Both: new times |
| Contact Customer | `jobs.contact_customer` | Opens a staff thread tied to `related_request_id` in `support_tickets` | Customer Messages |
| View History | `jobs.view_history` | `audit_log where entity_type='job'` + `activity_log` + payments timeline | — |
| Create job | `jobs.create` | `handleStaffCreateJob` (`StaffCreateJobForm.tsx`) → `jobs.create` | Customer sees the job; guard if assigned |

### 4.6 Assignments & Schedules (`/staff/schedules`, new)
Pages: **schedule board** (days × guards, jobs as cards; built on `DesktopDragBoard` from the desktop kit), **coverage gaps** (unfilled slots in the next 72 hours), guard availability heat map, recurring templates.

| Action | Permission | Backed by | App effect |
|---|---|---|---|
| Drag job onto guard | `jobs.assign` | `assignments.assignGuard`. It runs the same eligibility and conflict checks (`guardScheduleConflictError`, `checkJobRequirements`) on the server. | As 4.5 Assign |
| Move shift time | `schedules.edit` + `jobs.edit` | Schedule-change flow (`src/lib/jobScheduleChange.ts`); billing deltas go to the payments service | Customer approval or pay prompt (existing flow) |
| Edit guard availability | `schedules.manage_availability` | `guard_availability*` (server copy, B1) | Guard sees updated availability |
| Create / edit recurring template | `schedules.create` / `schedules.edit` | `recurring_shift_templates` (unused today) + generator (B3; `src/lib/recurringShifts.ts` exists but is unused) | Future jobs appear for the customer (and guards if assigned) |
| Delete shift / template | `schedules.delete` | new | — |

### 4.7 Messages (`/staff/messages`, `/staff/support`)
| Action | Permission | Backed by | App effect |
|---|---|---|---|
| Support inbox view / reply / status / delete resolved | `messages.support_view` / `support_reply` / `support_manage` | `support_tickets`/`support_messages`; `handleSendSupportMessage`, `handleUpdateSupportTicketStatus`, `handleDeleteSupportTicket` | User sees the reply plus push `support_ticket_status` |
| **Create ticket for user** | `messages.create_ticket_for_user` | `handleCreateSupportTicket` exists but isn't wired to `StaffDashboard` (B18) | User sees the new thread |
| Assign ticket to staff member | `messages.support_manage` | **new** column `support_tickets.assigned_staff_id` | — |
| View job chats | `messages.job_chats_view` | `job_chat_*` (revive `StaffJobChatsPanel.tsx`) | — (read-only by default; posting as staff needs `send_as_staff` and is labelled "Guardr Staff") |
| Guard / customer community chat moderation | `messages.delete` | `api/messages/guards.ts`, `clients.ts` (DELETE exists) | Message removed |
| Broadcast | `messages.broadcast` | `StaffSettingsPanel` Broadcast + `lib/push/broadcast.ts` | Push to the audience |

### 4.8 Files (`/staff/files`, new)
Pages: the file index (owner, type, related record, uploaded by, date, sensitivity), viewer, and per-record Files tabs.

| Action | Permission | Backed by | App effect |
|---|---|---|---|
| View / download | `files.view` (+`files.view_sensitive` for IDs) | **new** `files` table + **Supabase Storage private buckets** served through short-lived signed URLs. Existing base64 images show up through an adapter that reads the current columns. | — |
| Upload on behalf | `files.upload` | new; writes Storage + `files`, then links to the credential or record | Guard/customer credential shows "On file" |
| Replace / Delete | `files.replace` / `files.delete` | new (soft delete; kept for retention) | — |

Migrating existing base64 blobs is a **separate, optional backfill** (D6). New uploads go to Storage once HQ-10 ships. The app upload screens need a small change to call the upload API instead of writing base64. That one is app-visible only in speed, not UI.

### 4.9 Reports (`/staff/reports`, `/staff/incidents`, `/staff/violations`, `/staff/analytics`)
| Action | Permission | Backed by | App effect |
|---|---|---|---|
| View shift reports and self-audits | `reports.view` | Revive `StaffReportsPanel.tsx` (dead code today) over `check_in_audit`/`check_out_audit`/`reports` | — |
| Incident workflow: set status (open → investigating → resolved → closed), owner, escalate, note | `incidents.manage` | **new** `incidents` table (id, job_id, source report ref, status, owner_staff_id, severity, notes, timestamps), backfilled from `check_out_audit.incidentReports` (B5) | Customer: incident status on the job; push on resolution |
| Resolve violation | `violations.resolve` | `handleStaffResolveAuditViolation` | Guard standing updates |
| Analytics with date range and export | `analytics.view` / `reports.export` | `StaffAnalyticsPanel.tsx` + new export (C3) | — |

### 4.10 Activity / Audit (`/staff/audit-log`)
See section 6. Filters by actor, role, action, entity, date, city, and outcome. Row → diff viewer (before/after JSON side by side) → "Open record". Export needs `audit.export`. Every record page's **Activity** tab is this view pre-filtered.

### 4.11 Financials (`/staff/payments`, `/staff/disputes`, `/staff/platform-fees`, `/staff/staff-compensation`)
| Action | Permission | Backed by | App effect |
|---|---|---|---|
| View payments, invoices, payouts | `financial.view` | `payments`, `guard_payout_invoices`, `client_invoices`, `api/stripe/payments.ts` | — |
| **Mark paid / Waive** (A4) | `financial.edit` | New `payments.markPaid` / `payments.waive` (the cash handlers in `App.tsx` ~lines 8995–9630 are toast-only today) | Customer: invoice "Paid/Waived"; job unblocks |
| Refund (full / partial) | `financial.refund` / `financial.refund_partial` | `api/stripe/payment/refund.ts` (unauthenticated today, A3) → `payments.refund` with the amount checked against server records | Customer: refund notice |
| Release payout (/ force) | `financial.release_payout` / `financial.force_payout` | `api/stripe/payout/release.ts` (A3) → `payments.releasePayout` (shared with the Wave 1 Task 2 cron) | Guard: Pay page shows the transfer, plus push |
| Resolve dispute (with real money outcomes) | `disputes.resolve` (+`financial.*` for the money part) | `handleResolveDispute` (notification-only today, B4), `handleStaffResolveOvertimeDispute` | Both parties: outcome plus money movement |
| Fees / staff comp | `financial.manage_fees` / `financial.manage_staff_comp` | `PlatformFeeScheduleEditor.tsx`, `StaffCompensationPanel.tsx` | New jobs price with the new fees |
| Export | `financial.export` | `payoutExport.ts` → data sheets export | — |

### 4.12 Settings (`/staff/settings`, `/staff/permissions`, `/staff/integrations`, `/staff/cities`, `/staff/locations`)
| Action | Permission | Backed by | App effect |
|---|---|---|---|
| Platform settings (job review mode, payment rails, content) | `settings.edit_platform` / `settings.edit_content` | `handleUpdatePlatformSettings`, `platform_settings` | Apps reload settings (realtime on `platform_settings`) |
| Role permissions matrix and overrides | `staff.manage_permissions` | `rbac_*` tables (replaces `platform_settings.staff_role_permissions`) | Staff nav changes |
| Integrations | `settings.edit_integrations` | `handleUpdateStaffIntegrations`, `api/integrations/health.ts` | — |
| Cities open/close, city manager | `settings.edit_cities` | `handleUpdatePlatformCity`, `handleAssignCityManager` | Market availability in apps |
| **City staff cap** (A13/AUD-006) | `settings.edit_city_caps` | **new** control for `minStaffSlotsPerOpenCity` / `marketplaceUsersPerStaffSlot` (`src/lib/staffMarketplaceCap.ts`) | — |
| Locations | `settings.edit_locations` | `handleSaveJobLocation`, `handleApproveClientLocation`, … | Customer sites status |

### 4.13 Data sheets (`/staff/data`, new)
See section 5. Entry points: "Open as sheet" on any list (Customers, Guards, Jobs, Payments, Schedules), plus a **Datasets** library for imported files.

---

## 5. Spreadsheet / data system

### 5.1 Library choice (fits React 19 + Vite + Base Web)
| Need | Recommended | Alternatives | License / caveats |
|---|---|---|---|
| Grid engine | **TanStack Table v8** (headless) + **TanStack Virtual**, rendered inside the existing `DesktopDataTable` look | **Glide Data Grid** (canvas, very fast for 100k+ rows, but harder to match Base Web styling and accessibility); **AG Grid Community** | TanStack: MIT. Glide: MIT. AG Grid Community: MIT, but **Excel export, range selection, Excel-style clipboard, row grouping, pivots, formulas, and server-side row model are Enterprise-only (commercial licence, about $999/dev per AG Grid's site)**. Avoid Handsontable (non-commercial or paid licence). |
| CSV parse/write | **Papa Parse** | hand-rolled (`payoutExport.ts` style) for export only | MIT |
| Excel read/write | **SheetJS Community Edition** (`xlsx`) **installed from `cdn.sheetjs.com`**, not npm | ExcelJS (MIT; heavier; good for styled exports) | SheetJS CE is Apache-2.0. **The npm registry copy is stuck at 0.18.5, which is vulnerable to CVE-2023-30533 (prototype pollution when reading crafted files).** Use 0.20.x from the SheetJS CDN, and parse imports in a Web Worker. |
| Formulas | **Not a full formula engine in v1.** Column aggregates plus simple computed columns from a whitelisted expression set, run server-side for live views | HyperFormula | HyperFormula is **GPLv3 or commercial**, so it needs a licence decision (D5) |

Why TanStack: it's headless, so the grid looks and behaves like the rest of the Guardr desktop surface (same tokens, 40px rows, keyboard model, hover row actions). It adds nothing to the mobile bundle because the desktop kit is already a lazy chunk (`docs/SURFACES.md` "Code splitting"). And it doesn't lock us into a vendor licence.

### 5.2 Mode A: live views over real tables
- **Definition:** a `live_view` is a server-side spec: base resource (for example `jobs`), allowed columns (each mapped to a DB column or computed field), which columns are **editable**, and which service command each edit calls. Example: `jobs.status` cell → `jobs.changeStatus`; `jobs.assigned_guard` cell (guard picker) → `assignments.assignGuard`; `guards.hourly_rate` → `guards.update`. Columns without a mapped command are read-only. **There's no generic "update any column" endpoint.**
- **Data flow:** `GET /api/hq/data/live/:view?filters&sort&page&cursor` returns server-paginated, permission- and city-filtered rows. Hidden columns come back redacted when the viewer lacks `*_pii`. Realtime on the base table highlights rows changed by others.
- **Cell edit:** `POST /api/hq/data/live/:view/edit { rowId, column, value, expectedVersion }` → the mapped service command → same permission check, same audit row (`source='data_sheet'`). Optimistic concurrency uses the row's `updated_at`/version. On conflict the cell shows "changed by X, reload?". Bulk paste or fill becomes a batch of commands (capped, for example 200 rows) with a single confirmation and per-row results.
- **Add / remove rows:** only where a create or delete command exists and the user has permission (for example `jobs.create`). Delete maps to soft-delete or cancel, never a raw `DELETE`.
- **Totals:** footer aggregates (sum, avg, min, max, count) computed **server-side over the whole filtered set**, not just the visible page. The `DesktopDataTable` `footer` slot already exists.
- **Export:** CSV/XLSX of the current filtered view (`data.export` + resource view permission), and the export itself is audited.

### 5.3 Mode B: imported sheets stored as datasets
New tables:
```sql
create table datasets (
  id text primary key, name text not null, description text,
  owner_staff_id text not null, city_scope text[],           -- visibility scope
  source_filename text, source_kind text check (source_kind in ('csv','xlsx','manual')),
  current_version int not null default 1,
  schema jsonb not null,            -- [{key,label,type:'text|number|currency|date|bool|enum|ref', enumValues?, refResource?}]
  linked_resource text,             -- optional: 'guards' | 'jobs' | … for write-back mapping
  archived_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table dataset_versions (
  dataset_id text references datasets(id) on delete cascade, version int,
  created_by text not null, created_at timestamptz default now(),
  reason text, row_count int, file_path text,   -- original file in private Storage bucket 'hq-imports' (optional)
  primary key (dataset_id, version)
);
create table dataset_rows (
  id text primary key, dataset_id text references datasets(id) on delete cascade,
  row_key text,                     -- stable key (e.g. guard badge #) for diffs/write-back
  position int, data jsonb not null,
  created_version int not null, deleted_version int,         -- soft delete per version
  updated_at timestamptz default now(), updated_by text
);
create table dataset_changes (      -- cell-level change tracking (append-only)
  id bigserial primary key, dataset_id text, row_id text, version int,
  column_key text, old_value jsonb, new_value jsonb,
  changed_by text not null, changed_at timestamptz default now(),
  change_kind text                  -- 'cell','add_row','delete_row','import','revert'
);
create table data_views (           -- saved views for both modes
  id text primary key, owner_staff_id text, name text,
  target_kind text check (target_kind in ('live','dataset')), target_id text,
  columns jsonb, filters jsonb, sort jsonb, aggregates jsonb,
  shared_with jsonb default '{"roles":[],"staff":[]}'::jsonb, created_at timestamptz default now()
);
```
- **Import flow:** the file is parsed in a Web Worker (Papa Parse or SheetJS) → preview with detected column types → map columns, or create a new schema → upload rows in chunks of about 1–2 MB, because Vercel functions cap request bodies around 4.5 MB (per Vercel docs; verify on the chosen plan) → a new `dataset_version` → `dataset_changes` rows with `change_kind='import'` (summarized, not one row per cell, for big imports).
- **Editing:** a cell edit calls `POST /api/hq/data/datasets/:id/rows/:rowId` and writes the row plus one `dataset_changes` row plus an `audit_log` row (`entity_type='dataset'`). Row history comes from `dataset_changes`. "Revert to version N" builds a new version, so history is never rewritten.
- **Write-back to live tables (optional, D3):** a dataset linked to a resource can run **"Apply to live data"**. That runs a dry-run diff against live rows by `row_key`, shows per-row changes, then executes each row as the normal service command (for example `guards.update`), with the normal permissions (`data.write_back` **and** the resource permission) and the normal audit. There are no raw bulk SQL updates. The default recommendation is **off** until Mode A has been in use for a while.

### 5.4 Permissions, change tracking, audit (both modes)
- The sheet UI hides edit affordances when the user lacks the mapped permission. The server enforces it regardless.
- Every edit is traceable twice: domain-level in `audit_log` (who, what, before, after, reason) and, for datasets, cell-level in `dataset_changes`.
- Saved views: private by default. Sharing needs `data.share_views`. A view never widens access. It's always intersected with the viewer's permissions and city scope.

### 5.5 Feel "native"
Uses the desktop kit (toolbar, filter chips, tabs, inspector panel for the row detail), Guardr type and tokens, keyboard shortcuts (existing `useKeyboardShortcuts`), and command palette entries ("Open Jobs sheet", "Import CSV…"). Clicking a row opens the same record page with its context actions, so the sheet isn't a separate admin tool.

---

## 6. Audit log design

### 6.1 Schema (extend the existing `audit_log`; don't replace it)
```sql
alter table audit_log
  add column if not exists actor_staff_role text,        -- 'Manager', 'Viewer', …
  add column if not exists actor_side_role text,          -- 'Finance'
  add column if not exists actor_auth_uid uuid,           -- from verified JWT
  add column if not exists permission text,               -- permission key checked, e.g. 'jobs.assign'
  add column if not exists source text default 'hq',      -- 'hq','guard_app','client_app','data_sheet','cron','webhook','system','legacy_browser'
  add column if not exists outcome text default 'success' check (outcome in ('success','denied','error')),
  add column if not exists before jsonb,                  -- changed fields only (plus id)
  add column if not exists after jsonb,
  add column if not exists reason text,                   -- required for S/C-risk actions
  add column if not exists user_agent text,
  add column if not exists request_id text,               -- correlates multi-row commands
  add column if not exists city text,                     -- for scoped review
  add column if not exists prev_hash text,
  add column if not exists row_hash text;                 -- optional tamper-evidence chain
create index if not exists idx_audit_log_action on audit_log(action, created_at desc);
create index if not exists idx_audit_log_city on audit_log(city, created_at desc);
```
Existing columns keep their meaning (`actor_id`, `actor_email`, `actor_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`). The `AuditAction` union in `src/lib/auditLog.ts` becomes the dotted action keys (`job.assign_guard`, `account.suspend`, …), with old names still readable.

### 6.2 Writing (server-side only)
- `lib/services/audit.ts#record(ctx, { action, entity, before, after, reason, outcome })` is called **inside every service command**, including denials and errors. IP comes from `x-forwarded-for` and user agent from the request. The actor comes **only from the verified JWT session**, never from the request body.
- `before`/`after` store only changed fields plus identifiers. Secrets (password hashes, tokens, full card data) are **never** stored. ID-document images are stored as references, not base64.
- Multi-step commands share a `request_id`. For atomic DB work, the RPC writes its own audit row inside the transaction.
- The browser `writeAuditLog()` and its `localStorage` copy are retired once each action moves server-side. During the transition, browser-written rows are marked `source='legacy_browser'` so reviewers can tell them apart.

### 6.3 Immutability
- RLS: **no** insert, update, or delete policies for `anon`/`authenticated`. Only the service role inserts. Replace today's `audit_log_insert … WITH CHECK (is_authenticated_user() OR true)`.
- A trigger `BEFORE UPDATE OR DELETE ON audit_log → RAISE EXCEPTION`. Triggers still fire for the service role, which only bypasses RLS. Retention purges, if ever needed, go through a documented, Founder-only migration.
- Optional hash chain (`row_hash = sha256(prev_hash || canonical_row)`) with a "Verify integrity" button in the UI (D8).

### 6.4 Review UI (`/staff/audit-log`, upgrades `StaffAuditLogPanel.tsx`)
- Filters: date range, actor (typeahead), actor role, action, entity type and ID, city, outcome (include **denied** attempts), source, and a "sensitive/critical only" toggle.
- Row list (desktop data table) → inspector with a **before/after diff**, reason, IP, user agent, request_id siblings, and "Open record".
- Saved filters (shared with data views). Export CSV/XLSX (`audit.export`, which is audited itself).
- Visibility: `audit.view` shows your own actions plus your city. `audit.view_all` shows everything. Founders see everything, including other Founders.
- Realtime stays (`useAuditLogRealtime.ts`), filtered by the same rules through RLS select policies.

---

## 7. Phased build plan (PR-sized, ordered after FIX-PLAN Wave 1)

Every phase is one PR, or two when marked, and ships behind the permission it introduces. App UI stays untouched unless it's stated.

| # | Goal | Areas touched | Depends on | Acceptance criteria |
|---|---|---|---|---|
| **W1** | *(FIX-PLAN Wave 1 Task 1 + Task 2, already planned)* Server auth, RLS, money lockdown, cron | `authService.ts`, `lib/accountSessionAuth.ts`, RLS migrations, `api/stripe/*`, `api/cron/*` | — | As in FIX-PLAN. **Plus, for HQ:** every client session carries a Supabase JWT; a reusable `requireSession(req)` helper exists; payout logic lives in a shared server module. |
| **HQ-1** | Server foundation and audit writer | new `lib/http/requireSession.ts`, `lib/services/{audit,notify,context}.ts`, `api/hq/[...route].ts`, mount in `server/createApp.ts`, migration extending `audit_log` + immutability trigger + insert-policy fix | W1 | `GET /api/hq/me` returns the verified staff identity. Browser inserts into `audit_log` are rejected. Service-written rows include before/after, IP, and UA. Unit tests for requireSession and audit. The function count grows by 1. |
| **HQ-2** | RBAC tables, seeding, enforcement | migration `rbac_*`, `Viewer` role CHECK, `lib/services/rbac.ts`, `/api/hq/me` permissions, `PermissionsProvider`/`<Can>`, `permissions.ts` helpers re-pointed, `staffNavAccess.ts` | HQ-1 | Effective permissions for every existing role **match today's** (snapshot test against `ROLE_PERMISSIONS` + saved overrides). A denied call gets 403 and a `denied` audit row. City and rank scope tests. |
| **HQ-3** | Jobs and assignment service ("assign guard exists once") | `lib/services/{jobs,assignments}.ts`, `src/lib/mappers/job.ts`, routes `POST /api/hq/jobs/:id/{assign,unassign,status,cancel,expire,edit}` and `POST /api/app/jobs/:id/confirm-guard`; Postgres RPC for atomic assign; expired status | HQ-2, W1 Task 2 (expire code) | A staff assign on web → the guard app shows the job under Scheduled and gets a push, and the customer app shows "Picked up", with no reload beyond realtime. Conflict and eligibility rules match `assignGuardToJob`. Audit rows exist for each step. Covers **B13** and the staff side of **A7**. |
| **HQ-3b** | Point app handlers at the shared service (no UI change) | `App.tsx` bodies of `assignGuardToJob`, `handleClientApprovePendingGuard`, `handleApplyToJob` (instant pick-up path), `handleCancelRequest` → `fetch('/api/app/...')` | HQ-3 | Same UX in the apps. The DB write happens only on the server. The e2e flow passes: customer approves → guard assigned. |
| **HQ-4** | Record pages and ContextActionBar | `appNavigation.ts` (path-style record routes + legacy query support), new `src/components/staff/hq/{RecordPage,ContextActionBar,ActivityTab}.tsx`, `src/lib/hqActions.ts`, Customers and Guards detail refactors reusing `StaffClientDetailPanel`/`StaffGuardDetailPanel` pieces | HQ-2 (HQ-3 for job actions) | The customer page shows exactly [View Profile][Edit][View Activity][View Requests][Message][Suspend] for a Manager, and fewer for Support. Old `?c=`/`?g=` links still open. Activity tab reads `audit_log`. |
| **HQ-5** | Customers, Guards, Staff actions server-side | `lib/services/{customers,guards,staff,credentials}.ts`; move approve / suspend / restore / trusted / verify-credential / role-change handlers; customer credential upload-on-behalf and waive (AUD-009) | HQ-4 | Each listed action in 4.1–4.3 works through `/api/hq`, is audited with before/after, and is hidden without its permission. Covers staff side of **A5**. |
| **HQ-6** | Accounts section | `/staff/accounts`, `lib/services/accounts.ts` (reset password, force sign-out, one-role hold fix, cascade delete RPC) | HQ-5; email provider (FIX-PLAN Wave 2 #6) for reset emails | Covers **A10/AUD-008**, **A12/AUD-011**. A deleted account removes related rows per the retention rule. The hold "Ignore" stays cleared on the next sign-in. |
| **HQ-7** | Jobs section complete | Job detail tabs (overview, assignment, history, messages, payments), status override with reason, contact customer | HQ-3, HQ-4 | All actions in 4.5 work. History shows audit + activity_log + payments in one timeline. |
| **HQ-8** | Schedules and availability | `/staff/schedules` on `DesktopDragBoard`, `lib/services/schedules.ts`, guard availability saved server-side (**B1**; the guard app's save call switches to the API, same UI), optional recurring generator (**B3**) | HQ-3 | Dragging a job to a guard runs the server assign with conflict checks. A guard's availability edited on the phone appears in HQ and in `guardOpenJobRecipients`. |
| **HQ-9** | Messages and support | ticket assignment column, create-ticket-for-user wired (**B18**), staff→customer/guard DM via support threads, job chat viewer (revive `StaffJobChatsPanel`), `api/messages/*` switched to `requireSession` + RBAC | HQ-2 | The customer or guard sees a new staff thread with a push. Duplicated inline auth in `api/messages/*` is removed. |
| **HQ-10** | Files | Supabase Storage private buckets, `files` table, signed-URL service, upload-on-behalf, read adapter for legacy base64 columns | HQ-2 | New uploads land in Storage. Sensitive files need `files.view_sensitive`. Every view and download is audited. The app upload call switches to the API (no UI change). |
| **HQ-11** | Financials through the service layer | `lib/services/payments.ts` (mark paid / waive **A4**, partial refund, dispute money outcomes **B4**), wraps secured Stripe endpoints from W1 | W1, HQ-2 | No money action is reachable without a verified session and `financial.*`. Amounts come from server records. Every action is audited with the amount before and after. |
| **HQ-12** | Reports and incidents | `incidents` table + backfill from `check_out_audit`, incident workflow (**B5**), revive `StaffReportsPanel`, analytics export (**C3**) | HQ-4 | An incident can be assigned, escalated, and closed. The customer sees its status. CSV export works. |
| **HQ-13** | Audit review UI | Upgrade `StaffAuditLogPanel.tsx`: filters, diff inspector, export, optional integrity check | HQ-1 | All filters in 6.4 work. Denied attempts are visible. Export is audited. |
| **HQ-14** | Data sheets Mode A (two PRs: read-only, then editable) | add `@tanstack/react-table`, `@tanstack/react-virtual`, Papa Parse, SheetJS (CDN tarball); `/staff/data`; live-view specs; `GET/POST /api/hq/data/live/*`; `data_views` table | HQ-3, HQ-5, HQ-11 (for the columns they back) | Jobs, Guards, Customers, and Payments sheets with server filter, sort, and paging and whole-set totals. A cell edit goes through the mapped command and gets audited. Unauthorized columns are read-only or redacted. XLSX/CSV export. |
| **HQ-15** | Data sheets Mode B (datasets) | `datasets`, `dataset_versions`, `dataset_rows`, `dataset_changes`; worker-based import; version history and revert; optional write-back (feature-flagged, D3) | HQ-14 | Import a 5,000-row XLSX, edit cells, add and remove rows, see cell history, revert to v1, export. Write-back (if enabled) runs a dry-run diff and per-row service commands. |
| **HQ-16** | Settings consolidation | Permissions matrix + per-user overrides UI, **city staff cap control (A13/AUD-006)**, `/hq` alias, settings changes via `lib/services/settings.ts` | HQ-2 | A Founder or Director can raise the Sacramento cap. Every settings change is audited with before/after. |

**Overlaps with FIX-PLAN (so nothing is built twice):** A4 → HQ-11, A5 staff side → HQ-5, A7 staff control → HQ-3, A10/A12/AUD-011 → HQ-6, A13 → HQ-16, B1/B3 → HQ-8, B4 → HQ-11, B5/C3 → HQ-12, B13 → HQ-3, B18 → HQ-9, and Wave 3 "split App.tsx" happens gradually through HQ-3b and the per-handler moves. Whichever plan picks an item up first should take the service-layer approach described here.

**App-side changes, all without UI changes:** HQ-3b (assignment/cancel handlers call `/api/app`), HQ-8 (availability save calls the API), HQ-10 (uploads call the API). Everything else is Control Center-only.

---

## 8. Open decisions for Markeith

1. **D1 – Role mapping.** Is Founder = Super Admin, Director = Admin, Manager = Manager, Administrator/Moderator/Support = Staff presets, plus a new Viewer role right? The alternative is renaming stored roles, which I don't recommend. Note that the existing "Administrator" ranks **below** Manager, so the word "Admin" could confuse people. Should the UI badge say "Staff – Administrator"?
2. **D2 – Should staff dispatch?** Today's code says staff are "not security operations dispatch" (`src/lib/staffPlatformScope.ts`). Your request has staff assigning guards, changing statuses, and running schedules. Confirm this reversal, and whether staff assignment **skips the customer's approval** (today `assignmentSource:'staff'` does skip it) or sends it to the customer to approve.
3. **D3 – Write-back from imported sheets.** Can an imported dataset update live records (guards, jobs, payments) through the "Apply to live data" flow, or should datasets stay reference-only? The recommendation is off at first, then Director+ only.
4. **D4 – Vercel plan and limits.** The project has 33 function files and 5-minute crons, both above Hobby limits (12 functions, daily crons). The site is currently 402. The plan keeps new work to about 2 catch-all functions either way. Which plan will Guardr be on? Pro is needed for the existing crons as written.
5. **D5 – Spreadsheet formulas.** Are column totals plus simple computed columns enough, or do you need Excel-style formulas? Full formulas mean HyperFormula (GPLv3 or a paid licence) or AG Grid Enterprise (paid).
6. **D6 – Files.** Should Guardr move uploads to Supabase Storage? It costs storage but gives per-file permissions and signed links. And should existing base64 images be backfilled, or only new uploads?
7. **D7 – Peer management.** Keep "only manage roles strictly below yours" (so only the Founder can make Directors, AUD-012), or let Directors manage Directors?
8. **D8 – Audit strictness.** Do you want the optional tamper-evidence hash chain, and a retention period (for example 7 years), or keep everything forever?
9. **D9 – Suspend semantics.** When staff suspend a customer or guard with upcoming or active jobs, should those jobs auto-cancel (with refund rules), be flagged for reassignment, or stay as they are?
10. **D10 – Staff reading private chats.** May Support or Admin read customer↔guard job chats and community DMs (`messages.job_chats_view`, `messages.direct_view`)? If yes, should the users be told (policy text in `src/lib/legalContent.ts`)?
11. **D11 – Viewer (read-only) PII.** Should read-only viewers ever see personal details (phone, address, IDs), or only redacted views?
12. **D12 – Staff APK.** Keep the optional Staff APK/PWA as a secondary surface of the same Control Center (the recommendation), or make the website the only staff surface?

---

## Appendix: what I couldn't verify
- Live Supabase RLS policies, realtime publication, and whether `auth_user_id` is filled in for real accounts. I read only the SQL files.
- Why Vercel returns 402, and which Vercel plan the project had.
- Whether each pure `src/lib/*` module can be imported server-side without browser-only dependencies. Check per module in HQ-3.
- The exact field that defines a customer's or guard's "city" for scoping.
- Exact Supabase admin APIs for force sign-out and session revocation. Confirm against the current `@supabase/supabase-js` v2 docs when HQ-6 starts.
- Vercel request body limit (about 4.5 MB) on the chosen plan.
- "No auth found" on some Stripe routes (overtime, tip, schedule-change, connect, hold, Square) is based on a grep for session checks, not a line-by-line read of every file.
