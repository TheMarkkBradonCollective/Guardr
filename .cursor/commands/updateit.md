# /updateit — Full project update and release

Perform a complete project update before merging to `main`. Use this when shipping a release, not just merging completed PRs (use `/mergeit` for that alone).

## Expected outcome

Every open PR is merged (or closed if superseded), migrations and schema are current, web/PWA/APK are on the same build, realtime/auth/notifications work, production build passes, and everything is merged to `main`.

## Tasks

1. Pull `main` and merge every open PR (fix conflicts; skip anything already on `main`)
2. Delete all merged PRs/branches — close superseded or stale PRs on GitHub
3. Finish all outstanding SQL/database migrations
4. Update `supabase/complete_schema_setup.sql` with anything new
5. Verify database schema and relationships match the app
6. Update API endpoints if needed (Supabase RPC, edge functions, client API layer)
7. Bump version in `package.json`; run `generate:download-version`
8. Bust PWA/service worker cache
9. Rebuild and deploy the website
10. Rebuild the Android APK via CI (no `ALLOW_APK_WITHOUT_FCM`) — **APK binary must match `package.json` version**, not just `version.json`
11. Verify authentication, push notifications, and realtime syncing on web, PWA, and APK (messages, notifications, audit log, live location, etc.)
12. Wire up Supabase realtime wherever it is missing
13. Bundle push handlers if needed
14. Run `npm run lint`, `npm test`, and production build (`npm run build`)
15. Update `docs/DEV-UPDATES.md` and `docs/guardr-general-guide.md`
16. Push `cursor/full-platform-update-361c`, **merge to `main`**, pull `main` locally

## Clear all PRs

After merging what belongs on `main`:

1. `gh pr list --state open` — nothing should remain unless genuinely blocked
2. Close every superseded or already-on-main PR (`gh pr close <n> --comment "…"`)
3. If the integration cannot close PRs, list them in the report for manual closure
4. Do **not** leave draft PRs hanging after a release

## Rules

- Branch names: `cursor/<descriptive-name>-361c`
- Commit and push as you go
- Never ship an APK where `version.json` says N but the binary is N-1
- Website, PWA, and APK must be on the **same build**
- Always end on `main` merged and deployed

## Report back

- Version/build shipped
- Which PRs merged and which were cleared/skipped
- Test count and lint/build status
- SQL to run in Supabase (if any)
- Download link for APK
- Auth, notification, and sync verification results
- What to do next
