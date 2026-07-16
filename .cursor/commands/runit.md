# /runit — Full Guardr platform release

Do a full Guardr release in one shot.

Pull `main`, merge every open PR (fix conflicts, skip anything already on `main`), get `tsc` and tests green, and update `supabase/complete_schema_setup.sql` with anything new.

Make sure the **website, PWA, and APK are all on the same build** — bump version, run `generate:download-version`, bust the PWA/service worker cache, deploy web, and ship the CI FCM APK (no `ALLOW_APK_WITHOUT_FCM`) with the **actual APK binary** matching `package.json`, not just `version.json`.

I need **real-time working everywhere** — web, PWA, and APK — for messages, notifications, audit log, live location, and anything else that should update without a manual refresh. Wire up Supabase realtime wherever it's missing.

Bundle push handlers if needed, update `docs/DEV-UPDATES.md` and `docs/guardr-general-guide.md`, run lint/tests/apk audit, push `cursor/full-platform-update-361c`, merge to `main`, and tell me what shipped (version/build), which PRs merged, test count, any SQL I need to run in Supabase, the download link, and what I should do next.
