-- Peer guard suggestions on open jobs (notify suggested guard + client).
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS guard_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN security_requests.guard_suggestions IS
  'Guard-to-guard suggestions for open jobs; client reviews before placement.';
