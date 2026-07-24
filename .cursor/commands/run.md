# /run — Complete audit, validation, optimization, and repair

Perform a complete audit, validation, optimization, and repair of the **selected scope**. Audit every part of the selected scope, automatically identify issues, repair them, optimize where needed, and verify fixes before marking complete.

## Scope

| Selection | What to do |
|-----------|------------|
| **Current component** | Audit and repair only that component |
| **Current page** | Audit and repair only that page |
| **Selected pages** | Audit and repair all selected pages |
| **Entire website/application** | Full project audit and repair |

When no specific selection is given, ask what to target or infer scope from context (open files, recent edits, or an explicit area name).

## UI/UX

- Find broken layouts
- Fix alignment issues
- Fix spacing inconsistencies
- Fix typography
- Fix colors and contrast
- Verify animations
- Verify loading states
- Verify empty states
- Verify error states
- Verify success states
- Verify modals, drawers, dialogs, and popups
- Verify navigation
- Verify icons
- Verify accessibility
- Verify touch targets
- Verify responsive behavior

## Responsive audit

### Website

Each layout must be independently designed and optimized for its screen size. **Do not simply scale the desktop version.**

- Desktop
- Laptop
- Tablet
- Mobile

### PWA

Optimize as a **lightweight experience**. Verify:

- Installation
- Offline mode
- Caching
- Service workers
- Synchronization
- Navigation
- Responsiveness

### APK

Optimize as the **premium mobile experience**. Verify:

- Native-style navigation
- Android lifecycle
- Notifications
- Permissions
- Camera
- GPS
- Storage
- Responsiveness

## Functionality

Test and repair as needed:

- Every button, link, form, modal, menu, search, and filter
- Every upload and download
- Every API request and route
- Every role and permission

## Authentication

Verify and repair:

- Registration, login, logout, password reset
- Session handling and token validation
- Role security

## Database

Verify and repair:

- Schema, relationships, constraints, indexes, queries, migrations
- Duplicate data removal
- Data integrity checks

Update `supabase/complete_schema_setup.sql` when schema changes are made.

## Performance

- Remove unused and duplicate code
- Optimize assets, images, JavaScript, and CSS
- Optimize rendering
- Improve loading speed and memory usage

## Security

Verify:

- Authorization and authentication
- Input validation and API security
- SQL protection, XSS protection, CSRF protection
- Secure storage

## Code quality

- Fix console errors and warnings
- Fix broken imports and dependencies
- Remove dead code
- Standardize formatting
- Improve maintainability

## Production readiness

Verify:

- Production build (`npm run build`)
- Deployment configuration
- Environment variables
- Version consistency (website, PWA, APK)
- Release configuration

Run `npm run lint` and `npm test` before finishing.

## Completion requirements

- **Repair every issue found** — do not stop at reporting problems
- Continue until all identified issues in scope are resolved
- Preserve existing functionality unless a change improves stability, usability, or performance
- If something is blocked (missing credentials, external service down), document it clearly under Remaining Concerns

## Branch & PR

- Branch: `cursor/run-<descriptive-name>-e760`
- Commit and push as you go

## Final report

Produce a summary with:

- **Issues Found**
- **Issues Fixed**
- **Remaining Concerns** (if any)
- **Recommendations**
- **Overall Health Score** (e.g. 1–10 with brief rationale)
- **Production Readiness Status** (Ready / Needs work / Blocked)
