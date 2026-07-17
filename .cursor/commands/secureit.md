# /secureit — Security audit and repair

Audit and repair authentication, authorization, permissions, API security, SQL, XSS, CSRF, and data protection.

## Scope

| Selection | What to do |
|-----------|------------|
| **Feature / page** | Security review of that scope |
| **API / database** | RLS, policies, input validation |
| **Entire application** | Full security pass |

## Audit

### Authentication
- Registration, login, logout, password reset, session handling, token validation

### Authorization
- Role permissions (guard, client, staff tiers)
- RLS policies on every Supabase table
- API route / RPC access control

### Input & output
- Input validation on all forms and API payloads
- XSS prevention (sanitized render, no `dangerouslySetInnerHTML` without audit)
- CSRF where applicable

### Data protection
- SQL injection protection (parameterized queries, RPC)
- Secure storage (no secrets in client code)
- PII handling and least-privilege access

## Rules

- Fix vulnerabilities — do not only report them
- Do not weaken RLS to make tests pass
- Document any risk that requires human decision

## Branch & PR

- Branch: `cursor/secureit-<descriptive-name>-e760`

## Report back

- Vulnerabilities found and fixed
- Remaining risks (severity + recommendation)
- Files and policies changed
- Test/lint status
