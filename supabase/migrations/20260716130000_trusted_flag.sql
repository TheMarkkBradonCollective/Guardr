-- Add explicit trusted flag to guards and clients.
-- Set by Directors and Owners only; separate from the approval/verified flow.
-- Trusted guards skip client confirmation on non-cash job placements.
-- Trusted clients skip the job posting approval queue for non-cash jobs.

ALTER TABLE guards ADD COLUMN IF NOT EXISTS trusted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trusted BOOLEAN NOT NULL DEFAULT FALSE;
