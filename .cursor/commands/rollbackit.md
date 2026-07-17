# /rollbackit — Undo the last completed change

Undo the last completed change while preserving project integrity.

## What to do

1. Identify the last merged commit or deployment on `main`
2. Confirm with git log what will be reverted
3. Revert safely:
   - Prefer `git revert` on `main` (preserves history) over force-push
   - If schema changed, provide reverse migration or manual SQL
4. Run `npm run lint` and `npm test` after revert
5. Push revert to `main` and close/note any affected open PRs

## Rules

- Do not revert unrelated commits bundled in a merge without user confirmation
- If revert is risky (data migration, payment config), stop and explain options
- Document what was rolled back and why

## Report back

- What was reverted (commit SHA, PR, summary)
- New `main` commit after revert
- Manual steps required (Supabase, env, redeploy)
- Test/lint status
