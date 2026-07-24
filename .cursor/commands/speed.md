# /speed — Performance optimization

Optimize performance, loading times, rendering, bundle size, database queries, images, caching, and responsiveness.

## Scope

| Selection | What to do |
|-----------|------------|
| **Page / component** | Optimize that scope |
| **Feature** | Optimize data fetching and render path |
| **Entire application** | Full performance pass |

## Optimize

- Remove unused and duplicate code
- Lazy-load routes and heavy components
- Reduce unnecessary re-renders (memo, stable deps)
- Trim JavaScript and CSS bundle size
- Optimize images and assets (format, size, lazy load)
- Database query efficiency (indexes, N+1, select scope)
- Caching (service worker, HTTP cache, client cache)
- Loading states and perceived performance (skeletons, prefetch)

## Measure

- Run `npm run build` and note bundle sizes when changed
- Run `npm test` after optimizations
- Call out before/after where measurable

## Rules

- Do not sacrifice correctness for speed
- Preserve functionality unless change is a clear win

## Branch & PR

- Branch: `cursor/speed-<descriptive-name>-e760`

## Report back

- Optimizations applied
- Estimated impact (bundle size, query count, etc.)
- Files changed
- Further recommendations
