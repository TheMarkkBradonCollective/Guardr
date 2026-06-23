# Guardr — Full App Workflow (Start to Finish)

_Last updated: June 2026_

Guardr connects **clients** who need security coverage with **licensed guards** through a marketplace operated by Guardr staff. Money, credentials, and job status move through clear steps so everyone knows what happens next.

---

## Job status lifecycle

Every job offer moves through these statuses:

| Status | Meaning |
|--------|---------|
| **Draft** | Client started posting but has not submitted yet |
| **Pending review** | Submitted — staff must approve the job listing |
| **Open** | Approved and visible — guards can apply (or client pays to unlock hiring) |
| **Accepted** | A guard is assigned and confirmed |
| **In progress** | Guard has started the shift (clocked in with self-audit) |
| **Completed** | Guard ended the shift |
| **Closed** | Archived / cancelled |

---

## Client workflow

### 1. Sign up and get approved

1. Create a client account and complete company profile.
2. Staff review and approve the client account.
3. Until approved, the client dashboard is limited.

### 2. Post a job offer

**Marketplace job** — open to qualified guards:

1. Go to **Home → Post job offer** (or Jobs).
2. Enter **address**, **state**, and optional **site name**.
3. Tap **Use current location** to fill GPS coordinates (and address when available), or paste latitude and longitude manually. If you skip coordinates, the job is flagged and staff are notified to add them.
4. Enter schedule, requirements, and pay.
5. Submit — status becomes **Pending review**.

**Direct request** — hire a specific guard from their profile:

1. Open **Guards**, pick a guard, tap **Request this guard**.
2. Fill in shift details — use **Use current location** on the address step when posting from the job site.
3. Submit.

### 3. Staff approves the listing

Staff review the job in **Approvals → Job offers** or **Jobs**. When approved, status becomes **Open**.

### 4. Pay for the job

While the job is **Open**, the client pays before a guard is fully locked in:

- **Pay by card** (Stripe) when enabled in platform settings.
- **Pay in cash** — client requests cash payment; staff approves once cash is received.

Payment unlocks guard assignment for marketplace jobs.

### 5. Guard assignment (marketplace jobs)

1. Guards apply to the open job.
2. Staff review applicants and **Send to client** the best fit.
3. Client sees **Approve guard** / **Decline guard** on the job.
4. **Client approves** → guard is assigned (**Accepted**).
5. If staff or client **declines**, the guard is removed from the list and the job stays open for other applicants.

**Direct requests** skip the client approval step — the client already chose that guard.

### 6. While the job is accepted

- The assigned guard sees the job on **Map** and **My jobs**.
- The client does **not** start deployment. The guard starts the shift when they arrive.
- Client can use **Live coverage** and **Job chat** to coordinate.

### 7. Guard starts shift → client confirms self-audit

1. Guard arrives on site (Map → slide **Arrive on site**).
2. Guard slides **Start shift** and completes the **self-audit** (selfie, uniform, shoes) or skips (flagged **No Self Audit** for staff).
3. Job becomes **In progress**.
4. Client opens the job (Jobs or Live coverage) and **Confirms self-audit photos** when ready.
5. Client may also confirm **spot-check** photos if staff uploaded them.

### 8. Job completion and review

1. Guard slides **End shift** when the scheduled window allows clock-out.
2. Job becomes **Completed**; guard pay moves to the payout queue (Stripe or cash per job settings).
3. Client can **Rate the guard** from the job detail.

### 9. Support and reports

Use **More → Support** for help tickets. **More → Reports** for incident history. **More → Coverage** for live job status.

---

## Guard workflow

### 1. Sign up, credentials, and activation

1. Create a guard account and upload **guard card** and required credentials (PTA, Use of Force, etc.).
2. Staff verify ID and certifications in **Approvals**.
3. Staff **approve** then **activate** the guard account when requirements are met.
4. Connect **Stripe** under **Pay** for card payouts (optional if taking cash).

**Grace period:** Guards missing optional training may receive a temporary grace window to claim shifts; when grace expires, the account returns to inactive until credentials are complete.

### 2. Find and apply for jobs

1. **Map** — browse open marketplace jobs near you.
2. **My jobs** — upcoming and past assignments.
3. Slide **Apply for job** when you meet all requirements.
4. For **direct requests** sent to you, slide **Claim job**.

Staff review applications and send the best fit to the client for approval (marketplace jobs).

### 3. Start your shift (you — not the client)

When a job is **Accepted** and clock-in is open (15 minutes before start):

1. Open **Map** — active job sheet appears.
2. Slide **Arrive on site**.
3. Slide **Start shift** → complete **self-audit** photos (or skip with staff follow-up).
4. Job status → **In progress**; timer runs on site.

### 4. On duty

- **Report incident** or **Activity report** as needed.
- **Message client** via job chat.
- View site instructions and operational briefing when unlocked.

### 5. End shift

1. Slide **End shift** during the clock-out window (scheduled end through 15 minutes after).
2. Complete checkout and optional client rating.
3. Job → **Completed**; earnings appear under **Pay**.

### 6. Payouts

- **Stripe** — transfer after staff releases payout when client funds are secured.
- **Cash** — request cash pickup invoice from **Pay** when the job paid cash.

---

## Staff workflow

### 1. Operations overview

**Overview** shows active jobs, guards on duty, approvals queue, and payment alerts. **Map** shows live job geography.

### 2. Approvals queue

| Queue | Action |
|-------|--------|
| **Job offers** | Approve or deny new client listings |
| **Guard applications** | Send guard to client or decline applicant |
| **Client accounts** | Approve new clients |
| **Guard accounts** | Approve profile, verify ID, activate |
| **Credentials** | Verify certification uploads |

### 3. Jobs panel

- Approve pending listings, edit title/location (including **Use current location**), assign guards.
- Upload **self-audit** or **spot-check** photos when guards skipped audit or sent photos offline.
- Monitor **No Self Audit** / **No Spot Check** flags.

### 4. Guard assignment rules

1. Guard applies → staff **Send to client**.
2. Client approves → **Accepted**.
3. Staff or client decline → guard removed; job stays **Open**.
4. Direct hire → assign immediately (no client guard-approval step).

### 5. Payments (Directors / Owners)

| Situation | Staff action |
|-----------|----------------|
| Client cash request pending | Approve or decline |
| Client paid cash | Mark received; deposit to Stripe or pay platform fee |
| Job completed | Release Stripe payout or mark guard paid cash |
| Platform fee only due | Manually deposit fee or pay with card |

Card checkout labels **Pay guard $X with card** when the platform fee is already collected and the remaining deposit funds the guard payout.

### 6. People and support

- **Guards / Clients / Staff** — roster, profiles, moderation.
- **Support inbox** — tickets from all roles.
- **Incidents / Disputes** — escalations tied to jobs.
- **Job chats / Staff chat** — coordination.

### 7. Settings

Owners configure **cash vs card** payment modes, platform fees, and staff roles.

---

## End-to-end sequence (marketplace job)

```
Client posts job
    → Staff approves listing (Open)
    → Client pays
    → Guards apply
    → Staff sends best fit to client
    → Client approves guard (Accepted)
    → Guard arrives → self-audit → In progress
    → Client confirms self-audit photos
    → Guard ends shift (Completed)
    → Staff releases payout / cash settlement
    → Client rates guard
```

---

## Quick reference by role

| Step | Client | Guard | Staff |
|------|--------|-------|-------|
| Post job | ✓ | | Approve listing |
| Pay | ✓ | | Approve cash |
| Apply | | ✓ | |
| Pick guard | Approve | | Send to client |
| Start shift | | ✓ Self-audit | |
| Confirm audit | ✓ | | Upload if missing |
| End shift | | ✓ | |
| Pay guard | | | Release / cash |

---

## Need help?

- **Clients & guards:** Support tab or **More → Support**
- **Staff:** Support inbox in the sidebar
- This guide: **Workflow guide** in the sidebar (staff) or **More** (clients and guards)
