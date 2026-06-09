-- Persist guard shift self-audit data on security_requests
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS check_in_audit JSONB;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS mid_shift_audits JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS check_out_audit JSONB;

UPDATE security_requests SET mid_shift_audits = '[]'::jsonb WHERE mid_shift_audits IS NULL;
