# Guardr Staff Ops Manual

For platform staff: **Support → Moderator → Administrator → Manager → Director → Founder**.

Guardr staff verify marketplace eligibility, run operations, and support users. Guardr is **not** a PPO, employer of guards, or staffing agency. Staff do **not** dispatch guards for normal jobs — placement is for **dispute or safety exceptions only**.

**Related:** [Quick Start](./quick-start.md) · [Client Manual](./client-user-manual.md) · [Guard Manual](./guard-user-manual.md) · In-app **Guide** (sidebar)

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

## Part B — Role hierarchy

Higher tiers inherit lower-tier capabilities unless a restriction is noted.

| Role | Core job |
|------|----------|
| **Support** | Help desk, tickets, incident review, monitor activity |
| **Moderator** | Approve **applications** (clients/guards); monitor field |
| **Administrator** | Verify **credentials**, job offer review, disputes, suspend |
| **Manager** | Executive ops/payments tools, staff time/pay rates, markets, permissions |
| **Director** | Full finance, staff team, trusted status, staff hiring review |
| **Founder** | Platform governance, payment methods, Director management |

**Governance rules**

- Support does **not** approve applications or verify credentials.
- Moderators approve applications — they do **not** verify documents.
- Administrators verify credentials and review jobs — they do **not** manage Directors.
- Managers share many executive payment/ops controls with Directors; city-market flagging for Director review is Manager-specific where enabled.
- Directors run ops/finance — they do **not** manage other Directors.
- Founders oversee the platform — they do **not** moderate other Founders.

---

## Part C — Shared staff pages

Access depends on role (see matrix below).

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
| **Payments** | Deposits, payouts, cash, dispute holds |
| **Staff** | Team roster and hiring |
| **Locations** / **Service Areas** | Shared sites; city markets |
| **Payment settings** / **Marketplace agreements** / **Audit log** / **Permissions** / **Settings** / **Dev notes** | Configuration and governance |

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
| Dev notes | — | — | — | ✓* | ✓ | ✓ |

\*Manager access follows executive-ops / permission catalog grants in the live app. If a control is hidden, you do not have that grant — escalate to Director/Founder.

---

## Part D — Support

Help-desk tier. You handle people and reports — not account activation.

### Can

- Reply to **Support** tickets and formal reports
- Review field reports in **Incidents**
- Monitor **Map** / **Overview**
- Message clients, guards, and staff

### Cannot

- Approve guard or client applications
- Verify credentials, government ID, or insurance
- Approve job listings, handle disputes, or suspend users
- Access **Payments**, fees, or staff permission controls

### Daily workflow

1. **Support** inbox — answer open tickets; set status (open / in progress / resolved).
2. **Incidents** — review new field reports; escalate safety issues.
3. **Overview** / **Map** — situational awareness; flag issues for Moderator+.

---

## Part E — Moderator

Front line for marketplace **application** intake and field monitoring.

### Can (in addition to Support)

- Approve **client** accounts (**Applications**)
- Approve **guard applications** (`pending` → `approved`) — slide to approve
- Monitor **Jobs** / **Map**; view credential queues (verification is Admin+)
- Desktop **Stats** where available

### Cannot

- Verify credentials or government ID/insurance
- Approve job listings
- Handle disputes, suspend users, or access **Payments**
- Add staff or change platform fees

### Guard activation (your slice)

| Step | Your action | Result |
|------|-------------|--------|
| 1 | **Slide to approve application** | `pending` → `approved` |
| 2 | (Administrator+) verifies all five credentials | Account **auto-activates** → `active` |

You do **not** verify documents or press a separate “activate” control.

### Daily workflow

1. **Overview** — approval queue counts.
2. **Applications** — clients and guard intake.
3. Hand credential work to Administrator+ via **Credentials**.
4. **Map** / **Jobs** — active shifts and **No Self Audit** flags.
5. **Messages** / **Support** — tickets.

---

## Part F — Administrator

Credential verification and day-to-day marketplace operations.

### Can (in addition to Moderator)

- Verify government ID, guard card, COI, PTA/UOF, CE, and optional extras (**Credentials** / **Guards**)
- Approve or decline **job offers** (**Applications**)
- Handle **Disputes**; suspend/restore users
- **Analytics**; general **Settings** (integrations / content — not payment methods)
- Locations QC / shared site management as granted

### Credential verification workflow

1. Open **Credentials** (or guard detail).
2. Review each pending upload — nothing auto-verifies.
3. **Verify** or **Reject** (with reason / resubmit when needed).
4. Optional extras (firearms, medical, FEMA, etc.) only surface to clients after verification.
5. When all **five activation credentials** are verified, the guard account **activates automatically**.

### Job offer review

1. **Applications** → job offers queue.
2. Check location, schedule, pay, requirements, coordinates.
3. **Slide to approve job** or **Decline** with reason.

### Cannot

- Access **Payments**, executive fee controls, marketplace agreements, or audit log (unless a higher role / grant applies)
- Manage Director accounts

---

## Part G — Manager

Between Administrator and Director. Shares **executive ops and payment controls** with Director/Founder where the permission catalog allows.

### Typical Manager responsibilities

- Everything Administrators can do (unless restricted by overrides)
- **Payments** pipeline tools shared with executive ops
- Staff **time** adjustments and **hourly pay rates** for tracked staff time
- **Permissions** / approval-rule configuration (Manager+)
- **Service Areas** visibility; **flag cities for Director review** (Manager-only where enabled)
- Operational overrides (job edits / staff job management) as granted

### Escalate to Director / Founder for

- Staff revenue-share compensation confirmations (Director+)
- Opening/closing city markets (Director+)
- Assigning the city Manager for a market (Director+)
- Founder-only payment method / platform mode changes

---

## Part H — Director

Unrestricted operational access and financial controls. You also run **staff hiring** review for new platform employees.

### Can (in addition to Administrator / Manager executive tools)

- Full **Payments**: deposits, payouts, cash overrides, refunds, dispute holds
- Platform **fees** in **Payment settings**
- **Marketplace agreements**, **Audit log**, **Permissions**
- **Staff** team: add/manage Moderators, Administrators, and lower tiers (not other Directors)
- Mark guards/clients **trusted**
- Place a guard on a job **only** for dispute/safety (confirmation required)
- **Service Areas** open/closed/waitlist; assign city Manager
- Staff compensation (revenue-share) settings and payout confirmation
- Review **staff applications** and verify **staff government IDs** for onboarding
- **Dev notes**

### Financial workflow

- Most guard payouts auto-release ~48h after completion — no action needed.
- **Dispute hold** — manually release only when the dispute is resolved.
- Watch **Payments** for overtime awaiting client payment and cash exceptions.

### Staff hiring workflow

1. Applicant uses **Apply to work at Guardr**.
2. Review application details in **Staff** / review panels.
3. Approve application when appropriate.
4. Verify staff government ID when submitted.
5. Applicant completes Stripe; account **auto-activates** when the checklist is clear.

---

## Part I — Founder

Platform governance overseer. Everything Directors can do, plus:

| Action | Where |
|--------|-------|
| Payment methods / platform modes | **Payment settings** |
| Founder homepage message | **Settings → Founder message** (or equivalent) |
| Manage **Director** accounts | **Staff** |
| Ultimate governance | All panels |

**Cannot** moderate or suspend other Founder accounts.

---

## Part J — Marketplace job lifecycle (staff view)

```
Client posts → Admin+ reviews job offer → Open
→ Client pays → Guard applies → Client approves (staff place only for dispute/safety)
→ Guard heads / arrives / starts + self-audit → Client confirms photos
→ End shift → Completed → Payouts (~48h) / invoices
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
| Credential reject / resubmit | Guard uploads again |
| Overtime dispute | Admin+ disputes; Director+ payments release |
| Safety / dispute placement | Director+ exception only |

---

## Part K — Messages & support inbox

- **Messages** — job and staff chat.
- **Support** — ticket inbox for client/guard **Contact support** and **File a report** threads.
- Resolved tickets may be deletable by roles with support-inbox access.
- Guards on the activation screen get an **Activation help** thread — treat those as onboarding priority.

---

## Need help?

Escalate inside Guardr by role, or use internal staff chat. External user contact remains support@guardr.co for marketplace users.
