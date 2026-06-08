-- Direct client-to-guard requests
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS preferred_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_security_requests_preferred_guard
  ON security_requests(preferred_guard_id);
