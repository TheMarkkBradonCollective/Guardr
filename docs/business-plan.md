# Guardr Business Plan

**Prepared for:** Signature Security Specialist, LLC  
**Product:** Guardr — [guardr.co](https://guardr.co)  
**Date:** August 2026  
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Description](#2-company-description)
3. [Problem & Solution](#3-problem--solution)
4. [Market Analysis](#4-market-analysis)
5. [Products & Services](#5-products--services)
6. [Business Model & Unit Economics](#6-business-model--unit-economics)
7. [Go-to-Market Strategy](#7-go-to-market-strategy)
8. [Operations Plan](#8-operations-plan)
9. [Management & Organization](#9-management--organization)
10. [Financial Projections](#10-financial-projections)
11. [Funding Requirements & Use of Funds](#11-funding-requirements--use-of-funds)
12. [Risk Analysis & Mitigation](#12-risk-analysis--mitigation)
13. [Milestones & Roadmap](#13-milestones--roadmap)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### The Opportunity

California is the largest private security market in the United States, with an estimated **$2.3 billion** in annual spending and more than **351,000 licensed security guards** regulated by the Bureau of Security and Investigative Services (BSIS). Despite this scale, hiring licensed security coverage remains slow, opaque, and agency-centric. Clients wait days for quotes, have little visibility into who is on site, and pay through fragmented invoicing. Guards — most of whom are independent contractors in practice — lack a direct channel to find work on their own terms.

### The Solution

**Guardr** is a map-first, on-demand marketplace that connects clients who need licensed security coverage with independent contractor guards who browse and accept work directly. Guardr handles discovery, credential verification, booking, in-app payments, live shift tracking, and post-shift reporting — while guards and clients contract directly for each job.

**Tagline:** *Anytime. Anywhere. Security, When You Need It.*

### Company

| Item | Detail |
|------|--------|
| Legal entity | Signature Security Specialist, LLC |
| Product brand | Guardr |
| Website | [guardr.co](https://guardr.co) |
| Support | support@guardr.co |
| Geography | California (BSIS-aligned) |
| Status | Live production (v1.0 beta, launched June 2026) |

### Business Model

Guardr earns a **platform fee per hour** on every completed shift — embedded in the client rate at booking. Default economics at a $35/hr client rate:

| Party | Amount |
|-------|--------|
| Client pays | $35/hr |
| Guard receives | $30/hr |
| Platform fee | $5/hr |

Revenue scales with gross merchandise volume (GMV): hours worked × client rate × number of jobs.

### Traction & Readiness

- Production platform live at guardr.co with web, PWA, and Android APK distribution
- Full three-sided marketplace: clients, guards, and internal staff operations
- Stripe Connect payments with automated guard payouts
- BSIS credential verification workflow (guard card, COI, PTA/UOF, 32-hour training block)
- Comprehensive legal framework (Terms, Privacy, ICA, client agreement, guard conduct)
- User manuals, staff ops tooling, and investor-demo-ready product (July 2026)

### Financial Highlights (Year 1 Target — Base Case)

| Metric | Target |
|--------|--------|
| Active guards on platform | 500 |
| Active business clients | 75 |
| Monthly completed shifts | 1,200 |
| Average shift length | 6 hours |
| Average client rate | $38/hr |
| Annual GMV | ~$3.3M |
| Annual platform revenue | ~$430K |
| Net revenue after staff share (~50%) | ~$215K |

### Funding Ask

**$500K–$750K seed round** to fund 18 months of operations: guard and client acquisition, Google Play / App Store launch, initial city expansion within California, and compliance/legal reserve.

---

## 2. Company Description

### Mission

Make licensed security coverage as accessible and transparent as ordering a ride — while preserving the independence of guards and the direct accountability between guards and clients.

### Vision

Become the trusted compliance-first marketplace for independent security professionals, starting in California and expanding state by state as credential and regulatory frameworks allow.

### Legal Positioning

Guardr is operated by Signature Security Specialist, LLC as a **technology platform only**. Guardr is explicitly **not**:

- A private patrol operator (PPO)
- A security guard employer
- A staffing agency
- A licensed security services provider

Guards and clients enter into a direct independent contractor relationship for each job. Guardr facilitates discovery, booking, payment, and documentation. Credential review is administrative — not a guarantee of suitability or safety outcomes.

### What We Have Built

Guardr is not a concept or prototype. As of August 2026, the platform includes:

- **Client tools:** Job posting, guard approval, live coverage dashboard, self-audit photo review, invoicing, incident/activity reports, ratings
- **Guard tools:** Map-first job discovery, credential wallet, shift lifecycle (GPS check-in, self-audit, reports), Stripe Connect payouts, performance tiers
- **Staff operations:** Application approval queues, credential verification, dispute resolution, SLA dashboards, payment pipeline, broadcast notifications, audit log
- **Cross-platform delivery:** Responsive web, installable PWA, Capacitor Android APK (Google Play listing prepared)

### Core Values

1. **Compliance first** — BSIS credential requirements are built into onboarding, not bolted on
2. **Transparency** — Rates, fees, and guard credentials are visible before booking
3. **Independence** — Guards choose jobs; clients approve who works their site
4. **Accountability** — Self-audits, live tracking, and post-shift reports create a documented record
5. **Technology, not dispatch** — We connect; we do not assign or employ guards

---

## 3. Problem & Solution

### The Problem

#### For Clients (Businesses, Venues, Property Owners)

| Pain Point | Current Reality |
|------------|-----------------|
| Slow procurement | Calling agencies, waiting for quotes, negotiating contracts takes days |
| Opaque pricing | Markups, minimums, and overtime rules are unclear until invoiced |
| Limited choice | Agency dispatches whoever is available — client has little say |
| Poor visibility | No live confirmation of who arrived, in what uniform, at what time |
| Fragmented billing | Separate invoices, disputes, and payment follow-up |

#### For Guards (Licensed Independent Contractors)

| Pain Point | Current Reality |
|------------|-----------------|
| No direct market | Work flows through agencies that take a large margin |
| Inflexible scheduling | Assigned shifts, not chosen shifts |
| Delayed pay | Net-30 or net-60 invoicing is common |
| Credential friction | Re-submitting documents to every new employer |
| Mobile-unfriendly tools | Paper logs, phone calls, text chains |

#### For the Industry

- **351,000+ licensed guards** in California, but no dominant gig-economy-style marketplace with built-in BSIS compliance
- **5,700+ licensed security companies** compete on relationships and dispatch speed, not technology
- Rising labor costs (8–12% rate increases projected for 2026) pressure margins and increase demand for flexible staffing models

### The Guardr Solution

| Stakeholder | How Guardr Helps |
|-------------|------------------|
| **Clients** | Post coverage in minutes, approve guards by profile and credentials, pay in-app, watch live shifts, receive formal reports |
| **Guards** | Browse jobs on a map, choose work, get paid via Stripe Connect within ~48 hours of completion |
| **Industry** | A compliance-native marketplace layer that sits above traditional agency dispatch |

### Competitive Comparison

| Dimension | Traditional Agency | Job Board / Classifieds | Guardr |
|-----------|-------------------|------------------------|--------|
| Guard selection | Agency dispatches | Client posts; no verification | Guards apply; client approves |
| Credential check | Internal | None | Platform-verified before go-live |
| Payment | Separate invoicing | Off-platform / cash | In-app Stripe; automated payouts |
| Shift visibility | Varies | None | Self-audit photos, GPS, live dashboard |
| Compliance | Agency license | None | BSIS-aligned credential wallet |
| Relationship | Agency employs/assigns | Informal | Independent contractor per job |

---

## 4. Market Analysis

### Market Size

| Segment | Estimate | Source / Basis |
|---------|----------|----------------|
| California private security market | ~$2.3B annually | Industry estimates (2025–2026) |
| Licensed security guards (CA) | 351,170 | BSIS licensing data (Feb 2026) |
| Licensed security companies (CA) | ~5,700 active PPOs | State licensing directories |
| Armed guard hourly rate (CA) | $45–$85/hr | Market surveys (2026) |
| Unarmed guard hourly rate (CA) | $25–$45/hr | Market surveys (2026) |

### Serviceable Addressable Market (SAM)

Guardr's initial SAM focuses on **on-demand and short-notice security coverage** in California metro areas — jobs where speed, transparency, and direct guard selection matter more than long-term agency contracts.

**Conservative SAM estimate:**

- 351,000 licensed guards × 10% active gig-seekers = **35,000 potential guard supply**
- 5,700 security companies + thousands of unmet direct-hire clients = **large fragmented demand**
- If 5% of CA security spend shifts to marketplace platforms over 5 years = **~$115M annual GMV opportunity**

### Serviceable Obtainable Market (SOM) — Year 3 Target

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Active guards | 500 | 2,000 | 5,000 |
| Active clients | 100 | 400 | 1,000 |
| Monthly shifts | 1,200 | 5,000 | 15,000 |
| Annual GMV | $3.3M | $14M | $42M |
| Platform revenue | $430K | $1.8M | $5.5M |

### Target Customer Segments

#### Primary — Business Clients

| Segment | Use Case | Typical Job |
|---------|----------|-------------|
| Event organizers | Concerts, festivals, private events | 4–20 guards, 6–12 hours |
| Retail & hospitality | Loss prevention, door staff, crowd control | 1–4 guards, recurring |
| Construction & industrial | Site security, equipment protection | 1–2 guards, multi-week |
| Property management | Vacant property, HOA patrols | 1 guard, recurring |
| Corporate campuses | Lobby, parking, executive protection | 1–10 guards, scheduled |

#### Secondary — Personal Clients

Individuals hiring guards for personal events, travel, or property — capped at 4 guards per request.

#### Supply — Guards

Licensed California security professionals seeking flexible, independent work:

- Part-time guards supplementing agency income
- Full-time independents building their own client base
- Specialized guards (armed, executive protection, medical) commanding premium rates

### Market Trends

1. **Gig economy normalization** — Workers expect app-based discovery and instant pay
2. **Rising security demand** — Retail shrink, event rebound, construction activity
3. **Regulatory complexity** — BSIS training mandates create barrier to entry that favors compliance-first platforms
4. **Transparency expectations** — Clients want photo verification, GPS, and digital records
5. **Labor cost pressure** — Agencies pass costs to clients; direct marketplace models can be more efficient

### Competition

| Competitor Type | Examples | Guardr Advantage |
|-----------------|----------|------------------|
| Traditional PPOs | Allied Universal, Securitas, regional agencies | Speed, choice, transparency, lower overhead |
| Staffing platforms | Indeed, Craigslist, Facebook groups | Credential verification, payments, shift tracking |
| Tech-enabled security | Trackforce, Silvertrac (guard management) | Full marketplace — not just workforce management |
| General gig platforms | Uber, TaskRabbit | Security-specific compliance and workflows |

**Guardr's defensibility:** Deep BSIS compliance integration, three-sided ops platform (not just a job board), integrated payments and disputes, mobile-first field UX, and California-first regulatory expertise.

---

## 5. Products & Services

### Platform Overview

Guardr is a three-sided marketplace delivered as a cross-platform application (web, PWA, Android APK, iOS planned).

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CLIENTS   │────▶│   GUARDR    │◀────│   GUARDS    │
│  (demand)   │     │  (platform) │     │  (supply)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    STAFF    │
                    │ (operations)│
                    └─────────────┘
```

### Client Features

| Feature | Personal Account | Business Account |
|---------|-----------------|------------------|
| Guards per request | Up to 4 | Up to 50 |
| Job posting | ✓ | ✓ |
| Sites & rosters | — | ✓ |
| Live coverage dashboard | ✓ | ✓ |
| Formal invoicing & reports | Basic | Full reporting suite |
| Open-contract pricing | ✓ | ✓ |
| Trusted-client auto-publish | — | Configurable |

### Guard Features

- Map-first job discovery with distance, rate, and type filters
- Credential wallet (government ID, BSIS guard card, COI, PTA/UOF, 32-hour CE package)
- Shift lifecycle: heading → arrive (GPS) → start → self-audit → work → end
- On-shift tools: incident reports, activity logs, client messaging, pre-shift briefing
- Earnings via Stripe Connect with ~48-hour payout release
- Performance tiers (Overall / Standing / Driving priority)
- Vehicle profile for patrol/driving jobs
- Guard community chat (guards + staff)

### Staff / Operations Features

- Role hierarchy: Support → Moderator → Administrator → Manager → Director → Founder
- Approval queues for guards, clients, staff, and jobs
- Credential verification with expiry alerts
- SLA dashboard (approval time, fill time, no-show rate)
- Dispute resolution and payment holds
- Platform analytics and financial controls (Director+)
- Service area management (city-level within California)
- Broadcast notifications

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, Base Web |
| Backend | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth + PBKDF2 bridge |
| Payments | Stripe Connect (marketplace facilitator) |
| Maps | Leaflet + react-leaflet |
| Push | Web Push (VAPID) + FCM (Android) |
| Mobile | Capacitor 7 (Android APK; iOS scaffolded) |
| Hosting | Vercel (guardr.co) |
| CI/CD | GitHub Actions + Playwright E2E |

### Distribution Channels

| Channel | Status |
|---------|--------|
| Web (guardr.co) | Live |
| PWA (installable) | Live |
| Android APK (sideload) | Live — guardr.co/download |
| Google Play | Listing prepared; AAB build pending |
| iOS App Store | Scaffolded; pending Apple Developer account |

---

## 6. Business Model & Unit Economics

### Revenue Model

Guardr earns revenue through **platform fees** deducted from the client hourly rate before guard pay. No subscription fees. Revenue is purely transactional.

**Fee models (configurable in Staff → Payment settings):**

| Model | Description | Default |
|-------|-------------|---------|
| Flat | Fixed $/hr per account type and guard type | $5/hr personal, $6/hr business |
| Percent | % of client rate with min/max caps | 15% |
| Tiered | Fee scales with hourly rate bands | Legacy |

Fees **snapshot at job creation** — rate changes do not affect existing jobs.

### Unit Economics — Single Shift Example

**Assumptions:** 1 guard, 8-hour shift, $35/hr client rate, $5/hr flat platform fee

| Line Item | Amount |
|-----------|--------|
| Client pays (gross) | $280.00 |
| Guard receives ($30/hr × 8) | $240.00 |
| Platform fee ($5/hr × 8) | $40.00 |
| Stripe processing (~2.9% + $0.30) | ~$8.42 |
| Staff revenue share (~50% of fees) | $20.00 |
| **Net to company** | **~$11.58** |

**Net margin per shift:** ~4.1% of GMV (before fixed overhead)

At scale, fixed costs (hosting, insurance, legal) amortize across volume and margin improves.

### Unit Economics — Monthly (Base Case, Month 12)

| Metric | Value |
|--------|-------|
| Completed shifts | 1,200 |
| Avg shift hours | 6 |
| Avg client rate | $38/hr |
| Avg platform fee | $5.50/hr |
| Monthly GMV | $273,600 |
| Monthly platform revenue | $39,600 |
| Staff share (50%) | $19,800 |
| Stripe fees (~3%) | $8,208 |
| **Net revenue** | **~$11,592** |

*Note: This is contribution margin before fixed operating expenses.*

### Key Metrics to Track

| Metric | Definition | Target (Month 12) |
|--------|------------|-------------------|
| GMV | Total client spend | $274K/mo |
| Take rate | Platform fee / GMV | ~14.5% |
| Fill rate | Jobs filled / jobs posted | > 80% |
| Time to fill | Post → guard accepted | < 4 hours |
| Guard utilization | Shifts per active guard / month | 2.4 |
| Client retention | Repeat clients / total clients | > 60% |
| CAC (client) | Acquisition cost per business client | < $500 |
| CAC (guard) | Acquisition cost per activated guard | < $100 |
| LTV (client) | Lifetime GMV × take rate | > $5,000 |

---

## 7. Go-to-Market Strategy

### Phase 1: Supply-First Launch (Months 1–6)

**Goal:** Build guard supply in 2–3 California metro areas before heavy client marketing.

| Tactic | Detail |
|--------|--------|
| Guard recruitment | BSIS training schools, guard card renewal offices, security Facebook groups, union adjacent networks |
| Incentive | First 10 shifts bonus, referral bonuses ($50 guard refers guard) |
| Credential support | Streamlined onboarding; staff verification SLA < 24 hours |
| Target | 200 activated guards in LA + Inland Empire |

### Phase 2: Demand Activation (Months 4–12)

**Goal:** Convert business clients in verticals with high on-demand need.

| Tactic | Detail |
|--------|--------|
| Direct sales | Outreach to event companies, property managers, construction firms |
| Vertical landing pages | Event security, construction, retail, nightlife |
| Founding client program | Reduced platform fee for first 25 business accounts |
| Case studies | Document fill time, cost savings, visibility benefits |
| Target | 75 active business clients, 1,200 monthly shifts |

### Phase 3: Growth & Distribution (Months 12–24)

| Tactic | Detail |
|--------|--------|
| Google Play launch | App store discovery for guard recruitment |
| iOS App Store | Unlock guard and client adoption on iPhone |
| SEO / content | "Hire security guard [city]" landing pages |
| Partnerships | Event venues, property management associations, BSIS training providers |
| Referral program | Client refers client; guard refers client |
| Target | 2,000 guards, 400 clients, 5,000 monthly shifts |

### Marketing Channels

| Channel | Audience | Priority |
|---------|----------|----------|
| Guard community (social, forums) | Supply | High |
| Direct B2B sales | Business clients | High |
| Google Play / App Store | Both | Medium (post-launch) |
| Local SEO | Clients searching by city | Medium |
| Industry events & trade shows | Business clients | Medium |
| Paid search (Google Ads) | High-intent client queries | Low initially |
| PR / local media | Brand awareness | Low initially |

### Pricing Strategy

- **Launch pricing:** Flat $5/hr personal / $6/hr business — competitive with agency markup (typically 30–50% above guard pay)
- **Value messaging:** Client sees total rate upfront; no surprise invoices; guard gets ~85% of client rate
- **Premium tiers (future):** Higher fees for armed, executive protection, and rush (< 2 hour) bookings
- **Enterprise (future):** Volume discounts for clients posting 50+ shifts/month with dedicated account support

---

## 8. Operations Plan

### Daily Operations

| Function | Owner | Cadence |
|----------|-------|---------|
| Guard/client application review | Moderator + Administrator | Daily |
| Credential verification | Administrator | Daily |
| Job approval (non-trusted clients) | Administrator | Daily |
| Dispute resolution | Administrator + Director | As needed |
| Payment pipeline & payouts | Director | Daily |
| SLA monitoring | Manager + Director | Weekly |
| Compliance expiry scans | Automated cron + Administrator | Daily |
| Platform health & incidents | Director + Founder | Continuous |

### Key Operational Workflows

**Guard activation:**
1. Guard signs up and uploads 5 required credentials
2. Staff verifies documents (target: < 24 hours)
3. Guard connects Stripe Connect bank account
4. Account activated → guard appears on map

**Job lifecycle:**
```
Draft → Pending Review → Open → Accepted → In Progress → Completed → Closed
```

**Payment flow:**
1. Client pays by card at booking (Stripe)
2. Job completes
3. Platform releases guard payout ~48 hours after completion
4. Disputes can hold payout until Director/Founder resolution

### Service Areas

Launch cities (California):

1. **Greater Los Angeles** — largest market, events, nightlife, retail
2. **Inland Empire** — warehouses, construction, logistics
3. **Orange County** — corporate, retail, events
4. **San Diego** — border-adjacent, military, tourism
5. **Bay Area** — corporate campuses, tech events (Phase 2)

City-level service areas are managed by Directors/Founders in the platform.

### Technology Operations

| System | Provider | Monthly Cost (est.) |
|--------|----------|---------------------|
| Hosting | Vercel | $20–$200 |
| Database | Supabase | $25–$100 |
| Payments | Stripe | 2.9% + $0.30/txn |
| Push notifications | FCM / VAPID | Free |
| Error monitoring | Sentry | $0–$26 |
| Domain / DNS | GoDaddy | ~$15 |

### Quality Assurance

- Automated CI/CD: lint, test, build, Playwright E2E on every PR
- Staff SLA dashboard tracks approval time, fill time, no-show rate
- Missed check-in escalation cron (every 5 minutes)
- Immutable audit log for all staff actions

---

## 9. Management & Organization

### Corporate Structure

```
Signature Security Specialist, LLC
└── Guardr (product brand)
    ├── Marketplace participants (independent contractors)
    │   ├── Guards
    │   └── Clients
    └── Platform employees (W-2 staff)
        └── Support → Founder hierarchy
```

### Staff Roles & Responsibilities

| Role | Focus | Revenue Share (default) |
|------|-------|------------------------|
| Support | Help desk, incident review | 4% |
| Moderator | Application intake approval | 6% |
| Administrator | Credential verification, disputes, suspensions | 7% |
| Manager | Team oversight, SLA management | 10% |
| Director | Full operations, financial controls | 11.1% |
| Founder | Platform governance, strategy | 11.9% |

Staff compensation = **~50% of collected platform fees** (revenue share) + Prop 22 hourly add-ons ($18–$40/hr) + manual bonuses. Paid weekly.

### Hiring Plan

| Role | Year 1 | Year 2 | Purpose |
|------|--------|--------|---------|
| Founder / CEO | 1 | 1 | Strategy, product, fundraising |
| Director of Operations | 1 | 1 | Daily ops, client relationships |
| Administrators (credential verification) | 2 | 4 | Scale onboarding |
| Moderators (application intake) | 1 | 2 | Scale intake |
| Support | 1 | 2 | User help desk |
| Part-time sales / BD | 1 | 2 | Client acquisition |

### Advisory Needs

- **Legal:** Marketplace/IC classification, BSIS regulatory counsel, insurance
- **Finance:** Unit economics modeling, fundraising, tax (1099 reporting)
- **Industry:** Former PPO executives, BSIS training providers, event security operators

---

## 10. Financial Projections

### Assumptions

| Assumption | Value |
|------------|-------|
| Avg shift length | 6 hours |
| Avg client rate | $38/hr (Year 1), $40/hr (Year 2), $42/hr (Year 3) |
| Avg platform fee | $5.50/hr |
| Staff share of fees | 50% |
| Stripe processing | 3% of GMV |
| Monthly shift growth | 15% (Year 1), 20% (Year 2), 10% (Year 3) |

### Revenue Projections (Base Case)

| | Year 1 | Year 2 | Year 3 |
|---|--------|--------|--------|
| Monthly shifts (exit rate) | 1,200 | 5,000 | 15,000 |
| Annual shifts | 7,200 | 42,000 | 120,000 |
| Annual GMV | $3.3M | $20.2M | $60.5M |
| Platform revenue | $430K | $2.8M | $7.9M |
| Staff share (50%) | ($215K) | ($1.4M) | ($3.9M) |
| Stripe fees (3%) | ($99K) | ($605K) | ($1.8M) |
| **Net revenue** | **$116K** | **$795K** | **$2.2M** |

### Operating Expenses (Base Case)

| Category | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|
| Staff compensation (hourly add-ons) | $120K | $250K | $400K |
| Technology & hosting | $15K | $30K | $60K |
| Insurance (GL, E&O, cyber) | $25K | $40K | $60K |
| Legal & compliance | $30K | $40K | $50K |
| Marketing & acquisition | $80K | $200K | $350K |
| Office / misc | $10K | $20K | $30K |
| **Total OpEx** | **$280K** | **$580K** | **$950K** |

### Profit & Loss Summary (Base Case)

| | Year 1 | Year 2 | Year 3 |
|---|--------|--------|--------|
| Net revenue | $116K | $795K | $2,200K |
| Operating expenses | ($280K) | ($580K) | ($950K) |
| **Net income** | **($164K)** | **$215K** | **$1,250K** |

### Scenario Analysis

| Scenario | Year 1 Shifts | Year 1 Net Revenue | Year 1 Net Income |
|----------|---------------|--------------------|--------------------|
| Conservative (50% of base) | 3,600 | $58K | ($222K) |
| Base | 7,200 | $116K | ($164K) |
| Aggressive (150% of base) | 10,800 | $174K | ($106K) |

*Year 1 is investment phase — profitability expected in Year 2 at base case.*

### Break-Even Analysis

At base case unit economics (~$9.67 net revenue per shift after staff share and Stripe):

- Monthly fixed costs (Year 1): ~$23K
- Break-even shifts: ~2,400/month
- Expected break-even: **Month 10–12** (base case)

---

## 11. Funding Requirements & Use of Funds

### Funding Ask

**$500K–$750K seed round** for 18 months of runway to reach profitability.

### Use of Funds

| Category | Amount | % | Purpose |
|----------|--------|---|---------|
| Guard & client acquisition | $200K | 33% | Incentives, marketing, sales |
| Team (operations & support) | $150K | 25% | Administrators, moderators, support |
| Technology & distribution | $75K | 13% | Google Play, iOS, App Store assets |
| Legal & compliance | $75K | 13% | Regulatory counsel, insurance, IC classification |
| Reserve / contingency | $100K | 17% | Buffer for disputes, slow growth, regulatory changes |
| **Total** | **$600K** | **100%** | |

### Milestones for Funding Tranches (if structured)

| Tranche | Amount | Milestone |
|---------|--------|-----------|
| Tranche 1 | $300K | Close seed; 200 activated guards; 25 business clients |
| Tranche 2 | $200K | 500 guards; 75 clients; 1,000 monthly shifts |
| Tranche 3 | $100K | Google Play live; break-even trajectory visible |

### Capital Efficiency

- Product is **already built and live** — funding goes to growth, not engineering
- Asset-light model: no vehicles, uniforms, or guard payroll
- Staff compensation tied to revenue (50% of fees) aligns incentives

---

## 12. Risk Analysis & Mitigation

### Regulatory & Legal Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Misclassification as PPO | High | Low | Clear legal positioning; no dispatch; guards/clients contract directly; legal counsel on retainer |
| IC misclassification (guards) | High | Medium | ICA per job; guards control schedule; platform does not set hours or supervise work |
| BSIS rule changes | Medium | Low | Monitor BSIS agendas; credential system is configurable |
| Liability for guard actions | High | Medium | Disclaimers; liability cap ($100 or 12 months fees); require guard COI; client assumes site liability |

### Market Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Cold-start (chicken-and-egg) | High | High | Supply-first strategy; founding client program; geographic focus |
| Agency retaliation | Medium | Medium | Target underserved segments (on-demand, short-notice); compete on speed and transparency |
| Slow client adoption | High | Medium | Direct sales; founding client incentives; case studies |
| Guard churn | Medium | Medium | Fast pay (48hr); performance rewards; community features |

### Operational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Credential fraud | High | Medium | Manual staff verification; expiry alerts; audit log |
| No-shows | Medium | Medium | No-show detection workflow; replacement flows; performance tiers |
| Payment disputes | Medium | Medium | Dispute resolution process; payout holds; overtime approval workflow |
| Platform downtime | High | Low | Vercel hosting; CI/CD; Sentry monitoring; offline sync for guards |

### Financial Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Staff share at 50% compresses margin | Medium | High | Scale GMV; adjust share as revenue grows; automate ops to reduce staff hours |
| Stripe chargebacks | Medium | Low | Clear client agreements; dispute process; hold periods |
| Slower growth than projected | High | Medium | Conservative scenario planning; milestone-based spending; 17% reserve |

---

## 13. Milestones & Roadmap

### Completed (as of August 2026)

- [x] Production platform live at guardr.co
- [x] Three-sided marketplace (clients, guards, staff)
- [x] Stripe Connect payments and guard payouts
- [x] BSIS credential verification workflow
- [x] Self-audit, live tracking, incident/activity reports
- [x] Web + PWA + Android APK
- [x] Comprehensive legal framework
- [x] User manuals (PDF) for all roles
- [x] CI/CD, E2E tests, investor demo readiness

### Q3 2026 (Current)

- [ ] Google Play Store launch
- [ ] First 100 activated guards
- [ ] First 10 paying business clients
- [ ] LA + Inland Empire service areas active

### Q4 2026

- [ ] 500 activated guards
- [ ] 75 business clients
- [ ] 1,000 monthly completed shifts
- [ ] iOS App Store submission
- [ ] Seed fundraising close

### 2027

- [ ] 2,000 guards, 400 clients
- [ ] 5,000 monthly shifts
- [ ] Expand to Bay Area and San Diego
- [ ] Enterprise client program (volume pricing)
- [ ] Break-even on operating income
- [ ] Evaluate second-state expansion (Nevada, Arizona, Texas)

### 2028+

- [ ] Multi-state expansion with per-state credential systems
- [ ] API for enterprise integrations (property management, event platforms)
- [ ] Premium guard tiers (armed, executive protection marketplace)
- [ ] Series A fundraise for national expansion

---

## 14. Appendix

### A. Key URLs

| Resource | URL |
|----------|-----|
| Homepage | https://guardr.co |
| User guide | https://guardr.co/guide |
| Download (APK) | https://guardr.co/download |
| Manuals (PDF) | https://guardr.co/manuals |
| Terms of Service | https://guardr.co/legal/terms |
| Privacy Policy | https://guardr.co/legal/privacy |
| Parent company | https://www.signaturesecurityspecialist.com |
| Support | support@guardr.co |

### B. California BSIS Credential Requirements (Guards)

| Credential | Required | Notes |
|------------|----------|-------|
| Government ID | Yes | Driver's license or passport |
| BSIS Guard Card | Yes | Active registration |
| Certificate of Insurance (COI) | Yes | General liability |
| Power to Arrest / Use of Force | Yes | BSIS-approved training |
| 32-hour BSIS training block | Yes | 9 certificates |
| Firearm permit | Optional | Armed jobs only |
| Baton permit | Optional | Baton-required jobs |

### C. Platform Fee Configuration

| Account Type | Default Flat Fee | Notes |
|--------------|-----------------|-------|
| Personal | $5/hr | Up to 4 guards per request |
| Business | $6/hr | Up to 50 guards; higher for armed/EP |

Percent model default: 15% with min/max caps.  
Fees snapshot at job creation.  
Open-contract pricing allows per-job negotiation.

### D. Staff Compensation Model

| Component | Detail |
|-----------|--------|
| Revenue share | ~50% of collected platform fees, split by role |
| Hourly add-ons | Prop 22 tracked hours × role rate ($18–$40/hr) |
| Bonuses | Manual, add-only |
| Cadence | Weekly |
| Per-role caps | $1,100–$8,300/period |

### E. Technology Architecture Summary

- **Surfaces:** Mobile (phone), Tablet, Desktop — resolved by viewport + device type
- **Experience tiers:** PWA Full/Lite, APK Full/Premium
- **Offline:** IndexedDB queue for field records; auto-flush on reconnect
- **Cron jobs:** Missed check-ins (5 min), pre-shift briefings (5 min), placard expiry (daily)
- **Security:** Role-based RLS, rate limiting (60 req/min API), PBKDF2 password hashing

### F. Glossary

| Term | Definition |
|------|------------|
| BSIS | Bureau of Security and Investigative Services (California) |
| COI | Certificate of Insurance |
| GMV | Gross Merchandise Volume (total client spend) |
| ICA | Independent Contractor Agreement |
| PPO | Private Patrol Operator (licensed security company) |
| PTA/UOF | Power to Arrest / Appropriate Use of Force training |
| RLS | Row Level Security (database access control) |
| SAM | Serviceable Addressable Market |
| SOM | Serviceable Obtainable Market |
| Take rate | Platform fee as % of GMV |

---

*This business plan is based on Guardr platform data, California BSIS licensing statistics, and industry estimates as of August 2026. Financial projections are illustrative and should be refined with actual operating data as the platform scales.*

**Signature Security Specialist, LLC**  
*Guardr — Anytime. Anywhere. Security, When You Need It.*
