# /testit — Comprehensive functionality test

Run a comprehensive functionality test **without making design changes**.

## Scope

| Selection | What to do |
|-----------|------------|
| **Component / page** | Test only that scope |
| **Role** | Test all flows for guard, client, or staff |
| **Entire application** | Full regression pass |

## Test

- Every button, link, form, modal, menu, search, and filter
- Every upload and download
- Every API request and route
- Every role and permission boundary
- Auth flows: registration, login, logout, session expiry
- Realtime: messages, notifications, live updates
- Error paths — not just happy paths

## Do not

- Redesign UI or change styling (use `/fixit` or `/designit` for that)
- Refactor unrelated code

## Do

- Fix functional bugs found during testing
- Add or update automated tests when gaps are found
- Run `npm run lint` and `npm test`

## Report back

- Test matrix (what was tested, pass/fail)
- Bugs found and fixed
- Bugs remaining (with repro steps)
- Automated test count and status
