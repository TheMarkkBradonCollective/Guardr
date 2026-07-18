# Guardr — Guide

Guardr connects **clients** who need security coverage with **licensed guards** through an independent-contractor technology marketplace. Guardr staff **verify guard credentials** for marketplace eligibility — that is the platform's core compliance role. Guardr is not the employer, PPO, or staffing agency.

This guide explains how Guardr works: which page to open, where actions appear, what button or slider to use, and what status changes after each step.

Use it as the operating manual for the whole app:

- **Clients** post jobs, choose guards, pay, confirm coverage, review reports, and contact support.
- **Guards** upload required credentials on the **activation screen** while their application is under review, become **active** after staff approve and verify credentials, then apply for work, clock in and out, complete self-audits, submit reports, and collect pay.
- **Staff** (Moderator, Administrator, Director, Founder) each have defined responsibilities — see the role-specific guides below.

### Where to open this guide

| Audience | How to open it | Page title |
|----------|----------------|------------|
| **Public** | **guardr.co/guide** or **Guide** on the homepage | **Guide** |
| **Client** | Account menu → **Guide** | **Guide** |
| **Guard** | Account menu → **Guide** (available after account is **active**) | **Guide** |
| **Staff** | Left sidebar → **Guide** — filter by role | **Guide** |

### Main navigation by role

| Role | Main pages |
|------|------------|
| **Client** | **Map**, **Home**, **Messages**, **Guards**, **Jobs**, plus account menu / **More** → **Invoices**, **Locations**, **Reports**, **Notifications**, **Settings**, **Profile**, **Guide** |
| **Guard (pending)** | **Activation screen** — **Application under review**; upload the five required credentials while staff reviews your application. Account menu → **Settings** (sign out). |
| **Guard (approved, not active)** | **Activation screen** — upload ID, COI, guard card, PTA/UOF, 32-hour block inline. **Map**, **Jobs**, **Pay**, **Messages**, **Profile**, and **Guide** remain blocked until **active**. |
| **Guard (active)** | **Map**, **Jobs**, **Pay**, **Messages**, **Crew** (if trusted), plus account menu → **Profile**, **Notifications**, **Performance**, **Vehicle** (if driving jobs), **Preferences**, **Availability**, **Settings**, and **Guide** |
| **Moderator** | **Overview**, **Map**, **Jobs**, **Applications**, **Credentials**, **Clients**, **Guards**, **Messages**, **Incidents**, **Stats** (desktop), **Guide** |
| **Administrator** | Moderator pages plus credential verification queues, **Disputes**, **Analytics**, partial **Settings** |
| **Director** | Administrator pages plus **Payments**, **Staff** team management, full financial controls, **Dev notes** |
| **Founder** | Everything Directors can do plus platform governance settings (payment modes, homepage messages, top-tier staff management) |

---

## IC marketplace model

Guardr is a **California-aligned independent contractor technology marketplace**. The platform verifies that guards meet credential requirements; it does not dispatch, supervise, or employ guards on site.

### What Guardr staff do (by role)

| Staff role | Primary responsibilities |
|------------|-------------------------|
| **Moderator** | Approve guard and client **applications**, monitor activity, review reports |
| **Administrator** | Everything Moderators do, plus **verify credentials** (government ID, guard card, COI, training certs), review job requests, handle disputes, suspend users |
| **Director** | Full platform operations — financial controls, cash handling, job creation, guard assignment (dispute/safety only), manage Administrators and Moderators |
| **Founder** | Platform governance overseer — everything Directors do, plus manage Directors and all staff tiers, platform settings, homepage messages |

**Credential verification and account activation are Administrator and above only.** Moderators approve applications but do not verify documents or activate accounts.

### How jobs and coverage work

- Guards **self-select** — they apply directly; clients approve or decline.
- Staff placement is for **dispute or safety situations only**.
- **Self-audit photos** at shift start are **guard-submitted** (selfie, uniform, shoes) — clients review and confirm.
- Guards can upload credentials while **pending**; staff verify after application approval; guards browse the app only after staff **activate** the account.
- Clients **approve guards** before a job becomes **Accepted**.
- Card/Stripe is the primary payment path; payouts auto-release to Stripe Connect after completion unless a dispute holds them.

---

## Whole app — start to finish (your perspective)

This section walks through Guardr from first sign-up to final payout — the same journey every user type follows, in order.

### Phase 1 — Accounts exist

| Who | What you do | What happens next |
|-----|-------------|-------------------|
| **Client** | Sign up → complete **Profile** → wait on **Home** ("Account pending approval") | Moderator+ approves from **Applications** |
| **Guard** | Sign up → land on **activation screen** ("Application under review") — upload five required credentials | Moderator+ **approves application** (`pending` → `approved`) |
| **Staff** | Sign in with credentials provided by a Director or Founder | Full staff console opens per your role |

### Phase 2 — Guard becomes marketplace-eligible (manual, three steps)

```
1. Guard uploads credentials while pending →  credentials attached to application
2. Moderator+ approves application     →  `pending` → `approved`
3. Administrator+ verifies each cred   →  ID, COI, guard card, PTA/UOF, 32-hr
4. Account activates automatically     →  guard gets Map / Jobs / Pay
```

Guards stay on the **activation screen** until activation. The progress bar tracks all five required credentials from sign-up.

### Phase 3 — A job gets posted and paid

| Step | Actor | Action | Page |
|------|-------|--------|------|
| 1 | Client | Post job offer | **Home** or **Jobs** → slide to post |
| 2 | Administrator+ | Approve listing (unless client is trusted) | **Applications** (job offers queue) |
| 3 | Client | Pay by card (Stripe) | **Jobs** → Pay Now |
| 4 | Job status | **Open** — visible on guard **Map** | — |

### Phase 4 — Guard gets the job

**Marketplace path:**

1. Guard opens **Map** → slides **Apply for job**.
2. Application goes **directly to the client** (staff do not pick guards).
3. Client opens **Jobs** → **Approve guard** or **Decline guard**.
4. Job becomes **Accepted**.

**Direct request path:**

1. Client opens **Guards** → selects a guard → **Send assignment request**.
2. Guard opens **Map** → slides **Claim job**.
3. Job becomes **Accepted** (no client application step).

### Phase 5 — Shift runs

| Step | Actor | Action | Page |
|------|-------|--------|------|
| 1 | Guard | Arrive on site | **Map** → slide to arrive |
| 2 | Guard | Start shift + self-audit photos | **Map** → slide to start shift |
| 3 | Client | Confirm self-audit photos | **Jobs** or **Live coverage** |
| 4 | Guard | Work shift — message client, file reports as needed | Active shift controls |
| 5 | Guard | End shift | **Map** → slide to end shift |
| 6 | Job status | **Completed** | — |

Staff monitor from **Map** and **Jobs**. Incidents appear in **Incidents**.

### Phase 6 — Money moves

1. Client paid at checkout (Stripe) before or when the job ran.
2. Platform auto-releases guard payout to Stripe Connect ~48 hours after completion.
3. Guard opens **Pay** → **Send to my bank** when available.
4. If overtime is disputed, payout may be held — Director/Founder resolve in **Payments** / **Disputes**.

### Phase 7 — Close the loop

- Client rates the guard from **Jobs**.
- Client reviews reports from **Home → Reports**.
- Guard reviews earnings in **Pay**.
- Anyone can open **Messages → Support** for help tickets and reports.

### Your cheat sheet — "who acts next?"

| Situation | Who has the ball |
|-----------|------------------|
| New client waiting | **Moderator+** — approve client account |
| New guard waiting (no creds yet) | **Moderator+** — approve guard application |
| Guard approved, creds uploading | **Guard** — upload on activation screen |
| Creds uploaded, pending review | **Administrator+** — verify in **Credentials** |
| All five creds verified | **Administrator+** — activate account |
| Job posted, not live | **Administrator+** — approve job offer |
| Job open, not paid | **Client** — Pay Now |
| Guard applied | **Client** — approve or decline guard |
| Shift not started | **Guard** — arrive and start shift |
| Self-audit pending | **Client** — confirm photos |
| Shift done, payout pending | **Platform** — auto-release (~48h) unless dispute hold |
| Overtime disputed | **Director/Founder** — **Disputes** / **Payments** |

---

## Job status lifecycle

Every job offer moves through these statuses:

| Status | Meaning | Where people usually see it |
|--------|---------|-----------------------------|
| **Draft** | Client started a job but has not submitted it yet | Client job-posting flow |
| **Pending review** | Client submitted the job and staff must approve it | Client **Jobs** page; staff **Applications** (job offers) and **Jobs** |
| **Open** | Staff approved the listing; guards can apply, or payment/assignment can continue | Client **Jobs** page; guard **Map**; staff **Jobs** |
| **Accepted** | A guard is assigned and confirmed | Client **Jobs** / **Live coverage**; guard **Map** / **Jobs**; staff **Jobs** / **Map** |
| **In progress** | Guard arrived, started the shift, and completed or skipped self-audit | Client **Live coverage** / **Jobs**; guard **Map**; staff **Map** / **Jobs** |
| **Completed** | Guard ended the shift | Client **Jobs**; guard **Jobs** / **Pay**; staff **Payments** |
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

#### Guard activation chart

```
GUARD (pending)                       MODERATOR+
  |                                     |
  | Sign up                             |
  | "Application under review"          |
  | Upload ID, COI, guard card, certs   |
  |------------------------------------>|
  |                                     | Approve application (pending → approved)
  |                                     |
GUARD (approved)                      ADMINISTRATOR+
  |                                     |
  | Finish any missing credentials      |
  | Progress bar updates                |
  |------------------------------------>|
  |                                     | Verify each credential (no auto-activate)
  |                                     |
GUARD (approved, all verified)        PLATFORM
  |                                     |
  | Account activates automatically     |
  |------------------------------------>|
  |                                     | Manually activate account
  | Full app unlocks (active)           |
  | Map / Jobs / Pay / Messages         |
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
  |     -> Guard should upload photos when able
  |     -> Client Jobs/Live coverage: confirm photos when available
  |
  |-- Incident or activity report
  |     -> Guard active shift: Report incident / Activity report
  |     -> Staff Incidents: review full report
  |     -> Client Home: Reports
  |
  |-- Late clock-out overtime
  |     -> Guard Jobs: Approve overtime
  |     -> Client Jobs: Approve overtime or Dispute charge
  |     -> Staff Payments or Disputes: settle and close
  |
  |-- Support question
        -> Client/Guard sidebar **Messages** group: **Messages** (job chats) or **Support** (tickets/reports)
        -> Staff sidebar **Messages** group: **Messages** (job/staff chat) or **Support** (ticket inbox)
```

---

## Client guide

### Client page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Map** | Bottom navigation | Live job geography and active shift map |
| **Home** | Bottom navigation | Quick actions, account status, live coverage shortcuts, reports shortcuts |
| **Messages** | Sidebar **Messages** group | Job chats and team threads |
| **Support** | Sidebar **Messages** group | Contact support, file a report, view ticket threads |
| **Guards** | Bottom navigation | Browse guard profiles and send direct requests |
| **Jobs** | Bottom navigation | View posted jobs, pay, approve guards, confirm audits, approve overtime, rate guards |
| **Invoices** | Sidebar → **Invoices** (Account group on phone) | View job invoices, download PDF, pay when staff mark invoice ready |
| **Profile** | Account menu | Company/contact profile details |
| **Guide** | Account menu | This guide |

### 1. Sign up, finish the profile, and wait for approval

1. Create a **Client** account during sign-up.
2. Complete the company profile and contact information from **Profile** in the account menu.
3. Watch **Home** for the pending approval state:
   - A pending client sees **Account pending approval** on **Home**.
   - Most operational pages are blocked until staff approves the account.
   - While pending, clients can still use **Home**, **Profile**, **Messages**, and **Guide**.
4. Staff approve the account from **Applications** or the **Clients** roster.
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

- Staff see the submitted job in **Applications** (job offers) and **Jobs**.
- Staff approve or decline the listing.
- Once approved, the job becomes **Open**.

### 3. Request a specific guard directly

Use this when you already know which guard you want.

1. Open **Guards** from the sidebar (menu button on phone).
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

- **Applications** (job offers queue).
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
4. Complete self-audit photos at clock-in, or skip with a **No Self Audit** flag until photos are added.

### 8. Confirm self-audit photos

Self-audit photos document that the guard arrived prepared. Guards take these photos themselves at shift start.

1. Open **Jobs** or **Live coverage**.
2. Open the active job.
3. Find the **Guard self-audit** / **Guard self-audit photos** section.
4. Review the selfie, uniform, and shoes photos.
5. Select **Confirm self-audit photos** when the photos are acceptable.

If the guard skipped the audit:

- The job may show **No Self Audit** until the guard uploads the required photos.

### 9. Use messages, job chat, support, and reports

Use the **Messages** sidebar group for communication:

1. Open **Messages** for job chats and team threads.
2. Open **Support** for help tickets and formal reports.
3. Select **Contact support** to open a new support ticket.
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

### 12. Invoices

After staff approve a completed job for billing, clients can view and pay formal invoices.

1. Open **Invoices** from the sidebar (under Account on phone).
2. Each row shows the job, invoice number, amount, and status (**Draft**, **Payment due**, **Paid**).
3. Tap an invoice to open details — review line items, dates, and totals.
4. Use **Download PDF** to save or share the invoice.
5. When status is **Payment due**, pay with **Pay by card** (Stripe) or Square if enabled.
6. You receive a push notification when an invoice is ready (if push is enabled in **Settings**).

Invoices complement the in-app **Jobs → Pay Now** flow — some jobs may show payment on the job card first; the invoice page is the record for approved billing.

---

## Guard guide

### Guard page map

| Page | Where it is | What it is for |
|------|-------------|----------------|
| **Activation screen** | Shown automatically after sign-in until account is **active** | Upload credentials, track application progress, wait for staff activation |
| **Map** | Bottom navigation (active guards only) | Find open jobs, claim direct requests, and run active shifts |
| **Jobs** | Bottom navigation (active guards only) | Upcoming assignments, past work, overtime review |
| **Crew** | Bottom navigation (trusted guards only) | Standing team roster, job crews, team codes |
| **Pay** | Bottom navigation (active guards only) | Stripe setup, earnings, and bank payouts |
| **Messages** | Sidebar **Messages** group (active guards only) | Job chats and team threads |
| **Support** | Sidebar **Messages** group (active guards only) | Contact support, file a report, view ticket threads |
| **Profile** | Account menu (active guards only) | Personal profile, resume, experience, and credentials |
| **Notifications** | Account menu | Inbox — tap to open list; unread badge on avatar; mark all read |
| **Settings** | Account menu | Theme, push notifications, notification sound (APK), legal pages, sign out — available on activation screen too |
| **Performance** | Account menu (active guards) | Overall, Standing, and Driving priority tabs; tier breakdown and rewards |
| **Vehicle** | Account menu (active guards, when driving jobs apply) | Vehicle profile, insurance link, staff approval for driving priority |
| **Preferences** | Account menu (active guards) | Job type and work-style preferences |
| **Availability** | Account menu (active guards) | Schedule and availability windows |
| **Guide** | Account menu (active guards only) | This guide |

### 1. Sign up, get approved, upload credentials, and become active

1. Create a **Guard** account during sign-up.
2. After sign-in you land on the **activation screen** with **Application under review**:
   - Upload government ID, COI, guard card, PTA/UOF, and 32-hour training while staff reviews your application.
   - **Map**, **Jobs**, **Pay**, **Messages**, **Profile**, and **Guide** are blocked.
3. When a **Moderator+ approves your application** (`pending` → `approved`):
   - Staff can verify the credentials you already uploaded.
   - Continue completing any missing items on the activation screen:
     - Government ID (front, back, selfie, state, number, expiration).
     - Certificate of Insurance (COI).
     - BSIS guard card.
     - Power to Arrest / Appropriate Use of Force (PTA/UOF).
     - 32-hour BSIS course block (or individual course certs).
     - Optional extra credentials (firearms, medical, FEMA, etc.).
4. **Administrators verify each credential** — nothing auto-verifies on upload.
5. When all five required credentials are verified, an **Administrator+ manually activates** your account (`approved` → `active`).
6. After activation, the full guard app opens — **Map**, **Jobs**, **Pay**, **Messages**, and **Profile**.

Grace period (optional training):

- If PTA/UOF or the 32-hour block is not on file when staff activate your account, a **48-hour grace window** applies automatically.
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
5. Once confirmed, the assignment appears in **Jobs** and active shift controls appear when the shift window opens.

### 5. Review upcoming and past jobs

1. Open **Jobs**.
2. The tier hero shows a breakdown of open, scheduled, completed, and missed work — tap a legend item or tab to filter.
3. Use upcoming jobs to confirm schedule and site details.
4. Use past jobs to review completed work, overtime prompts, ratings, and history.
5. Open job chat from the job when you need assignment-specific communication.

### 6. Coordinate crews (trusted guards only)

Trusted guards can build a **standing crew** — a reusable roster for multi-guard jobs.

**Standing crew vs job crew:**

| Term | What it is |
|------|------------|
| **Standing crew** | Your persistent team roster on the **Crew** page. Invite guards once; reuse them on future coordinated jobs. |
| **Job crew** | Guards rostered on a specific multi-guard shift. Appears under **Crew → Active** while you are coordinating that job. |

**Become a crew lead:**

1. Open **Crew**.
2. Under **Lead your own crew**, tap **Request crew lead approval**.
3. Staff review the request in **Crews** and approve or decline.
4. Once approved, name your crew and invite members from your standing roster.

**Join another coordinator's crew:**

1. Open **Crew**.
2. Under **Join a crew**, enter the team code from the coordinator.
3. You can only be on **one standing crew at a time** — leave your current crew before joining another.

**On a multi-guard job:**

1. Apply as **team lead** from the map on a job that needs multiple guards.
2. Open **Crew → Active** to manage roster slots, share the team code, and invite your standing crew.
3. Clients approve the full crew before the job is accepted.

**If trusted status is removed:**

- Your standing crew is dissolved.
- Coordinated jobs you lead may be re-listed on the marketplace.
- You can still work as a regular guard but cannot coordinate new crews until staff restore trusted status.

### 7. Performance, vehicle, and driving priority

**Performance** (account menu → **Performance**):

- **Overall** — composite tier and rating across all job types.
- **Standing** — foot-patrol / static-post priority progress.
- **Driving** — vehicle-patrol priority progress (requires approved vehicle + valid insurance).

**Vehicle** (account menu → **Vehicle**, when driving jobs apply):

1. Upload **vehicle insurance** in **Profile → Credentials** first.
2. Save vehicle details (make, model, plate, etc.) on the **Vehicle** page.
3. Submit for staff approval — driving priority stays locked until approved.
4. Renew insurance before expiry — expired insurance blocks vehicle/driving access.

### 8. Start a shift

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
- The job is flagged **No Self Audit** until you upload the three required photos yourself.

### 9. Work the shift

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

### 10. End a shift

1. At the end of the shift, open **Map** if the active shift controls are not already visible.
2. Use **Slide to end shift** during the allowed clock-out window.
3. Confirm checkout details.
4. Complete any optional client rating prompt.
5. The job becomes **Completed**.
6. Earnings appear under **Pay** after the payment/payout rules are satisfied.

Late clock-out:

- If you clock out late, the app may ask for a time confirmation.
- Late clock-out can create overtime that both guard and client must approve.

### 11. Review overtime

1. Open **Jobs**.
2. Open the job with **Late clock-out overtime**.
3. Review the overtime amount and details.
4. Select **Approve overtime** if the overtime is correct.
5. If client approval/payment is also required, wait for the client and staff payment process.

### 12. Collect payouts

1. Open **Pay**.
2. Review earnings by job.
3. For Stripe payouts:
   - Make sure your bank account is connected.
   - Use **Send to my bank** when payout is available (after auto-release delay).

Payouts depend on:

- Client payment status.
- Auto Stripe payout schedule (~48h after completion).
- Whether overtime or disputes are still open.

### 13. Get help or message people

1. Open **Messages** for job chats.
2. Open **Support** for help tickets and formal reports.
3. During an active shift, **Message client** opens the relevant job chat.

---

## Moderator guide

Moderators are the front line for account intake and field monitoring. You **approve applications** — you do **not** verify credential documents or activate accounts.

### What you can do

| Action | Where |
|--------|-------|
| Approve client accounts | **Applications** |
| Approve guard applications (`pending` → `approved`) | **Applications** — slide to approve application |
| View guards awaiting credential verification | **Applications** or **Guards** — account auto-activates when Administrator+ verifies all five creds |
| Monitor live jobs and map | **Map**, **Jobs**, **Overview** |
| Review field reports | **Incidents** (view) |
| Message clients, guards, staff | **Messages** |

### What you cannot do

- Verify credentials, government ID, or insurance (Administrator+ only)
- Approve job listings (Administrator+ only)
- Handle disputes, suspend users, or access **Payments**
- Add staff accounts or change platform fees

### Daily workflow

1. Open **Overview** — check approval queue counts.
2. **Applications** — approve pending clients and guard **applications** (intake only; credentials can be uploaded while pending).
3. **Credentials** — Administrator+ verifies documents; accounts **auto-activate** when all five activation credentials are verified.
4. **Map** / **Jobs** — monitor active shifts and **No Self Audit** flags on jobs where guards skipped photos.
5. **Messages** — respond to support tickets.

### Guard activation (your role)

| Step | Your action | Guard status |
|------|-------------|--------------|
| 1 | **Slide to approve application** | `pending` → `approved` (guard may already have credentials on file) |
| 2 | Administrator+ verifies all five credentials in **Credentials** | Account **auto-activates** → `active` when checklist is clear |

Moderators do not verify documents or manually activate accounts.

---

## Administrator guide

Administrators handle credential verification and day-to-day operations. You inherit everything Moderators do **plus** document verification, job reviews, and user management.

### What you can do (in addition to Moderator)

| Action | Where |
|--------|-------|
| Verify government ID | **Credentials** or **Guards** → ID review section |
| Verify credentials (guard card, COI, PTA/UOF, 32-hr, permits) | **Credentials** or **Guards** |
| Approve or decline job offers | **Applications** (job offers queue) |
| Handle disputes | **Disputes** |
| Suspend or restore users | **Guards** / **Clients** detail panels |
| View analytics | **Analytics** |
| Partial platform settings | **Settings** (approval rules, integrations — no payment controls) |

### Credential verification workflow

1. Open **Credentials** (or **Guards** → guard detail).
2. Review each pending upload — government ID, COI, guard card, training certs.
3. **Verify** or **Reject** each document. Nothing auto-verifies.
4. Optional credentials (firearms, medical, FEMA) only appear to clients after you verify them.
5. When all five activation credentials are verified, the account **activates automatically** — no separate activate button.

### Job offer review

1. **Applications** (job offers queue).
2. Check location, schedule, pay, requirements, map coordinates.
3. **Slide to approve job** or **Decline** with reason.

---

## Director guide

Directors have unrestricted operational access and financial controls. You manage Administrators and Moderators (not other Directors).

### What you can do (in addition to Administrator)

| Action | Where |
|--------|-------|
| All payment and payout controls | **Payments** |
| Cash handling overrides, refunds, platform fees | **Payments**, **Payment settings** |
| Manage staff team (add Moderators, Administrators) | **Staff** |
| Place guard on job (dispute/safety exception only) | **Jobs** — confirmation required |
| Full analytics with financial data | **Analytics** |
| Dev notes | **Dev notes** (sidebar) |
| Mark guards/clients as **trusted** | **Guards** / **Clients** detail |

### Financial workflow

- Most payouts auto-release ~48h after job completion — **no action needed**.
- **Dispute hold only** — manually release payout when overtime dispute is resolved.
- Monitor **Payments** for overtime awaiting client payment.

### Team management

1. **Staff** panel — view roster.
2. **Add staff** — create Moderator or Administrator accounts.
3. Cannot modify other Directors or Founders.

---

## Founder guide

The Founder is the platform governance overseer. You inherit everything Directors do **plus** top-tier staff and platform configuration.

### What only Founders can do

| Action | Where |
|--------|-------|
| Change payment methods and platform modes | **Payment settings** |
| Edit Founder homepage message | **Settings → Founder message** |
| Manage Director accounts | **Staff** |
| Ultimate platform governance | All panels |

### What you share with Directors

- Financial controls, **Payments**, **Dev notes**
- Trusted status, job exception placement
- **Payment settings** (fees, crew pay bump), **Marketplace agreements**, **Audit log**

### Governance principles

- **Moderators** approve applications — they do not verify documents or activate accounts.
- **Administrators** verify credentials and review jobs — they do not manage Directors.
- **Directors** run operations and finances — they do not manage other Directors.
- **Founders** oversee the platform — cannot moderate other Founders.

### Staff page map (all roles)

| Page | Moderator | Administrator | Director | Founder |
|------|-----------|---------------|----------|---------|
| **Overview** | ✓ | ✓ | ✓ | ✓ |
| **Map** / **Jobs** | ✓ | ✓ | ✓ | ✓ |
| **Applications** / **Credentials** | Approve applications | + Verify credentials | ✓ | ✓ |
| **Guards** / **Clients** | ✓ | + Suspend | + Trusted | ✓ |
| **Messages** / **Incidents** | ✓ | ✓ | ✓ | ✓ |
| **Stats** (desktop) | ✓ | ✓ | ✓ | ✓ |
| **Disputes** | — | ✓ | ✓ | ✓ |
| **Analytics** | — | ✓ | + Financials | ✓ |
| **Payments** | — | — | ✓ | ✓ |
| **Staff** | — | — | ✓ | + Directors |
| **Payment settings** | — | — | ✓ | + Payment methods |
| **Marketplace agreements** | — | — | ✓ | ✓ |
| **Audit log** | — | — | ✓ | ✓ |
| **Permissions** | — | — | ✓ | ✓ |
| **Settings** | — | ✓ | ✓ | ✓ |
| **Dev notes** | — | — | ✓ | ✓ |

---

## Staff role permissions

Guardr staff roles form a hierarchy: **Moderator → Administrator → Director → Founder**. Each tier inherits the capabilities of the roles below it unless a restriction is noted.

Use this reference when onboarding staff, answering “can I do X?” questions, or routing an escalation to the right tier.

The summary cards below list the key permissions for each role. Expand the topics for sidebar access and common workflows.

### Platform sidebar access

| Page | Moderator | Administrator | Director | Founder |
|------|-----------|---------------|----------|---------|
| **Overview**, **Map**, **Jobs** | ✓ | ✓ | ✓ | ✓ |
| **Applications**, **Credentials**, **Guards**, **Clients** | ✓ | ✓ | ✓ | ✓ |
| **Messages**, **Incidents** | ✓ | ✓ | ✓ | ✓ |
| **Stats** (desktop) | ✓ | ✓ | ✓ | ✓ |
| **Disputes**, **Analytics** | — | ✓ | ✓ | ✓ |
| **Payments** | — | — | ✓ | ✓ |
| **Staff** (team roster) | — | — | ✓ | + Directors |
| **Payment settings** | — | — | ✓ edit fees & crew bump | + payment methods |
| **Marketplace agreements** | — | — | ✓ | ✓ |
| **Audit log** | — | — | ✓ | ✓ |
| **Permissions** | — | — | ✓ job approval rules & role toggles | ✓ |
| **Settings** | — | ✓ | ✓ | ✓ |
| **Dev notes** | — | — | ✓ | ✓ |

### Governance principles

- **Moderators** approve applications — they do not verify credential documents or activate accounts.
- **Administrators** verify credentials and review jobs — they do not access payments, audit logs, or executive payment settings.
- **Directors** run operations and finances — they do not manage other Directors.
- **Founders** oversee the platform — cannot moderate other Founders.

### Moderator permissions

- Approve guard and client **applications** (`pending` → `approved`)
- Monitor live jobs, map, and incidents
- Reply to support messages
- **Cannot:** verify credentials, approve job offers, handle disputes, access payments, or change platform settings

### Administrator permissions

Everything Moderators can do, plus:

- Verify government ID, guard card, COI, and training credentials
- Approve or decline job offers
- Handle disputes and suspend or restore users
- View analytics and manage general **Settings** (approval rules, integrations, homepage messages)
- **Cannot:** access **Payments**, **Payment settings**, **Marketplace agreements**, **Audit log**, or change payment methods

### Director permissions

Everything Administrators can do, plus:

- Full **Payments** pipeline — deposits, payouts, cash overrides, dispute holds
- Edit platform fees and crew team pay bump in **Payment settings**
- Review **Marketplace agreements** compliance and the **Audit log**
- Manage Moderators and Administrators in **Staff**
- Mark guards and clients as **trusted**
- Place guards on jobs (dispute/safety exception only)

### Founder permissions

Everything Directors can do, plus:

- Change **Payment settings → Payment methods** (Stripe / cash toggles)
- Manage Director accounts
- Ultimate platform governance across all panels
- **Cannot** moderate or suspend other Founder accounts

---

## End-to-end sequence (marketplace job)

```
Client opens Home or Jobs
    → Client posts job with Slide to post job offer
    → Staff opens Applications (job offers)
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
| Open this guide | Homepage **Guide** or account menu → **Guide** | Account menu → **Guide** (after **active**) | Sidebar → **Guide** |
| Account approval / activation | **Home** pending banner; account menu → **Profile** | **Activation screen** — wait for approval, then upload creds; blocked until **active** | **Moderator+** approve application; **Administrator+** verify creds & activate |
| Post marketplace job | **Home → Post job offer** or **Jobs → + Post offer** | — | **Applications** (job offers) |
| Direct guard request | **Guards → guard profile → Send assignment request to [name]** | **Map → Slide to claim job** | **Jobs** |
| Add location | Posting flow → **Use current location** | — | **Jobs → Use current location** when editing location |
| Pay for job | **Jobs → Pay Now** | — | — |
| Apply for job | — | **Map → Slide to apply for job** | — |
| Approve guard | **Jobs → Approve guard** / **Decline guard** | — | Dispute/safety placement only |
| Start shift | Watch from **Live coverage** / **Jobs** | **Map → Slide to arrive on site → Slide to start shift** | **Map** / **Jobs** |
| Self-audit | **Jobs** or **Live coverage → Confirm self-audit photos** | Self-audit modal after start shift | **Jobs** — view **No Self Audit** flags |
| On-duty messages | **Messages** / job chat | **Message client** / **Messages** | **Messages** |
| Incident/activity reports | **Home → Reports** to review | **Report incident** / **Activity report** | **Incidents** |
| End shift | Watch completion from **Jobs** | **Map → Slide to end shift** | **Jobs** |
| Overtime | **Jobs → Approve overtime $X** or **Dispute charge** | **Jobs → Approve overtime** | **Payments** / **Disputes** |
| Payout | — | **Pay → Send to my bank** | **Payments** — dispute-hold override only (Director/Founder) |
| Support | **Support** → Contact support or File a report | **Support** → Contact support or File a report | **Support** ticket inbox |

---

## Sections & features reference

This section describes each key part of the app — what it contains, what it is for, and how to use it.

---

### Guard activation screen

**Where:** Shown automatically after guard sign-in until account status is **active**

Guards who are **pending** see **Application under review** and can upload the five required credentials on that screen. Staff verify credentials after the application is approved. Guards who are **approved** (but not yet **active**) continue uploading here until staff activate the account.

| Element | What it is |
|---------|------------|
| **Title** | **Application under review** (pending) or **Complete your credentials** (approved) or **Awaiting account activation** (approved, all creds verified) |
| **Subtitle** | Short explanation of what to do next or that staff are finishing activation |
| **Progress bar** | % complete across five requirements: government ID, COI, guard card, PTA/UOF, 32-hour block |
| **Credential uploads** | Same upload UI as **Profile → Credentials** — tap each row to add or update documents |

**Account menu while pending/approved:** **Settings** and **Sign out** only — no **Profile** link.

---

### Guard credentials

**Where:**

- **Before active:** Activation screen (inline uploads on the same page).
- **After active:** Account menu → **Profile** → **Credentials**.

Staff can also open credentials from **Guards → guard detail** and upload documents on the guard's behalf.

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

If PTA/UOF or the 32-hour block is not on file when the account would auto-activate, a **48-hour grace window** applies automatically. The guard can work during grace. If grace expires before credentials are uploaded, marketplace access may be restricted until they are on file.

---

### Guard status & qualification panel

**Where:** Account menu → **Profile** → guard status card (active guards only)

This panel shows activation status and which credentials are on file. Guards who are not yet **active** use the **activation screen** progress bar and checklist instead.

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

**For guards:** When you start a shift, the self-audit modal opens automatically. Take and submit all three photos to start the shift. If you need to skip temporarily, use **Skip self audit · clock in** — the job is flagged **No Self Audit** until you upload the photos yourself.

**For clients:** Self-audit photos appear in the job detail under **Guard self-audit photos**. Review the photos and tap **Confirm self-audit photos** when they are acceptable.

**For staff:** If a guard skipped the audit, the job shows a **No Self Audit** flag on **Jobs** and **Map** for monitoring. Guards upload their own photos — staff do not add them on the guard's behalf.

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
- Verify credentials; accounts auto-activate when all five required credentials are verified.
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
- Add new staff accounts (**Add staff** button) — Directors and Founders only.
- Review each member's role — see **Guide → Staff role permissions** for what each tier can do.

Staff accounts manage the platform only and cannot accept field guard jobs.

#### Applications panel

**Where:** Staff sidebar → **Applications**

The Applications section holds account intake and job-offer review queues. Open a queue to view items and take action.

| Queue | What it holds |
|-------|---------------|
| **Job offers** | Submitted job listings waiting for staff approval before going live. |
| **Guard accounts** | New guard sign-ups — Moderator+ **approve application** (`pending` → `approved`). Guards can upload credentials while pending. |
| **Client accounts** | New client sign-ups waiting for staff approval. |
| **Staff accounts** | Staff-provisioned accounts awaiting review (Director/Founder). |

When Administrator+ verifies all five activation credentials, guard accounts **auto-activate** (`approved` → `active`).

On phone, the Applications roster fits the viewport — scroll inside the list, not the whole page.

#### Credentials panel

**Where:** Staff sidebar → **Credentials**

Credential and COI verification queue — staff verify license photos, government ID, and training documents. Approve or reject each upload. Pending guards can also upload activation credentials from their application review screen.

_Note: Guards apply directly to clients for marketplace jobs._

#### Payments panel

**Where:** Staff sidebar → **Payments** (Directors and Founders)

Every job follows the same payment path: the client pays, the job runs, then the guard collects pay from their Pay screen. Jobs in Payments are grouped by what needs to happen next.

| Stage | Description |
|-------|-------------|
| **Awaiting client payment** | Client has not paid yet — job ready for Stripe checkout. |
| **Awaiting guard payout** | Job complete — auto Stripe release scheduled; guard collects from **Pay**. |
| **Dispute hold** | Payout blocked by overtime dispute — staff resolve in **Disputes**, then release if needed. |

**Payment settings** (Directors and Founders — sidebar → **Platform**):

- **Payment methods** — Card (Stripe) and optional cash (Founder edits methods; Directors view)
- **Platform fees** — flat $/hr or percentage model for new jobs
- **Crew team pay bump** — extra $/hr for guards rostered on coordinated crew jobs

Platform fees are set globally in **Payment settings**. Open-contract jobs can override per agreement. Existing jobs keep their original fee.

#### Incidents panel

**Where:** Staff sidebar → **Incidents**

All incident reports filed by guards across active and completed jobs. Each report includes who, what, when, where, why, and how the guard responded — shared with the client.

On phone, the Incidents list fits the viewport the same way as Applications.

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

Available from the **Support** sidebar tab for clients and guards. Opens a new support thread with the Guardr operations team. The team responds in the same thread.

#### File a report

Available from the **Support** sidebar tab for clients and guards. Use for safety concerns, formal complaints, or structured reports that need staff review and follow-up.

---

### Install the app

Guardr ships as a **website**, **installable PWA**, and **Android APK** (currently **v1.0.82**, build **182**).

| Surface | How to install |
|---------|----------------|
| **Website** | Open [guardr.co](https://www.guardr.co) in any browser |
| **PWA** | **iOS:** Safari → Share → **Add to Home Screen**. **Android/Chrome:** browser menu or install prompt → **Install** |
| **Android APK** | [guardr.co/download](https://www.guardr.co/download) — scan QR or tap **Download APK** |

Installing the PWA or APK gives faster access, live shift tracking, and push notifications when Guardr is closed. The APK loads the live site in a native shell with black branding; the PWA uses white branding on the home screen and **updates automatically** when you open it.

#### APK updates (important)

The APK does **not** auto-update like the PWA. When a new build ships:

1. Open [guardr.co/download](https://www.guardr.co/download) in your browser.
2. If your installed version is older, the page shows **Update available**.
3. Download and install again (your account data stays in the cloud).
4. Uninstall the old APK first if Android blocks the install.

The install page reads the version from inside the APK — not just the website label — so reinstall when the page says you are behind.

#### Push notifications

| Surface | How it works |
|---------|--------------|
| **PWA / browser** | Web Push (VAPID) — enable in **Settings → Push notifications** |
| **Android APK** | Native Firebase (FCM) — same **Settings** toggle; requires a push-enabled APK build |

After installing or updating the APK:

1. Open **Settings** → **Push notifications**.
2. Turn on **Register this device**.
3. Allow notifications when Android prompts.
4. Tap **Test notification** to confirm.
5. On APK, choose **Notification sound** — **Guardr tone** (walkie chirp) or **System sound** (pick from Android).

Guards can set **quiet hours** and per-alert-type toggles in the same panel.

### Live updates (no refresh needed)

Guardr syncs key data in real time across web, PWA, and APK:

- **Messages** and job chats
- **Notifications** inbox
- **Staff audit log**
- **Live guard location** on active jobs (when sharing is on)

You should not need to pull-to-refresh for these — changes appear when the other party acts.

### System back button

On **mobile, tablet, and desktop**, the system back control works consistently:

| Surface | Back control |
|---------|--------------|
| **Website / PWA** | Browser back button or swipe-back gesture |
| **Android APK** | Hardware back button |

Back closes open sheets and dialogs first (auth, More menu, confirm prompts, message threads, job details), then navigates to the previous in-app page. At the root screen on APK, back minimizes the app instead of force-closing it.

Press back repeatedly to step out of nested views (for example: guard profile → guards list → map tab).

---

## Need help?

- **Clients:** Open **Support** for **Contact support** or **File a report**. Use **Messages** for job chats.
- **Guards:** Open **Support** for **Contact support** or **File a report**. Use **Messages** for job chats. During a shift, use **Message client** for the active job chat.
- **Staff:** Open **Messages** for job/staff chat and **Support** for the ticket inbox. Use **Incidents** and **Disputes** for escalations. Filter this guide by your role: **Moderator**, **Administrator**, **Director**, or **Founder**.
- **This guide:** Clients and guards open the account menu and select **Guide**. Staff select **Guide** in the left sidebar.
