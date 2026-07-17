# /deployit — Prepare for production deployment

Prepare for production deployment by validating builds, environment variables, assets, databases, and release configuration.

## Pre-deploy checklist

1. `git checkout main && git pull origin main`
2. `npm run lint` and `npm test` — all green
3. `npm run build` — production build succeeds
4. Version bump in `package.json` if releasing
5. Run `generate:download-version` for APK/PWA version files
6. Environment variables documented and set for production
7. `supabase/complete_schema_setup.sql` current — list SQL to run if migrations pending
8. PWA service worker cache bust if needed
9. Deploy web (per project deploy process)
10. Build APK via CI (no `ALLOW_APK_WITHOUT_FCM`) — binary must match `package.json` version
11. Verify auth, notifications, and realtime on production surfaces

## Rules

- Never ship APK where `version.json` ≠ binary version
- Website, PWA, and APK must be on the same build for a release
- Document rollback steps if deployment fails

## Related commands

- `/updateit` — full platform release including merge of all open PRs
- `/mergeit` — merge completed work to `main` before deploy

## Report back

- Version/build deployed
- Deploy targets (web URL, APK link)
- SQL run or pending
- Env vars verified
- Smoke test results
- Production readiness status
