# Guardr fix plan (parked until Cursor on-demand usage is turned on)

Saved Sep 25, 2026. Nothing launched yet. When Markeith turns on on-demand usage, launch the cloud agents below against https://github.com/TheMarkkBradonCollective/Guardr, attaching GAP-ANALYSIS.md to each. Every fix goes up as a PR for his review before merging.

Source material in this folder:
- GAP-ANALYSIS.md: full gap list (A must-have, B soon, C nice-to-have), the two-way platform review, and the suggested page structure for each role (section 4.3)
- PAGE-INVENTORY.md: every page and button, marked works, placeholder, broken, or missing
- DEFECTS.md: audit defects AUD-001 to AUD-021 (also on GitHub issue #1043)

## Blocker outside the code (not a coding task)
- guardr.co returns Vercel "402 Payment required, DEPLOYMENT_DISABLED" (confirmed 3:25 PM PT Sep 25).
- GitHub Actions haven't had a good run since Aug 26. Both likely billing or plan problems. Markeith chose not to look into Vercel for now.

## Wave 1 (ready to launch)
### Task 1: server-side auth, data access, locked money endpoints (A2, A3, and the checkout part of A7)
- Move password checks to the server. No password hashes sent to the browser, no "any password works" path, real server sessions. Migrate existing users without locking them out.
- Tighten database row-level security so the public key can't read or write the core tables. Privileged actions go through server endpoints that check role.
- Payout and refund endpoints verify who is calling and their role. The amount and destination come from server records. Any force override is limited to senior staff and logged.
- Checkout computes the amount on the server and refuses jobs that have ended or aren't payable.
- No production env or database changes. SQL ships as migration files with notes on how to apply them. Land the money lockdown first if the auth work is large.

### Task 2: server scheduled job (A7, A8)
- One cron route protected by a secret. It releases due automatic payouts exactly once, expires Open jobs past their end time and notifies the client, and marks ended jobs as not payable.
- Remove the payout loop that only runs in a staff member's browser tab (`processDueAutoPayouts` in `App.tsx`).
- Check whether the cron schedule needs a paid Vercel plan.
- Keep changes separate from Task 1, putting payout logic in a shared server module.

## Wave 2 (after Wave 1 merges)
3. Staging with Stripe test mode, plus a staff "mark paid / waive" control (A4, AUD-017). Then run the full pay, apply, shift, payout loop once, with the Stripe Manager bot.
4. Fix the Business credential gate so verified businesses can post (A5, AUD-009/016).
5. Merge or finish PRs #1031 and #1033 (website sends active users to the app, A6) and #1015 (maps API key, A11).
6. Password reset, plus email notifications (A9).
7. Make one-role hold clears stick (A10, AUD-008). Add a city staff-cap control (A13, AUD-006).
8. User self-delete account, and a staff delete that removes related data (A12, AUD-011, required by Google Play).

## Wave 3 (two-way platform: give every role real actions)
- Guards: withdraw an application, call off an accepted shift, dispute pay, save availability to the server.
- Clients: save drafts, real recurring shifts, disputes and refunds beyond overtime, business team logins.
- PPOs: onboard and dispatch their own guards, more Live ops actions.
- Staff: working dispute payouts (no notification-only buttons), partial refunds, incident workflow (status, owner, escalation), assign or reassign a guard on an existing job, handle Stripe chargeback, refund, and payout events.
- Structure: split `App.tsx` and the 1,156-line client job panel, give job detail and active shift their own pages instead of overlays on `/guard/map`, split `/staff/applications` into its own queues, and replace silent redirects with real not-found pages. Follow section 4.3 of GAP-ANALYSIS.md.
- Hook up built-but-unconnected features: Approve full team, Apply as team lead, staff create ticket.
- Small fixes: staff role picker at signup (AUD-001), blank Applications page (AUD-002/003), activation progress screen, `/client/sites` route (AUD-018), settings text pointing to menu items that don't exist (AUD-010), Downloads link (AUD-021).

## Later (nice-to-have)
iOS app, duplicate or repost a job, extend a shift, analytics export, captcha on sign-up, an accessibility review, removing about 30 unused components, labels on the payments tiles.
