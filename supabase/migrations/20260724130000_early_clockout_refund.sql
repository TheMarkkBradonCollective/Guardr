-- Early clock-out refund tracking
-- When a guard clocks out before the scheduled end time, the unused hours
-- are refunded to the client.

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS early_clock_out_actual_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS early_clock_out_refund_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS early_clock_out_refund_status TEXT;

COMMENT ON COLUMN security_requests.early_clock_out_actual_hours IS 'Actual hours worked when guard clocked out early';
COMMENT ON COLUMN security_requests.early_clock_out_refund_amount IS 'Amount owed back to client for unused scheduled time';
COMMENT ON COLUMN security_requests.early_clock_out_refund_status IS 'pending | returned_stripe | returned_cash | waived';
