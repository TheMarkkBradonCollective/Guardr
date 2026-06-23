-- Late clock-out overtime billing: preserve scheduled amounts and track overtime charges.

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS scheduled_duration_hours NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS scheduled_estimated_payout NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS overtime_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS overtime_payment_status TEXT;

COMMENT ON COLUMN security_requests.scheduled_duration_hours IS 'Original scheduled shift length before late clock-out adjustment';
COMMENT ON COLUMN security_requests.scheduled_estimated_payout IS 'Original client bill before late clock-out adjustment';
COMMENT ON COLUMN security_requests.overtime_hours IS 'Extra hours billed when guard clocked out after scheduled end';
COMMENT ON COLUMN security_requests.overtime_amount IS 'Additional client charge for late clock-out';
COMMENT ON COLUMN security_requests.overtime_payment_status IS 'none | unpaid | paid — tracks collection of overtime difference';
