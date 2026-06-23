-- =============================================================================
-- Guardr — FIX EVERYTHING (run once in Supabase SQL Editor)
-- Idempotent: safe to re-run. Does NOT delete your data.
-- Adds all missing tables, columns, constraints, RLS policies, and realtime.
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
  staff_role TEXT CHECK (staff_role IS NULL OR staff_role IN ('Owner', 'Director', 'Administrator', 'Moderator')),
  user_status TEXT NOT NULL DEFAULT 'pending' CHECK (user_status IN ('pending', 'active', 'suspended', 'blocked')),
  failed_audits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE guards ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS availability_notes TEXT DEFAULT '';
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
ALTER TABLE guards ADD COLUMN IF NOT EXISTS credential_grace_missing JSONB;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_submitted_by TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS migrated_to_staff_at TIMESTAMPTZ;

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
    CHECK (staff_role IN ('Owner', 'Director', 'Administrator', 'Moderator')),
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

UPDATE clients SET approved = TRUE WHERE approved IS NULL;
UPDATE clients
SET account_status = CASE
  WHEN approved = FALSE THEN 'suspended'
  ELSE 'active'
END
WHERE account_status IS NULL;
ALTER TABLE clients ALTER COLUMN account_status SET DEFAULT 'pending';
UPDATE clients SET account_status = 'active' WHERE account_status IS NULL;

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_account_status_check;
ALTER TABLE clients ADD CONSTRAINT clients_account_status_check
  CHECK (account_status IN ('pending', 'active', 'suspended'));

-- ── CERTIFICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'pending', 'rejected')),
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE certifications ADD COLUMN IF NOT EXISTS catalog_id TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS submitted_by_role TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS id_submitted_by TEXT;

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

-- Columns added after initial deploy (common reason inserts fail)
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
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS platform_fee_paid_cash BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_cash_payout_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_cash_payout_requested_at TIMESTAMPTZ;
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

-- Backfill nulls so NOT NULL constraints can apply
UPDATE security_requests SET cash_deposited_to_stripe = FALSE WHERE cash_deposited_to_stripe IS NULL;
UPDATE security_requests SET cash_deposited_amount = estimated_payout
  WHERE cash_deposited_to_stripe = TRUE AND cash_deposited_amount = 0;
UPDATE security_requests SET site_name = '' WHERE site_name IS NULL;
UPDATE security_requests SET address = '' WHERE address IS NULL;
UPDATE security_requests SET state = '' WHERE state IS NULL;
UPDATE security_requests SET guards_needed = 1 WHERE guards_needed IS NULL;
UPDATE security_requests SET uniform_requirements = '' WHERE uniform_requirements IS NULL;
UPDATE security_requests SET equipment_requirements = '' WHERE equipment_requirements IS NULL;
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

-- Legacy status values → current app values
UPDATE security_requests SET status = 'accepted' WHERE status = 'assigned';
UPDATE security_requests SET status = 'closed' WHERE status = 'cancelled';
UPDATE security_requests SET status = 'open' WHERE status NOT IN (
  'draft', 'pending-review', 'open', 'accepted', 'in-progress', 'completed', 'closed'
);

-- Refresh check constraints
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

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'cash'));

-- Rename legacy column if present
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

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,
  assignment BOOLEAN NOT NULL DEFAULT true,
  guard_checkin BOOLEAN NOT NULL DEFAULT true,
  missed_checkin BOOLEAN NOT NULL DEFAULT true,
  emergency_alert BOOLEAN NOT NULL DEFAULT true,
  support_message BOOLEAN NOT NULL DEFAULT true,
  job_chat_message BOOLEAN NOT NULL DEFAULT true,
  staff_message BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS job_chat_threads_request_id_idx ON job_chat_threads(request_id);
CREATE INDEX IF NOT EXISTS job_chat_threads_status_idx ON job_chat_threads(status);
CREATE INDEX IF NOT EXISTS job_chat_messages_thread_id_idx ON job_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS staff_messages_created_at_idx ON staff_messages(created_at);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_guards_email ON guards(email);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_certifications_guard_id ON certifications(guard_id);
CREATE INDEX IF NOT EXISTS idx_certifications_catalog_id ON certifications(catalog_id);
CREATE INDEX IF NOT EXISTS idx_experience_guard_id ON experience(guard_id);
CREATE INDEX IF NOT EXISTS idx_education_guard_id ON education(guard_id);
CREATE INDEX IF NOT EXISTS idx_security_requests_client_id ON security_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_security_requests_status ON security_requests(status);
CREATE INDEX IF NOT EXISTS idx_security_requests_assigned_guard ON security_requests(assigned_guard_id);
CREATE INDEX IF NOT EXISTS idx_security_requests_request_type ON security_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_security_requests_target_guard ON security_requests(target_guard_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
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
ALTER TABLE job_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'guards', 'staff', 'clients', 'certifications', 'experience', 'education',
    'security_requests', 'payments', 'guard_payout_invoices',
    'support_tickets', 'support_messages', 'push_subscriptions',
    'job_chat_threads', 'job_chat_messages', 'staff_messages', 'notification_preferences'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_insert', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_update', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_delete', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Allow all access to ' || tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable read access for all users', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable insert access for all users', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable update access for all users', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'Enable delete access for all users', tbl);

    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', tbl || '_select', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)', tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (true) WITH CHECK (true)', tbl || '_update', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (true)', tbl || '_delete', tbl);
  END LOOP;
END $$;

-- ── REALTIME (live sync without refresh) ────────────────────────────────────
-- Skips tables that are not deployed yet (safe on partial / older databases).
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'guards', 'staff', 'clients', 'certifications', 'experience', 'education',
    'security_requests', 'payments', 'guard_payout_invoices',
    'support_tickets', 'support_messages',
    'job_chat_threads', 'job_chat_messages', 'staff_messages'
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

-- ── OPTIONAL: Owner and Director staff accounts ───────────────────────────────
-- Passwords are checked in the app (AuthPage.tsx), not stored in the database.
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
    'Owner — Platform governance.',
    'Owner', 'active'
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

-- Migrate any legacy staff rows still on guards into staff, then remove them from guards.
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

-- Legacy data: guards marked active before approved→active split
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

-- Refresh PostgREST schema cache (required after adding columns)
NOTIFY pgrst, 'reload schema';

-- ── VERIFY (read-only) ─────────────────────────────────────────────────────
-- 1) Credential columns the app writes (missing = photo / save failures)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'certifications'
  AND column_name IN ('image_url', 'submitted_by_role', 'rejection_reason', 'catalog_id', 'category')
ORDER BY column_name;

-- 2) Guard approval / grace columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'guards'
  AND column_name IN (
    'user_status', 'credential_grace_deadline', 'credential_grace_missing',
    'id_submitted_by', 'id_verification_status', 'id_state', 'id_number', 'id_expiry_date'
  )
ORDER BY column_name;

-- 3) Columns the app writes when editing jobs (missing columns = silent save failures)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'security_requests'
  AND column_name IN (
    'latitude', 'longitude', 'contact_name', 'contact_phone',
    'parking_instructions', 'access_instructions',
    'platform_fee_paid_cash', 'cash_deposited_amount',
    'check_in_audit', 'spot_checks', 'mid_shift_audits', 'check_out_audit'
  )
ORDER BY column_name;

-- 4) RLS policies on security_requests (need UPDATE policy or edits fail)
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'security_requests'
ORDER BY policyname;

-- 5) All public tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
