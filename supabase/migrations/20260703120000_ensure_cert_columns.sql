-- Ensure credential photo + submission tracking columns exist (idempotent catch-up).
-- Run in Supabase SQL Editor if cert saves fail with missing column errors.

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS catalog_id TEXT;

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS submitted_by_role TEXT;

ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS id_submitted_by TEXT;

-- Refresh PostgREST schema cache so the API sees new columns immediately.
NOTIFY pgrst, 'reload schema';
