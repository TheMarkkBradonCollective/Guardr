Closed after **v1.0.132** on `main` ([PR #1058](https://github.com/TheMarkkBradonCollective/Guardr/pull/1058)).

**Code defects addressed from this log**
- **AUD-001** — Staff sign-up **requested ladder role** picker (Support–Director); roster/review shows `requestedStaffRole`.
- **AUD-006** — Founder can edit **min staff slots per open city** in Service Areas; default raised to **6** (`staffMarketplaceCap`).
- **AUD-018** (Wave 3) — `/client/sites` routes to **locations** view.
- **AUD-021** (partial) — Account **downloads** show role-filtered APK (+ Messenger), not all four APKs.
- **SLA** — Job **approval time** metric uses created/submitted → `openedAt` (not shift start).
- **Guard card** — Upload collects **expiry**; legacy cards without expiry still qualify.
- **Staff Control Center** — Ops ladder overview kicker/branding (`staffOverviewConfig`).
- **CI** — `permissions: contents: read` on workflows.

**Still outside this close** (track on [#1044](https://github.com/TheMarkkBradonCollective/Guardr/issues/1044) / ops): AUD-002/003 Applications blank/search, AUD-008 hold persistence, Vercel deploy, Wave 1 server auth/RLS/cron, process notes AUD-007, etc.

See `docs/DEV-UPDATES.md` — Friday, Sep 26, 2026.
