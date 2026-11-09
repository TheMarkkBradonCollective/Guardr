-- Guardr: idempotent Stripe cash-deposit application
-- Additive only. This records Stripe event IDs already applied to the job total.
ALTER TABLE public.security_requests
  ADD COLUMN IF NOT EXISTS cash_deposit_stripe_event_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.security_requests.cash_deposit_stripe_event_ids IS
  'Stripe webhook event IDs already applied to cash_deposited_amount; prevents replay from incrementing a deposit twice.';
