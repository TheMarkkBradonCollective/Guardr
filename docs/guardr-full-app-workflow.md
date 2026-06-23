# Guardr — Full App Workflow (Start to Finish)

_Last updated: June 2026_

Guardr connects **clients** who need security coverage with **licensed guards** through a marketplace operated by Guardr staff. This guide explains the complete workflow, including which page to open, where the action appears, what button or slider to use, and what status changes after each step.

Use it as the operating manual for the whole app:

- **Clients** post jobs, choose guards, pay, confirm coverage, review reports, and contact support.
- **Guards** complete onboarding, apply for work, clock in and out, submit audits/reports, and collect pay.
- **Staff** approve accounts and jobs, manage assignments, monitor live operations, handle money, and resolve support or safety issues.

### Where to open this guide in the app

| Role | How to open it | Page title |
|------|----------------|------------|
| **Client** | Open the account menu in the header, then select **Workflow guide** | **Workflow guide** |
| **Guard** | Open the account menu in the header, then select **Workflow guide** | **Workflow guide** |
| **Staff** | Use the left sidebar and select **Workflow guide** | **Workflow guide** |

### Main navigation by role

| Role | Main pages |
|------|------------|
| **Client** | **Map**, **Home**, **Messages**, **Guards**, **Jobs**, plus account menu pages like **Profile** and **Workflow guide** |
| **Guard** | **Map**, **My jobs**, **Pay**, **Messages**, plus account menu pages like **Profile** and **Workflow guide** |
| **Staff** | **Overview**, **Map**, **Jobs**, **Approvals**, **Clients**, **Guards**, **Staff**, **Messages**, **Payments**, **Incidents**, **Disputes**, **Analytics**, **Workflow guide**, **Settings** |

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
2. Staff approves listing.
3. Client pays by card or requests cash approval.
4. Guard applies.
5. Staff sends the recommended guard to the client.
6. Client approves the guard.
7. Guard arrives, starts the shift, and submits self-audit.
8. Client confirms photos and watches live coverage.
9. Guard ends the shift.
10. Staff releases payout or records cash settlement.
11. Client rates the guard and reviews any reports.

### Direct request sequence

1. Client opens **Guards**, selects a guard, and sends a direct assignment request from the guard profile.
2. Guard claims the direct request.
3. Staff and payment controls still apply as configured.
4. The job moves to **Accepted** once the direct assignment is confirmed.

---

## Client workflow

### Client page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Map** | Bottom navigation | Live job geography and active shift map |
| **Home** | Bottom navigation | Quick actions, account status, live coverage shortcuts, reports shortcuts |
| **Messages** | Bottom navigation | Job chats, support tickets, support reports |
| **Guards** | Bottom navigation | Browse guard profiles and send direct requests |
| **Jobs** | Bottom navigation | View posted jobs, pay, approve guards, confirm audits, approve overtime, rate guards |
| **Profile** | Account menu | Company/contact profile details |
| **Workflow guide** | Account menu | This guide |

### 1. Sign up, finish the profile, and wait for approval

1. Create a **Client** account during sign-up.
2. Complete the company profile and contact information from **Profile** in the account menu.
3. Watch **Home** for the pending approval state:
   - A pending client sees **Account pending approval** on **Home**.
   - Most operational pages are blocked until staff approves the account.
   - While pending, clients can still use **Home**, **Profile**, **Messages**, and **Workflow guide**.
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
3. Select the available payment action:
   - **Pay Now** / **Pay for this job** for card payment.
   - **Pay in Cash** to request cash payment.
4. For card payment:
   - Complete the Stripe checkout.
   - Return to **Jobs** to confirm the payment state.
5. For cash payment:
   - Confirm the **Pay in cash?** dialog.
   - Select **Request cash payment**.
   - Wait for staff to approve once cash is received.
   - The job may show **Cash payment pending approval** while staff review it.

Payment unlocks guard assignment for marketplace jobs when platform settings require payment before hiring.

### 6. Approve or decline the recommended guard

This step applies to marketplace jobs after guards apply and staff recommend one.

1. Open **Jobs**.
2. Open the **Open** job card.
3. Look for the guard approval area, often labeled **Approve your guard** or a message like "Waiting for your approval on the guard Guardr recommended."
4. Review the recommended guard.
5. Choose one:
   - **Approve guard** assigns that guard and moves the job to **Accepted**.
   - **Decline guard** removes that recommendation and keeps the job open for another applicant.

What happened before you see this:

- Guards applied from their **Map**.
- Staff reviewed applicants.
- Staff selected **Send to client** for the best fit.

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

### 8. Confirm self-audit and spot-check photos

Self-audit photos document that the guard arrived prepared.

1. Open **Jobs** or **Live coverage**.
2. Open the active job.
3. Find the **Guard self-audit** / **Guard self-audit photos** section.
4. Review the selfie, uniform, and shoes photos.
5. Select **Confirm self-audit photos** when the photos are acceptable.
6. If staff uploaded spot-check photos, review and confirm those too.

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
5. If approved, pay the overtime:
   - **Pay $X by card** when card payment is available.
   - **Pay in cash** to request cash approval.
6. If cash is requested, wait for staff approval. The job may show **Cash overtime payment pending staff approval**.

### 11. Job completion, rating, and review

1. The guard ends the shift from the guard app with **Slide to end shift**.
2. The job becomes **Completed**.
3. Open **Jobs**.
4. Review any reports, photos, overtime, and payment notices.
5. Use the job detail rating action to rate the guard when available.
6. Staff then release the guard payout or record cash settlement from **Payments**.

---

## Guard workflow

### Guard page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Map** | Bottom navigation | Find open jobs, claim direct requests, and run active shifts |
| **My jobs** | Bottom navigation | Upcoming assignments, past work, overtime review |
| **Pay** | Bottom navigation | Stripe setup, earnings, payouts, cash pickup |
| **Messages** | Bottom navigation | Job chats, support tickets, support reports |
| **Profile** | Account menu | Personal profile, credentials, ID, resume, certifications |
| **Workflow guide** | Account menu | This guide |

### 1. Sign up, upload credentials, and get activated

1. Create a **Guard** account during sign-up.
2. Open **Profile** from the account menu.
3. Complete your profile and required onboarding:
   - Government ID / identity verification.
   - BSIS guard card.
   - Power to Arrest / Appropriate Use of Force training.
   - Required certification uploads.
   - Resume, experience, education, and profile information.
4. While your account is not active:
   - You may see **Pending approval** or **Profile approved** gating screens.
   - **Map**, **My jobs**, and **Pay** may be blocked.
   - **Profile**, **Messages**, and **Workflow guide** remain available.
5. Staff verify your profile from **Approvals → Profile approval** and credentials from **Approvals → Guard credentials**.
6. Staff approve your profile and activate the account when requirements are met.

Grace period:

- Staff may allow a temporary grace period for optional training.
- If the grace period expires before requirements are complete, the account can return to inactive until credentials are finished.

### 2. Set up pay

1. Open **Pay**.
2. For card payouts, select **Connect bank account** and complete Stripe setup.
3. For cash jobs, use **Pay** to track cash earnings and cash pickup status.
4. After a cash job is ready, use **Request cash pickup** when available. This sends a pickup invoice/request to staff **Payments**.

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
5. Wait while staff review applications.

What happens after applying:

- Staff see your application in **Approvals → Guard applications** and **Jobs**.
- Staff may select **Send to client**.
- The client then sees **Approve guard** or **Decline guard**.
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
5. If client approval/payment is also required, wait for the client and staff payment workflow.

### 10. Collect payouts

1. Open **Pay**.
2. Review earnings by job.
3. For Stripe payouts:
   - Make sure your bank account is connected.
   - Use **Send to my bank** when payout is available.
4. For cash payouts:
   - Use **Request cash pickup** when the job is ready to collect.
   - Staff handle the cash payout from **Payments**.

Payouts depend on:

- Client payment status.
- Staff payout release.
- Whether the job was paid by card or cash.
- Whether overtime or disputes are still open.

### 11. Get help or message people

1. Open **Messages**.
2. Use job chat for assignment-specific messages.
3. Use **Contact support** for help tickets.
4. Use **File a report** for support/report submissions.
5. During an active shift, **Message client** opens the relevant job chat.

---

## Staff workflow

### Staff page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Overview** | Left sidebar | Operational summary, action queues, active jobs, alerts |
| **Map** | Left sidebar | Live operations map and job geography |
| **Jobs** | Left sidebar | Job listings, approvals, assignment, audit uploads, operational status |
| **Approvals** | Left sidebar | Job offers, guard applications, credentials, profile/account approval |
| **Clients** | Left sidebar | Client roster and client profile moderation |
| **Guards** | Left sidebar | Guard roster, guard details, approval and activation controls |
| **Staff** | Left sidebar | Staff/team management |
| **Messages** | Left sidebar | Staff chat, job chats, support tickets |
| **Payments** | Left sidebar, finance roles only | Cash approvals, card payouts, payout release, deposits, overtime payments |
| **Incidents** | Left sidebar | Client incident and field report review |
| **Disputes** | Left sidebar | Payment/overtime dispute handling |
| **Analytics** | Left sidebar | Operational and financial metrics |
| **Workflow guide** | Left sidebar | This guide |
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
6. The client gains access to the full client workflow.

Client accounts can also be reviewed from:

- **Clients** roster.
- Client detail panel.

### 3. Approve guard profiles, credentials, and activation

Guard approval can require both profile approval and activation.

1. Open **Approvals**.
2. Use **Profile approval** for guard profile review.
3. Review ID, profile details, guard card status, and onboarding readiness.
4. Use **Slide to approve profile** when the profile is acceptable.
5. Use **Guard credentials** to verify license/certification uploads.
6. Approve or reject credential uploads as needed.
7. Activate the guard account when requirements are complete.

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
- Assign guards.
- Review applicants.
- Upload missing self-audit photos.
- Upload spot-check photos.
- Monitor **No Self Audit** and **No Spot Check** flags.

Recommended flow:

1. Open **Jobs**.
2. Filter or find the job.
3. Review its status badge.
4. Open the job actions.
5. Complete the required operational action.

### 6. Handle guard applications

Marketplace application flow:

1. A guard uses **Slide to apply for job** from guard **Map**.
2. Staff open **Approvals → Guard applications** or the job in **Jobs**.
3. Review all applicants.
4. Pick the best fit.
5. Select **Send to client**.
6. The client sees **Approve guard** / **Decline guard** in **Jobs**.
7. If the client approves, the job becomes **Accepted**.
8. If staff or client decline an applicant, that guard is removed from consideration and the job stays **Open**.

Direct request flow:

1. Client chooses a guard from **Guards** and sends a direct request.
2. Guard uses **Slide to claim job**.
3. Staff monitor the job from **Jobs** and payment from **Payments** as configured.
4. Direct requests do not need the same staff **Send to client** recommendation step because the client already chose the guard.

### 7. Monitor active shifts

1. Open **Map** for live geography.
2. Open **Jobs** for job-level operational controls.
3. Watch for status changes:
   - **Accepted** before the guard starts.
   - **In progress** after the guard starts.
   - **Completed** after clock-out.
4. Watch audit flags:
   - **No Self Audit** means the guard skipped the required self-audit.
   - **No Spot Check** means spot-check evidence may still be missing.
5. If needed, upload self-audit or spot-check photos from **Jobs**.
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

- Cash payment requests.
- Client cash received confirmation.
- Stripe/card payout release.
- Guard cash payout marking.
- Overtime payment and payout.
- Platform fee collection.
- Manual deposit tracking.

Common payment situations:

| Situation | Where | Staff action |
|-----------|-------|--------------|
| Client requested cash for a job | **Payments** | **Approve cash payment** or **Decline request** |
| Client cash was received | **Payments** | Mark the client paid cash and record required deposit/fee state |
| Job completed and card funds are ready | **Payments** | Release guard payout |
| Guard is paid cash | **Payments** | Mark guard paid cash |
| Overtime cash request is pending | **Payments** | **Approve overtime cash** |
| Overtime payout is ready | **Payments** | Release overtime payout or mark overtime guard paid cash |
| Platform fee only is due | **Payments** | Mark platform fee paid or deposit manually |

Card checkout may show **Pay guard $X with card** when the platform fee is already collected and the remaining card deposit funds the guard payout.

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
- Open **Guards** to review guard profiles, approve profiles, activate accounts, and inspect credentials.
- Open **Staff** to manage internal staff records.

Settings:

1. Open **Settings** if your role has access.
2. Configure cash/card payment modes.
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
    → Client opens Jobs and pays by card or requests cash
    → Guard opens Map and slides to apply
    → Staff opens Approvals → Guard applications
    → Staff sends best applicant to client
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
    → Staff opens Payments to release payout or record cash settlement
```

---

## Quick reference by role

| Workflow step | Client page/action | Guard page/action | Staff page/action |
|---------------|--------------------|-------------------|-------------------|
| Open this guide | Account menu → **Workflow guide** | Account menu → **Workflow guide** | Sidebar → **Workflow guide** |
| Account approval | **Home** pending banner; account menu → **Profile** | Account menu → **Profile** | **Approvals → Profile approval**; **Clients**; **Guards** |
| Post marketplace job | **Home → Post job offer** or **Jobs → + Post offer** | — | **Approvals → Job offers** |
| Direct guard request | **Guards → guard profile → Send assignment request to [name]** | **Map → Slide to claim job** | **Jobs** |
| Add location | Posting flow → **Use current location** | — | **Jobs → Use current location** when editing location |
| Pay for job | **Jobs → Pay Now** or **Pay in Cash** | — | **Payments → Approve cash payment** or release/card controls |
| Apply for job | — | **Map → Slide to apply for job** | **Approvals → Guard applications** |
| Recommend guard | **Jobs → Approve guard** / **Decline guard** | — | **Send to client** / **Decline** |
| Start shift | Watch from **Live coverage** / **Jobs** | **Map → Slide to arrive on site → Slide to start shift** | **Map** / **Jobs** |
| Self-audit | **Jobs** or **Live coverage → Confirm self-audit photos** | Self-audit modal after start shift | **Jobs → Upload self-audit photos** if missing |
| On-duty messages | **Messages** / job chat | **Message client** / **Messages** | **Messages** |
| Incident/activity reports | **Home → Reports** to review | **Report incident** / **Activity report** | **Incidents** |
| End shift | Watch completion from **Jobs** | **Map → Slide to end shift** | **Jobs** |
| Overtime | **Jobs → Approve overtime $X** or **Dispute charge** | **My jobs → Approve overtime** | **Payments** / **Disputes** |
| Payout | — | **Pay → Send to my bank** or **Request cash pickup** | **Payments → release payout / mark paid cash** |
| Support | **Messages → Contact support** or **File a report** | **Messages → Contact support** or **File a report** | **Messages** support inbox |

---

## Need help?

- **Clients:** Open **Messages**, then choose **Contact support** or **File a report**. Use job chat for job-specific questions.
- **Guards:** Open **Messages**, then choose **Contact support** or **File a report**. During a shift, use **Message client** for the active job chat.
- **Staff:** Open **Messages** for support tickets, job chats, and staff chat. Use **Incidents** and **Disputes** for escalations.
- **This guide:** Clients and guards open the account menu and select **Workflow guide**. Staff select **Workflow guide** in the left sidebar.
