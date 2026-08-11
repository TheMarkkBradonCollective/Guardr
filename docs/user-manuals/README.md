# Guardr User Manuals

Role-based manuals for Guardr (operated by Signature Security Specialist, LLC). Guardr is a **technology marketplace** — not an employer, PPO, or staffing agency.

## Print-ready PDFs (US Letter)

Open and print these directly. Each file has a cover page, running headers/footers, and page numbers.

**Download on the live site / app**

- Public page: [guardr.co/manuals](https://guardr.co/manuals) (`public/manuals/`)
- In-app: **Guide → Download manuals** (role-filtered PDF links)
- Landing footer: **Manuals (PDF)**

| Manual | Repo PDF | Public URL |
|--------|----------|------------|
| Quick Start | [pdf/Guardr-Quick-Start.pdf](./pdf/Guardr-Quick-Start.pdf) | `/manuals/Guardr-Quick-Start.pdf` |
| Client User Manual | [pdf/Guardr-Client-User-Manual.pdf](./pdf/Guardr-Client-User-Manual.pdf) | `/manuals/Guardr-Client-User-Manual.pdf` |
| Guard User Manual | [pdf/Guardr-Guard-User-Manual.pdf](./pdf/Guardr-Guard-User-Manual.pdf) | `/manuals/Guardr-Guard-User-Manual.pdf` |
| Staff Ops Manual | [pdf/Guardr-Staff-Ops-Manual.pdf](./pdf/Guardr-Staff-Ops-Manual.pdf) | `/manuals/Guardr-Staff-Ops-Manual.pdf` |
| Combined (all) | [pdf/Guardr-User-Manuals-Combined.pdf](./pdf/Guardr-User-Manuals-Combined.pdf) | `/manuals/Guardr-User-Manuals-Combined.pdf` |

Regenerate after editing the Markdown sources (also syncs into `public/manuals/`):

```bash
npm run docs:manuals-pdf
```

## Markdown sources

| Manual | Audience | File |
|--------|----------|------|
| [Quick Start](./quick-start.md) | Anyone new | First path for client, guard, or staff |
| [Client User Manual](./client-user-manual.md) | Businesses / property owners | Post jobs, hire, pay, confirm coverage |
| [Guard User Manual](./guard-user-manual.md) | Licensed independent contractors | Credentials, jobs, shifts, pay |
| [Staff Ops Manual](./staff-ops-manual.md) | Support → Founder | Onboarding, approvals, verification, ops, finance |

**Do not confuse these paths:**

- **I need security** → Client (hire guards)
- **I'm a guard** → Guard (marketplace IC work)
- **Apply to work at Guardr** → Staff (platform jobs)

In-app guide (all roles): [guardr.co/guide](https://guardr.co/guide) · Product overview: [../guardr.md](../guardr.md)
