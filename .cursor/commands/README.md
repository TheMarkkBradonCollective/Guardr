# Guardr slash commands

Cursor slash commands for Guardr development. Invoke as `/commandname` in Cursor chat.

## Release and git

| Command | Purpose |
|---------|---------|
| `/merge` | Merge completed open PRs to `main`; close merged/superseded PRs; lint/test |
| `/update` | Full platform release: merge + schema + version + web/PWA/APK + deploy + docs |
| `/automerge` | Auto-merge each completed task to `main` until disabled |
| `/deploy` | Production deploy checklist when `main` is ready |
| `/rollback` | Safely revert the last merged change on `main` |
| `/continue` | Resume the last incomplete task or branch |

## Build and finish work

| Command | Purpose |
|---------|---------|
| `/build` | Build a feature, page, component, or system end-to-end |
| `/finish` | Clear TODOs, stubs, mocks, and incomplete wiring |
| `/clean` | Remove dead code, debug artifacts, and unused dependencies |
| `/improve` | Senior-architect pass: UX, maintainability, performance |
| `/plan` | Prioritized development roadmap (planning only) |

## UI, theme, and surfaces

| Command | Purpose |
|---------|---------|
| `/fix` | Scope-aware UI/UX optimization (desktop / tablet / mobile / PWA / APK) |
| `/design` | Redesign selected page(s); preserve functionality |
| `/theme` | Light / Dark / Grey theme audit and fixes |
| `/mobile` | Mobile web, PWA, and APK optimization only |
| `/uber` | Uber Base Web presentation-layer redesign |
| `/uberplatforms` | Per-platform Uber Base Web redesign (mandatory independent layouts) |
| `/optimize` | Cross-cutting optimization pass |

## Audit and test

| Command | Purpose |
|---------|---------|
| `/run` | Scope-aware audit, validation, optimization, and repair |
| `/fullaudit` | Comprehensive production-readiness audit |
| `/test` | Functionality testing without design changes |
| `/secure` | Security audit and repair |
| `/speed` | Performance optimization |
| `/websiteaudit` | Full website audit (all breakpoints) |
| `/websitedesktopaudit` | Desktop website audit |
| `/websitetabletaudit` | Tablet website audit |
| `/websitemobileaudit` | Mobile website audit |
| `/pwaaudit` | PWA audit |
| `/apkaudit` | Android APK audit |

## Data and docs

| Command | Purpose |
|---------|---------|
| `/sql` | Database audit, migrations, RLS, and schema sync |
| `/read` | Complete project documentation for AI/developers |
| `/document` | Generate or refresh docs for a feature, role, or the whole app |

## Platform setup

| Command | Purpose |
|---------|---------|
| `/setupplatforms` | Cross-platform setup overview |
| `/setupwebsite` | Website setup |
| `/setupdesktop` | Desktop layout setup |
| `/setuptablet` | Tablet layout setup |
| `/setupmobile` | Mobile layout setup |
| `/setuppwa` | PWA setup |
| `/setupapk` | Android APK setup |

## Typical workflows

```
Daily integration:     /merge
Ship a release:        /update   (or /merge then /update)
After merge, deploy:   /deploy
New feature:           /build → /test → /merge
UI polish:             /fix or /design → /theme
Pre-release hardening: /fullaudit or /run
```

## Branch naming

- Release/integration: `cursor/merge-to-main-8442`, `cursor/full-platform-update-8442`
- Feature work: `cursor/<command>-<descriptive-name>-8442` (or `-e760` where noted in the command file)

## Key docs

- `docs/guardr-general-guide.md` — product and technical guide
- `docs/CROSS_PLATFORM.md` — surface model (desktop / tablet / mobile / PWA / APK)
- `docs/guardedesign.md` — design language
- `docs/uber-patterns.md` — Uber Base Web patterns
- `docs/DEV-UPDATES.md` — release changelog
