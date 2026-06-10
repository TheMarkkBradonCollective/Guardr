-- Rich job listing fields for professional client offers and guard viewing
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS parking_instructions TEXT,
  ADD COLUMN IF NOT EXISTS access_instructions TEXT;
