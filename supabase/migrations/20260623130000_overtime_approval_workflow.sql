-- Overtime approval workflow: guard + client approve before payment; separate guard overtime payout.

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS overtime_status TEXT,
  ADD COLUMN IF NOT EXISTS overtime_guard_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overtime_client_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overtime_client_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS overtime_client_cash_payment_requested BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS overtime_client_cash_payment_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overtime_guard_payout_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS overtime_guard_payout_available_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overtime_guard_payout_method TEXT;

COMMENT ON COLUMN security_requests.overtime_status IS 'none | pending_guard | pending_client | awaiting_payment | paid';
COMMENT ON COLUMN security_requests.overtime_guard_approved_at IS 'When the guard confirmed late clock-out overtime';
COMMENT ON COLUMN security_requests.overtime_client_approved_at IS 'When the client approved paying overtime';
COMMENT ON COLUMN security_requests.overtime_client_payment_method IS 'stripe | cash — how the client paid overtime';
COMMENT ON COLUMN security_requests.overtime_guard_payout_method IS 'stripe | cash — how the guard was paid for overtime';
