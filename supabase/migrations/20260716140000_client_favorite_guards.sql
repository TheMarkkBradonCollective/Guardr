-- Clients can favourite guards they like.
-- Stored as a JSONB array of guard IDs on the client row.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS favorite_guard_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
