-- Staff spot-check photos confirming guard presence on site
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS spot_checks JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE security_requests SET spot_checks = '[]'::jsonb WHERE spot_checks IS NULL;
