ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS cash_deposited_manually BOOLEAN NOT NULL DEFAULT FALSE;
