# Guardr Staff Ops Manual

For **Guardr platform employees**: Support → Moderator → Administrator → Manager → Director → Founder.

---

## Who staff are on Guardr (read this first)

| Staff (this manual) | Marketplace guards & clients |
|---------------------|------------------------------|
| **Employees / operators** of Signature Security Specialist, LLC via **Apply to work at Guardr** | **Independent contractors** (guards) and **business clients** using the marketplace |
| Run verification, ops, payments pipeline, and platform governance | Post jobs, accept work, and contract **directly with each other** per assignment |
| Paid through **staff compensation** (revenue share + hourly add-ons) | Guards paid per shift; clients pay posted rates |
| **Cannot** accept field guard jobs or work client sites as marketplace guards | Cannot access staff ops tools |

Guardr is **not** a private patrol operator (PPO), guard employer, or staffing agency for marketplace work. Staff verify eligibility and operate the platform — you do **not** dispatch guards for normal jobs. **Placement by staff is for dispute or safety exceptions only** (Director+).

**Related:** [Quick Start](./quick-start.md) · [Client Manual](./client-user-manual.md) · [Guard Manual](./guard-user-manual.md) · In-app **Guide**

---

## Part A — New hire onboarding (all staff roles)

### A1. Apply the right way

1. On [guardr.co](https://guardr.co), choose **Apply to work at Guardr**.
2. Do **not** sign up as Guard or Client to get a Guardr job. Those paths are the security marketplace only.
3. Submit your application (experience, city, work history, availability, and related fields).

### A2. Pending checklist

Sign in anytime while pending/approved. Complete:

| Step | You | Staff reviewer |
|------|-----|----------------|
| **Application submitted** | Application form complete | **Director** reviews / approves |
| **Government ID verified** | Upload front, back, selfie | **Director** verifies |
| **Payout bank connected** | Finish Stripe Connect (payouts enabled) | — |

When the checklist is ready, your account moves to **active** automatically (`pending` → `approved` → `active`).

Until active, you stay on the staff pending/activation experience — finish ID and Stripe rather than using full ops tools.

### A3. After you are active

Use the staff workspace for your assigned role. Escalate by tier: Support → Moderator → Administrator → Manager → Director → Founder.

---

## Part B — Role hierarchy and governance

Higher tiers inherit lower-tier capabilities unless a restriction is noted.

| Role | Core job |
|------|----------|
| **Support** | Help desk, tickets, incident review, monitor activity |
| **Moderator** | Approve **applications** (clients/guards); monitor field |
| **Administrator** | Verify **credentials**, job offer review, disputes, suspend |
| **Manager** | Executive ops/payments tools, staff time/pay rates, markets, permissions |
| **Director** | Full finance, staff team, trusted status, staff hiring review |
| **Founder** | Platform governance, payment methods, Director management |

### Governance rules — who may decide what

These limits exist so marketplace integrity, legal positioning, and financial controls stay consistent. **Do not bypass your tier** — escalate instead.

| Rule | Reason |
|------|--------|
| Support does **not** approve applications or verify credentials | Prevents unqualified account activation |
| Moderators approve applications — they do **not** verify documents | Separation of intake vs document proof |
| Administrators verify credentials and review jobs — they do **not** manage Directors | Credential fraud requires trained review; Director tier is HR/governance |
| Managers share executive payment/ops controls with Directors where granted | Ops scale without giving every Manager full HR authority |
| Directors run ops/finance — they do **not** manage other Directors | Prevents circular HR authority |
| Founders oversee the platform — they do **not** moderate other Founders | Governance at the top tier |
| Staff **never** accept marketplace guard jobs | Avoids conflict between employee and contractor roles |
| Staff **place guards on jobs** only for dispute/safety (Director+) | Normal placement is **client approval**, not dispatch |

---

## Part C — How staff pay works (Guardr employees)

Staff compensation is **separate** from guard/client marketplace money. You are paid as a **platform employee** for operating Guardr, not per guard shift.

### C1. Two parts of staff pay

| Component | What it is | Who configures |
|-----------|----------|----------------|
| **Revenue share (base)** | Your role's **percentage of collected platform fees** in each pay period, split evenly among active staff in that role | Director / Founder in **Payment settings** |
| **Prop 22 hourly add-ons** | **Tracked hours × your role hourly rate** — added on top of base | Hours from **Profile → Timesheets**; rates editable by Manager+ |
| **Manual bonus** | Optional add-on amount | Director confirms on **Payments** |

**Important:** Adjustments are **add-only**. There are **no deductions** from staff compensation through this system.

### C2. Pay periods and defaults

| Setting | Typical value |
|---------|---------------|
| **Cadence** | Weekly (Monday–Sunday UTC) or monthly — set in **Payment settings** |
| **Eligible roles** | Support, Moderator, Administrator, Manager, Director, Founder |
| **Fee recognition** | Only **collected** platform fees count (after client payment / deposit rules are satisfied) |

**Default role allocation (example — live settings may differ):**

| Role | Share of collected fees | Cap / period | Hourly add-on rate |
|------|-------------------------|--------------|-------------------|
| Support | 1.5% | $400 | $18/hr |
| Moderator | 2.0% | $600 | $20/hr |
| Administrator | 2.5% | $800 | $22/hr |
| Manager | 3.0% | $1,200 | $28/hr |
| Director | 4.0% | $2,000 | $35/hr |
| Founder | 5.0% | $3,000 | $40/hr |

Each role's share is divided among **active staff in that role** for the period. **$0 periods still create payout rows** when no fees were collected.

**Example:** $400 in platform fees collected in a week, 2 Support staff active → each Support base share ≈ 1.5% × $400 ÷ 2 = **$3.00** before hourly add-ons and bonus.

### C3. Timesheets (Prop 22 hourly add-ons)

1. Your work time is tracked automatically while signed in and active on staff ops.
2. View **Profile → Timesheets** for sessions and totals.
3. Managers may apply **time adjustments** with reason codes.
4. Directors **confirm** hourly add-ons and bonuses on **Payments → Staff compensation**.

Clock time drives hourly add-ons — keep sessions accurate. Do not share accounts.

### C4. Payout workflow (staff)

```
Period ends → Base revenue-share row created → Director reviews hours/bonus
→ Director confirms → Finalized payout recorded → Stripe deposit per onboarding
```

1. **Base share** is calculated when platform fees for the period are recognized.
2. **Director / Founder** opens **Payments → Staff compensation**, reviews hourly hours and optional bonus, and **confirms** the payout.
3. Complete **Stripe Connect** during onboarding so compensation can deposit to your bank.

### C5. Stripe Connect (staff)

Same Connect infrastructure as guards, linked to your **staff** record:

- Finish during pending checklist or from profile/payments prompts.
- Stripe holds bank details; Guardr stores Connect account ID only.
- Payouts enabled flag must be true before deposits succeed.

---

## Part D — Marketplace payments (staff operations)

Staff with finance access manage **client → Guardr → guard** money on **Payments**. This is **marketplace** money, not your staff salary.

### D1. Platform fee model (marketplace)

| Setting | Default | Effect |
|---------|---------|--------|
| **Flat fee** | $5/hr | Guard receives client rate minus $5/hr |
| **Percent fee** | Alternative in settings | Fee = % of client hourly rate (capped) |
| **Per-job override** | Open-contract negotiation | Flat or % on that deal only |

Directors / Founders edit global fees in **Payment settings**.

### D2. Payment pipeline (guard/client jobs)

| Stage | Staff action |
|-------|--------------|
| **Awaiting client** | Monitor; approve legacy cash requests if any |
| **Client paid / active** | Monitor job progress |
| **Awaiting guard payout** | Auto-release ~48h after completion; manual release on **dispute hold** only |
| **Guard collection pending** | Fulfill guard **payout invoice** via Stripe transfer |
| **Settled** | No action |

**Director financial snapshot** on **Payments** / **Stats:** gross income, platform fees collected/outstanding, guard payouts paid/due.

### D3. Guard payout rules (for staff reference)

- Guard pay blocked until client paid, job complete, overtime settled, refunds settled.
- **Auto Stripe payout** to guard Connect account: typically **48 hours** after completion.
- Guards are **contractors** — staff do not withhold taxes on guard payouts.

### D4. Client billing (for staff reference)

- Clients pay **posted hourly rate × billable hours × guards** plus approved overtime, schedule extensions, optional tips.
- Staff approve job **listings** before clients pay (Administrator+).
- Invoices and payment history appear on client **Payments** page.

---

## Part E — Shared staff pages

| Page | Typical use |
|------|-------------|
| **Overview** | Queue counts and ops snapshot |
| **Map** / **Jobs** | Live coverage, assignments, flags (e.g. **No Self Audit**) |
| **Applications** | Client/guard application intake; job offer queue |
| **Credentials** | Guard document verification |
| **Clients** / **Guards** | Rosters, detail panels, suspend/trusted (by tier) |
| **Messages** / **Support** | Job/staff chat; support ticket inbox |
| **Incidents** | Field reports |
| **Disputes** | Overtime/payment disputes |
| **Analytics** / **Stats** | Ops and (higher tiers) financial views |
| **Payments** | Marketplace pipeline + **staff compensation** |
| **Staff** | Team roster and hiring |
| **Locations** / **Service Areas** | Shared sites; city markets |
| **Payment settings** / **Marketplace agreements** / **Audit log** / **Permissions** / **Settings** | Configuration and governance |

### Sidebar access matrix

| Page | Support | Moderator | Administrator | Manager | Director | Founder |
|------|---------|-----------|---------------|---------|----------|---------|
| Overview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Map / Jobs | View | ✓ | ✓ | ✓ | ✓ | ✓ |
| Applications | — | Approve apps | + Job offers | ✓ | ✓ | ✓ |
| Credentials | — | View queues | Verify | ✓ | ✓ | ✓ |
| Clients / Guards | View | ✓ | + Suspend | ✓ | + Trusted | ✓ |
| Messages / Incidents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stats (desktop) | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Disputes / Analytics | — | — | ✓ | ✓ | + Financials | ✓ |
| Payments | — | — | — | ✓ | ✓ | ✓ |
| Staff | — | — | — | Limited* | ✓ | + Directors |
| Locations | — | Review/QC | ✓ | ✓ | ✓ | ✓ |
| Service Areas | — | — | — | View / flag | ✓ | ✓ |
| Payment settings | — | — | — | Fees* | Fees | + Methods |
| Marketplace agreements / Audit log / Permissions | — | — | — | ✓* | ✓ | ✓ |
| Settings | — | — | ✓ | ✓ | ✓ | ✓ |

\*Manager access follows executive-ops / permission catalog grants in the live app.

---

## Part F — Support

Help-desk tier. You handle people and reports — not account activation or money.

### Can

- Reply to **Support** tickets and formal reports
- Review field reports in **Incidents**
- Monitor **Map** / **Overview**
- Message clients, guards, and staff

### Cannot

- Approve guard or client applications
- Verify credentials, government ID, or insurance
- Approve job listings, handle disputes, or suspend users
- Access **Payments**, fees, or staff compensation

---

## Part G — Moderator

Front line for marketplace **application** intake and field monitoring.

### Can (in addition to Support)

- Approve **client** accounts (**Applications**)
- Approve **guard applications** (`pending` → `approved`)
- Monitor **Jobs** / **Map**; view credential queues (verification is Admin+)

### Cannot

- Verify credentials or government ID/insurance
- Approve job listings, handle disputes, suspend users, or access **Payments**

### Guard activation (your slice)

| Step | Your action | Result |
|------|-------------|--------|
| 1 | **Slide to approve application** | `pending` → `approved` |
| 2 | (Administrator+) verifies all five credentials | Account **auto-activates** → `active` |

---

## Part H — Administrator

Credential verification and day-to-day marketplace operations.

### Can (in addition to Moderator)

- Verify government ID, guard card, COI, PTA/UOF, CE, and optional extras
- Approve or decline **job offers**
- Handle **Disputes**; suspend/restore users
- **Analytics**; general **Settings**

### Operational standards

- **Reject with clear reason** when documents are unreadable, expired, or wrong type.
- **Never verify** a credential you cannot read or that fails BSIS/insurance requirements.
- Job offer review: confirm location, schedule, pay, and requirements match marketplace policy before **Slide to approve job**.

### Cannot

- Access **Payments**, executive fee controls, or staff compensation confirmation (unless higher role)

---

## Part I — Manager

Between Administrator and Director. Shares **executive ops and payment controls** with Director/Founder where granted.

### Typical responsibilities

- Everything Administrators can do (unless restricted)
- **Payments** pipeline tools shared with executive ops
- Staff **time** adjustments and **hourly pay rates** for tracked staff time
- **Permissions** / approval-rule configuration (Manager+)
- **Service Areas** visibility; flag cities for Director review

### Escalate to Director / Founder for

- Staff revenue-share **compensation confirmations**
- Opening/closing city markets
- Assigning city Manager
- Founder-only payment method / platform mode changes

---

## Part J — Director

Unrestricted operational access and financial controls. You run **staff hiring** review and **staff pay confirmation**.

### Can (in addition to Administrator / Manager)

- Full **Payments**: deposits, payouts, cash overrides, refunds, dispute holds
- Platform **fees** and **staff compensation settings** in **Payment settings**
- **Staff compensation confirmation** (revenue share + hourly add-ons + bonus)
- **Staff** team management (not other Directors)
- Mark guards/clients **trusted**
- Place a guard on a job **only** for dispute/safety (confirmation required)
- Review **staff applications** and verify **staff government IDs**

### Financial workflow

- Most guard payouts auto-release ~48h after completion.
- **Dispute hold** — manually release only when resolved.
- **Staff compensation** — confirm each period on **Payments → Staff compensation** after reviewing timesheets.

### Staff hiring workflow

1. Applicant uses **Apply to work at Guardr**.
2. Review application in **Staff** panels.
3. Approve application; verify staff government ID.
4. Applicant completes Stripe; account **auto-activates** when checklist is clear.

---

## Part K — Founder

Platform governance. Everything Directors can do, plus payment methods, Founder message, and **Director** account management.

**Cannot** moderate or suspend other Founder accounts.

---

## Part L — Marketplace job lifecycle (staff view)

```
Client posts → Admin+ reviews job offer → Open
→ Client pays → Guard applies → Client approves (staff place only for dispute/safety)
→ Guard heads / arrives / starts + self-audit → Client confirms photos
→ End shift → Completed → Guard payout (~48h) / client invoice
→ Overtime or dispute → Disputes + Payments as needed
```

### Who acts next (cheat sheet)

| Situation | Next actor |
|-----------|------------|
| Client or guard account pending | Moderator+ (application) |
| Guard credentials uploaded | Administrator+ (verify) |
| Staff applicant pending | Director (app + ID) |
| Job offer pending review | Administrator+ |
| Guard applied to marketplace job | **Client** |
| Self-audit photos submitted | **Client** confirm |
| Support ticket | Support+ |
| Staff pay period ended | **Director** confirms compensation |
| Overtime dispute | Admin+ disputes; Director+ payments release |
| Safety / dispute placement | Director+ exception only |

---

## Part M — Messages & support inbox

- **Messages** — job and staff chat.
- **Support** — ticket inbox for client/guard **Contact support** and **File a report**.
- Guards on the activation screen get **Activation help** — treat as onboarding priority.

---

## Need help?

Escalate inside Guardr by role, or use internal staff chat. External marketplace users: support@guardr.co
