# /improveit — Senior architect improvements

Analyze the selected scope like a senior software architect and implement improvements for usability, maintainability, scalability, accessibility, performance, and user experience beyond the original requirements.

## Scope

| Selection | What to do |
|-----------|------------|
| **Component / module** | Deep improvement of that unit |
| **Feature** | End-to-end improvement across UI, API, and data |
| **Entire project** | Strategic improvement pass |

## Improve across

- **Usability** — fewer steps, clearer copy, better defaults
- **Maintainability** — simpler abstractions, less duplication, clearer types
- **Scalability** — query patterns, caching, pagination, realtime efficiency
- **Accessibility** — keyboard, screen readers, contrast, focus management
- **Performance** — render cost, bundle size, network round-trips
- **UX** — polish beyond minimum viable (animations, empty states, error recovery)

## Rules

- Preserve existing functionality unless improvement clearly supersedes it
- Prefer incremental, reviewable changes over rewrites
- Explain trade-offs for non-obvious architectural choices
- Run `npm run lint` and `npm test`

## Branch & PR

- Branch: `cursor/improveit-<descriptive-name>-e760`

## Report back

- Improvements implemented (with rationale)
- Trade-offs and alternatives considered
- Files changed
- Further recommendations
- Test/lint status
