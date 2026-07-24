# /read — Complete project documentation

Produce complete, accurate project documentation that an AI or developer can use to understand Guardr end-to-end without spelunking the codebase.

## Expected outcome

A comprehensive written guide covering product behavior, technical architecture, roles, and current project state. Write in plain language. Prefer updating or creating `docs/guardr-general-guide.md` unless asked for a different format.

## Include

### Product overview

- Full application overview — what Guardr is and who it serves
- Landing page workflow
- Authentication flow
- User registration process

### Role workflows

- **Staff** workflow (Moderator → Founder tiers)
- **Guard** workflow (onboarding, jobs, shifts, payouts)
- **Client** workflow (posting jobs, approving guards, payments)
- **Admin** workflow
- **Owner / Master Admin** workflow

### Technical reference

- Database structure (tables, key relationships, RLS patterns)
- API flow (Supabase client, RPC, edge functions, realtime)
- Role permissions matrix
- Dashboard explanations per role
- Navigation map (routes, shells, entry points)
- Feature list (shipped vs partial)

### Project status

- Current progress
- Remaining tasks
- Known issues

## Rules

- Read the codebase and existing docs (`docs/`, `supabase/`, `src/`) — do not guess
- Call out gaps where behavior is unclear or incomplete
- Use the user's voice: simple, direct, no marketing fluff
- If a section does not apply yet, say so explicitly
- Keep structure scannable with headings and tables where helpful

## Report back

- Where documentation was written or updated (file paths)
- Sections completed vs still missing
- Assumptions or open questions that need human input
- Suggested next doc improvements
