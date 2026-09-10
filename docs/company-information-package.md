# Guardr — Company Information Package

**Prepared for:** Legal counsel, advisors, investors, partners, and other stakeholders  
**Legal entity:** Signature Security Specialist, LLC  
**Product:** Guardr — [guardr.co](https://guardr.co)  
**Tagline:** *Anytime. Anywhere. Security, When You Need It.*  
**Document version:** 1.0  
**Last updated:** September 10, 2026

---

## How to Use This Document

This is a **head-to-toe informational briefing** on Signature Security Specialist, LLC and its Guardr platform. It is designed to be handed to:

- **Legal advisors** — entity structure, marketplace positioning, regulatory context, agreements, and risk areas
- **General business advisors** — strategy, operations, market, and organizational model
- **Investors** — product readiness, unit economics, financial projections, funding ask, and milestones
- **Partners and other interested parties** — what Guardr is, how it works, and how to engage

Sections marked **(Gap)** indicate information not currently on file in company records and should be supplied separately before formal engagements.

For deeper detail, see the full business plan at `docs/business-plan.md` and the public product guide at `docs/guardr.md`.

---

## 1. Company at a Glance

| Field | Detail |
|-------|--------|
| **Legal name** | Signature Security Specialist, LLC |
| **Entity type** | Limited Liability Company (LLC) |
| **State of operation** | California (BSIS-aligned) |
| **State of formation** | (Gap — provide articles of organization / state of filing) |
| **EIN / tax ID** | (Gap — provide for counsel and investors under NDA) |
| **Registered address** | (Gap — available on request per Terms of Service) |
| **Product brand** | Guardr |
| **Parent brand** | Signature Security Specialist |
| **Product website** | https://guardr.co |
| **Parent company website** | https://www.signaturesecurityspecialist.com |
| **Support** | support@guardr.co |
| **Legal** | legal@guardr.co |
| **Privacy** | privacy@guardr.co |
| **Product version** | v1.0.131-beta |
| **Launch status** | Live production (v1.0 beta launched June 2026) |
| **Geography** | California launch; multi-state expansion planned |
| **Repository** | TheMarkkBradonCollective/Guardr (private) |

---

## 2. What Guardr Is (and Is Not)

### What it is

Guardr is a **map-first, on-demand technology marketplace** that connects:

- **Clients** (businesses, venues, property owners, and individuals) who need licensed security coverage
- **Guards** (independent, licensed security professionals) who browse and accept work directly
- **Staff** (W-2 employees of Signature Security Specialist, LLC) who operate the platform

The platform handles discovery, credential verification, booking, in-app payments (Stripe Connect), live shift tracking, self-audit photo verification, incident/activity reporting, and post-shift documentation.

### What it is not

Guardr is explicitly **not**:

- A private patrol operator (PPO)
- A security guard employer
- A staffing agency
- A licensed security services provider

**Guards and clients contract directly** for each job. Guardr facilitates the connection, payment, and recordkeeping — it does not dispatch, assign, employ, or supervise field security work.

### One-sentence summary

> Guardr makes licensed security coverage as accessible and transparent as ordering a ride — while preserving guard independence and direct accountability between guards and clients.

---

## 3. Mission, Vision, and Values

### Mission

Make licensed security coverage as accessible and transparent as ordering a ride — while preserving the independence of guards and the direct accountability between guards and clients.

### Vision

Become the trusted compliance-first marketplace for independent security professionals, starting in California and expanding state by state as credential and regulatory frameworks allow.

### Core values

1. **Compliance first** — BSIS credential requirements are built into onboarding, not bolted on
2. **Transparency** — Rates, fees, and guard credentials are visible before booking
3. **Independence** — Guards choose jobs; clients approve who works their site
4. **Accountability** — Self-audits, live tracking, and post-shift reports create a documented record
5. **Technology, not dispatch** — We connect; we do not assign or employ guards

---

## 4. Corporate Structure

```
Signature Security Specialist, LLC
└── Guardr (product brand)
    ├── Marketplace participants (independent contractors)
    │   ├── Guards — independent contractors per job (ICA)
    │   └── Clients — direct service arrangement with guards
    └── Platform employees (W-2 staff)
        └── Support → Moderator → Administrator → Manager → Director → Founder
```

### Participant relationships

| Participant | Legal relationship | Compensation |
|-------------|-------------------|--------------|
| **Guards** | Independent contractors (ICA per job) | Paid via Stripe Connect (~48 hr after shift completion) |
| **Clients** | Direct service arrangement with guards | Pay client hourly rate in-app at booking |
| **Staff** | W-2 employees of Signature Security Specialist, LLC | Revenue share (~50% of platform fees) + Prop 22 hourly add-ons + bonuses |

### Android / app identity

| Item | Value |
|------|-------|
| Android package ID | `com.signaturesecurity.guardr` |
| Keystore legal name | Signature Security Specialist LLC, California, US |

---

## 5. Leadership and Team

### Key leadership (platform seed data)

| Name | Role | Email | Summary |
|------|------|-------|---------|
| **Markeith White** (displayed as M. White) | Founder & Platform Governance | m.white@signaturesecurityspecialist.com | Founded Guardr; sets platform policy, approves executive staff, manages city rollouts |
| **Tyrone Johnson** | Director of Platform Operations | t.johnson@signaturesecurityspecialist.com | Day-to-day operations: credential reviews, job flow, payouts, disputes |

### Staff role hierarchy

| Role | Focus | Default revenue share |
|------|-------|----------------------|
| Support | Help desk, incident review | 4% |
| Moderator | Application intake approval | 6% |
| Administrator | Credential verification, disputes, suspensions | 7% |
| Manager | Team oversight, SLA management | 10% |
| Director | Full operations, financial controls | 11.1% |
| Founder | Platform governance, strategy | 11.9% |

Staff compensation = **~50% of collected platform fees** (split by role) + Prop 22 hourly add-ons ($18–$40/hr tracked via timesheets) + manual bonuses. Paid weekly via Stripe Connect.

### Hiring plan

| Role | Year 1 | Year 2 |
|------|--------|--------|
| Founder / CEO | 1 | 1 |
| Director of Operations | 1 | 1 |
| Administrators | 2 | 4 |
| Moderators | 1 | 2 |
| Support | 1 | 2 |
| Part-time sales / BD | 1 | 2 |

### Advisory needs (identified)

- **Legal:** Marketplace/IC classification, BSIS regulatory counsel, insurance
- **Finance:** Unit economics modeling, fundraising, 1099 reporting
- **Industry:** Former PPO executives, BSIS training providers, event security operators

### Cap table and ownership (Gap)

Ownership percentages, member interests, and any existing investor agreements are not included in this package. Provide separately under NDA for legal and investor review.

---

## 6. Product Overview

### Three-sided marketplace

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

### Client features

| Feature | Personal account | Business account |
|---------|-----------------|------------------|
| Guards per request | Up to 4 | Up to 50 |
| Job posting | ✓ | ✓ |
| Sites & rosters | — | ✓ |
| Live coverage dashboard | ✓ | ✓ |
| Formal invoicing & reports | Basic | Full reporting suite |
| Open-contract pricing | ✓ | ✓ |
| Trusted-client auto-publish | — | Configurable |

### Guard features

- Map-first job discovery with distance, rate, and type filters
- Credential wallet (government ID, BSIS guard card, COI, PTA/UOF, 32-hour CE package)
- Shift lifecycle: heading → arrive (GPS) → start → self-audit → work → end
- On-shift tools: incident reports, activity logs, client messaging, pre-shift briefing
- Earnings via Stripe Connect with ~48-hour payout release
- Performance tiers (Overall / Standing / Driving priority)
- Vehicle profile for patrol/driving jobs
- Guard community chat (guards + staff)

### Staff / operations features

- Approval queues for guards, clients, staff, and jobs
- Credential verification with expiry alerts
- SLA dashboard (approval time, fill time, no-show rate)
- Dispute resolution and payment holds
- Platform analytics and financial controls (Director+)
- Service area management (city-level within California)
- Broadcast notifications
- Immutable audit log

### Job status flow

```
Draft → Pending Review → Open → Accepted → In Progress → Completed → Closed
```

### Distribution channels

| Channel | Status |
|---------|--------|
| Web (guardr.co) | Live |
| PWA (installable) | Live |
| Android APK (sideload) | Live — guardr.co/download |
| Google Play | Listing prepared; AAB build pending keystore secrets |
| iOS App Store | Scaffolded; pending Apple Developer account |

### Shipped platform capabilities (v1.0)

- Supabase Auth bridge (PBKDF2 password hashing)
- Role-based row-level security (RLS)
- Trusted-client auto-publish
- Audit log and SLA dashboard
- Guard availability calendar
- Client invoicing
- Offline sync (IndexedDB queue for field records)
- Onboarding tours and compliance alerts
- CI/CD (GitHub Actions + Playwright E2E)
- Rate limiting and Sentry scaffold
- Capacitor Android APK

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, Base Web |
| Backend / database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth + PBKDF2 bridge (`/api/auth/bridge`) |
| Payments | Stripe Connect (primary); Square also integrated |
| Maps | Leaflet + react-leaflet |
| Push notifications | Web Push (VAPID) + FCM (Android) |
| Mobile | Capacitor 7 (Android APK; iOS scaffolded) |
| Hosting | Vercel (guardr.co) |
| Design system | Base Web + Guardr-branded themes |

### Cross-platform surfaces

One codebase delivers web, PWA, and native shells across three independent surface applications:

| Surface | Primary users | Shell |
|---------|--------------|-------|
| Mobile | Guards, clients | Bottom tab bar |
| Tablet | Staff, guards, clients | Side rail |
| Desktop | Staff ops, admin | Sidebar + command palette |

Breakpoints: 744px (mobile/tablet), 1180px (tablet/desktop).

### Background jobs (cron)

| Job | Cadence |
|-----|---------|
| Missed check-ins | Every 5 minutes |
| Pre-shift briefings | Every 5 minutes |
| Company placard expiry | Daily |

### Optional integrations (env-configured)

Twilio (SMS), Checkr (background checks), insurance verification API, Sentry error monitoring.

### Database

Single source of truth: `supabase/complete_schema_setup.sql` (idempotent).

---

## 8. Market and Competition

### Market size (California)

| Segment | Estimate |
|---------|----------|
| CA private security market | ~$2.3B/year |
| Licensed guards (CA) | 351,170 |
| Licensed security companies (PPOs) | ~5,700 |
| Unarmed guard hourly rate | $25–$45/hr |
| Armed guard hourly rate | $45–$85/hr |

### Target customer segments

**Primary — business clients:** Event organizers, retail/hospitality, construction, property management, corporate campuses.

**Secondary — personal clients:** Individuals (capped at 4 guards per request).

**Supply — guards:** Part-time and full-time independents, specialized (armed, executive protection, medical).

### Competitive positioning

| vs. | Guardr advantage |
|-----|------------------|
| Traditional PPOs | Speed, choice, transparency, lower overhead |
| Job boards / classifieds | Credential verification, payments, shift tracking |
| Guard management SaaS | Full marketplace, not just workforce tools |
| General gig platforms | Security-specific BSIS compliance and workflows |

### Launch cities (California)

1. Greater Los Angeles
2. Inland Empire
3. Orange County
4. San Diego
5. Bay Area (Phase 2)

### 3-year growth targets (base case)

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Active guards | 500 | 2,000 | 5,000 |
| Active clients | 100 | 400 | 1,000 |
| Monthly shifts | 1,200 | 5,000 | 15,000 |
| Annual GMV | $3.3M | $20.2M | $60.5M |
| Platform revenue | $430K | $2.8M | $7.9M |

---

## 9. Business Model and Unit Economics

### Revenue model

**Transactional platform fees only** — no subscription fees. Fee deducted from client hourly rate before guard pay. Fees **snapshot at job creation**; changes do not affect existing jobs.

### Fee models (configurable in Staff → Payment settings)

| Model | Description | Default |
|-------|-------------|---------|
| Flat | Fixed $/hr per account type | $5/hr personal, $6/hr business |
| Percent | % of client rate with min/max caps | 15% |
| Tiered | Fee scales with hourly rate bands | Legacy (migrated to flat) |

### Example economics ($35/hr client rate, flat $5 model)

| Party | Amount |
|-------|--------|
| Client pays | $35/hr |
| Guard receives | $30/hr |
| Platform fee | $5/hr |

### Unit economics — single 8-hour shift

| Line item | Amount |
|-----------|--------|
| Client pays (gross) | $280.00 |
| Guard receives | $240.00 |
| Platform fee | $40.00 |
| Stripe processing (~2.9% + $0.30) | ~$8.42 |
| Staff revenue share (~50%) | $20.00 |
| **Net to company** | **~$11.58** (~4.1% of GMV) |

### Payment flow

1. Client pays by card at booking (Stripe)
2. Job completes
3. Guard payout released ~48 hours after completion
4. Disputes can hold payout until Director/Founder resolution

### Key metrics (Month 12 targets)

| Metric | Target |
|--------|--------|
| GMV | $274K/mo |
| Take rate | ~14.5% |
| Fill rate | > 80% |
| Time to fill | < 4 hours |
| Client retention | > 60% |
| CAC (business client) | < $500 |
| CAC (guard) | < $100 |

---

## 10. Financial Projections

### Year 1 targets (base case)

| Metric | Target |
|--------|--------|
| Active guards | 500 |
| Active business clients | 75 |
| Monthly completed shifts | 1,200 |
| Average shift length | 6 hours |
| Average client rate | $38/hr |
| Annual GMV | ~$3.3M |
| Annual platform revenue | ~$430K |
| Net revenue (after staff share and Stripe) | ~$116K |
| Year 1 net income | ($164K) — investment phase |

### 3-year P&L summary (base case)

| | Year 1 | Year 2 | Year 3 |
|---|--------|--------|--------|
| Net revenue | $116K | $795K | $2.2M |
| Operating expenses | ($280K) | ($580K) | ($950K) |
| **Net income** | **($164K)** | **$215K** | **$1.25M** |

### Break-even

Expected at **Month 10–12** (base case), ~2,400 shifts/month.

### Scenario analysis (Year 1)

| Scenario | Annual shifts | Net income |
|----------|---------------|------------|
| Conservative (50% of base) | 3,600 | ($222K) |
| Base | 7,200 | ($164K) |
| Aggressive (150% of base) | 10,800 | ($106K) |

### Technology operating costs (estimated)

| System | Monthly |
|--------|---------|
| Vercel | $20–$200 |
| Supabase | $25–$100 |
| Stripe | 2.9% + $0.30/transaction |
| Sentry | $0–$26 |

### Insurance (projected, not on file)

General liability, E&O, and cyber insurance budgeted at $25K (Year 1), $40K (Year 2), $60K (Year 3). **(Gap)** — policy documents and carrier details not included.

---

## 11. Funding

### Ask

**$500K–$750K seed round** for 18 months of runway to reach profitability.

### Use of funds ($600K midpoint)

| Category | Amount | % | Purpose |
|----------|--------|---|---------|
| Guard & client acquisition | $200K | 33% | Incentives, marketing, sales |
| Team (operations & support) | $150K | 25% | Administrators, moderators, support |
| Technology & distribution | $75K | 13% | Google Play, iOS, App Store assets |
| Legal & compliance | $75K | 13% | Regulatory counsel, insurance, IC classification |
| Reserve / contingency | $100K | 17% | Buffer for disputes, slow growth, regulatory changes |

### Milestone-based tranches (if structured)

| Tranche | Amount | Milestone |
|---------|--------|-----------|
| 1 | $300K | 200 activated guards; 25 business clients |
| 2 | $200K | 500 guards; 75 clients; 1,000 monthly shifts |
| 3 | $100K | Google Play live; break-even trajectory visible |

### Capital efficiency highlights

- Product is **already built and live** — funding targets growth, not engineering
- Asset-light model: no vehicles, uniforms, or guard payroll
- Staff compensation tied to revenue (50% of fees) aligns incentives

### Investor demo access

Demo accounts are available for product walkthroughs. Contact the founder for credentials or run `supabase/investor_demo_accounts.sql` in a staging environment.

---

## 12. Legal Framework

### Published legal documents

| Document | Version date | Required for | Public URL |
|----------|-------------|--------------|------------|
| Terms of Service | 2026-06-22 | All roles | https://guardr.co/legal/terms |
| Privacy Policy | 2026-06-22 | All roles | https://guardr.co/legal/privacy |
| Independent Contractor Agreement (ICA) | 2026-06-25 | Guards | In-app |
| Client Platform Agreement | 2026-06-25 | Clients | In-app |
| Guard Code of Conduct | 2026-06-25 | Guards | In-app |
| Equal Opportunity / Veterans / Disabled notice | 2026-08-27 | Public | In-app |

Source code for all legal text: `src/lib/legalContent.ts`

### Core legal thesis

1. **Platform only** — Guardr is a technology marketplace, not a PPO, employer, or staffing agency
2. **Direct engagements** — Guards and clients contract directly per job; Guardr is not a party to the underlying security services contract
3. **Independent contractors** — Guards choose jobs, set/propose rates, and control their schedule
4. **Administrative credential review** — Staff review is eligibility screening only, not a guarantee of suitability or safety
5. **No outcome guarantee** — Security work involves inherent risk; liability is disclaimed to the maximum extent permitted by law
6. **Payment facilitation** — Stripe collection does not create an employment or agency relationship

### Key legal provisions (Terms of Service)

| Provision | Detail |
|-----------|--------|
| Governing law | State of California |
| Dispute resolution | Binding individual arbitration (30-day opt-out via legal@guardr.co) |
| Liability cap | Greater of $100 or 12 months of platform fees paid |
| Indemnification | Users indemnify the company for claims arising from their use, services, or violations |
| Regulatory compliance | Guards must maintain all required licenses; clients must use licensed personnel where required |

### California BSIS credential requirements (platform-enforced)

| Credential | Required |
|------------|----------|
| Government ID | Yes |
| BSIS Guard Card | Yes |
| Certificate of Insurance (COI) | Yes |
| Power to Arrest / Use of Force | Yes |
| 32-hour BSIS training block (9 certificates) | Yes |
| Firearm permit | Optional (armed jobs) |
| Baton permit | Optional |

### Guard activation workflow

1. Guard uploads 5 required credentials
2. Staff verifies documents (target: < 24 hours)
3. Guard connects Stripe Connect bank account
4. Account activated → guard appears on map

### Documents not in this package (Gap)

- Articles of organization / operating agreement
- EIN confirmation letter
- Insurance policies (GL, E&O, cyber)
- Signed investor agreements or term sheets
- Cap table
- Registered agent details and physical mailing address

---

## 13. Operations

### Daily operations cadence

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

### Go-to-market phases

**Phase 1 (Months 1–6): Supply-first** — Recruit 200 activated guards in LA + Inland Empire via BSIS schools, social groups, referral bonuses.

**Phase 2 (Months 4–12): Demand activation** — Direct B2B sales to event companies, property managers, construction firms. Founding client program (reduced fees for first 25 business accounts). Target: 75 business clients, 1,200 monthly shifts.

**Phase 3 (Months 12–24): Growth & distribution** — Google Play and iOS launch, SEO, partnerships, referral programs. Target: 2,000 guards, 400 clients, 5,000 monthly shifts.

---

## 14. Risk Register

### Regulatory and legal

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Misclassification as PPO | High | Low | Clear legal positioning; no dispatch; direct guard/client contracts; legal counsel |
| IC misclassification (guards) | High | Medium | ICA per job; guards control schedule; platform does not supervise field work |
| BSIS rule changes | Medium | Low | Monitor BSIS agendas; configurable credential system |
| Liability for guard actions | High | Medium | Disclaimers; liability cap; require guard COI; client assumes site liability |

### Market

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Cold-start (chicken-and-egg) | High | High | Supply-first strategy; founding client program; geographic focus |
| Agency retaliation | Medium | Medium | Target underserved on-demand segments; compete on speed and transparency |
| Slow client adoption | High | Medium | Direct sales; founding client incentives; case studies |
| Guard churn | Medium | Medium | Fast pay (48 hr); performance rewards; community features |

### Operational

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Credential fraud | High | Medium | Manual staff verification; expiry alerts; audit log |
| No-shows | Medium | Medium | No-show detection workflow; replacement flows; performance tiers |
| Payment disputes | Medium | Medium | Dispute resolution process; payout holds |
| Platform downtime | High | Low | Vercel hosting; CI/CD; Sentry; offline sync for guards |

### Financial

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Staff share at 50% compresses margin | Medium | High | Scale GMV; adjust share as revenue grows; automate ops |
| Stripe chargebacks | Medium | Low | Clear client agreements; dispute process; hold periods |
| Slower growth than projected | High | Medium | Conservative scenario planning; milestone-based spending; 17% reserve |

---

## 15. Roadmap and Milestones

### Completed (as of September 2026)

- [x] Production platform live at guardr.co
- [x] Three-sided marketplace (clients, guards, staff)
- [x] Stripe Connect payments and guard payouts
- [x] BSIS credential verification workflow
- [x] Self-audit, live tracking, incident/activity reports
- [x] Web + PWA + Android APK
- [x] Comprehensive legal framework
- [x] User manuals (PDF) for all roles
- [x] CI/CD, E2E tests, investor demo readiness

### Q3 2026

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

- [ ] 2,000 guards, 400 clients, 5,000 monthly shifts
- [ ] Bay Area and San Diego expansion
- [ ] Enterprise client program
- [ ] Break-even on operating income
- [ ] Evaluate Nevada, Arizona, Texas

### 2028+

- [ ] Multi-state expansion with per-state credential systems
- [ ] Enterprise API integrations
- [ ] Premium guard tiers (armed, executive protection)
- [ ] Series A for national expansion

---

## 16. Key URLs and Resources

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
| Combined user manuals (PDF) | https://www.guardr.co/manuals/Guardr-User-Manuals-Combined.pdf |

### Internal documentation (repository)

| Document | Path | Audience |
|----------|------|----------|
| Business plan | `docs/business-plan.md` | Investors, advisors |
| Public product guide | `docs/guardr.md` | General |
| General guide | `docs/guardr-general-guide.md` | Product/technical |
| Staff ops manual | `docs/user-manuals/staff-ops-manual.md` | Operations |
| Legal content (source) | `src/lib/legalContent.ts` | Legal counsel |
| Database schema | `supabase/complete_schema_setup.sql` | Technical |
| Deployment guide | `docs/DEPLOYMENT-GUARDR-CO.md` | Technical |
| Dev changelog | `docs/DEV-UPDATES.md` | Internal |

---

## 17. Glossary

| Term | Definition |
|------|------------|
| **BSIS** | Bureau of Security and Investigative Services (California) |
| **COI** | Certificate of Insurance |
| **GMV** | Gross Merchandise Volume (total client spend) |
| **ICA** | Independent Contractor Agreement |
| **PPO** | Private Patrol Operator (licensed security company) |
| **PTA/UOF** | Power to Arrest / Appropriate Use of Force training |
| **RLS** | Row Level Security (database access control) |
| **SAM** | Serviceable Addressable Market |
| **SOM** | Serviceable Obtainable Market |
| **Take rate** | Platform fee as % of GMV |

---

## 18. Information Gaps Checklist

The following items should be gathered and appended (or provided under NDA) before formal legal, investment, or partnership engagements:

- [ ] State of LLC formation and date of organization
- [ ] EIN / tax identification number
- [ ] Registered agent name and address
- [ ] Physical business address and mailing address
- [ ] Operating agreement and member ownership percentages
- [ ] Cap table and any existing investor instruments
- [ ] Insurance policies (GL, E&O, cyber) with carrier and coverage limits
- [ ] Banking relationship details (for due diligence)
- [ ] Actual operating metrics (guards activated, clients, monthly shifts) as of current date
- [ ] Signed contracts with key vendors (Stripe, Supabase, Vercel)
- [ ] Any pending or threatened litigation
- [ ] BSIS or other regulatory correspondence

---

## 19. Contact for Follow-Up

| Purpose | Contact |
|---------|---------|
| General / product | support@guardr.co |
| Legal questions | legal@guardr.co |
| Privacy / data | privacy@guardr.co |
| Founder | m.white@signaturesecurityspecialist.com |
| Director of Operations | t.johnson@signaturesecurityspecialist.com |

---

*This document is based on Guardr platform data, California BSIS licensing statistics, and internal projections as of September 2026. Financial projections are illustrative and should be refined with actual operating data as the platform scales. This document does not constitute legal, tax, or investment advice.*

**Signature Security Specialist, LLC**  
*Guardr — Anytime. Anywhere. Security, When You Need It.*
