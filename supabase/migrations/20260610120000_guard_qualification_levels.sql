-- Minimum guard qualification level required to accept a job
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS min_guard_qualification TEXT NOT NULL DEFAULT 'pending'
  CHECK (min_guard_qualification IN ('pending', 'active'));
