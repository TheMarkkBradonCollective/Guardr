# /optimize — First-pass production optimization

Optimize the selected scope for **production quality**. This is the first comprehensive optimization pass — it brings the project up to production-ready standard.

## Scope

| Selection | What to do |
|-----------|------------|
| **Current component** | Optimize only that component |
| **Current page** | Optimize only that page |
| **Selected pages** | Optimize all selected pages |
| **Current module** | Optimize that module end-to-end |
| **Entire platform** | Optimize one platform (website, PWA, or APK) |
| **Entire project** | Full project optimization |

When no specific selection is given, ask what to target or infer from context.

## Preserve

Do **not** rebuild from scratch unless absolutely necessary.

- Existing branding and design language
- Architecture and folder structure
- Workflows and business logic
- Authentication and permissions
- Existing functionality

## Automatically improve

- UI/UX issues — find and repair
- Layouts, responsiveness, and accessibility
- Navigation, animations, typography, spacing, visual hierarchy
- Visual and interaction consistency
- Performance — duplicate code, dead code, assets, loading speed
- Verify every workflow still functions correctly after changes

## Platform optimization

### Website (browser)

Independently optimize each form factor — **do not scale desktop down**:

| Surface | Form factor |
|---------|-------------|
| **Desktop** | ≥1024px |
| **Tablet** | 768–1023px |
| **Mobile** | <768px |

### PWA (FULL • LITE)

- Maintain the **complete feature set**
- Optimize as a lightweight installable application
- Improve startup speed, offline functionality, caching, synchronization
- Improve battery and bandwidth efficiency

### Android APK (FULL • PREMIUM)

- Maintain the **complete feature set**
- Optimize native navigation and Android integrations
- Improve animations, device performance, battery usage
- Improve overall native experience

## Architecture

```
shellKind (browser | pwa | native)  ×  formFactor (mobile | tablet | desktop)  →  viewSurface
```

See `docs/CROSS_PLATFORM.md`, `/fix`, and `/speed` for related surface work.

## Rules

- Run `npm run lint` and `npm test` when code changes
- Fix issues — do not only report them
- Use `/reoptimize` for a second pass after this command

## Branch & PR

- Branch: `cursor/optimize-<descriptive-name>-e760`

## Report back

- Scope optimized
- Surfaces touched (desktop / tablet / mobile / PWA / APK)
- Issues found and fixed
- Performance improvements (if measurable)
- Test/lint status
- Production readiness assessment

## Goal

Make the selected scope cleaner, faster, more polished, more maintainable, and production-ready.
