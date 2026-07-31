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
- `package.json`, download version, PWA cache, and APK binary share the **same version**
- Auth, push notifications, and realtime work on web, PWA, and APK
- `npm run lint`, `npm test`, and `npm run build` pass
- `docs/DEV-UPDATES.md` and `docs/guardr-general-guide.md` are updated
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
5. Rebuild Android APK via CI (**no** `ALLOW_APK_WITHOUT_FCM`)
6. Confirm APK binary version matches `package.json` — not just `version.json`

## Phase 4 — Verify surfaces

1. **Authentication** — sign-in, session, role routing on web, PWA, APK
2. **Push** — web push (VAPID) and native FCM on APK
3. **Realtime** — messages, notifications, audit log, live location where applicable
4. Wire missing Supabase realtime subscriptions
5. Bundle or update push handlers if needed

## Phase 5 — Deploy and docs

1. Deploy website (per project process)
2. Update `docs/DEV-UPDATES.md` with release notes
3. Update `docs/guardr-general-guide.md` if user-facing behavior changed
4. Push `cursor/full-platform-update-97bf`, **merge to `main`**, pull `main` locally

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
- Website, PWA, and APK must be on the **same build** for a release
- Always end on `main` merged and deployed

## Report back

- Version/build shipped
- Which PRs merged and which were cleared/skipped
- Test count and lint/build status
- SQL to run in Supabase (if any)
- APK download link
- Auth, notification, and sync verification results
- What to do next

## Related

- `/merge` — PR integration only
- `/deploy` — deploy checklist when code is already on `main`
- `/sql` — deep database audit without a full release
