-- Jun 26, 2026 session changes
-- Supports: marketplace legal acceptances (PR #308), COI/insurance (PR #296/#309),
-- and optional certification expiry dates (cert expiry removed from app UI).

-- Fix column types if an earlier draft used UUID for text-based profile ids
DO $$
BEGIN
  IF to_regclass('public.user_legal_acceptances') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_legal_acceptances'
        AND column_name = 'user_id'
        AND udt_name = 'uuid'
    ) THEN
      ALTER TABLE user_legal_acceptances
        ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    END IF;
  END IF;

  IF to_regclass('public.guard_insurance_policies') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'guard_insurance_policies'
        AND column_name = 'guard_id'
        AND udt_name = 'uuid'
    ) THEN
      ALTER TABLE guard_insurance_policies
        ALTER COLUMN guard_id TYPE TEXT USING guard_id::text;
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'guard_insurance_policies'
        AND column_name = 'reviewed_by'
        AND udt_name = 'uuid'
    ) THEN
      ALTER TABLE guard_insurance_policies
        ALTER COLUMN reviewed_by TYPE TEXT USING reviewed_by::text;
    END IF;
  END IF;
END $$;

-- ── 1. Marketplace legal acceptances (accept once, audit trail for directors/owners) ──

CREATE TABLE IF NOT EXISTS user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('guard', 'client', 'staff')),
  document_id TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, document_id, document_version)
);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_id
  ON user_legal_acceptances (user_id);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_role
  ON user_legal_acceptances (user_role);

COMMENT ON TABLE user_legal_acceptances IS
  'Versioned legal document acceptances — marketplace agreements accepted once per user';

ALTER TABLE user_legal_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_legal_acceptances_select" ON user_legal_acceptances;
CREATE POLICY "user_legal_acceptances_select" ON user_legal_acceptances
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_legal_acceptances_insert" ON user_legal_acceptances;
CREATE POLICY "user_legal_acceptances_insert" ON user_legal_acceptances
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "user_legal_acceptances_update" ON user_legal_acceptances;
CREATE POLICY "user_legal_acceptances_update" ON user_legal_acceptances
  FOR UPDATE USING (true) WITH CHECK (true);

-- ── 2. Guard COI / general liability insurance ───────────────────────────────

CREATE TABLE IF NOT EXISTS guard_insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
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
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guard_insurance_policies_guard_id
  ON guard_insurance_policies (guard_id);

COMMENT ON TABLE guard_insurance_policies IS
  'Guard general liability COI — required for marketplace profile approval and jobs';

ALTER TABLE guard_insurance_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guard_insurance_policies_select" ON guard_insurance_policies;
CREATE POLICY "guard_insurance_policies_select" ON guard_insurance_policies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "guard_insurance_policies_insert" ON guard_insurance_policies;
CREATE POLICY "guard_insurance_policies_insert" ON guard_insurance_policies
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "guard_insurance_policies_update" ON guard_insurance_policies;
CREATE POLICY "guard_insurance_policies_update" ON guard_insurance_policies
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "guard_insurance_policies_delete" ON guard_insurance_policies;
CREATE POLICY "guard_insurance_policies_delete" ON guard_insurance_policies
  FOR DELETE USING (true);

-- ── 3. Marketplace compliance columns (platform + jobs) ────────────────────

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS service_agreement JSONB;

COMMENT ON COLUMN security_requests.service_agreement IS
  'Generated client-guard per-job service agreement at assignment';

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS auto_payout_scheduled_at TIMESTAMPTZ;

COMMENT ON COLUMN security_requests.auto_payout_scheduled_at IS
  'When automatic Stripe payout should run after shift completion';

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS auto_stripe_payout_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS auto_stripe_payout_delay_hours INTEGER NOT NULL DEFAULT 48;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS verified_guard_self_serve BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN platform_settings.verified_guard_self_serve IS
  'When true, verified insured guards skip staff applicant review on card jobs';

-- ── 4. Certifications: expiry no longer required (app removed expiry from certs) ──

ALTER TABLE certifications
  ALTER COLUMN expiry_date DROP NOT NULL;

COMMENT ON COLUMN certifications.expiry_date IS
  'Legacy optional field — app no longer collects cert expiry; COI and government ID keep their own expiry columns';

-- ── 5. Realtime (live sync for new tables) ───────────────────────────────────

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['user_legal_acceptances', 'guard_insurance_policies']
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN OTHERS THEN
          IF SQLERRM NOT LIKE '%already member of publication%' THEN
            RAISE;
          END IF;
      END;
    END IF;
  END LOOP;
END $$;
