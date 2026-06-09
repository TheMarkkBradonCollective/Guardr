-- Director-recorded cash payments (client intake + guard payout)

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS client_payment_method TEXT
  CHECK (client_payment_method IS NULL OR client_payment_method IN ('stripe', 'cash'));

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS guard_payout_method TEXT
  CHECK (guard_payout_method IS NULL OR guard_payout_method IN ('stripe', 'cash'));

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT
  CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'cash'));
