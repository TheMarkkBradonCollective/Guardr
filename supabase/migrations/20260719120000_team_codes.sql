-- Shareable crew team codes for multi-guard jobs (lead invites / guard self-join)

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS team_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_security_requests_team_code_unique
  ON security_requests (UPPER(team_code))
  WHERE team_code IS NOT NULL AND status = 'open';
