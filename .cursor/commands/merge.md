# /merge — Merge completed work into `main`

Land every **completed** open PR on `main`, close merged and superseded PRs, remove temporary dev artifacts, and verify lint/tests pass.

This is the **git/PR pass only**. For a full platform release (version bump, migrations, PWA/APK rebuild, production deploy), run `/update` instead or after `/merge`.

## When to use

| Situation | Command |
|-----------|---------|
| Open PRs are ready and you want them on `main` | `/merge` |
| Shipping a versioned release to production | `/update` (includes `/merge`) |
| Deploy only (already on `main`) | `/deploy` |
| Auto-merge each finished task going forward | `/automerge` |

## Expected outcome

- All completed work is on `main`
- Merged and superseded PRs are **closed** (not left open)
- Merged remote branches are deleted when safe
- Scratch/debug artifacts are removed
- `npm run lint` and `npm test` pass

## Tasks

1. `git checkout main && git pull origin main`
2. List open PRs: `gh pr list --state open`
3. Create branch `cursor/merge-to-main-8442` off `main`
4. Merge **every completed open PR** into that branch (**oldest first**)
5. Resolve all merge conflicts
6. **Skip** PRs already superseded on `main` — note them for closing
7. Remove temporary development files (scratch branches, debug artifacts, one-off scripts not meant for `main`)
8. Run `npm run lint` and `npm test` — fix anything broken
9. Commit, push branch, open PR to `main`
10. **Merge the PR to `main`** — do not leave it open as a draft
11. Pull `main` locally when done
12. **Close every merged source PR** — for each PR landed via the merge PR, close with `ManagePullRequest` `set_pr_status` `closed` (or `gh pr close <number>`). Comment when possible: `Merged to main via #<merge-pr-number>.`
13. **Close superseded PRs** skipped because already on `main` — comment: `Superseded on main.`
14. Delete merged remote branches when safe

## Rules

- **Base branch is always `main`**
- Use `gh pr merge --merge` (or GitHub UI) — land on `main` in the same session
- If CI fails after merge, fix on a follow-up branch and merge that too
- **Closing PRs is required** — merged and superseded PRs must not be left open
- Do **not** bump version, rebuild APK, or deploy — that is `/update` or `/deploy`

## Report back

- Which PRs merged (number + title)
- Which PRs skipped and why
- Which PRs and branches were closed/deleted
- Temporary files removed
- Current `main` commit SHA
- Conflicts resolved (if any)
- Lint/test status
- SQL to run in Supabase if schema changed (note only — full migration pass is `/update`)

## Related

- `/update` — full release after merge (version, APK, docs, deploy)
- `/automerge` — keep merging each completed task automatically
- `/deploy` — production deploy when `main` is already current
