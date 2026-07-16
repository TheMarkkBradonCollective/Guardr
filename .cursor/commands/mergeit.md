# /mergeit — Merge everything to main

Merge all open work into `main` and ship it. This is the git/PR pass — use `/updateit` if I also need a version bump, APK, and full release.

## Do this

1. `git checkout main && git pull origin main`
2. List open PRs: `gh pr list --state open`
3. Create branch `cursor/merge-to-main-361c` off `main`
4. Merge **every open PR** into it (oldest first), resolve conflicts
5. Skip PRs already superseded on `main` — note them so I can close on GitHub
6. Run `npm run lint` and `npm test` — fix anything broken
7. Commit, push branch, open PR to `main`
8. **Merge the PR to `main`** — don't leave it open as a draft
9. Pull `main` locally when done

## Always

- **Base branch is `main`**. Always merge into `main`, not a side branch.
- Use `gh pr merge --merge` (or GitHub UI) — get it on `main` same session
- If CI fails after merge, fix on a follow-up branch and merge that too
- Close or note stale PRs that couldn't merge

## Report back

- Which PRs merged (number + title)
- Which PRs skipped and why
- Current `main` commit
- Any conflicts you resolved
- Test/lint status
- What I should run in Supabase if schema changed

If I also need APK bump, docs, and deploy — run `/updateit` after or combine both in one pass.
