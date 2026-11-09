# Guardr — Revenue Protection Implementation Plan

**Status:** Engineering implementation proposal; not an activated pricing or enforcement policy  
**Owner:** Signature Security Specialist, LLC  
**Companion policy:** PR #1079 — Platform Revenue & Fee Protection Framework

> **Critical launch guardrail:** This implementation does not approve or activate higher hourly rates, administrative fees, cancellation charges, processor surcharges, penalties, liquidated damages, or non-circumvention remedies. Existing fee schedules and accepted job terms remain authoritative. New charge types must remain disabled until the Founder approves a versioned schedule, required user acceptance is captured, and California payments/marketplace counsel reviews applicable disclosures and agreements.

## Existing foundation verified in the repository

- Personal and business fee schedules with guard-type overrides already exist in `lib/platformFees.ts`.
- Flat and percentage hourly platform fee models already exist.
- Job-level fee/guard-pay snapshots already exist and are protected from live settings rewrites.
- Open-contract fee overrides already exist.
- Overtime approval, client dispute, payment, waiver, and guard payout states already exist in `src/lib/shiftBilling.ts`.
- Early-clock-out refund amounts and statuses already exist.
- The current billing UI exposes client rate, guard rate, platform fee, multi-guard totals, overtime, and early-clock-out refunds.

Do not rebuild these systems. Audit and unify their remaining call sites.

## Workstreams and acceptance criteria

### 1. Unified billing engine
- One calculation source must power estimates, booking confirmation, checkout, invoices, Stripe Connect transfer/payout calculations, overtime, refunds, and finance reporting.
- Each guard on a multi-guard job receives an individually attributable fee and compensation allocation.
- Currency rounding and billable-hour rules are shared and deterministic.
- Payment webhook retries must be idempotent.
- Tips, reimbursements, taxes, and processor costs must be separate from platform revenue.

### 2. Versioned billing snapshots
- Snapshot client hourly rate, fee model, hourly platform fee, guard compensation, account/service category, guard count, duration, currency, fee schedule version, timestamp, and accepted additional-fee configuration.
- Existing jobs retain their snapshot permanently.
- Any change to price, guard count, or duration is an append-only amendment with before/after values, actor, timestamp, reason, and required client/guard acceptance.
- No live schedule update may reprice an existing job.

### 3. Optional administrative fee capability
- Support flat or percentage administrative fee with a clearly named basis (per booking, per guard, or per hour).
- Keep disabled by default.
- A fee is chargeable only if the exact enabled fee version was disclosed and accepted before payment.
- Show it as a separate line item in estimate, confirmation, checkout, receipt, invoice, and refund calculations.
- Do not label processor costs as platform revenue or double-charge the same service.

### 4. Extensions and overtime
- Reuse the existing overtime approval/dispute state machine.
- Client sees the incremental amount before approval.
- Accepted job snapshot governs extensions unless parties expressly accept a new agreement.
- Track extension and overtime as separate append-only adjustments.
- Unapproved or disputed amounts are not collected or included in available guard payouts.
- Reconcile the hourly platform allocation and guard share for the additional approved hours.

### 5. Cancellation, no-show, replacement, and refunds
- Preserve current cancellation/refund behavior.
- Do not add a cancellation or no-show fee until amount, trigger, exceptions, recipients, refund treatment, and agreement wording are approved.
- Any future charge must be shown before confirmation and captured in the immutable snapshot.
- Refunds reverse only the appropriate original line items, proportionally and idempotently.
- Replacement itself is not a billable service unless separately priced and accepted.

### 6. Repeat bookings and narrow transaction-origin protection
- Store origin metadata linking a repeat booking to its original Guardr job where a user intentionally creates a continuation/rebooking through the platform.
- Treat matching as a review signal, not proof of circumvention.
- Exclude independently sourced work and unrelated future work.
- No automatic penalty, debit, suspension, or fee claim from an inferred relationship.
- Any attribution period and contract remedy require California counsel approval and explicit user acceptance before enforcement.
- Provide evidence submission, human review, written decision, and appeal.

### 7. Financial ledger and reconciliation
- Append-only ledger rows for client charge, platform fee, guard allocation, processor fee, staff share, adjustment, refund, reversal, and payout.
- Unique idempotency key per provider event/transaction leg.
- Link every ledger row to job, guard, client, payment intent/transfer, fee snapshot, and adjustment where applicable.
- Never silently overwrite settled rows; post correcting/reversal entries.
- Daily reconciliation report: gross client payments = guard allocations + platform revenue + separately identified taxes/pass-throughs/processor costs, adjusted for refunds and reversals.
- Alert on mismatch; do not auto-debit a user to fix a mismatch.

### 8. Administration and audit controls
- Founder-only activation of new charge types and schedule versions unless explicitly delegated.
- Two-step review for high-impact changes: draft → preview/simulation → approve → effective date.
- Record old/new values, actor, approver, timestamp, effective date, and reason.
- Provide rollback for future bookings only; never mutate historical snapshots.
- Staff access to financial detail must follow least privilege.

## Implementation gates

| Gate | Requirement | Must remain blocked until |
|---|---|---|
| New hourly rates | Approved schedule and notice | Founder approval |
| Administrative fee | Separate itemized disclosure + acceptance | Founder + counsel review |
| Cancellation/no-show fees | Defined trigger, amount, exceptions, agreement | Founder + counsel review |
| Processor surcharge | Processor and legal review | Explicit approval |
| Attribution window | Narrow origin evidence and safe harbors | California counsel review |
| Circumvention remedies | Accepted terms, proportionality, appeal | California counsel review |
| Ledger rollout | Backfill/reconciliation plan and idempotency tests | Finance sign-off |

## Validation matrix

- Personal/business defaults and every service override.
- Flat/percentage fee math and cents rounding.
- Multi-guard allocation with no double multiplication.
- Existing snapshot unaffected by live schedule changes.
- New schedule applies only to future bookings after effective time.
- Accepted administrative fee appears exactly once; disabled/unaccepted/version-mismatched fee is zero.
- Extension uses accepted snapshot and requires approval.
- Unapproved overtime is not collectible.
- Cancellation/refund/no-show cases preserve existing behavior until policy approval.
- Stripe retries and duplicate webhook events create no duplicate ledger rows.
- Refunds reverse the original allocations exactly once.
- Repeat-booking origin links only to a user-initiated, related booking; unrelated work is excluded.
- Suspected circumvention requires human review and cannot create an automatic penalty.
- Invoice, checkout, receipt, client billing, guard earnings, and finance ledger reconcile.

## Scope of this initial engineering slice

This branch adds tested, opt-in calculation primitives for separately itemized administrative fees, immutable billing snapshots, append-only adjustments, and idempotent ledger-event handling. It does not connect a new fee to checkout or activate any new charge. Full production integration still requires the workstreams above, database persistence/migrations, role-gated administration, payment-path integration, and end-to-end reconciliation tests.
