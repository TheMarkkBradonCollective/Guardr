-- =============================================================================
-- Guardr — COMPLETE SCHEMA SETUP (run once in Supabase SQL Editor)
-- Idempotent: safe to re-run. Does NOT delete your data.
-- Adds all tables, columns, constraints, RLS policies, and realtime.
-- Last updated: Jun 25, 2026 — Founder role, approved user_status, listed_weapon_gear,
--   two-step guard activation (pending → approved → active), COI, crew teams, schedule changes.
-- Ends with PostgREST schema reload so the API sees new columns immediately.
-- =============================================================================

-- ── GUARDS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  badge_number TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  is_armed BOOLEAN NOT NULL DEFAULT FALSE,
  background_checked BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(4, 2) NOT NULL DEFAULT 0,
  jobs_completed INTEGER NOT NULL DEFAULT 0,
  hourly_rate_requirement INTEGER,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  staff_role TEXT CHECK (staff_role IS NULL OR staff_role IN ('Founder', 'Owner', 'Director', 'Administrator', 'Moderator')),
  user_status TEXT NOT NULL DEFAULT 'pending' CHECK (user_status IN ('pending', 'active', 'suspended', 'blocked')),
  failed_audits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE guards ADD COLUMN IF NOT EXISTS failed_audits INTEGER NOT NULL DEFAULT 0;
UPDATE guards SET failed_audits = 0 WHERE failed_audits IS NULL;

ALTER TABLE guards ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS availability_notes TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS listed_weapon_gear JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS theme_preference TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_verification_status TEXT NOT NULL DEFAULT 'not_submitted';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_state TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_expiry_date DATE;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_front_url TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_back_url TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_selfie_url TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_verification_submitted_at TIMESTAMPTZ;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_verification_reviewed_at TIMESTAMPTZ;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_verification_rejection_reason TEXT;

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_id_verification_status_check;
ALTER TABLE guards ADD CONSTRAINT guards_id_verification_status_check
  CHECK (id_verification_status IN ('not_submitted', 'pending', 'verified', 'rejected'));

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_user_status_check;
ALTER TABLE guards ADD CONSTRAINT guards_user_status_check
  CHECK (user_status IN ('pending', 'approved', 'active', 'suspended', 'blocked'));
ALTER TABLE guards ALTER COLUMN user_status SET DEFAULT 'pending';

ALTER TABLE guards ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS credential_grace_deadline TIMESTAMPTZ;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS credential_grace_hours INTEGER;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS credential_grace_missing JSONB;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_submitted_by TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS migrated_to_staff_at TIMESTAMPTZ;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS trusted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_staff_role_check;
ALTER TABLE guards ADD CONSTRAINT guards_staff_role_check
  CHECK (staff_role IS NULL OR staff_role IN ('Founder', 'Owner', 'Director', 'Administrator', 'Moderator'));

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_theme_preference_check;
ALTER TABLE guards ADD CONSTRAINT guards_theme_preference_check
  CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey'));

-- Backfill name parts from display name where empty
UPDATE guards
SET
  first_name = COALESCE(NULLIF(trim(first_name), ''), split_part(trim(name), ' ', 1)),
  last_name = COALESCE(
    NULLIF(trim(last_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) >= 2
        THEN (regexp_split_to_array(trim(name), '\s+'))[array_length(regexp_split_to_array(trim(name), '\s+'), 1)]
      ELSE ''
    END
  ),
  middle_name = COALESCE(
    NULLIF(trim(middle_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) > 2
        THEN array_to_string(
          (regexp_split_to_array(trim(name), '\s+'))[2:array_length(regexp_split_to_array(trim(name), '\s+'), 1) - 1],
          ' '
        )
      ELSE NULL
    END
  )
WHERE trim(coalesce(name, '')) <> '';

-- ── STAFF (platform ops accounts — separate from field guards) ───────────────
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  badge_number TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  staff_role TEXT NOT NULL
    CHECK (staff_role IN ('Founder', 'Owner', 'Director', 'Administrator', 'Moderator')),
  user_status TEXT NOT NULL DEFAULT 'active'
    CHECK (user_status IN ('active', 'suspended', 'blocked')),
  password TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  theme_preference TEXT CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  migrated_from_guards_at TIMESTAMPTZ
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_select" ON staff;
DROP POLICY IF EXISTS "staff_insert" ON staff;
DROP POLICY IF EXISTS "staff_update" ON staff;
DROP POLICY IF EXISTS "staff_delete" ON staff;
CREATE POLICY "staff_select" ON staff FOR SELECT USING (true);
CREATE POLICY "staff_insert" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "staff_update" ON staff FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "staff_delete" ON staff FOR DELETE USING (true);

-- ── CLIENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  total_requests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rating NUMERIC(4, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS theme_preference TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_status TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trusted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS favorite_guard_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industries TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_license TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_description TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_types TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estimated_guards_needed INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS armed_preference TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_frequencies TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS estimated_start_date TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_state TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_types TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referred_by_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS how_heard_about_us TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_prior_security_service BOOLEAN;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS prior_security_provider TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS special_requirements TEXT;

UPDATE clients SET favorite_guard_ids = '[]'::jsonb WHERE favorite_guard_ids IS NULL;
UPDATE guards SET trusted = FALSE WHERE trusted IS NULL;
UPDATE clients SET trusted = FALSE WHERE trusted IS NULL;
UPDATE clients SET approved = TRUE WHERE approved IS NULL;
UPDATE clients
SET account_status = CASE
  WHEN approved = FALSE THEN 'suspended'
  ELSE 'active'
END
WHERE account_status IS NULL;
ALTER TABLE clients ALTER COLUMN account_status SET DEFAULT 'pending';
UPDATE clients SET account_status = 'active' WHERE account_status IS NULL;
ALTER TABLE clients ALTER COLUMN account_status SET NOT NULL;

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_account_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_account_status_check
  CHECK (account_status IN ('pending', 'active', 'suspended'));

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_theme_preference_check;
ALTER TABLE clients ADD CONSTRAINT clients_theme_preference_check
  CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey'));

UPDATE clients
SET
  first_name = COALESCE(NULLIF(trim(first_name), ''), split_part(trim(name), ' ', 1)),
  last_name = COALESCE(
    NULLIF(trim(last_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) >= 2
        THEN (regexp_split_to_array(trim(name), '\s+'))[array_length(regexp_split_to_array(trim(name), '\s+'), 1)]
      ELSE ''
    END
  ),
  middle_name = COALESCE(
    NULLIF(trim(middle_name), ''),
    CASE
      WHEN array_length(regexp_split_to_array(trim(name), '\s+'), 1) > 2
        THEN array_to_string(
          (regexp_split_to_array(trim(name), '\s+'))[2:array_length(regexp_split_to_array(trim(name), '\s+'), 1) - 1],
          ' '
        )
      ELSE NULL
    END
  )
WHERE trim(coalesce(name, '')) <> '';

-- ── CERTIFICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'pending', 'rejected')),
  issue_date DATE NOT NULL,
  expiry_date DATE,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE certifications ADD COLUMN IF NOT EXISTS catalog_id TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS submitted_by_role TEXT;

-- Cert expiry is optional — app no longer collects cert expiry (COI and government ID keep their own).
ALTER TABLE certifications ALTER COLUMN expiry_date DROP NOT NULL;

COMMENT ON COLUMN certifications.expiry_date IS
  'Legacy optional field — app no longer collects cert expiry; COI and government ID keep their own expiry columns';

CREATE UNIQUE INDEX IF NOT EXISTS idx_certifications_unique_normalized_number
ON certifications (
  upper(regexp_replace(trim(number), '[^a-zA-Z0-9]', '', 'g'))
)
WHERE trim(number) <> '';

-- ── EXPERIENCE & EDUCATION ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience (
  id TEXT PRIMARY KEY,
  guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS education (
  id TEXT PRIMARY KEY,
  guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  school TEXT NOT NULL,
  degree TEXT NOT NULL DEFAULT '',
  field TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── SECURITY REQUESTS (jobs) — what clients post ────────────────────────────
CREATE TABLE IF NOT EXISTS security_requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_logo TEXT NOT NULL DEFAULT '',
  client_rating NUMERIC(4, 2),
  site_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'event',
  armed_required BOOLEAN NOT NULL DEFAULT FALSE,
  guards_needed INTEGER NOT NULL DEFAULT 1,
  uniform_requirements TEXT NOT NULL DEFAULT '',
  equipment_requirements TEXT NOT NULL DEFAULT '',
  site_instructions TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  duration_hours NUMERIC(10, 2) NOT NULL DEFAULT 8,
  hourly_rate INTEGER NOT NULL DEFAULT 35,
  guard_pay INTEGER,
  platform_fee_per_hour INTEGER NOT NULL DEFAULT 5,
  estimated_payout NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
  required_certifications TEXT[] NOT NULL DEFAULT '{}',
  applicants TEXT[] NOT NULL DEFAULT '{}',
  rating_given INTEGER,
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guards_needed INTEGER DEFAULT 1;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS uniform_requirements TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS equipment_requirements TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS site_instructions TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS operational_details JSONB;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_pay INTEGER;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS platform_fee_per_hour INTEGER DEFAULT 5;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS client_rating NUMERIC(4, 2);
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'marketplace';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS target_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS min_guard_qualification TEXT DEFAULT 'pending';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS client_payment_method TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_payout_method TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS cash_deposited_to_stripe BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS cash_deposited_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS cash_deposited_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS cash_deposited_manually BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS platform_fee_paid_cash BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_cash_payout_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_cash_payout_requested_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_payout_available BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_payout_available_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS client_cash_payment_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS client_cash_payment_requested_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS pending_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS staff_approved_guard_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS check_in_audit JSONB;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS spot_checks JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS mid_shift_audits JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS check_out_audit JSONB;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS parking_instructions TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS access_instructions TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS scheduled_duration_hours NUMERIC(10, 2);
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS scheduled_estimated_payout NUMERIC(12, 2);
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(10, 2);
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_amount NUMERIC(12, 2);
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_payment_status TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_status TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_guard_approved_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_client_approved_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_client_payment_method TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_client_cash_payment_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_client_cash_payment_requested_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_guard_payout_available BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_guard_payout_available_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_guard_payout_method TEXT;

-- Overtime dispute: client contests late clock-out charge; staff reviews and adjusts.
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_dispute_reason TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_disputed_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_dispute_claimed_clock_out_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_dispute_resolved_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_dispute_resolution TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_original_hours NUMERIC(10, 2);
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS overtime_original_amount NUMERIC(12, 2);
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS break_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS shift_breaks JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS team_lead_id TEXT REFERENCES guards(id) ON DELETE SET NULL;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS team_code TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS crew_name TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS crew_description TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS service_agreement JSONB;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS auto_payout_scheduled_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS pending_start_date TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS pending_end_date TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS pending_duration_hours NUMERIC;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS pending_estimated_payout NUMERIC;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS schedule_change_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS schedule_change_requested_at TIMESTAMPTZ;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS schedule_change_requested_by TEXT;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS schedule_change_extra_amount NUMERIC;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS early_clock_out_actual_hours NUMERIC;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS early_clock_out_refund_amount NUMERIC;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS early_clock_out_refund_status TEXT;

COMMENT ON COLUMN security_requests.break_minutes IS 'Total unpaid break minutes the client allows during the shift';
COMMENT ON COLUMN security_requests.shift_breaks IS 'Guard break sessions: [{ id, startedAt, endedAt? }]';
COMMENT ON COLUMN security_requests.service_agreement IS 'Generated client-guard per-job service agreement at assignment';
COMMENT ON COLUMN security_requests.auto_payout_scheduled_at IS 'When automatic Stripe payout should run after shift completion';
COMMENT ON COLUMN security_requests.schedule_change_status IS 'none | pending_staff | pending_client | awaiting_payment | pending_staff_billing';
COMMENT ON COLUMN security_requests.schedule_change_requested_by IS 'client | staff — who proposed the pending schedule change';
COMMENT ON COLUMN security_requests.early_clock_out_actual_hours IS 'Actual hours worked when guard clocked out early';
COMMENT ON COLUMN security_requests.early_clock_out_refund_amount IS 'Amount owed back to client for unused scheduled time';
COMMENT ON COLUMN security_requests.early_clock_out_refund_status IS 'pending | returned_stripe | returned_cash | waived';

COMMENT ON COLUMN security_requests.scheduled_duration_hours IS 'Original scheduled shift length before late clock-out adjustment';
COMMENT ON COLUMN security_requests.scheduled_estimated_payout IS 'Original client bill before late clock-out adjustment';
COMMENT ON COLUMN security_requests.overtime_hours IS 'Extra hours billed when guard clocked out after scheduled end';
COMMENT ON COLUMN security_requests.overtime_amount IS 'Additional client charge for late clock-out';
COMMENT ON COLUMN security_requests.overtime_payment_status IS 'none | unpaid | paid — tracks collection of overtime difference';
COMMENT ON COLUMN security_requests.overtime_status IS 'none | pending_guard | pending_client | awaiting_payment | disputed | paid | waived';
COMMENT ON COLUMN security_requests.overtime_guard_approved_at IS 'When the guard confirmed late clock-out overtime';
COMMENT ON COLUMN security_requests.overtime_client_approved_at IS 'When the client approved paying overtime';
COMMENT ON COLUMN security_requests.overtime_dispute_reason IS 'Client explanation when disputing late clock-out overtime';
COMMENT ON COLUMN security_requests.overtime_disputed_at IS 'When the client opened an overtime dispute';
COMMENT ON COLUMN security_requests.overtime_dispute_claimed_clock_out_at IS 'Client-stated actual guard clock-out time when disputing overtime';
COMMENT ON COLUMN security_requests.overtime_dispute_resolved_at IS 'When staff resolved an overtime dispute';
COMMENT ON COLUMN security_requests.overtime_dispute_resolution IS 'Staff note describing how an overtime dispute was resolved';
COMMENT ON COLUMN security_requests.overtime_original_hours IS 'Overtime hours claimed when the client opened a dispute';
COMMENT ON COLUMN security_requests.overtime_original_amount IS 'Overtime amount claimed when the client opened a dispute';
COMMENT ON COLUMN security_requests.overtime_client_payment_method IS 'stripe | cash — how the client paid overtime';
COMMENT ON COLUMN security_requests.overtime_guard_payout_method IS 'stripe | cash — how the guard was paid for overtime';

UPDATE security_requests SET cash_deposited_to_stripe = FALSE WHERE cash_deposited_to_stripe IS NULL;
UPDATE security_requests SET cash_deposited_amount = estimated_payout
  WHERE cash_deposited_to_stripe = TRUE AND cash_deposited_amount = 0;
UPDATE security_requests SET cash_deposited_manually = FALSE WHERE cash_deposited_manually IS NULL;
UPDATE security_requests SET site_name = '' WHERE site_name IS NULL;
UPDATE security_requests SET address = '' WHERE address IS NULL;
UPDATE security_requests SET state = '' WHERE state IS NULL;
UPDATE security_requests SET guards_needed = 1 WHERE guards_needed IS NULL;
UPDATE security_requests SET uniform_requirements = '' WHERE uniform_requirements IS NULL;
UPDATE security_requests SET equipment_requirements = '' WHERE equipment_requirements IS NULL;
UPDATE security_requests SET site_instructions = '' WHERE site_instructions IS NULL;
UPDATE security_requests SET description = '' WHERE description IS NULL;
UPDATE security_requests SET platform_fee_per_hour = 5 WHERE platform_fee_per_hour IS NULL;
UPDATE security_requests SET payment_status = 'unpaid' WHERE payment_status IS NULL;
UPDATE security_requests SET request_type = 'marketplace' WHERE request_type IS NULL;
UPDATE security_requests SET min_guard_qualification = 'pending' WHERE min_guard_qualification IS NULL;
UPDATE security_requests SET min_guard_qualification = 'pending'
  WHERE min_guard_qualification NOT IN ('pending', 'active');
UPDATE security_requests SET request_type = 'marketplace'
  WHERE request_type IS NOT NULL AND request_type NOT IN ('marketplace', 'direct');
UPDATE security_requests SET required_certifications = '{}' WHERE required_certifications IS NULL;
UPDATE security_requests SET applicants = '{}' WHERE applicants IS NULL;
UPDATE security_requests SET spot_checks = '[]'::jsonb WHERE spot_checks IS NULL;
UPDATE security_requests SET mid_shift_audits = '[]'::jsonb WHERE mid_shift_audits IS NULL;
UPDATE security_requests SET platform_fee_paid_cash = FALSE WHERE platform_fee_paid_cash IS NULL;
UPDATE security_requests SET guard_cash_payout_requested = FALSE WHERE guard_cash_payout_requested IS NULL;
UPDATE security_requests SET client_cash_payment_requested = FALSE WHERE client_cash_payment_requested IS NULL;
UPDATE security_requests SET guard_payout_available = FALSE WHERE guard_payout_available IS NULL;
UPDATE security_requests SET overtime_client_cash_payment_requested = FALSE WHERE overtime_client_cash_payment_requested IS NULL;
UPDATE security_requests SET overtime_guard_payout_available = FALSE WHERE overtime_guard_payout_available IS NULL;
UPDATE security_requests SET break_minutes = 0 WHERE break_minutes IS NULL;
UPDATE security_requests SET shift_breaks = '[]'::jsonb WHERE shift_breaks IS NULL;
UPDATE security_requests SET schedule_change_status = 'none' WHERE schedule_change_status IS NULL;
UPDATE security_requests
SET
  guard_payout_available = TRUE,
  guard_payout_available_at = COALESCE(guard_payout_available_at, NOW())
WHERE status = 'completed'
  AND payment_status IN ('paid', 'held')
  AND COALESCE(guard_payout_method, '') <> 'cash'
  AND payment_status <> 'released';

UPDATE security_requests SET status = 'accepted' WHERE status = 'assigned';
UPDATE security_requests SET status = 'closed' WHERE status = 'cancelled';
UPDATE security_requests SET status = 'open' WHERE status NOT IN (
  'draft', 'pending-review', 'open', 'accepted', 'in-progress', 'completed', 'closed'
);

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_status_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_status_check
  CHECK (status IN ('draft', 'pending-review', 'open', 'accepted', 'in-progress', 'completed', 'closed'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_payment_status_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_payment_status_check
  CHECK (payment_status IS NULL OR payment_status IN ('unpaid', 'paid', 'held', 'released'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_request_type_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_request_type_check
  CHECK (request_type IS NULL OR request_type IN ('marketplace', 'direct'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_min_guard_qualification_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_min_guard_qualification_check
  CHECK (min_guard_qualification IN ('pending', 'active'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_client_payment_method_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_client_payment_method_check
  CHECK (client_payment_method IS NULL OR client_payment_method IN ('stripe', 'cash'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_guard_payout_method_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_guard_payout_method_check
  CHECK (guard_payout_method IS NULL OR guard_payout_method IN ('stripe', 'cash'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_overtime_payment_status_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_overtime_payment_status_check
  CHECK (overtime_payment_status IS NULL OR overtime_payment_status IN ('none', 'unpaid', 'paid'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_overtime_status_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_overtime_status_check
  CHECK (overtime_status IS NULL OR overtime_status IN (
    'none', 'pending_guard', 'pending_client', 'awaiting_payment', 'disputed', 'paid', 'waived'
  ));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_overtime_client_payment_method_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_overtime_client_payment_method_check
  CHECK (overtime_client_payment_method IS NULL OR overtime_client_payment_method IN ('stripe', 'cash'));

ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_overtime_guard_payout_method_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_overtime_guard_payout_method_check
  CHECK (overtime_guard_payout_method IS NULL OR overtime_guard_payout_method IN ('stripe', 'cash'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'security_requests' AND column_name = 'preferred_guard_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'security_requests' AND column_name = 'target_guard_id'
  ) THEN
    ALTER TABLE security_requests RENAME COLUMN preferred_guard_id TO target_guard_id;
  END IF;
END $$;

-- ── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES security_requests(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'cash')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'held', 'released', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'cash'));

-- ── GUARD PAYOUT INVOICES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guard_payout_invoices (
  id TEXT PRIMARY KEY,
  guard_id TEXT NOT NULL,
  guard_name TEXT NOT NULL,
  guard_email TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'stripe')),
  job_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS guard_payout_invoices_guard_id_idx ON guard_payout_invoices(guard_id);
CREATE INDEX IF NOT EXISTS guard_payout_invoices_status_idx ON guard_payout_invoices(status);

-- ── SUPPORT ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('chat', 'report')),
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  related_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── PUSH SUBSCRIPTIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  push_role TEXT NOT NULL CHECK (push_role IN ('guard', 'dispatch', 'admin', 'client')),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  site_id TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PUSH NOTIFICATION DEDUP (server-side duplicate prevention) ───────────────
CREATE TABLE IF NOT EXISTS push_notification_dedup (
  id TEXT PRIMARY KEY,
  notification_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_push_notification_dedup_created
  ON push_notification_dedup (created_at);

COMMENT ON TABLE push_notification_dedup IS
  'Prevents duplicate operational push alerts; rows older than ~25h are pruned by cron.';

-- ── MESSAGING (job chat + staff channel + notification prefs) ───────────────
CREATE TABLE IF NOT EXISTS job_chat_threads (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  guard_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS job_chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES job_chat_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS staff_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS guard_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  message_type TEXT NOT NULL
    CHECK (message_type IN ('job_chat', 'staff', 'guard', 'support')),
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (message_type, message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_lookup_idx
  ON message_reactions (message_type, message_id);
CREATE INDEX IF NOT EXISTS message_reactions_user_idx
  ON message_reactions (user_id);

CREATE TABLE IF NOT EXISTS chat_read_receipts (
  user_id TEXT NOT NULL,
  channel_type TEXT NOT NULL
    CHECK (channel_type IN ('job_chat', 'staff', 'guard', 'support')),
  channel_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, channel_type, channel_id)
);

CREATE INDEX IF NOT EXISTS chat_read_receipts_channel_idx
  ON chat_read_receipts (channel_type, channel_id);

CREATE OR REPLACE FUNCTION mark_channel_read(
  p_user_id TEXT,
  p_channel_type TEXT,
  p_channel_id TEXT
)
RETURNS VOID
LANGUAGE sql
AS $$
  INSERT INTO chat_read_receipts (user_id, channel_type, channel_id, last_read_at)
  VALUES (p_user_id, p_channel_type, p_channel_id, timezone('utc'::text, now()))
  ON CONFLICT (user_id, channel_type, channel_id)
  DO UPDATE SET last_read_at = EXCLUDED.last_read_at;
$$;

CREATE OR REPLACE FUNCTION unread_counts(p_user_id TEXT)
RETURNS TABLE (
  channel_type TEXT,
  channel_id TEXT,
  unread_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    'job_chat'::TEXT AS channel_type,
    t.id AS channel_id,
    COUNT(m.id) FILTER (
      WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
        AND m.sender_id <> p_user_id
    ) AS unread_count
  FROM job_chat_threads t
  JOIN job_chat_messages m ON m.thread_id = t.id
  LEFT JOIN chat_read_receipts r
    ON r.user_id = p_user_id
   AND r.channel_type = 'job_chat'
   AND r.channel_id = t.id
  WHERE t.client_id = p_user_id OR t.guard_id = p_user_id
  GROUP BY t.id, r.last_read_at

  UNION ALL

  SELECT
    'guard'::TEXT AS channel_type,
    'guard-community'::TEXT AS channel_id,
    COUNT(m.id) FILTER (
      WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
        AND m.sender_id <> p_user_id
    ) AS unread_count
  FROM guard_messages m
  LEFT JOIN chat_read_receipts r
    ON r.user_id = p_user_id
   AND r.channel_type = 'guard'
   AND r.channel_id = 'guard-community'

  UNION ALL

  SELECT
    'staff'::TEXT AS channel_type,
    'staff-community'::TEXT AS channel_id,
    COUNT(m.id) FILTER (
      WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
        AND m.sender_id <> p_user_id
    ) AS unread_count
  FROM staff_messages m
  LEFT JOIN chat_read_receipts r
    ON r.user_id = p_user_id
   AND r.channel_type = 'staff'
   AND r.channel_id = 'staff-community'

  UNION ALL

  SELECT
    'support'::TEXT AS channel_type,
    t.id AS channel_id,
    COUNT(m.id) FILTER (
      WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
        AND m.sender_id <> p_user_id
    ) AS unread_count
  FROM support_tickets t
  JOIN support_messages m ON m.ticket_id = t.id
  LEFT JOIN chat_read_receipts r
    ON r.user_id = p_user_id
   AND r.channel_type = 'support'
   AND r.channel_id = t.id
  WHERE t.user_id = p_user_id
  GROUP BY t.id, r.last_read_at
$$;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,
  assignment BOOLEAN NOT NULL DEFAULT true,
  guard_checkin BOOLEAN NOT NULL DEFAULT true,
  missed_checkin BOOLEAN NOT NULL DEFAULT true,
  emergency_alert BOOLEAN NOT NULL DEFAULT true,
  support_message BOOLEAN NOT NULL DEFAULT true,
  job_chat_message BOOLEAN NOT NULL DEFAULT true,
  staff_message BOOLEAN NOT NULL DEFAULT true,
  guard_message BOOLEAN NOT NULL DEFAULT true,
  job_submitted BOOLEAN NOT NULL DEFAULT true,
  guard_application BOOLEAN NOT NULL DEFAULT true,
  guard_pending_approval BOOLEAN NOT NULL DEFAULT true,
  client_pending_approval BOOLEAN NOT NULL DEFAULT true,
  credential_pending BOOLEAN NOT NULL DEFAULT true,
  payment_attention BOOLEAN NOT NULL DEFAULT true,
  support_ticket BOOLEAN NOT NULL DEFAULT true,
  support_ticket_status BOOLEAN NOT NULL DEFAULT true,
  dispute_update BOOLEAN NOT NULL DEFAULT true,
  guard_clockout BOOLEAN NOT NULL DEFAULT true,
  guard_break_start BOOLEAN NOT NULL DEFAULT true,
  guard_break_end BOOLEAN NOT NULL DEFAULT true,
  reaction_notification BOOLEAN NOT NULL DEFAULT true,
  guard_trusted_status BOOLEAN NOT NULL DEFAULT true,
  client_trusted_status BOOLEAN NOT NULL DEFAULT true,
  job_relisted BOOLEAN NOT NULL DEFAULT true,
  team_chat_message BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_message BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS job_submitted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_application BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_pending_approval BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS client_pending_approval BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS credential_pending BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS payment_attention BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS support_ticket BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS support_ticket_status BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS dispute_update BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_clockout BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_break_start BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_break_end BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS reaction_notification BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_trusted_status BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS client_trusted_status BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS job_relisted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS team_chat_message BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN notification_preferences.support_ticket IS 'Staff alert for new support chats and formal reports';
COMMENT ON COLUMN notification_preferences.support_ticket_status IS 'User alert when staff updates ticket status';
COMMENT ON COLUMN notification_preferences.dispute_update IS 'Alerts for dispute filings and resolutions';
COMMENT ON COLUMN notification_preferences.guard_trusted_status IS 'Guard alert when staff mark or remove trusted status';
COMMENT ON COLUMN notification_preferences.client_trusted_status IS 'Client alert when staff mark or remove trusted status';
COMMENT ON COLUMN notification_preferences.job_relisted IS 'Client alert when a coordinated crew is dissolved and the job returns to the marketplace';
COMMENT ON COLUMN notification_preferences.team_chat_message IS 'Crew chat messages for multi-guard coordinated jobs';

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  payment_cash_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  payment_stripe_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  fee_config JSONB NOT NULL DEFAULT '{
    "model": "flat",
    "flatFeePerHour": 5,
    "percentRate": 0.15,
    "minFeePerHour": 4,
    "maxFeePerHour": 12,
    "tiers": [
      { "minHourlyRate": 75, "feePerHour": 10 },
      { "minHourlyRate": 50, "feePerHour": 8 },
      { "minHourlyRate": 30, "feePerHour": 6 },
      { "minHourlyRate": 0, "feePerHour": 5 }
    ]
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS fee_config JSONB NOT NULL DEFAULT '{
  "model": "flat",
  "flatFeePerHour": 5,
  "percentRate": 0.15,
  "minFeePerHour": 4,
  "maxFeePerHour": 12,
  "tiers": [
    { "minHourlyRate": 75, "feePerHour": 10 },
    { "minHourlyRate": 50, "feePerHour": 8 },
    { "minHourlyRate": 30, "feePerHour": 6 },
    { "minHourlyRate": 0, "feePerHour": 5 }
  ]
}'::jsonb;

INSERT INTO platform_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS auto_stripe_payout_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS auto_stripe_payout_delay_hours INTEGER NOT NULL DEFAULT 48;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS verified_guard_self_serve BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS team_lead_bonus_per_guard_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 1.00;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS team_lead_bonus_client_share_percent INTEGER NOT NULL DEFAULT 50;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS team_lead_bonus_platform_share_percent INTEGER NOT NULL DEFAULT 50;

COMMENT ON COLUMN platform_settings.verified_guard_self_serve IS
  'When true, verified insured guards skip staff applicant review on card jobs';

UPDATE security_requests
SET opened_at = COALESCE(opened_at, created_at)
WHERE status = 'open' AND opened_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_security_requests_team_code_unique
  ON security_requests (UPPER(team_code))
  WHERE team_code IS NOT NULL AND status = 'open';

-- ── MULTI-GUARD CREW SLOTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_guard_slots (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES security_requests(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 1),
  guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
  is_lead BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open',
  invited_by_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  invite_expires_at TIMESTAMPTZ,
  staff_approved_at TIMESTAMPTZ,
  client_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, slot_index)
);

ALTER TABLE job_guard_slots DROP CONSTRAINT IF EXISTS job_guard_slots_status_check;
ALTER TABLE job_guard_slots ADD CONSTRAINT job_guard_slots_status_check CHECK (
  status IN (
    'open',
    'invited',
    'pending_staff',
    'crew_confirmed',
    'pending_client',
    'approved',
    'declined',
    'expired',
    'withdrawn'
  )
);

CREATE INDEX IF NOT EXISTS idx_job_guard_slots_job_id ON job_guard_slots(job_id);
CREATE INDEX IF NOT EXISTS idx_job_guard_slots_guard_id ON job_guard_slots(guard_id);
CREATE INDEX IF NOT EXISTS idx_job_guard_slots_status ON job_guard_slots(status);

-- ── CREW TEAM CHAT ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_chat_threads (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES security_requests(id) ON DELETE CASCADE,
  team_lead_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS team_chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES team_chat_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_chat_threads_request_id ON team_chat_threads(request_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_threads_status ON team_chat_threads(status);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_thread_id ON team_chat_messages(thread_id);

-- ── MARKETPLACE LEGAL ACCEPTANCES ─────────────────────────────────────────────
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

-- ── GUARD COI / GENERAL LIABILITY INSURANCE ───────────────────────────────────
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

ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_arrived BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS guard_left_site BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS job_open_to_guards BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN notification_preferences.guard_arrived IS 'Staff/client alert when a guard arrives on site';
COMMENT ON COLUMN notification_preferences.guard_left_site IS 'Staff/client/guard alert when a guard leaves the job site';
COMMENT ON COLUMN notification_preferences.job_open_to_guards IS 'Guard broadcast when a paid job is opened on the marketplace map';

CREATE INDEX IF NOT EXISTS job_chat_threads_request_id_idx ON job_chat_threads(request_id);
CREATE INDEX IF NOT EXISTS job_chat_threads_status_idx ON job_chat_threads(status);
CREATE INDEX IF NOT EXISTS job_chat_messages_thread_id_idx ON job_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS staff_messages_created_at_idx ON staff_messages(created_at);
CREATE INDEX IF NOT EXISTS guard_messages_created_at_idx ON guard_messages(created_at);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_guards_email ON guards(email);
CREATE INDEX IF NOT EXISTS idx_guards_verified ON guards(verified);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_approved ON clients(approved);
CREATE INDEX IF NOT EXISTS idx_certifications_guard_id ON certifications(guard_id);
CREATE INDEX IF NOT EXISTS idx_certifications_catalog_id ON certifications(catalog_id);
CREATE INDEX IF NOT EXISTS idx_certifications_category ON certifications(category);
CREATE INDEX IF NOT EXISTS idx_certifications_state ON certifications(state);
CREATE INDEX IF NOT EXISTS idx_experience_guard_id ON experience(guard_id);
CREATE INDEX IF NOT EXISTS idx_education_guard_id ON education(guard_id);
CREATE INDEX IF NOT EXISTS idx_security_requests_client_id ON security_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_security_requests_state ON security_requests(state);
CREATE INDEX IF NOT EXISTS idx_security_requests_status ON security_requests(status);
CREATE INDEX IF NOT EXISTS idx_security_requests_assigned_guard ON security_requests(assigned_guard_id);
CREATE INDEX IF NOT EXISTS idx_security_requests_request_type ON security_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_security_requests_target_guard ON security_requests(target_guard_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_push_role ON push_subscriptions(push_role);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_site_id ON push_subscriptions(site_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);

-- ── ROW LEVEL SECURITY (open policies — app uses anon key) ─────────────────
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_payout_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_dedup ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_guard_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_insurance_policies ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'guards', 'staff', 'clients', 'certifications', 'experience', 'education',
    'security_requests', 'payments', 'guard_payout_invoices',
    'support_tickets', 'support_messages', 'push_subscriptions', 'push_notification_dedup',
    'job_chat_threads', 'job_chat_messages', 'staff_messages', 'guard_messages',
    'message_reactions', 'chat_read_receipts', 'notification_preferences',
    'platform_settings', 'job_guard_slots', 'team_chat_threads', 'team_chat_messages',
    'user_legal_acceptances', 'guard_insurance_policies'
  ]
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_insert', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_update', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_delete', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Allow all access to ' || tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable read access for all users', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable insert access for all users', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable update access for all users', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable delete access for all users', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_threads_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_messages_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'job_chat_threads_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'job_chat_messages_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'staff_messages_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'guard_messages_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'message_reactions_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'chat_read_receipts_all', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'notification_preferences_all', tbl);

    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', tbl || '_select', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)', tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (true) WITH CHECK (true)', tbl || '_update', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (true)', tbl || '_delete', tbl);
  END LOOP;
END $$;

-- ── REALTIME (live sync without refresh) ────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'guards', 'staff', 'clients', 'certifications', 'experience', 'education',
    'security_requests', 'payments', 'guard_payout_invoices',
    'support_tickets', 'support_messages',
    'job_chat_threads', 'job_chat_messages', 'staff_messages', 'guard_messages', 'message_reactions',
    'user_legal_acceptances', 'guard_insurance_policies', 'team_chat_messages', 'job_guard_slots'
  ]
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

-- ── OPTIONAL: Founder and Director staff accounts ───────────────────────────────
INSERT INTO staff (
  id, name, email, badge_number, avatar, phone, bio,
  staff_role, user_status
) VALUES
  (
    'staff-director',
    'M. White',
    'm.white@signaturesecurityspecialist.com',
    'OWN-00001',
    '', '',
    'Founder — Platform governance.',
    'Founder', 'active'
  ),
  (
    'staff-director-tyrone',
    'Tyrone Johnson',
    't.johnson@signaturesecurityspecialist.com',
    'DIR-00002',
    '', '',
    'Director — Platform operations.',
    'Director', 'active'
  )
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  badge_number = EXCLUDED.badge_number,
  staff_role = EXCLUDED.staff_role,
  user_status = 'active';

INSERT INTO staff (
  id, name, first_name, middle_name, last_name, email, badge_number,
  avatar, phone, bio, staff_role, user_status, password, must_change_password,
  theme_preference, created_at, migrated_from_guards_at
)
SELECT
  g.id, g.name, g.first_name, g.middle_name, g.last_name,
  CASE
    WHEN g.email LIKE 'migrated-%@guardr.internal' THEN COALESCE(s_live.email, g.email)
    ELSE g.email
  END,
  g.badge_number,
  g.avatar, g.phone, g.bio,
  COALESCE(g.staff_role, s_live.staff_role, 'Moderator'),
  CASE WHEN g.user_status IN ('active', 'suspended', 'blocked') THEN g.user_status ELSE 'active' END,
  g.password, COALESCE(g.must_change_password, false), g.theme_preference, g.created_at, now()
FROM guards g
LEFT JOIN staff s_live ON s_live.id = g.id
WHERE g.is_staff = true OR g.migrated_to_staff_at IS NOT NULL
ON CONFLICT (id) DO NOTHING;

DELETE FROM guard_payout_invoices WHERE guard_id IN (SELECT id FROM staff);

DELETE FROM guards g
WHERE g.is_staff = true
   OR g.migrated_to_staff_at IS NOT NULL
   OR EXISTS (SELECT 1 FROM staff s WHERE s.id = g.id);

UPDATE guards g
SET user_status = 'approved'
WHERE NOT g.is_staff
  AND g.user_status = 'active'
  AND g.verified = true
  AND g.id_verification_status = 'verified'
  AND NOT EXISTS (
    SELECT 1
    FROM certifications c
    WHERE c.guard_id = g.id
      AND c.status = 'verified'
      AND (
        c.catalog_id = 'bsis-guard-card'
        OR c.name ILIKE '%guard card%'
        OR c.name ILIKE '%bsis guard%'
      )
  );

NOTIFY pgrst, 'reload schema';

-- ── VERIFY (read-only) ─────────────────────────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'certifications'
  AND column_name IN ('image_url', 'submitted_by_role', 'rejection_reason', 'catalog_id', 'category')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guards'
  AND column_name IN (
    'user_status', 'credential_grace_deadline', 'credential_grace_hours', 'credential_grace_missing',
    'id_submitted_by', 'id_verification_status', 'id_state', 'id_number', 'id_expiry_date'
  )
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'security_requests'
  AND column_name IN (
    'latitude', 'longitude', 'contact_name', 'contact_phone',
    'parking_instructions', 'access_instructions', 'operational_details',
    'platform_fee_paid_cash', 'cash_deposited_amount', 'cash_deposited_manually',
    'guard_payout_available', 'guard_payout_available_at',
    'scheduled_duration_hours', 'scheduled_estimated_payout',
    'overtime_hours', 'overtime_amount', 'overtime_payment_status', 'overtime_status',
    'overtime_guard_approved_at', 'overtime_client_approved_at',
    'overtime_dispute_reason', 'overtime_disputed_at', 'overtime_dispute_claimed_clock_out_at',
    'overtime_dispute_resolved_at',
    'overtime_dispute_resolution', 'overtime_original_hours', 'overtime_original_amount',
    'overtime_client_payment_method', 'overtime_client_cash_payment_requested',
    'overtime_guard_payout_available', 'overtime_guard_payout_available_at',
    'overtime_guard_payout_method',
    'break_minutes', 'shift_breaks',
    'check_in_audit', 'spot_checks', 'mid_shift_audits', 'check_out_audit',
    'pending_guard_id', 'staff_approved_guard_at',
    'team_lead_id', 'opened_at', 'team_code', 'crew_name', 'crew_description',
    'service_agreement', 'auto_payout_scheduled_at',
    'pending_start_date', 'pending_end_date', 'pending_duration_hours', 'pending_estimated_payout',
    'schedule_change_status', 'schedule_change_requested_at', 'schedule_change_requested_by',
    'schedule_change_extra_amount',
    'early_clock_out_actual_hours', 'early_clock_out_refund_amount', 'early_clock_out_refund_status'
  )
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
  AND column_name IN ('account_status', 'approved', 'password', 'must_change_password', 'first_name', 'last_name', 'trusted', 'favorite_guard_ids', 'business_type', 'service_description', 'service_city', 'service_state')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guards'
  AND column_name IN ('trusted')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'message_reactions'
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chat_read_receipts'
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'platform_settings'
  AND column_name IN ('payment_cash_enabled', 'payment_stripe_enabled', 'fee_config',
    'auto_stripe_payout_enabled', 'auto_stripe_payout_delay_hours', 'verified_guard_self_serve',
    'team_lead_bonus_per_guard_per_hour', 'team_lead_bonus_client_share_percent',
    'team_lead_bonus_platform_share_percent')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guard_insurance_policies'
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_legal_acceptances'
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notification_preferences'
  AND column_name IN (
    'job_submitted', 'guard_application', 'guard_pending_approval',
    'client_pending_approval', 'credential_pending', 'payment_attention',
    'support_ticket', 'support_ticket_status', 'dispute_update',
    'guard_clockout', 'guard_break_start', 'guard_break_end', 'reaction_notification',
    'guard_arrived', 'guard_left_site', 'job_open_to_guards'
  )
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'push_notification_dedup'
ORDER BY column_name;

SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'security_requests'
ORDER BY policyname;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
