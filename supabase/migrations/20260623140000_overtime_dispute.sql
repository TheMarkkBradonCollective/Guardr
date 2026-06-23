-- Overtime dispute: client contests late clock-out charge; staff reviews and adjusts.

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS overtime_dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS overtime_disputed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overtime_dispute_claimed_clock_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overtime_dispute_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS overtime_dispute_resolution TEXT,
  ADD COLUMN IF NOT EXISTS overtime_original_hours NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS overtime_original_amount NUMERIC(12, 2);

COMMENT ON COLUMN security_requests.overtime_dispute_reason IS 'Client explanation when disputing late clock-out overtime';
COMMENT ON COLUMN security_requests.overtime_dispute_claimed_clock_out_at IS 'Client-stated actual guard clock-out time when disputing overtime';
COMMENT ON COLUMN security_requests.overtime_original_hours IS 'Overtime hours claimed when the client opened a dispute';
COMMENT ON COLUMN security_requests.overtime_original_amount IS 'Overtime amount claimed when the client opened a dispute';

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_overtime_status_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_overtime_status_check
  CHECK (overtime_status IS NULL OR overtime_status IN (
    'none', 'pending_guard', 'pending_client', 'awaiting_payment', 'disputed', 'paid', 'waived'
  ));
