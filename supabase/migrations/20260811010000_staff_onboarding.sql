-- Staff onboarding: richer application intake, government ID, Stripe payout setup.

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_user_status_check;
ALTER TABLE staff ADD CONSTRAINT staff_user_status_check
  CHECK (user_status IN ('pending', 'approved', 'active', 'suspended', 'blocked'));

ALTER TABLE staff ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS availability_notes TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS application_revision_requested_at TIMESTAMPTZ;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS application_revision_note TEXT;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_verification_status TEXT
  CHECK (id_verification_status IS NULL OR id_verification_status IN ('not_submitted', 'pending', 'verified', 'rejected'));
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_state TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_expiry_date TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_front_url TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_back_url TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_selfie_url TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_verification_submitted_at TIMESTAMPTZ;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_verification_reviewed_at TIMESTAMPTZ;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_verification_rejection_reason TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_update_requested_at TIMESTAMPTZ;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_update_request_note TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_submitted_by TEXT
  CHECK (id_submitted_by IS NULL OR id_submitted_by IN ('guard', 'staff'));
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_document_type TEXT
  CHECK (id_document_type IS NULL OR id_document_type IN ('state_id', 'drivers_license'));
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_license_class TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_revision_history JSONB;

UPDATE staff SET id_verification_status = 'not_submitted' WHERE id_verification_status IS NULL;

COMMENT ON COLUMN staff.stripe_connect_account_id IS 'Stripe Connect Express account for staff compensation payouts.';
COMMENT ON COLUMN staff.id_verification_status IS 'Government ID verification for staff onboarding — required before ops access.';
