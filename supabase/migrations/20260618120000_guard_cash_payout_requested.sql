-- Guard requested physical cash payout from director

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS guard_cash_payout_requested BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS guard_cash_payout_requested_at TIMESTAMPTZ;
