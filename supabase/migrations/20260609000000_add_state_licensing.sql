-- State-based guard licensing: certs and jobs tied to US state codes

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_certifications_state ON certifications(state);
CREATE INDEX IF NOT EXISTS idx_security_requests_state ON security_requests(state);
