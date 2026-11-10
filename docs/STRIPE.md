# Stripe on Guardr (embedded UI)

Guardr uses **in-app** Stripe Elements and Connect embedded components — not hosted Checkout or Account Link redirects.

## Secrets (Worker)

```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PUBLISHABLE_KEY
```

The SPA loads the publishable key from **`GET /api/config`**.

## Client payments (Payment Element)

| Method | Path |
|--------|------|
| POST | `/api/stripe/payment-intent/create` |

Body: `{ "kind": "job_payment" | "overtime" | "schedule_change" | "tip", "jobId", "clientEmail", "amountCents", "jobTitle?" }`

Returns: `{ clientSecret, paymentIntentId }`

The browser confirms with `@stripe/react-stripe-js` (`redirect: 'if_required'` for 3DS inside WebView). **Webhooks** (`payment_intent.succeeded`, etc.) remain the source of truth for marking jobs paid.

Legacy redirect Checkout routes under `/api/stripe/checkout/*` remain for compatibility but are unused by the UI.

## Guard Connect (embedded)

| Method | Path |
|--------|------|
| POST | `/api/stripe/connect/create-account` |
| POST | `/api/stripe/connect/account-session` |
| GET | `/api/stripe/connect/status/:accountId` |

`account-session` returns a Connect.js `clientSecret` for embedded onboarding/management.

## Webhook

**`https://guardr.co/api/stripe/webhook`** (workers.dev URL also works)

Configure the same event set as before (`checkout.session.completed`, `payment_intent.*`, `charge.refunded`, transfers, payouts, `account.updated`).

## Reference (Worker routes and webhook events)

### Webhook endpoint

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

## Director+ test-mode payments

Test-mode Stripe keys stay configured permanently, including after live keys go on. Staff at **Director, Owner, or Founder** can run in-app test payments.

* Secrets: `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_PUBLISHABLE_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`. If `STRIPE_SECRET_KEY` is still an `sk_test_` key, it is used as the test secret until live keys are added.
* `POST /api/stripe/payment-intent/create` with `{ testMode: true }` is rejected unless the request Bearer token is Director+.
* `GET /api/config` returns `canRunTestPayments` and `stripeTestPublishableKey` only to Director+.
* The webhook verifies signatures against both the live and test signing secrets.
