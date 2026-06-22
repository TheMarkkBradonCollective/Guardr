-- Staff-granted grace period when optional credentials are missing at activation.
ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS credential_grace_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credential_grace_missing JSONB;
