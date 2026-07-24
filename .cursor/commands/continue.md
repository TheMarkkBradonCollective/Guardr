# /continue — Continue where development stopped

Continue exactly where development last stopped.

## What to do

1. Read recent git history, open PRs, branch state, and `docs/DEV-UPDATES.md`
2. Identify the last incomplete task, branch, or TODO chain
3. Resume that work — do not start unrelated features
4. Match the style and patterns already in progress on that branch
5. Finish the interrupted unit of work before starting anything new

## Rules

- If multiple threads are in progress, ask which to prioritize unless context is clear
- Do not revert completed work on `main`
- Run `npm run lint` and `npm test` when code changes
- Merge to `main` when complete if `/automerge` is active

## Report back

- What was in progress and where it stopped
- What you continued and completed
- What remains
- Current branch and commit
