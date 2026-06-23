ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS client_cash_payment_requested BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS client_cash_payment_requested_at TIMESTAMPTZ;
