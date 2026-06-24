-- Client schedule change requests (paid jobs): pending approval or auto-applied
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS pending_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_duration_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS pending_estimated_payout NUMERIC,
  ADD COLUMN IF NOT EXISTS schedule_change_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS schedule_change_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN security_requests.schedule_change_status IS 'none | pending_staff';
