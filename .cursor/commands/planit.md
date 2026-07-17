# /planit — Development roadmap

Analyze the current project and generate the next recommended development roadmap ordered by priority.

## Analyze

- Read `docs/`, open issues, `docs/DEV-UPDATES.md`, and recent git history
- Scan for TODOs, incomplete features, and known bugs
- Review role workflows for gaps (guard, client, staff)
- Review cross-platform coverage (desktop / tablet / mobile / PWA / APK)
- Review database schema vs app usage
- Review test coverage gaps

## Output roadmap

Ordered list of recommended work:

| Priority | Item | Why | Suggested command |
|----------|------|-----|-------------------|
| P0 | … | … | `/buildit`, `/runit`, etc. |

Group by: **bugs**, **incomplete features**, **UX gaps**, **performance**, **security**, **mobile/PWA/APK**, **docs**, **release prep**.

## Rules

- Be specific — file paths and feature names, not vague advice
- Estimate effort qualitatively (small / medium / large), not calendar time
- Do not implement — planning only unless user asks to start

## Report back

- Top 10 prioritized items
- Quick wins vs large initiatives
- Recommended first command to run (`/buildit`, `/fixit`, `/runit`, etc.)
