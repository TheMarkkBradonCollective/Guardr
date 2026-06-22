-- Optional client site briefing JSON (access codes, emergency plans, equipment maps, etc.)
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS operational_details JSONB;
