# /clean — Remove dead and redundant code

Remove dead code, duplicate files, unused assets, debug code, console logs, temporary files, and obsolete dependencies.

## Scope

| Selection | What to do |
|-----------|------------|
| **Directory / feature** | Clean that scope |
| **Entire project** | Full cleanup sweep |

## Remove or fix

- Unused components, hooks, utilities, and CSS
- Duplicate files and copy-pasted logic
- Unreferenced assets (images, fonts)
- `console.log`, `debugger`, and debug-only code paths
- Commented-out blocks that are no longer needed
- Temporary scripts and scratch files not meant for `main`
- Obsolete dependencies (`npm prune`, update `package.json`)
- Orphaned migration or config files

## Rules

- Verify references before deleting (grep, build, tests)
- Do not remove intentional demo/tutorial code without confirmation
- Run `npm run lint` and `npm test` after cleanup

## Branch & PR

- Branch: `cursor/clean-<descriptive-name>-e760`

## Report back

- Files deleted or simplified
- Dependencies removed
- Lines or bundle size saved (if measurable)
- Test/lint status
