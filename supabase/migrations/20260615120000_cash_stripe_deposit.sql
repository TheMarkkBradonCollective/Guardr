-- Track when Director deposits client cash into the Stripe platform balance

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS cash_deposited_to_stripe BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS cash_deposited_at TIMESTAMPTZ;
