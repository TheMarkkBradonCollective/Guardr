# /fullaudit — Comprehensive production-readiness audit

Perform the most comprehensive quality assurance, functionality, security, performance, and production-readiness audit possible across the selected scope.

**Default scope:** Entire project.

## Scope

| Selection | What to do |
|-----------|------------|
| **Current component** | Audit and repair only that component |
| **Current page** | Audit and repair only that page |
| **Selected pages** | Audit and repair all selected pages |
| **Entire website** | Full website audit (browser shell) |
| **Entire platform** | One platform (website, PWA, or APK) |
| **Entire project** | Full project audit (default) |

When no scope is given, audit the **entire project**.

---

## Platforms

Audit every platform **independently** while ensuring feature parity and consistent functionality.

### Website
- Desktop
- Tablet
- Mobile Website

### Progressive Web App (Full • Lite)
- Mobile
- Tablet

### Android APK (Full • Premium)
- Mobile
- Tablet

Each layout must be optimized specifically for its device. Nothing should overflow, overlap, or become inaccessible.

---

## Objective

Assume the application is preparing for a **production release**.

Inspect every page, component, route, workflow, API, database interaction, user role, permission, animation, transition, layout, and platform-specific experience.

- **Do not simply report issues** — automatically repair every issue that can reasonably be fixed
- Continue auditing until no significant issues remain
- Repeat testing after every repair

---

## Application health

Identify and repair:

- White screens, black screens, infinite loading, loading loops
- Broken routing, missing pages, blank components
- Hydration issues, render failures, component crashes, layout failures
- Responsive failures, missing assets, broken imports, missing dependencies
- Build failures, runtime errors, console errors and warnings
- Network failures, memory leaks, performance bottlenecks
- Duplicate rendering, state sync issues, race conditions

---

## UI & UX

Audit every page for layout consistency, alignment, padding, margins, typography, icons, images, cards, tables, charts, navigation, drawers, modals, dialogs, popups, dropdowns, tabs, accordions, tooltips, toasts, empty/error/success/loading states, skeleton loaders, animations, and transitions.

**Repair every issue found.**

---

## Responsive verification

| Platform | Surfaces |
|----------|----------|
| **Website** | Desktop, tablet, mobile |
| **PWA** | Mobile, tablet |
| **APK** | Mobile, tablet |

Never rely on simple scaling. Each layout must be device-specific.

---

## Functional testing

Test every button, link, icon, menu, navigation item, dropdown, toggle, checkbox, radio, slider, search, filter, sort, form, validation, upload, download, modal, dialog, drawer, context menu, shortcut, gesture, swipe, and drag-and-drop interaction.

Every interaction must work exactly as intended.

---

## Workflow testing

Validate **100% of every workflow** for every user role.

### Guardr roles to verify

| Role | Verify |
|------|--------|
| **Guest** | Landing, auth entry, public guide |
| **Guard** | Onboarding, credentials, jobs, map, shifts, payouts, messages |
| **Client** | Registration, job posting, guard approval, payments, reports |
| **Staff** | Moderator → Founder tiers — ops, approvals, credentials, incidents |
| **Admin / Owner** | Permissions, financial controls, settings, audit log |

### Workflows to verify end-to-end

- Registration, login, logout, password reset, email verification
- Profile management, dashboard access, role permissions
- Notifications, messaging, scheduling, assignments, reports
- Maps, GPS, live tracking, uploads, downloads
- Payments (Stripe), search, filters, settings, administration
- Every workflow must complete successfully without manual intervention or unexpected behavior

---

## Database

Audit schema, tables, relationships, constraints, indexes, views, functions, triggers, policies, and migrations.

Verify data integrity, foreign keys, query performance, duplicate/orphaned records, and transaction safety.

Update `supabase/complete_schema_setup.sql` when fixes are made.

Repair issues where possible.

---

## API audit

Verify every endpoint (GET, POST, PUT, PATCH, DELETE).

Verify authentication, authorization, validation, error handling, timeouts, rate limits, response formatting, retry handling, and realtime events (Supabase client, RPC, edge functions).

---

## Security

Audit authentication, authorization, role permissions, session management, JWT/cookies, SQL injection, XSS, CSRF, input validation, file uploads, API security, and data protection.

Repair vulnerabilities where possible.

---

## Performance

Optimize initial load, lazy loading, bundle size, images, fonts, JavaScript, CSS, rendering, re-renders, animations, queries, API requests, memory usage, battery usage, and cache efficiency.

Run `npm run build` and note bundle impact when changed.

---

## PWA verification

Verify installation, manifest, service worker, offline mode, cache, updates, push notifications, background sync, icons, and splash screens.

Ensure the PWA remains the **FULL application** delivered as a **lightweight experience**.

---

## APK verification

Verify native navigation, camera, GPS, notifications, biometrics, storage, permissions, deep links, native sharing, background services, device compatibility, orientation, and Android lifecycle.

Ensure the APK provides the **premium native experience**.

---

## Code quality

Repair dead code, duplicate code, unused imports/assets, broken references, deprecated code, type errors, lint errors, and formatting inconsistencies.

Run `npm run lint` and `npm test` — all must pass before completion.

---

## Completion requirements

- Do **not** stop after finding issues — repair until every discoverable issue is addressed
- Repeat testing after every repair
- Continue until all systems pass verification
- Nothing should remain partially functional
- Every page, workflow, button, role, platform, API, database interaction, and user experience must be fully operational

---

## Branch & PR

- Branch: `cursor/fullaudit-<descriptive-name>-e760`

## Final report

Provide a comprehensive report including:

- **Platforms Audited**
- **Pages Audited**
- **Components Audited**
- **User Roles Tested**
- **Workflows Tested**
- **Buttons & Actions Tested**
- **APIs Tested**
- **Database Verification Results**
- **Security Findings**
- **Performance Improvements**
- **Bugs Found**
- **Bugs Fixed**
- **Remaining Issues** (if any)
- **Production Readiness Score** (1–10)
- **Overall System Health Score** (1–10)

## Goal

Ensure the Website (Desktop, Tablet, Mobile), PWA (Full • Lite), and Android APK (Full • Premium) are stable, fully functional, production-ready, and provide a seamless, error-free experience for every user on every supported device.

## Related commands

| Command | When to use |
|---------|-------------|
| `/runit` | Scope-aware audit and repair (lighter pass) |
| `/testit` | Functionality testing without design changes |
| `/secureit` | Security-focused audit |
| `/websiteaudit`, `/pwaaudit`, `/apkaudit` | Single-platform audits |
