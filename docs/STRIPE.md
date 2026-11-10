# Stripe on Guardr (Cloudflare Worker + Neon)

Client bookings and guard payouts use **Stripe Checkout** and **Stripe Connect Express**, integrated with Guardr’s billing ledger (`lib/platformBilling.ts`, `stripe_webhook_events`, and related migrations). Secrets live only on the Worker.

## Worker secrets

```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PUBLISHABLE_KEY
```

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Server API |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures |
| `STRIPE_PUBLISHABLE_KEY` | Client via `GET /api/config` and `GET /api/stripe/health` |

Non-secret app origin: `APP_URL` / `VITE_APP_URL` (production: `https://guardr.co` in `wrangler.toml`).

Missing payment configuration returns **503** `{ "error": "payments not configured" }`.

## Webhook endpoint

**Canonical URL:** `https://guardr.co/api/stripe/webhook`

The Workers dev URL also works:  
`https://guardr.themarkkbrandoncollective-2d9.workers.dev/api/stripe/webhook`

Subscribe in Stripe Dashboard to at least:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated`
- `charge.refunded`
- `transfer.created` / `transfer.updated` / `transfer.reversed`
- `payout.paid` / `payout.failed`

The handler uses `constructEventAsync` (Workers-compatible crypto), claims each event in `stripe_webhook_events` (see `db/migrations/20261109_platform_revenue_protection.sql`), runs existing payout/billing logic, and records receipts.

## HTTP routes

| Method | Path | Role |
|--------|------|------|
| POST | `/api/stripe/webhook` | Webhooks |
| POST | `/api/stripe/checkout/create-session` | Job payment Checkout |
| POST | `/api/stripe/checkout/overtime-charge` | Overtime |
| POST | `/api/stripe/checkout/schedule-change-charge` | Schedule extension |
| POST | `/api/stripe/checkout/tip-charge` | Tips |
| POST | `/api/stripe/connect/create-account` | Connect Express |
| POST | `/api/stripe/connect/account-link` | Onboarding URL |
| GET | `/api/stripe/connect/status/:accountId` | Connect status |
| POST | `/api/stripe/payout/release` | Guard transfer |
| POST | `/api/stripe/payment/hold` | Hold funds |
| POST | `/api/stripe/payment/refund` | Refund |
| GET | `/api/stripe/health` | Config probe |
| GET | `/api/payments/health` | Stripe + Square probe |
| GET | `/api/config` | Publishable key for the SPA |

The SPA calls these via `src/lib/stripeApi.ts` (`apiUrl` from `src/lib/api/guardrClient.ts`). Checkout returns to `/client/invoices?payment=success|cancelled&job_id=…`.

## SDK on Workers

`lib/stripeClient.ts` constructs the official `stripe` package with `Stripe.createFetchHttpClient()` for Cloudflare Workers.
