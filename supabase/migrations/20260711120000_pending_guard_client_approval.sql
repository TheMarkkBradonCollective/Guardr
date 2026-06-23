ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS pending_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS staff_approved_guard_at TIMESTAMPTZ;
