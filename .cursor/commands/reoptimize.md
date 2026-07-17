# /reoptimize — Second-pass production refinement

Perform a complete **second-pass optimization**. Assume the selected scope has already been through `/optimize` or equivalent work.

This is the **professional finishing pass** — find subtle issues, edge cases, polish, and refinements that were missed the first time.

## Scope

| Selection | What to do |
|-----------|------------|
| **Current component** | Re-optimize only that component |
| **Current page** | Re-optimize only that page |
| **Selected pages** | Re-optimize all selected pages |
| **Current module** | Re-optimize that module end-to-end |
| **Entire platform** | Re-optimize one platform (website, PWA, or APK) |
| **Entire project** | Full project second pass |

## Mindset

- Review every page, component, workflow, and interaction with **fresh analysis**
- Look **beyond obvious issues**
- Identify improvements previously missed
- Refine every detail until production quality is reached
- **Continue refining** until no meaningful improvements remain

## Review

- UI/UX, responsiveness, accessibility, performance
- Navigation, visual hierarchy, typography, animations
- Loading, empty, and error states
- Forms, APIs, authentication, security
- Database interactions
- Code quality and maintainability

## Platform review

### Website (browser)

- Desktop, tablet, and mobile — each independently refined

### PWA (FULL • LITE)

- Verify feature parity with website
- Further reduce unnecessary resource usage
- Improve install experience and offline reliability

### Android APK (FULL • PREMIUM)

- Improve native feel and platform integrations
- Improve animations, performance, and user experience

## Difference from `/optimize`

| Command | Purpose |
|---------|---------|
| **`/optimize`** | First comprehensive pass — brings scope to production quality |
| **`/reoptimize`** | Second or later pass — subtle polish, edge cases, exceptional finish |

## Rules

- Do not rebuild from scratch
- Preserve branding, architecture, workflows, auth, permissions, and business logic
- Run `npm run lint` and `npm test` when code changes
- Stop when further changes would be negligible or cosmetic-only — note that in the report

## Branch & PR

- Branch: `cursor/reoptimize-<descriptive-name>-e760`

## Report back

- Scope re-optimized
- Subtle issues found and fixed (vs what `/optimize` would have caught)
- Remaining micro-improvements (if any)
- Test/lint status
- Final production readiness assessment

## Goal

Transform a polished application into an **exceptional** production-ready application.
