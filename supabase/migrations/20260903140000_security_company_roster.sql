-- Licensed security company IC roster (marketplace guards they book repeatedly).
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS security_company_roster JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN clients.security_company_roster IS
  'Independent contractor guards on the PPO roster — not employees; marketplace bookings only.';
