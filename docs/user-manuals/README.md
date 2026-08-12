# Guardr user manuals (source)

Markdown sources for print-ready PDFs in `public/manuals/`.

| Manual | Source | PDF |
|--------|--------|-----|
| Quick Start | [quick-start.md](./quick-start.md) | `Guardr-Quick-Start.pdf` |
| Client | [client-user-manual.md](./client-user-manual.md) | `Guardr-Client-User-Manual.pdf` |
| Guard | [guard-user-manual.md](./guard-user-manual.md) | `Guardr-Guard-User-Manual.pdf` |
| Staff Ops | [staff-ops-manual.md](./staff-ops-manual.md) | `Guardr-Staff-Ops-Manual.pdf` |
| Combined | (all of the above) | `Guardr-User-Manuals-Combined.pdf` |

Regenerate PDFs:

```bash
npm run docs:manuals-pdf
```

Output is copied to `public/manuals/` for website and in-app downloads at `/manuals/*.pdf`.

## Standalone vs combined

| File | Purpose |
|------|---------|
| `Guardr-Quick-Start.pdf` | Print Quick Start only |
| `Guardr-Client-User-Manual.pdf` | Print client manual only |
| `Guardr-Guard-User-Manual.pdf` | Print guard manual only |
| `Guardr-Staff-Ops-Manual.pdf` | Print staff manual only |
| `Guardr-User-Manuals-Combined.pdf` | Full binder — **merges the four standalone PDFs** in order (plus a binder cover). Content matches the standalone files. |

Each manual is written for its role:

- **Client** — hiring independent contractors; costs, billing, and direct engagement
- **Guard** — independent contractor status; credentials, shifts, payouts
- **Staff** — Guardr employees; governance, marketplace payments pipeline, staff compensation
