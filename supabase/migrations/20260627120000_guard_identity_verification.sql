-- Government ID + identity selfie verification for guard profiles.

ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS id_verification_status TEXT NOT NULL DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS id_front_url TEXT,
  ADD COLUMN IF NOT EXISTS id_back_url TEXT,
  ADD COLUMN IF NOT EXISTS id_selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS id_verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_verification_rejection_reason TEXT;

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_id_verification_status_check;
ALTER TABLE guards ADD CONSTRAINT guards_id_verification_status_check
  CHECK (id_verification_status IN ('not_submitted', 'pending', 'verified', 'rejected'));
