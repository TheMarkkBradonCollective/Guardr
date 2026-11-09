# Guardr — Platform Revenue & Fee Protection Framework

**Status:** Proposal for product and counsel review — not yet an active fee schedule or contract amendment  
**Owner:** Signature Security Specialist, LLC  
**Applies to:** Guardr marketplace transactions  
**Last updated:** November 9, 2026

> This document is an operating and drafting framework. It is not legal advice and must not be published as binding contract language until reviewed by California marketplace, payments, and worker-classification counsel. No new fee, penalty, or restriction is activated by this document.

---

## 1. Purpose and guardrails

Guardr is a technology marketplace operated by Signature Security Specialist, LLC. It connects clients with independent security professionals. Guardr is not the provider of security services, a PPO, a staffing agency, or a party to the direct security-services agreement between a client and a guard.

This framework is designed to:

- Make the platform's revenue model understandable before a client confirms a booking.
- Ensure the same disclosed fee rules are applied consistently to equivalent transactions.
- Preserve the fee and guard-pay amounts accepted for an existing job.
- Reduce accidental under-collection caused by extensions, additional guards, or booking edits.
- Address deliberate circumvention of fees on transactions that originated through Guardr, without claiming fees on unrelated business.
- Provide auditable records for adjustments, cancellations, refunds, and disputes.

**Core rule:** Guardr earns only the platform fee disclosed for the applicable transaction and accepted under the applicable agreement. Do not invent, silently add, or retroactively apply charges.

## 2. Existing fee model — repository baseline

The current implementation is in `lib/platformFees.ts` and `src/lib/platformSettings.ts`.

- The client pays the agreed client hourly rate.
- Guardr retains the configured platform fee from that rate.
- The guard's hourly compensation is the client rate minus the platform fee.
- Personal and business clients have separate fee schedules, with optional guard-type overrides.
- Supported models are flat dollars per hour and a percentage of the client hourly rate.
- Agreement-level overrides are supported.
- Job fee and guard-pay values are snapshotted so live fee-table changes do not silently reprice existing jobs.
- No subscription fee is part of the documented current model.

### Current fresh-install defaults in code

| Account type | Guard/service type | Current default platform fee |
|---|---|---:|
| Personal | General/default | $5/hr |
| Personal | Event, nightclub/bar, construction, fire watch | $6/hr |
| Personal | Executive protection/bodyguard, armed escort | $8/hr |
| Business | General/default and standing guard | $6/hr |
| Business | Event, nightclub/bar, construction, fire watch | $8/hr |
| Business | Property protection | $7/hr |
| Business | Executive protection/bodyguard, armed escort | $12/hr |

These are fresh-install code defaults. Existing stored settings and already-posted jobs may differ. Staff must inspect the active Payment settings and the job's stored billing snapshot before quoting a live transaction.

### Proposed rate review

Do not replace the current schedule with a blanket $6/hr or add a new percentage/administrative fee automatically. Instead:

1. Keep the existing per-account and per-service schedule as the baseline.
2. Have the Founder/authorized pricing owner approve any proposed rate changes in a separate rate sheet.
3. Compare proposed rates against local market conditions, guard compensation, processor costs, support costs, and client conversion.
4. Show the client the total hourly price and the platform/guard allocation wherever the product design and legal review require it.
5. Apply a new rate only to new transactions after the effective date and required notice/acceptance.
6. Never rewrite an existing job's stored fee snapshot merely because the global schedule changed.

A one-dollar increase to a $5/hr fee is a 20% increase in the platform's fee component. Model its effect on client conversion, guard earnings, and contribution margin before adopting it.

## 3. Fee calculation and billing rules

### 3.1 Standard hourly calculation

For each guard on a job:

`Platform fee = approved billable hours × accepted platform fee per hour`

`Guard compensation = approved billable hours × (accepted client rate − accepted platform fee per hour)`

For multi-guard work, calculate each guard's transaction independently using the accepted job/guard billing snapshot. Do not multiply a single fee only once when multiple guards are separately compensated.

### 3.2 Rate and fee source of truth

At the moment a job is posted, accepted, or otherwise contractually priced (as applicable to that flow), preserve a billing snapshot containing at minimum:

- Client hourly rate.
- Platform fee model and fee amount/rate.
- Guard compensation rate.
- Account type and service/guard type used to resolve the schedule.
- Agreement-level override, if any.
- Number of guards and scheduled duration used for the estimate.
- Currency and timestamp.
- Fee-schedule/version identifier where available.

Negotiated/open-contract pricing must show the final client rate, platform fee, and guard compensation before confirmation. Do not silently retain an obsolete fee if the parties explicitly renegotiate the fee allocation.

### 3.3 Extensions, overtime, and schedule changes

- An approved extension is additional billable time under the applicable accepted rate and fee snapshot unless the parties expressly accept a new written price.
- Overtime must follow the existing approval/dispute workflow. Do not convert an unapproved clock variance into an automatic charge.
- A change in scheduled end time must update the estimate and display the incremental amount before the client confirms.
- A change in guard count must calculate the additional guard's own compensation and platform fee.
- Keep the original snapshot and write an auditable amendment/adjustment record; do not erase the original terms.
- If an edit creates a new agreement or materially changes the fee, obtain renewed acceptance before applying it.

### 3.4 Time measurement and partial hours

Use actual approved billable time from the job's authoritative time records. If the product uses a minimum increment or rounding rule, disclose it before booking and apply it consistently. Do not introduce hidden rounding, minimum-hour charges, or retroactive time adjustments.

Unpaid breaks may be excluded only when the applicable booking terms and time records support that treatment.

### 3.5 Cancellations, no-shows, and replacements

This framework does not create a cancellation fee or no-show penalty.

Before adding any such charge, define and disclose:
- The cancellation window and the event that triggers a charge.
- Whether the charge is a client payment, guard compensation, platform revenue, or a combination.
- The amount or calculation method.
- Exceptions for safety issues, legal restrictions, platform errors, emergencies, and mutually agreed cancellation.
- How refunds, payment reversals, and guard compensation are handled.

A replacement request alone is not a billable platform service unless a separate, clearly priced service is approved and accepted in advance. Never double-charge for the same time or event.

### 3.6 Tips, reimbursements, and pass-through amounts

Tips, approved expense reimbursements, taxes, and third-party pass-through amounts must be separately identified and must not be treated as platform-fee revenue unless the relevant terms and accounting treatment expressly permit it.

### 3.7 Processor costs

Stripe or other processor charges are distinct from Guardr's platform fee. Do not add a payment-processing surcharge or pass-through fee without confirming processor rules and applicable law, and displaying the exact charge before payment.

## 4. Transaction integrity and non-circumvention

### 4.1 Narrow scope

The purpose of this section is to protect fees on a specific transaction that Guardr introduced, arranged, or materially facilitated. It is not intended to prohibit guards or clients from operating independent businesses, contacting prior customers, accepting unrelated work, or using other marketplaces.

### 4.2 Covered transaction

A covered transaction is a specific job, shift, extension, or repeat booking that:

- Was first introduced, requested, quoted, matched, negotiated, or accepted through Guardr; and
- Is identifiable in Guardr's records by job, client, guard, site, and booking history.

A repeat booking is covered only where it is a continuation, extension, renewal, or substantially related rebooking of the same Guardr-originated engagement, within a clearly defined period accepted in the applicable agreement.

**Proposed counsel-review item:** Decide whether a limited 12-month attribution window is appropriate, enforceable, and sufficiently narrow under California law. Do not activate a window until counsel approves the wording and the product clearly discloses it.

### 4.3 Conduct that may constitute circumvention

Subject to counsel-approved terms and applicable law, examples may include:

- Knowingly cancelling a confirmed Guardr booking and completing that same assignment directly to avoid the disclosed Guardr fee.
- Falsifying job, shift, guard-count, or time information to reduce the fee due on that booking.
- Routing payment for the same covered Guardr-originated shift outside the platform after accepting platform terms requiring that transaction to be paid through Guardr.
- Misrepresenting a covered extension or continuation as unrelated work solely to avoid the accepted fee.

A direct conversation, exchange of contact details, or independently sourced future job is not, by itself, proof of circumvention.

### 4.4 Exclusions and safe harbors

Do not claim a platform fee on:

- Work independently sourced before the Guardr introduction and documented as such.
- Unrelated work between the same parties that was not introduced, arranged, or materially facilitated by Guardr.
- A transaction after the applicable attribution period expires.
- A booking that Guardr cancelled or could not perform its contracted platform function for, except for an amount already properly earned and disclosed.
- Any transaction where charging the fee would violate law or the applicable agreement.

Allow a client or guard to submit records showing that work was independently sourced. Review evidence before making an adverse decision.

### 4.5 No automatic penalty

Do not impose an automatic liquidated-damages amount, punitive fee, account debit, or indefinite restriction merely because a user is suspected of circumvention. Any remedy must be stated in an accepted agreement, reasonably related to legitimate platform costs or fees actually due, supported by records, and approved by counsel.

Use notice, an opportunity to respond, human review, and a documented decision. Preserve appeal and dispute channels.

## 5. Records, audit, and dispute handling

For every covered job, preserve:

- Job and agreement identifiers.
- Client and guard identifiers.
- Posted and negotiated price history.
- Fee configuration and billing snapshot.
- Booking, acceptance, amendment, cancellation, and completion timestamps.
- Approved hours, breaks, overtime, and guard count.
- Payment processor references and settlement/refund records.
- Client/guard notices and acceptance versions.
- Support reports, evidence, and dispute outcomes.

Access to payment and identity records must be role-limited. Retain records only for legitimate operational, tax, dispute, and legal purposes under the Privacy Policy and retention schedule.

### Dispute workflow

1. A user submits the job identifier and explains the disputed amount.
2. The system freezes only the disputed adjustment where technically and legally appropriate; do not unnecessarily hold unrelated undisputed funds.
3. Staff compare the accepted snapshot, time records, amendments, and payment records.
4. Staff issue a written explanation showing the calculation.
5. Correct errors with a traceable adjustment or refund.
6. Escalate suspected fraud or legal questions to authorized leadership/counsel.
7. Record the resolution and notify affected parties.

## 6. Product and engineering requirements

The fee engine should remain the single calculation source. Avoid duplicate fee logic in UI components, payment webhooks, and reporting.

### Required safeguards

- **Snapshot integrity:** Existing job snapshots remain authoritative unless a documented amendment is accepted.
- **Per-guard accounting:** Multi-guard jobs allocate fees and guard compensation per guard.
- **Extension parity:** Estimate, checkout, invoice, and payout calculations use the same fee source.
- **Negotiation visibility:** Client and guard see the accepted allocation before final confirmation.
- **Idempotency:** Repeated webhook or retry events cannot collect the same fee twice.
- **No silent schedule fallback:** Unknown service types must use a documented fallback and be visible to staff for review.
- **No hidden charges:** UI totals must reconcile to the accepted price and itemized adjustments.
- **Audit history:** Store who changed a fee schedule, what changed, when, and the effective date.
- **Access control:** Only authorized pricing roles can change live fee schedules or approve exceptions.
- **No retroactive repricing:** A settings update cannot mutate a posted/accepted job's fee snapshot.
- **Refund parity:** Refunds and charge reversals must correctly reverse the corresponding platform-fee accounting entries.
- **Reconciliation:** Daily/periodic reports should reconcile gross client payments, guard allocations, platform fees, refunds, processor costs, and staff revenue share.

### Suggested tests

1. Personal default and every personal guard-type override resolve to the expected fee.
2. Business default and every business guard-type override resolve to the expected fee.
3. Flat and percentage fee models calculate and round consistently.
4. Agreement overrides take precedence only for the covered agreement.
5. A live fee-table change does not alter an existing job snapshot.
6. A newly created job uses the new effective schedule.
7. Multi-guard fees are calculated per guard and do not multiply twice.
8. Approved extensions use the correct accepted fee snapshot.
9. Unapproved overtime does not create a collectible charge.
10. Repeated payment webhooks do not duplicate platform revenue.
11. Refunds reverse platform revenue proportionally and exactly once.
12. Independent work is excluded from attribution/non-circumvention enforcement.
13. A disputed circumvention allegation cannot trigger an automatic penalty without review.
14. Client-facing totals reconcile with payment, invoice, and guard payout records.

## 7. Pricing governance and change control

Maintain a versioned fee schedule with:

- Schedule name and version.
- Account type and service category.
- Flat or percentage model.
- Exact rate and any approved cap/floor.
- Effective date and time zone.
- Approving role and approval timestamp.
- Client-facing disclosure text.
- Applicable agreement version.
- Rollback plan.

A price change must follow this sequence:

1. Model impact on client totals, guard compensation, platform revenue, processor costs, and staff revenue share.
2. Obtain Founder/authorized approval.
3. Obtain legal review for material fee, surcharge, or contract changes.
4. Update pricing disclosures and agreement versions.
5. Test estimates, checkout, stored snapshots, invoices, refunds, and payouts.
6. Deploy with an effective date.
7. Monitor reconciliation and client/guard support cases.

## 8. Implementation sequence

### Phase 1 — documentation and policy approval
- Counsel reviews the scope, fee disclosures, attribution window, and proposed remedies.
- Founder approves any new rate schedule separately.
- Existing live fee defaults remain unchanged until approval.

### Phase 2 — billing consistency audit
- Trace job creation, direct requests, negotiated pricing, schedule edits, overtime, invoices, Stripe checkout, payout, refund, and webhook paths.
- Confirm all paths use the shared fee helpers and stored job snapshots.
- Add missing tests before changing calculation behavior.

### Phase 3 — transparent fee display
- Show client rate, platform fee allocation, and guard compensation in the appropriate pre-confirmation screens.
- Clearly identify any approved one-time or pass-through charge before payment.
- Ensure receipts and invoices reconcile to the accepted quote.

### Phase 4 — transaction protection
- Add narrow transaction-origin metadata where missing.
- Add attribution-window logic only after counsel approves the agreement and retention design.
- Provide a manual evidence review and appeal process.
- Do not automatically penalize users based on a heuristic match.

### Phase 5 — reporting and monitoring
- Add per-job and per-guard platform-fee reporting.
- Reconcile platform gross fees, refunds, processor costs, and staff compensation.
- Alert staff to mismatches without automatically changing a user's balance.

## 9. Decisions required before activation

| Decision | Current status |
|---|---|
| Increase any current hourly fee | Not approved |
| Add booking, cancellation, replacement, or processing fees | Not approved |
| Adopt a 12-month attribution window | Counsel review required |
| Add any liquidated-damages or other circumvention remedy | Counsel review required |
| Change current fee snapshots or historical jobs | Prohibited by this proposal |
| Publish revised client/guard legal terms | Requires counsel approval and versioned acceptance |

## 10. Repository references

- `lib/platformFees.ts` — fee models, defaults, schedule resolution, job billing, snapshots.
- `src/lib/platformSettings.ts` — persisted platform fee schedules and staff settings.
- `src/lib/jobServiceAgreement.ts` — per-job client/guard service agreement.
- `src/lib/legalContent.ts` — Terms, Client Platform Agreement, and legal version registry.
- `docs/user-manuals/client-user-manual.md` — client-facing pricing and billing explanation.
- `docs/business-plan.md` — revenue model and unit economics.
- `docs/company-information-package.md` — company and stakeholder explanation.

---

**Release rule:** This framework is a proposal until the decisions in Section 9 are approved. It does not change production pricing, create new fees, amend accepted contracts, or authorize automatic enforcement.
