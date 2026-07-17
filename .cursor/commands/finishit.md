# /finishit — Finish everything in progress

Finish everything currently in progress. Remove placeholders, TODOs, mock data, and incomplete functionality.

## Scope

| Selection | What to do |
|-----------|------------|
| **Current branch / task** | Finish only the active work |
| **Selected files or feature** | Complete that scope fully |
| **Entire project** | Sweep for all incomplete work project-wide |

## Find and resolve

- `TODO`, `FIXME`, `HACK`, `XXX` comments
- Placeholder text, lorem ipsum, stub components
- Mock data that should be real API calls
- Dead feature flags and half-wired routes
- Empty handlers, `console.log` debug paths left in production code
- Incomplete forms, missing validation, missing error states
- Partial migrations or schema drift vs `complete_schema_setup.sql`

## Rules

- Replace stubs with real implementation — do not hide incomplete work
- Preserve intentional demo/tutorial data if documented as such
- Do not delete features — finish or explicitly scope them out with the user
- Run `npm run lint` and `npm test` before finishing

## Branch & PR

- Branch: `cursor/finishit-<descriptive-name>-e760`

## Report back

- Items found and completed
- Items intentionally left (with reason)
- Files changed
- Test/lint status
