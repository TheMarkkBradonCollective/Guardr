-- Marketplace compliance: legal acceptances, guard insurance, per-job agreements, auto-payout settings

CREATE TABLE IF NOT EXISTS user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('guard', 'client', 'staff')),
  document_id TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, document_id, document_version)
);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_id
  ON user_legal_acceptances (user_id);

COMMENT ON TABLE user_legal_acceptances IS 'Versioned legal document acceptances for marketplace compliance audit trail';

CREATE TABLE IF NOT EXISTS guard_insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL DEFAULT '',
  policy_number TEXT NOT NULL DEFAULT '',
  general_liability_limit NUMERIC,
  effective_date DATE,
  expiry_date DATE,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'not_submitted'
    CHECK (status IN ('not_submitted', 'pending', 'verified', 'rejected', 'expired')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guard_insurance_policies_guard_id
  ON guard_insurance_policies (guard_id);

COMMENT ON TABLE guard_insurance_policies IS 'Guard general liability COI — required for marketplace job applications';

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS service_agreement JSONB;

COMMENT ON COLUMN security_requests.service_agreement IS 'Generated client-guard per-job service agreement at assignment';

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS auto_payout_scheduled_at TIMESTAMPTZ;

COMMENT ON COLUMN security_requests.auto_payout_scheduled_at IS 'When automatic Stripe payout should run after shift completion';

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS auto_stripe_payout_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS auto_stripe_payout_delay_hours INTEGER NOT NULL DEFAULT 48;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS verified_guard_self_serve BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN platform_settings.verified_guard_self_serve IS 'When true, verified insured guards skip staff applicant review on card jobs';
