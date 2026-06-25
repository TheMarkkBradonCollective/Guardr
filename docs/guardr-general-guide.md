# Guardr — General Guide (Start to Finish)

_Last updated: June 25, 2026_

Guardr connects **clients** who need security coverage with **licensed guards** through an independent-contractor technology marketplace. Guardr staff **verify guard credentials** for marketplace eligibility — that is the platform's core compliance role. Guardr is not the employer, PPO, or staffing agency.

This general guide explains the complete process, including which page to open, where the action appears, what button or slider to use, and what status changes after each step.

Use it as the operating manual for the whole app:

- **Clients** post jobs, choose guards, pay, confirm coverage, review reports, and contact support.
- **Guards** complete onboarding, apply for work, clock in and out, submit audits/reports, and collect pay.
- **Staff** verify credentials, approve job listings, monitor operations, handle disputes, and resolve support or safety issues.

### Where to open this guide in the app

| Role | How to open it | Page title |
|------|----------------|------------|
| **Client** | Open the account menu in the header, then select **General guide** | **General guide** |
| **Guard** | Open the account menu in the header, then select **General guide** | **General guide** |
| **Staff** | Use the left sidebar and select **General guide** | **General guide** |

### Main navigation by role

| Role | Main pages |
|------|------------|
| **Client** | **Map**, **Home**, **Messages**, **Guards**, **Jobs**, plus account menu pages like **Profile** and **General guide** |
| **Guard** | **Map**, **My jobs**, **Pay**, **Messages**, plus account menu pages like **Profile** and **General guide** |
| **Staff** | **Overview**, **Map**, **Jobs**, **Approvals**, **Clients**, **Guards**, **Staff**, **Messages**, **Payments**, **Incidents**, **Disputes**, **Analytics**, **General guide**, **Dev notes**, **Settings** |

---

## IC marketplace model (June 2026)

Guardr is positioned as a **California-aligned independent contractor technology marketplace**. The platform verifies that guards meet credential requirements; it does not dispatch, supervise, or employ guards.

### What Guardr staff do

| Staff role | Purpose |
|------------|---------|
| **Verify guard credentials** | Government ID, BSIS guard card, COI (insurance), and other certs — staff review uploads and mark verified or rejected. This is marketplace **eligibility**, not employment onboarding. |
| **Approve job listings** | Client-submitted jobs go live after staff review (trusted clients may skip this queue). |
| **Resolve disputes & safety** | Overtime disputes, incidents, support tickets, and exceptional guard placement when needed. |
| **Monitor operations** | Live map, self-audit flags, messaging — without on-site supervision. |

### What changed to reduce employer-like control

| Area | Old behavior | Current behavior |
|------|--------------|------------------|
| **Job assignment** | Staff reviewed applicants and sent a guard to the client | Guards **self-select** — apply directly; client approves or declines |
| **Staff placement** | Routine dispatch | **Dispute/safety only** — staff confirm before placing a guard |
| **Spot checks** | Staff uploaded presence photos; clients confirmed | **Removed** — no platform on-site supervision |
| **Payments** | Card and cash options; staff released most payouts manually | **Card/Stripe only**; auto-release to Stripe Connect ~48h after completion |
| **Staff payout override** | Routine manual release | **Dispute hold only** — e.g. overtime under dispute |
| **Account activation** | Staff "hire/activate" language | **Marketplace eligibility** — staff verify credentials; system grants active status when verified |
| **Grace period (PTA/32-hr)** | Staff picked grace hours at activation | **48h self-serve** — auto-applied; automated lockout if credentials not uploaded |

### What did not change

- **Staff still verify every credential** — nothing auto-verifies on upload.
- **Guards cannot work until staff-verified and marketplace-eligible** (active status).
- **Clients still approve guards** before a job becomes **Accepted**.
- **Self-audit photos** at shift start remain required (guard-submitted, not staff spot-checks).

---

## Job status lifecycle

Every job offer moves through these statuses:

| Status | Meaning | Where people usually see it |
|--------|---------|-----------------------------|
| **Draft** | Client started a job but has not submitted it yet | Client job-posting flow |
| **Pending review** | Client submitted the job and staff must approve it | Client **Jobs** page; staff **Approvals → Job offers** and **Jobs** |
| **Open** | Staff approved the listing; guards can apply, or payment/assignment can continue | Client **Jobs** page; guard **Map**; staff **Jobs** |
| **Accepted** | A guard is assigned and confirmed | Client **Jobs** / **Live coverage**; guard **Map** / **My jobs**; staff **Jobs** / **Map** |
| **In progress** | Guard arrived, started the shift, and completed or skipped self-audit | Client **Live coverage** / **Jobs**; guard **Map**; staff **Map** / **Jobs** |
| **Completed** | Guard ended the shift | Client **Jobs**; guard **My jobs** / **Pay**; staff **Payments** |
| **Closed** | Job is archived, cancelled, or no longer active | Staff **Jobs** and historical views |

### Standard marketplace sequence

1. Client posts job.
2. Staff approves listing (unless client is trusted).
3. Client pays by card (Stripe).
4. Guard applies — application goes **directly to the client**.
5. Client approves or declines the guard.
6. Guard arrives, starts the shift, and submits self-audit.
7. Client confirms self-audit photos and watches live coverage.
8. Guard ends the shift.
9. Platform auto-releases Stripe payout after the completion delay (staff override only on dispute hold).
10. Client rates the guard and reviews any reports.

### Direct request sequence

1. Client opens **Guards**, selects a guard, and sends a direct assignment request from the guard profile.
2. Guard claims the direct request.
3. Staff and payment controls still apply as configured.
4. The job moves to **Accepted** once the direct assignment is confirmed.

### Process charts

These charts show the same process visually. Use them when you need to know "who has the next action?" quickly.

#### Marketplace job chart

```
CLIENT                         STAFF                         GUARD
  |                              |                             |
  | Post job offer               |                             |
  |----------------------------->|                             |
  | Status: Pending review       |                             |
  |                              | Review job offer            |
  |                              | Approve listing             |
  |<-----------------------------|                             |
  | Status: Open                 |                             |
  | Pay Now (Stripe)             |                             |
  |----------------------------->|                             |
  |                              |                             | Map: apply for job
  |                              |                             |---------------------------->|
  |<-----------------------------------------------------------| Application to client
  | Approve guard / Decline      |                             |
  |----------------------------->|                             |
  | Status: Accepted             |---------------------------->|
  |                              |                             | Arrive on site
  |                              |                             | Start shift + self-audit
  |<-----------------------------------------------------------|
  | Confirm self-audit photos    |                             |
  |                              | Monitor live job             |
  |                              |                             | End shift
  |<-----------------------------------------------------------|
  | Status: Completed            |                             |
  | Review/rate/report           |                             |
  |                              | Auto Stripe payout (~48h)    |
```

#### Direct request chart

```
CLIENT                         GUARD                         STAFF
  |                              |                             |
  | Guards page                  |                             |
  | Select guard profile         |                             |
  | Send assignment request      |                             |
  |----------------------------->|                             |
  |                              | Map: direct request appears  |
  |                              | Slide to claim job           |
  |<-----------------------------|---------------------------->|
  | Status: Accepted             |                             | Monitor job/payment
  |                              | Arrive -> Start -> Audit     |
  |<-----------------------------|                             |
  | Confirm audit / message      |                             |
  |                              | End shift                    |
  |<-----------------------------|---------------------------->|
  | Review completed job         | Pay tab                      | Payments closeout
```

#### Payment and payout chart

```
CLIENT PAYMENT
  |
  |-- Card (Stripe) — platform default
        -> Client Jobs page: Pay Now
        -> Stripe checkout
        -> Job runs after payment clears

GUARD PAYOUT
  |
  |-- Stripe Connect (automatic)
        -> Guard Pay page: Connect bank account
        -> Platform auto-releases payout ~48h after shift completion
        -> Guard Pay page: Send to my bank when available
        -> Staff Payments: manual release ONLY when payout is on dispute hold
```

#### Exception and escalation chart

```
Issue or exception
  |
  |-- Missing location coordinates
  |     -> Staff Jobs: add/verify location or use current location
  |
  |-- Guard skips self-audit
  |     -> Job flagged No Self Audit
  |     -> Staff Jobs: follow up or upload self-audit photos
  |     -> Client Jobs/Live coverage: confirm photos when available
  |
  |-- Incident or activity report
  |     -> Guard active shift: Report incident / Activity report
  |     -> Staff Incidents: review full report
  |     -> Client Home: Reports
  |
  |-- Late clock-out overtime
  |     -> Guard My jobs: Approve overtime
  |     -> Client Jobs: Approve overtime or Dispute charge
  |     -> Staff Payments or Disputes: settle and close
  |
  |-- Support question
        -> Client/Guard Messages: Contact support or File a report
        -> Staff Messages: support inbox / job chat / staff chat
```

---

## Client guide

### Client page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Map** | Bottom navigation | Live job geography and active shift map |
| **Home** | Bottom navigation | Quick actions, account status, live coverage shortcuts, reports shortcuts |
| **Messages** | Bottom navigation | Job chats, support tickets, support reports |
| **Guards** | Bottom navigation | Browse guard profiles and send direct requests |
| **Jobs** | Bottom navigation | View posted jobs, pay, approve guards, confirm audits, approve overtime, rate guards |
| **Profile** | Account menu | Company/contact profile details |
| **General guide** | Account menu | This guide |

### 1. Sign up, finish the profile, and wait for approval

1. Create a **Client** account during sign-up.
2. Complete the company profile and contact information from **Profile** in the account menu.
3. Watch **Home** for the pending approval state:
   - A pending client sees **Account pending approval** on **Home**.
   - Most operational pages are blocked until staff approves the account.
   - While pending, clients can still use **Home**, **Profile**, **Messages**, and **General guide**.
4. Staff approve the account from **Approvals → Profile approval** or the **Clients** roster.
5. After approval, the full client dashboard opens.

### 2. Post a marketplace job

A marketplace job is open to qualified guards.

1. Open **Home**.
2. Under quick actions, select **Post job offer**.
   - You can also open **Jobs** and select **+ Post offer**.
   - Home shortcuts like **Schedule** and **Multi-guard site** open the same posting flow with a preset.
3. On the **Post job offer** page, enter the job basics:
   - Site name or job title.
   - Address and state.
   - Schedule, start/end time, and coverage needs.
   - Guard requirements and operational instructions.
   - Pay and billing details.
4. On the address/location step:
   - Select **Use current location** if you are at the site and want the app to fill GPS coordinates.
   - If you are not at the site, manually enter the address and coordinates when available.
   - If coordinates are missing, staff may need to add or verify them before the job is cleanly visible on maps.
5. Review the summary.
6. Slide **Slide to post job offer**.
7. The job appears in **Jobs** with status **Pending review**.

What happens next:

- Staff see the submitted job in **Approvals → Job offers** and **Jobs**.
- Staff approve or decline the listing.
- Once approved, the job becomes **Open**.

### 3. Request a specific guard directly

Use this when you already know which guard you want.

1. Open **Guards** from the bottom navigation.
2. Select a guard profile.
3. Review the guard's resume, licenses, experience, and availability details.
4. Select **Send assignment request to [guard name]** from the guard profile.
5. The app opens **Request guard**.
6. Enter the same assignment details you would enter for a marketplace job:
   - Site/location.
   - Schedule.
   - Instructions.
   - Pay and billing details.
7. Use **Use current location** if you are posting from the job site.
8. Slide **Slide to send request to [guard name]**.
9. After submission, return to **Jobs** to track the request.

Important difference from marketplace jobs:

- The client already selected the guard.
- The client does not need a later **Approve guard** step for that same guard.
- The guard still needs to claim/accept the direct request, and payment or staff controls still apply.

### 4. Track staff review

1. Open **Jobs**.
2. Find the job card.
3. Check the status:
   - **Pending review** means staff still need to approve the listing.
   - **Open** means the listing is approved.
   - **Accepted** means a guard is assigned.
4. If staff decline or request corrections, update the job details as instructed.

Staff review usually happens from:

- **Approvals → Job offers**.
- **Jobs**.

### 5. Pay for the job

Payment appears on the job card in **Jobs** after the listing is ready for payment.

1. Open **Jobs**.
2. Expand or open the job card.
3. Select **Pay Now** / **Pay for this job** to complete Stripe checkout.
4. Return to **Jobs** to confirm the payment state.

Payment unlocks guard assignment for marketplace jobs when platform settings require payment before hiring.

### 6. Approve or decline guard applications

This step applies to marketplace jobs after guards apply.

1. Open **Jobs**.
2. Open the **Open** job card.
3. Look for the guard application area — e.g. **Guard application** or a message that a guard applied for your job.
4. Review the applying guard.
5. Choose one:
   - **Approve guard** assigns that guard and moves the job to **Accepted**.
   - **Decline guard** removes that application and keeps the job open for other applicants.

What happened before you see this:

- A qualified guard applied from their **Map**.
- The application was sent **directly to you** for approval (no staff picks the guard).

### 7. Watch accepted jobs and live coverage

After a job is **Accepted**:

1. Open **Jobs** to see assignment details.
2. Open **Home → Live coverage** or the **Map** to watch active coverage.
3. Use **Messages** or job chat to coordinate with the assigned guard.
4. Remember: the client does not start the shift. The guard starts the shift from the guard app.

The guard will:

1. Open **Map**.
2. Slide **Slide to arrive on site**.
3. Slide **Slide to start shift**.
4. Complete self-audit photos or skip self-audit with a staff-visible flag.

### 8. Confirm self-audit photos

Self-audit photos document that the guard arrived prepared.

1. Open **Jobs** or **Live coverage**.
2. Open the active job.
3. Find the **Guard self-audit** / **Guard self-audit photos** section.
4. Review the selfie, uniform, and shoes photos.
5. Select **Confirm self-audit photos** when the photos are acceptable.

If the guard skipped the audit:

- The job may show **No Self Audit**.
- Staff can follow up or upload photos later from **Jobs**.

### 9. Use messages, job chat, support, and reports

Use **Messages** for communication:

1. Open **Messages** from the bottom navigation.
2. Use job chats for assignment-specific coordination.
3. Select **Contact support** to open a support ticket.
4. Select **File a report** when you need to send a structured report to staff.

Use reports from **Home**:

1. Open **Home**.
2. Select **Reports**.
3. Review **Incident Report**, **Activity Report**, or **Property Report** items.
4. Open a report to see full details.

### 10. Handle overtime

Overtime can appear when a guard clocks out late and the app calculates an extra amount.

1. Open **Jobs**.
2. Open the completed or overtime-flagged job.
3. Find **Late clock-out overtime**.
4. Choose one:
   - **Approve overtime $X** if the charge is valid.
   - **Dispute charge** if the overtime is incorrect.
5. If approved, pay the overtime with **Pay $X by card** (Stripe).

### 11. Job completion, rating, and review

1. The guard ends the shift from the guard app with **Slide to end shift**.
2. The job becomes **Completed**.
3. Open **Jobs**.
4. Review any reports, photos, overtime, and payment notices.
5. Use the job detail rating action to rate the guard when available.
6. Guard payout auto-releases to Stripe Connect after the platform delay unless a dispute holds it.

---

## Guard guide

### Guard page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Map** | Bottom navigation | Find open jobs, claim direct requests, and run active shifts |
| **My jobs** | Bottom navigation | Upcoming assignments, past work, overtime review |
| **Pay** | Bottom navigation | Stripe setup, earnings, and bank payouts |
| **Messages** | Bottom navigation | Job chats, support tickets, support reports |
| **Profile** | Account menu | Personal profile, credentials, ID, resume, certifications |
| **General guide** | Account menu | This guide |

### 1. Sign up, upload credentials, and become marketplace-eligible

1. Create a **Guard** account during sign-up.
2. Open **Profile** from the account menu.
3. Complete your profile and required onboarding:
   - Government ID / identity verification.
   - BSIS guard card.
   - Certificate of Insurance (COI) — general liability.
   - Power to Arrest / Appropriate Use of Force training.
   - Required certification uploads.
   - Resume, experience, education, and profile information.
4. While your account is not active:
   - You may see **Eligibility review** or **Credentials verified** gating screens.
   - **Map**, **My jobs**, and **Pay** may be blocked.
   - **Profile**, **Messages**, and **General guide** remain available.
5. **Guardr staff verify your credentials** — government ID, guard card, COI, and other uploads. Nothing auto-verifies.
6. When staff have verified required credentials, you receive **marketplace eligibility** (active status) and can apply to jobs.

Grace period (optional training):

- If PTA/UOF or 32-hour block is not yet on file when you become eligible, a **48-hour grace window** applies automatically.
- Upload missing credentials before the grace expires, or marketplace access may be restricted until they are on file.

### 2. Set up pay

1. Open **Pay**.
2. Select **Connect bank account** and complete Stripe Connect setup.
3. After completed jobs, payouts auto-release to Stripe Connect after the platform delay (~48 hours).
4. Use **Send to my bank** when earnings are available.

### 3. Find marketplace jobs

1. Open **Map**.
2. Browse open jobs near you.
3. Open a job sheet to review:
   - Location and site details.
   - Shift schedule.
   - Pay.
   - Requirements.
   - Instructions or operational briefing when available.
4. If you qualify and want the job, use **Slide to apply for job**.
5. Wait for the **client** to approve or decline your application.

What happens after applying:

- Your application goes **directly to the client**.
- The client sees **Approve guard** or **Decline guard** on **Jobs**.
- If the client approves, the job becomes **Accepted**.

### 4. Claim direct requests

Direct requests are assignments a client sent to you specifically.

1. Open **Map**.
2. Open the direct request job sheet.
3. Review all details.
4. Use **Slide to claim job**.
5. Once confirmed, the assignment appears in **My jobs** and active shift controls appear when the shift window opens.

### 5. Review upcoming and past jobs

1. Open **My jobs**.
2. Use upcoming jobs to confirm schedule and site details.
3. Use past jobs to review completed work, overtime prompts, ratings, and history.
4. Open job chat from the job when you need assignment-specific communication.

### 6. Start a shift

Clock-in opens around the scheduled start window.

1. Travel to the site.
2. Open **Map**.
3. The active job sheet or active shift overlay appears.
4. Use **Slide to arrive on site** when you are physically at the location.
5. Use **Slide to start shift**.
6. Complete the self-audit modal:
   - Selfie.
   - Uniform photo.
   - Shoes photo.
7. Submit the self-audit to start the shift.
8. The job becomes **In progress**.

If you cannot complete the self-audit:

- Use **Skip self audit · clock in** only when necessary.
- The job is flagged **No Self Audit** for staff follow-up.
- Staff may upload self-audit photos later if you send them offline.

### 7. Work the shift

During an active shift, use the active shift controls:

- **Message client** for job chat.
- **Report incident** for safety or security incidents.
- **Activity report** for routine activity notes.
- Review site instructions and operational briefing when available.

Incident reporting:

1. Select **Report incident**.
2. Complete the incident form.
3. Submit it.
4. The app confirms **Incident report filed**.
5. Staff see the report in **Incidents**, and clients can review report details.

Activity reporting:

1. Select **Activity report**.
2. Enter the activity note.
3. Submit it.
4. The app confirms **Activity logged**.

### 8. End a shift

1. At the end of the shift, open **Map** if the active shift controls are not already visible.
2. Use **Slide to end shift** during the allowed clock-out window.
3. Confirm checkout details.
4. Complete any optional client rating prompt.
5. The job becomes **Completed**.
6. Earnings appear under **Pay** after the payment/payout rules are satisfied.

Late clock-out:

- If you clock out late, the app may ask for a time confirmation.
- Late clock-out can create overtime that both guard and client must approve.

### 9. Review overtime

1. Open **My jobs**.
2. Open the job with **Late clock-out overtime**.
3. Review the overtime amount and details.
4. Select **Approve overtime** if the overtime is correct.
5. If client approval/payment is also required, wait for the client and staff payment process.

### 10. Collect payouts

1. Open **Pay**.
2. Review earnings by job.
3. For Stripe payouts:
   - Make sure your bank account is connected.
   - Use **Send to my bank** when payout is available (after auto-release delay).

Payouts depend on:

- Client payment status.
- Auto Stripe payout schedule (~48h after completion).
- Whether overtime or disputes are still open.

### 11. Get help or message people

1. Open **Messages**.
2. Use job chat for assignment-specific messages.
3. Use **Contact support** for help tickets.
4. Use **File a report** for support/report submissions.
5. During an active shift, **Message client** opens the relevant job chat.

---

## Staff guide

### Staff page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Overview** | Left sidebar | Operational summary, action queues, active jobs, alerts |
| **Map** | Left sidebar | Live operations map and job geography |
| **Jobs** | Left sidebar | Job listings, approvals, assignment, audit uploads, operational status |
| **Approvals** | Left sidebar | Job offers, guard applications, credentials, profile/account approval |
| **Clients** | Left sidebar | Client roster and client profile moderation |
| **Guards** | Left sidebar | Guard roster, credential verification, marketplace eligibility |
| **Staff** | Left sidebar | Staff/team management |
| **Messages** | Left sidebar | Staff chat, job chats, support tickets |
| **Payments** | Left sidebar, finance roles only | Stripe payouts, dispute holds, overtime payments |
| **Incidents** | Left sidebar | Client incident and field report review |
| **Disputes** | Left sidebar | Payment/overtime dispute handling |
| **Analytics** | Left sidebar | Operational and financial metrics |
| **General guide** | Left sidebar | This guide |
| **Settings** | Left sidebar, finance/admin roles | Payment modes, platform fees, staff configuration |

### 1. Start from Overview

1. Open **Overview**.
2. Review:
   - Active jobs.
   - Guards on duty.
   - Approval queue counts.
   - Payment alerts.
   - Incidents or support items that need attention.
3. Use action cards to jump into the right queue, such as **Approvals**, **Jobs**, or **Payments**.
4. Open **Map** when you need live geography or active coverage context.

### 2. Approve client accounts

1. Open **Approvals**.
2. Select the **Profile approval** queue.
3. Find the client account.
4. Review company/contact information.
5. Select **Approve client** when the account is valid.
6. The client gains access to the full client experience.

Client accounts can also be reviewed from:

- **Clients** roster.
- Client detail panel.

### 3. Verify guard credentials and grant marketplace eligibility

Guard onboarding is **credential verification for marketplace eligibility** — not employment hiring.

1. Open **Approvals** or **Guards**.
2. Use **Profile approval** / guard detail for ID and profile review.
3. Review government ID photos, profile details, guard card, and COI.
4. Verify credential uploads in **Guard credentials** — approve or reject each document.
5. When ID and guard card are staff-verified, grant **marketplace eligibility** (active status).

Staff still verify every upload. The platform does not auto-verify credentials.

Guard records can also be managed from:

- **Guards** roster.
- Guard detail panel.

### 4. Approve or decline job offers

1. Open **Approvals**.
2. Select **Job offers**.
3. Review the submitted job:
   - Client.
   - Location.
   - Schedule.
   - Pay.
   - Requirements.
   - Operational notes.
   - Coordinates/map readiness.
4. If the job is valid, use **Slide to approve job**.
5. If it should not go live, use **Decline** and record the reason when prompted.
6. Approved jobs become **Open**.

You can also manage pending listings from **Jobs**.

### 5. Manage jobs from the Jobs panel

Use **Jobs** for day-to-day job operations.

Common actions:

- Approve pending listings.
- Edit title, address, state, schedule, or operational details.
- Use **Use current location** when setting coordinates from the site.
- Place a guard only for **dispute/safety** exceptions (confirmation required).
- Upload missing self-audit photos.
- Monitor **No Self Audit** flags.

Recommended flow:

1. Open **Jobs**.
2. Filter or find the job.
3. Review its status badge.
4. Open the job actions.
5. Complete the required operational action.

### 6. Guard applications (client approval)

Marketplace application flow:

1. A guard uses **Slide to apply for job** from guard **Map**.
2. The application goes **directly to the client** on **Jobs**.
3. The client selects **Approve guard** or **Decline guard**.
4. If approved, the job becomes **Accepted**.
5. Staff do **not** routinely pick guards from an applicant queue.

**Exception — staff placement:** Directors may place a guard on a job only for dispute resolution or safety. The app requires confirmation that this is an exception.

Direct request flow:

1. Client chooses a guard from **Guards** and sends a direct request.
2. Guard uses **Slide to claim job**.
3. Staff monitor the job from **Jobs** and payment from **Payments** as needed.
4. Direct requests skip the client application step because the client already chose the guard.

### 7. Monitor active shifts

1. Open **Map** for live geography.
2. Open **Jobs** for job-level operational controls.
3. Watch for status changes:
   - **Accepted** before the guard starts.
   - **In progress** after the guard starts.
   - **Completed** after clock-out.
4. Watch audit flags:
   - **No Self Audit** means the guard skipped the required self-audit.
5. If needed, upload self-audit photos from **Jobs**.
6. Use **Messages** for job chat or support follow-up.

### 8. Review incidents and reports

1. Open **Incidents**.
2. Review client incidents and field reports.
3. Use **View full report** to inspect details.
4. Use **Hide full report** to collapse details.
5. Coordinate with clients, guards, and staff through **Messages**.
6. If a report becomes a dispute, track it from **Disputes**.

### 9. Work support, staff chat, and job chats

1. Open **Messages**.
2. Use:
   - **Staff chat** for internal team coordination.
   - Job chats for assignment-specific conversations.
   - Support tickets for client/guard help requests.
   - Report tickets for structured support reports.
3. Keep operational decisions tied to the relevant job chat or ticket when possible.

### 10. Manage payments and payouts

**Payments** is available only to staff roles with financial controls, such as Directors/Owners/Admins as configured.

Open **Payments** for:

- Monitoring Stripe payout status.
- **Dispute-hold overrides** — manual payout release only when a job is on dispute hold.
- Overtime payment and payout.
- Refunds and platform fee collection.

Common payment situations:

| Situation | Where | Staff action |
|-----------|-------|--------------|
| Job completed, card paid | **Payments** | Usually **no action** — auto Stripe payout after ~48h |
| Overtime under dispute (payout held) | **Payments** | Resolve dispute, then release payout if needed |
| Overtime awaiting client payment | **Payments** | Monitor until client pays |
| Refund needed | **Payments** | Process refund per policy |

Card checkout uses Stripe; cash payments are no longer supported on the platform.

### 11. Handle overtime and disputes

Overtime starts when late clock-out creates an extra amount.

1. Guard reviews overtime from **My jobs** and may select **Approve overtime**.
2. Client reviews overtime from **Jobs** and chooses **Approve overtime $X** or **Dispute charge**.
3. Staff monitor overtime payment and payout from **Payments**.
4. If disputed, open **Disputes**.
5. Resolve the dispute according to company policy and update payment status after resolution.

### 12. Manage people and settings

People:

- Open **Clients** to review client accounts and approve client details.
- Open **Guards** to verify credentials, grant marketplace eligibility, and inspect profiles.
- Open **Staff** to manage internal staff records.

Settings:

1. Open **Settings** if your role has access.
2. Payment mode is **card (Stripe) only**.
3. Configure platform fees.
4. Configure staff onboarding and role controls where available.

Analytics:

- Open **Analytics** for operational and financial metrics.
- Finance-sensitive metrics appear only when the current role has access.

---

## End-to-end sequence (marketplace job)

```
Client opens Home or Jobs
    → Client posts job with Slide to post job offer
    → Staff opens Approvals → Job offers
    → Staff approves listing (job becomes Open)
    → Client opens Jobs and pays by card (Stripe)
    → Guard opens Map and slides to apply
    → Client opens Jobs and selects Approve guard
    → Job becomes Accepted
    → Guard opens Map and slides to arrive on site
    → Guard slides to start shift and completes self-audit
    → Job becomes In progress
    → Client opens Jobs or Live coverage and confirms self-audit photos
    → Guard works shift, uses reports/chat as needed
    → Guard slides to end shift
    → Job becomes Completed
    → Client reviews reports, overtime, and rating
    → Platform auto-releases Stripe payout (~48h); staff override only on dispute hold
```

---

## Quick reference by role

| Guide step | Client page/action | Guard page/action | Staff page/action |
|---------------|--------------------|-------------------|-------------------|
| Open this guide | Account menu → **General guide** | Account menu → **General guide** | Sidebar → **General guide** |
| Account approval | **Home** pending banner; account menu → **Profile** | Account menu → **Profile** | **Approvals → Profile approval**; **Clients**; **Guards** |
| Post marketplace job | **Home → Post job offer** or **Jobs → + Post offer** | — | **Approvals → Job offers** |
| Direct guard request | **Guards → guard profile → Send assignment request to [name]** | **Map → Slide to claim job** | **Jobs** |
| Add location | Posting flow → **Use current location** | — | **Jobs → Use current location** when editing location |
| Pay for job | **Jobs → Pay Now** | — | — |
| Apply for job | — | **Map → Slide to apply for job** | — |
| Approve guard | **Jobs → Approve guard** / **Decline guard** | — | Dispute/safety placement only |
| Start shift | Watch from **Live coverage** / **Jobs** | **Map → Slide to arrive on site → Slide to start shift** | **Map** / **Jobs** |
| Self-audit | **Jobs** or **Live coverage → Confirm self-audit photos** | Self-audit modal after start shift | **Jobs → Upload self-audit photos** if missing |
| On-duty messages | **Messages** / job chat | **Message client** / **Messages** | **Messages** |
| Incident/activity reports | **Home → Reports** to review | **Report incident** / **Activity report** | **Incidents** |
| End shift | Watch completion from **Jobs** | **Map → Slide to end shift** | **Jobs** |
| Overtime | **Jobs → Approve overtime $X** or **Dispute charge** | **My jobs → Approve overtime** | **Payments** / **Disputes** |
| Payout | — | **Pay → Send to my bank** | **Payments** — dispute-hold override only |
| Support | **Messages → Contact support** or **File a report** | **Messages → Contact support** or **File a report** | **Messages** support inbox |

---

## Sections & features reference

This section describes each key part of the app — what it contains, what it is for, and how to use it.

---

### Guard credentials

**Where:** Account menu → **Profile** → **Credentials**

The credentials panel contains all license and certification uploads for a guard account. Staff can also open it from **Guards → guard detail** and upload documents on the guard's behalf.

| Section | What it is |
|---------|------------|
| **Government ID** | State-issued photo ID — required before marketplace eligibility. Upload front, back, live selfie, plus state, number, and expiration. **Staff verify** before the guard can work. |
| **BSIS Guard Card** | California guard license — required to accept field jobs. Upload a document photo. **Staff verify** the card before eligibility is granted. |
| **Certificate of Insurance (COI)** | General liability insurance — required to apply to jobs. Upload your COI. **Staff verify** before the guard can apply. |
| **Power to Arrest & Appropriate Use of Force (PTA/UOF)** | 8-hour required training — required to accept field jobs. Upload your PTA and UOF completion certificates. Some jurisdictions package them together. |
| **32-Hour BSIS Course Block** | Required training block — required to accept field jobs. Upload all 9 individual course certificates, or a single 32-hour completion certificate if you have one. |
| **8-Hour BSIS Refresher** | Separate from the 32-hour block — upload when applicable for guard card renewals. Not required for initial activation. |
| **Other BSIS Training** | Supplemental BSIS courses — not part of the active pathway or 32-hour block. Upload any additional BSIS training not covered above. |
| **Permits & armed training** | Firearms permits, baton permit, and related training. Required for armed posts that request them. |
| **Medical & safety** | CPR/AED, First Aid, and similar certifications. |
| **FEMA / emergency mgmt** | FEMA ICS and related emergency management credentials. |

**Credential upload rules:**

- Upload a photo or scan of the actual credential document. Staff use the document photo to verify the credential.
- Each credential has its own section — tap any item to open its detail view.
- Staff can tap any item, then **Edit**, to upload or update details on behalf of the guard when you have the document in hand.
- Credentials show a status: **Pending review**, **Verified**, **Rejected**, or **Expired**.
- If staff request a resubmit, the item shows a resubmit-requested notice. Open the item and use **Edit** to re-upload.

**Marketplace eligibility requirements:**

Staff must **verify** (not auto-approve) these before a guard becomes active:

1. **Government ID** — fully on file with photos and details, staff-verified.
2. **BSIS Guard Card** — document photo on file, staff-verified.
3. **Certificate of Insurance** — current COI on file, staff-verified.
4. **PTA/UOF training** — on file (or within 48h grace window).
5. **32-hour BSIS course block** — on file (or within 48h grace window).

Optional credentials (firearms permits, medical certs, FEMA, and others) can be added at any time.

**Grace period (48 hours):**

If PTA/UOF or the 32-hour block is not on file when staff grant marketplace eligibility, a **48-hour grace window** applies automatically. The guard can work during grace. If grace expires before credentials are uploaded, marketplace access may be restricted until they are on file.

---

### Guard status & qualification panel

**Where:** Account menu → **Profile** → guard status card

This panel shows marketplace eligibility status and which credentials are on file.

| Status | Meaning |
|--------|---------|
| **Inactive** | Not yet marketplace-eligible — missing credentials or staff verification. |
| **Pending** | Credentials submitted — awaiting staff verification. |
| **Active** | Staff-verified and marketplace-eligible — can apply to and work jobs. |

The checklist shows each requirement as met, on file, or missing, plus whether each item has been verified by staff.

---

### Guard pay

**Where:** Bottom navigation → **Pay**

When you finish a job, your earnings appear here. Request a payout when jobs are ready to collect.

| Section | What it shows |
|---------|---------------|
| **Ready to collect** | Earnings from finished jobs not yet paid out. Use **Send to my bank** after the auto-release delay. |
| **Already paid** | Total received to date via Stripe bank transfer. |
| **Earnings by job** | Line-by-line breakdown of each job, pay amount, and payout status. |

**Connecting a bank account:**

Open **Pay** and use **Connect bank account** to link Stripe Connect for bank transfers.

**Requesting a payout:**

- **Send to my bank** — transfers available earnings via Stripe after the platform auto-release delay (~48 hours after job completion).

---

### Guard self-audit

**What it is:** A mandatory photo check performed by the guard at the start of each shift — selfie, uniform, and shoes. It confirms the guard arrived prepared and in the correct appearance.

**For guards:** When you start a shift, the self-audit modal opens automatically. Take and submit all three photos to start the shift. If you need to skip, use **Skip self audit · clock in** — the job is then flagged for staff follow-up.

**For clients:** Self-audit photos appear in the job detail under **Guard self-audit photos**. Review the photos and tap **Confirm self-audit photos** when they are acceptable.

**For staff:** If a guard skipped the audit, the job shows a **No Self Audit** flag. You can upload self-audit photos on behalf of the guard from **Jobs**.

---

### Incident reports

**What they are:** Filed by guards during active shifts or at clock-out when something notable happened. Each report covers who was involved, what happened, when and where, why, and how the guard responded.

**For guards:** During an active shift, use **Report incident** to file a report. Complete all fields and submit.

**For clients:** Incident reports appear under **Home → Reports** after they are filed. Open a report to see full details.

**For staff:** All incident reports are visible in **Incidents**. Each report includes the full guard-submitted detail and is shared with the client for review.

---

### Activity reports

**What they are:** Routine notes submitted by guards during a shift to document normal patrol activity, observations, or actions taken.

**For guards:** Use **Activity report** from the active shift controls to add a note. The note is appended to the daily activity log for that job.

**For clients and staff:** Activity log entries appear in the job's report history.

---

### Staff panels reference

#### Guards panel

**Where:** Staff sidebar → **Guards**

The Guards panel lists all field guard accounts. Staff can:

- Search and filter the guard roster.
- Open a guard profile to view credentials, eligibility status, jobs, and contact info.
- Add a new guard account (**Add guard** button).
- Edit credentials and verify documents on behalf of the guard.
- Verify credentials and grant marketplace eligibility.
- Suspend or restore access.

#### Clients panel

**Where:** Staff sidebar → **Clients**

The Clients panel lists all client accounts. Staff can:

- Search and filter the client roster.
- Open a client profile to view account status, jobs, and contact info.
- Add a new client account (**Add client** button).
- Approve, suspend, or restore client access.

#### Staff / Team panel

**Where:** Staff sidebar → **Staff**

The Staff panel lists all platform staff accounts. Staff can:

- View the team roster.
- Add new staff accounts (**Add staff** button) — Directors and Owners only.
- Review role and permissions for each team member.

Staff accounts manage the platform only and cannot accept field guard jobs.

#### Approvals panel

**Where:** Staff sidebar → **Approvals**

The Approvals hub holds all pending review queues. Open a queue to view items and take action.

| Queue | What it holds |
|-------|---------------|
| **Job offers** | Submitted job listings waiting for staff approval before going live. |
| **Guard credentials** | Credential and COI uploads — staff verify license photos and approve or reject. |
| **Profile approval** | New guard and client accounts — staff verify ID and grant marketplace eligibility for guards. |

_Note: Guard applications no longer queue for staff. Guards apply directly to clients._

#### Payments panel

**Where:** Staff sidebar → **Payments** (Directors, Owners, and Admins as configured)

Every job follows the same payment path: the client pays, the job runs, then the guard collects pay from their Pay screen. Jobs in Payments are grouped by what needs to happen next.

| Stage | Description |
|-------|-------------|
| **Awaiting client payment** | Client has not paid yet — job ready for Stripe checkout. |
| **Awaiting guard payout** | Job complete — auto Stripe release scheduled; guard collects from **Pay**. |
| **Dispute hold** | Payout blocked by overtime dispute — staff resolve in **Disputes**, then release if needed. |

**Settings → Payment methods:**

- **Card (Stripe)** — only payment mode; clients pay online at checkout.

**Settings → Platform fees:**

Platform fees are set per job at creation time. Existing jobs keep their original fee — only new jobs use the updated model.

#### Incidents panel

**Where:** Staff sidebar → **Incidents**

All incident reports filed by guards across active and completed jobs. Each report includes who, what, when, where, why, and how the guard responded — shared with the client.

#### Disputes panel

**Where:** Staff sidebar → **Disputes**

Overtime billing disputes and guard vs. client conflicts appear here when they need staff review. Inspect the evidence and resolve contested charges or conflicts.

#### Reports panel

**Where:** Staff sidebar → **Reports** (some configurations label this elsewhere)

Job audits, activity logs, and compliance records. Shows jobs with self-audit photos, checkout audits, and flagged audit issues.

---

### Messages & support

#### Job chat

Each accepted job has a dedicated chat thread between the guard, client, and staff. Job chat opens once a guard is assigned. Staff may monitor or reply to job chats.

#### Guard community chat

Guards on the platform have access to a shared community channel — visible only to guards and staff, not to clients.

#### Contact support

Available from **Messages** for all users. Opens a new support thread with the Guardr operations team. The team responds in the same thread.

#### File a report

Available from **Messages** for all users. Use for safety concerns, formal complaints, or structured reports that need staff review and follow-up.

---

### Install the app

Guardr works as an installable web app on both iOS and Android.

**iOS:** Open Guardr in Safari, tap the **Share** button, then tap **Add to Home Screen**.

**Android / Chrome:** Tap the browser menu or the install prompt that appears, then follow the install steps.

Installing the app gives faster access, live shift tracking, and push notifications when Guardr is closed.

---

## Need help?

- **Clients:** Open **Messages**, then choose **Contact support** or **File a report**. Use job chat for job-specific questions.
- **Guards:** Open **Messages**, then choose **Contact support** or **File a report**. During a shift, use **Message client** for the active job chat.
- **Staff:** Open **Messages** for support tickets, job chats, and staff chat. Use **Incidents** and **Disputes** for escalations.
- **This guide:** Clients and guards open the account menu and select **General guide**. Staff select **General guide** in the left sidebar.
