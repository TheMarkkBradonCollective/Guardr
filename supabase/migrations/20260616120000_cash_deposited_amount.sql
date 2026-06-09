-- Track how much client cash was deposited to Stripe (full job vs platform fee only)

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS cash_deposited_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

UPDATE security_requests
SET cash_deposited_amount = estimated_payout
WHERE cash_deposited_to_stripe = TRUE AND cash_deposited_amount = 0;
