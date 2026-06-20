-- Director can record platform fee received in cash (alternative to Stripe card deposit)
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS platform_fee_paid_cash BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE security_requests SET platform_fee_paid_cash = FALSE WHERE platform_fee_paid_cash IS NULL;
