# /update — Full platform release

Ship a complete Guardr release: merge all open PRs, sync database schema, align web/PWA/APK builds, verify auth/push/realtime, bump version, update docs, and land on `main` deployed.

Use this when **shipping a version** to production. For git/PR cleanup only, use `/merge`.

## When to use

| Situation | Command |
|-----------|---------|
| Versioned release (web + PWA + APK + docs) | `/update` |
| Merge open PRs only, no release artifacts | `/merge` |
| `main` is current; deploy existing build | `/deploy` |

## Expected outcome

- Every mergeable open PR is on `main` (or closed if superseded)
- Migrations and `complete_schema_setup.sql` are current
- `package.json`, download version, PWA cache, APK binary, and Play AAB share the **same version**
- Auth, push notifications, and realtime work on web, PWA, and APK
- `npm run lint`, `npm test`, and `npm run build` pass
- `docs/DEV-UPDATES.md` and `docs/guardr-general-guide.md` are updated (dates, missing product copy, and activity-cloud Time tables)
- User manuals under `docs/user-manuals/` are updated when user-facing behavior changed (`npm run docs:manuals-pdf` if those files changed)
- You end on `main`, merged and deployed

## Phase 1 — Merge (`/merge`)

Run the full `/merge` workflow first (or confirm `main` already has all completed PRs):

1. Pull `main`
2. Merge every completed open PR (oldest first); resolve conflicts
3. Close merged and superseded PRs; delete merged branches
4. Remove temporary dev artifacts
5. Lint and test green on the integration branch
6. Merge integration PR to `main` and pull locally

Do not proceed to release steps with open PRs that should ship in this release.

## Phase 2 — Database

1. Finish outstanding SQL/migrations in `supabase/migrations/`
2. Update `supabase/complete_schema_setup.sql` with anything new
3. Verify schema, relationships, RLS policies, and RPC match the app
4. Update API layer if endpoints changed (client, RPC, edge functions)

## Phase 3 — Version and builds

1. Bump version in `package.json`
2. Run `npm run generate:download-version`
3. Bust PWA/service worker cache when needed
4. Run `npm run lint`, `npm test`, and `npm run build`
5. Rebuild Android **APK and AAB** via `npm run android:release` or CI (**no** `ALLOW_APK_WITHOUT_FCM`)
6. Confirm APK binary version matches `package.json` — not just `version.json`
7. Confirm Play AAB is uploaded (`dist/play-store/guardr-play-release.aab`) alongside the sideload APK

## Phase 4 — Verify surfaces

1. **Authentication** — sign-in, session, role routing on web, PWA, APK
2. **Push** — web push (VAPID) and native FCM on APK
3. **Realtime** — messages, notifications, audit log, live location where applicable
4. Wire missing Supabase realtime subscriptions
5. Bundle or update push handlers if needed

### 4b — Viewport audit (mobile, tablet, desktop)

Run a full layout pass on **all three surfaces** before shipping. Guardr is three independent apps (not one responsive layout) — audit each explicitly.

```bash
npm run viewport:audit
```

**What it checks (per role × viewport):**
- Every staff section, guard path, client path, and public page loads
- Horizontal overflow and vertical scroll work
- Primary buttons are not clipped off-screen
- Sign-in works for demo accounts on each surface

**Viewports:** mobile 390×844, tablet 768×1024, desktop 1440×900

**Demo accounts** (`supabase/investor_demo_accounts.sql`): `tests@test.com`, `testc@test.com`, `testg@test.com` — password `#Qwerty12345`

**Report:** `/opt/cursor/artifacts/viewport-audit/viewport-audit-report.md`

Fix any layout/button findings before merge. For deeper flows (signup, payments, shift), also run `npm run fieldtest`.

## Phase 5 — Docs, activity cloud, deploy

This phase is **mandatory on every `/update`**, including when the product change feels "docs-only" or the version bump is the headline. Skipping it leaves Staff → Dev notes stale and the activity heatmap blank for the release day.

### 5a — Guide, manuals, dates

1. Set **Last updated** on `docs/DEV-UPDATES.md` and `docs/guardr-general-guide.md` to **today's weekday date** (e.g. `Tuesday, August 18, 2026`).
2. Update `docs/guardr-general-guide.md` for **every** user-facing or ops behavior that shipped in this release — fill missing sections; do not only append a bullet. Signup, roles, fees, credentials, and staff onboarding are the usual gaps.
3. Update `docs/user-manuals/*.md` when clients, guards, or staff procedures changed. If those files change, run `npm run docs:manuals-pdf` so `public/manuals/` matches.
4. Update `## Quick reference by date` in `docs/DEV-UPDATES.md` with a row for this release day.

### 5b — Dev notes + activity cloud (required)

The Staff **Dev notes** heatmap (`src/lib/devActivityGrid.ts` → `parseDevActivityGrid`) **only** counts:

- `| Time | What shipped |` table rows under a dated `## Weekday, Month D, YYYY` heading (`| 8:13 AM | … |`)
- `**Activity:** 9:25 AM` lines
- `### Something (9:25 AM)` headings plus `- ` bullets under that hour

A changelog with no Time rows **does not light up the cloud**.

1. `git log --format='%ad %s' --date=format:'%A, %B %-d, %Y %I:%M %p'` for commits in this release (convert to `h:mm AM/PM`).
2. Insert a dated day section at the top of `docs/DEV-UPDATES.md` (or add a Time table to today's existing heading).
3. Add a `| Time | What shipped |` table with **one row per commit** (merge commits can be skipped). Use the weekday name in the `##` heading or those rows are ignored.
4. Write the release notes under that heading (PRs merged, shipped behavior, SQL to run, version).
5. Confirm the latest dated heading in `docs/DEV-UPDATES.md` has Time rows — `src/lib/devActivityGrid.test.ts` asserts this.

Do **not** ship `/update` with Last updated still on a previous date, or with a new day heading that has no Time table.

### 5c — Deploy

1. Deploy website (per project process)
2. Push `cursor/full-platform-update-97bf`, **merge to `main`**, pull `main` locally

## Clear all PRs

After merging what belongs on `main`:

1. `gh pr list --state open` — nothing should remain unless genuinely blocked
2. Close every superseded or already-on-main PR (`gh pr close <n> --comment "…"`)
3. If the integration cannot close PRs, list them in the report for manual closure
4. Do **not** leave draft PRs hanging after a release

## Rules

- Branch names: `cursor/<descriptive-name>-97bf`
- Commit and push as you go
- Never ship an APK where `version.json` says N but the binary is N-1
- Website, PWA, APK, and AAB must be on the **same build** for a release
- Every `/update` ships **both** sideload APK (`public/download/guardr.apk`) and Play AAB (`dist/play-store/guardr-play-release.aab`)
- Always end on `main` merged and deployed

## Report back

- Version/build shipped
- Which PRs merged and which were cleared/skipped
- Test count and lint/build status
- SQL to run in Supabase (if any)
- APK download link and AAB artifact path
- Auth, notification, and sync verification results
- Viewport audit: `npm run viewport:audit` — findings count and fixes applied
- Docs: Last updated date, Guide sections filled, Dev notes Time table (activity cloud), manuals/PDF if regenerated
- What to do next

## Related

- `/merge` — PR integration only
- `/deploy` — deploy checklist when code is already on `main`
- `/sql` — deep database audit without a full release
