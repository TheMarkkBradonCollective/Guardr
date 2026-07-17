# /mergeit — Merge completed work into main

Merge everything completed in the current project branch into `main`. This is the git/PR pass — use `/updateit` if you also need a full platform release (migrations, PWA/APK rebuild, production verification).

## Expected outcome

All completed work lands on `main`, merged branches and PRs are closed, temporary dev artifacts are removed, and the build passes.

## Tasks

1. `git checkout main && git pull origin main`
2. List open PRs: `gh pr list --state open`
3. Create branch `cursor/merge-to-main-361c` off `main`
4. Merge **every completed open PR** into it (oldest first)
5. Resolve all merge conflicts
6. Skip PRs already superseded on `main` — note them for closing
7. Remove temporary development files (scratch branches, debug artifacts, one-off scripts not meant for `main`)
8. Run `npm run lint` and `npm test` — fix anything broken
9. Commit, push branch, open PR to `main`
10. **Merge the PR to `main`** — do not leave it open as a draft
11. Pull `main` locally when done
12. **Close every merged source PR** — for each PR landed via the merge PR, close with `ManagePullRequest` `set_pr_status` `closed` (or `gh pr close <number>`). Comment when possible: `Merged to main via #<merge-pr-number>.`
13. **Close superseded PRs** skipped because already on `main` — comment: `Superseded on main.`
14. Delete merged remote branches when safe

## Rules

- **Base branch is `main`**. Always merge into `main`, not a side branch.
- Use `gh pr merge --merge` (or GitHub UI) — get it on `main` in the same session.
- If CI fails after merge, fix on a follow-up branch and merge that too.
- **Always close merged and superseded PRs** — closing is part of the job, not optional.

## Report back

- Which PRs merged (number + title)
- Which PRs skipped and why
- Which PRs and branches were closed/deleted
- Temporary files removed
- Current `main` commit
- Any conflicts resolved
- Test/lint status
- What to run in Supabase if schema changed

If you also need APK bump, docs, and deploy — run `/updateit` after or combine both in one pass.
