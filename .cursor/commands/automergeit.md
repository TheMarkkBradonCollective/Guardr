# /automergeit — Enable automatic merging to main

Enable automatic merging for this project. From this point forward, treat `main` as the continuously integrated source of truth.

## Goal

Maintain `main` as the single source of truth with all completed work continuously integrated — no completed tasks left sitting in open PRs.

## Behavior (active until disabled)

Whenever a task, feature, page, component, bug fix, or improvement is **completed** in this agent:

1. **Automatically merge** completed work into `main`
2. **Do not wait** for additional merge requests or manual approval
3. **Resolve merge conflicts** whenever possible
4. **Delete merged branches and close merged PRs**
5. **Keep `main` up to date** after every completed task
6. **Preserve version history and commit messages** — use clear, descriptive commits; do not squash away meaningful history unless required
7. **Never leave completed work in open PRs** unless explicitly instructed otherwise
8. **Continue this behavior** until `/automergeit` is disabled or overridden

## Per-task workflow

When finishing any completed unit of work:

1. `git checkout main && git pull origin main`
2. Ensure lint/tests pass (`npm run lint`, `npm test` when code changed)
3. Merge the feature branch into `main` (or merge the PR to `main` via `ManagePullRequest` / `gh pr merge`)
4. Resolve conflicts on `main` or the feature branch before merging
5. Push `main` if merged locally
6. Close the PR and delete the remote branch when safe
7. Pull `main` locally and confirm the latest commit

## Rules

- **Base branch is always `main`**
- Merge **only completed, verified work** — do not auto-merge broken or half-finished changes
- If CI fails after merge, fix forward on a new branch and merge that too
- If the integration cannot close a PR or delete a branch, list it in the report
- `/mergeit` still applies for one-shot bulk merges of multiple open PRs
- `/updateit` still applies when a full platform release (version bump, APK, migrations) is needed

## Disable or override

This mode stays on until:

- The user explicitly disables automatic merging
- The user says to leave a PR open, use a different base branch, or skip merging for a specific task

When overridden for one task, resume automatic merging on the next completed task unless told otherwise.

## Report back (after each merged task)

- What was merged (branch, PR number, summary)
- `main` commit SHA after merge
- Branches/PRs closed or deleted
- Conflicts resolved (if any)
- Lint/test status
- Whether automatic merging remains active
