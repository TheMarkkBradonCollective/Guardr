-- Guardr Platform v2 extensions — auth hardening, audit, availability, compliance, invoicing, RLS
-- Run after complete_schema_setup.sql (idempotent)

-- ── AUTH LINKING ─────────────────────────────────────────────────────────────
ALTER TABLE guards ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_guards_auth_user_id ON guards(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON staff(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ── PLATFORM SETTINGS EXTENSIONS ───────────────────────────────────────────────
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS owner_message TEXT;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS owner_message_updated_at TIMESTAMPTZ;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS director_message TEXT;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS director_message_updated_at TIMESTAMPTZ;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS job_review_mode TEXT NOT NULL DEFAULT 'staff-all';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS trusted_client_auto_publish BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS background_check_provider TEXT DEFAULT 'manual';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS insurance_verification_mode TEXT NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN platform_settings.job_review_mode IS 'staff-all | trusted-auto | none';
COMMENT ON COLUMN platform_settings.trusted_client_auto_publish IS 'When true, trusted clients skip job review when coords are ready';

-- ── AUDIT LOG ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ── GUARD AVAILABILITY ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guard_availability (
  id TEXT PRIMARY KEY,
  guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guard_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_guard_availability_guard_id ON guard_availability(guard_id);

-- ── RECURRING SHIFT TEMPLATES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_shift_templates (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  site_name TEXT,
  address TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  recurrence_rule TEXT NOT NULL DEFAULT 'weekly',
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 35,
  guards_needed INTEGER NOT NULL DEFAULT 1,
  uniform_requirements TEXT,
  equipment_requirements TEXT,
  site_instructions TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_shifts_client ON recurring_shift_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_shifts_active ON recurring_shift_templates(active) WHERE active = TRUE;

-- ── COMPLIANCE ALERTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id TEXT PRIMARY KEY,
  guard_id TEXT REFERENCES guards(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_guard ON compliance_alerts(guard_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_unacked ON compliance_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;

-- ── CLIENT INVOICES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_invoices (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES security_requests(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'void')),
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_invoices_client ON client_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_request ON client_invoices(request_id);

-- ── ONBOARDING TOUR PROGRESS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_tour_progress (
  user_id TEXT NOT NULL,
  tour_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  step_index INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, tour_id)
);

-- ── RLS HELPER FUNCTIONS ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auth_guard_id() RETURNS TEXT
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM guards WHERE auth_user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.auth_client_id() RETURNS TEXT
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM clients WHERE auth_user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.auth_staff_id() RETURNS TEXT
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM staff WHERE auth_user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.is_staff_user() RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT auth_staff_id() IS NOT NULL; $$;

CREATE OR REPLACE FUNCTION public.is_authenticated_user() RETURNS BOOLEAN
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT auth.uid() IS NOT NULL; $$;

-- ── ROW LEVEL SECURITY (role-based) ────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tour_progress ENABLE ROW LEVEL SECURITY;

-- Audit log: staff read; authenticated users insert own actions
DROP POLICY IF EXISTS audit_log_select ON audit_log;
CREATE POLICY audit_log_select ON audit_log FOR SELECT
  USING (is_staff_user() OR actor_id IN (auth_guard_id(), auth_client_id(), auth_staff_id()));

DROP POLICY IF EXISTS audit_log_insert ON audit_log;
CREATE POLICY audit_log_insert ON audit_log FOR INSERT
  WITH CHECK (is_authenticated_user() OR true);

-- Guard availability: guard owns rows; staff can read all
DROP POLICY IF EXISTS guard_availability_select ON guard_availability;
CREATE POLICY guard_availability_select ON guard_availability FOR SELECT
  USING (guard_id = auth_guard_id() OR is_staff_user() OR NOT is_authenticated_user());

DROP POLICY IF EXISTS guard_availability_write ON guard_availability;
CREATE POLICY guard_availability_write ON guard_availability FOR ALL
  USING (guard_id = auth_guard_id() OR is_staff_user() OR NOT is_authenticated_user())
  WITH CHECK (guard_id = auth_guard_id() OR is_staff_user() OR NOT is_authenticated_user());

-- Recurring shifts: client owns; staff reads all
DROP POLICY IF EXISTS recurring_shifts_select ON recurring_shift_templates;
CREATE POLICY recurring_shifts_select ON recurring_shift_templates FOR SELECT
  USING (client_id = auth_client_id() OR is_staff_user() OR NOT is_authenticated_user());

DROP POLICY IF EXISTS recurring_shifts_write ON recurring_shift_templates;
CREATE POLICY recurring_shifts_write ON recurring_shift_templates FOR ALL
  USING (client_id = auth_client_id() OR is_staff_user() OR NOT is_authenticated_user())
  WITH CHECK (client_id = auth_client_id() OR is_staff_user() OR NOT is_authenticated_user());

-- Compliance alerts: subject user or staff
DROP POLICY IF EXISTS compliance_alerts_select ON compliance_alerts;
CREATE POLICY compliance_alerts_select ON compliance_alerts FOR SELECT
  USING (
    guard_id = auth_guard_id() OR client_id = auth_client_id() OR is_staff_user() OR NOT is_authenticated_user()
  );

DROP POLICY IF EXISTS compliance_alerts_write ON compliance_alerts;
CREATE POLICY compliance_alerts_write ON compliance_alerts FOR ALL
  USING (is_staff_user() OR NOT is_authenticated_user())
  WITH CHECK (is_staff_user() OR NOT is_authenticated_user());

-- Client invoices: client owns; staff reads all
DROP POLICY IF EXISTS client_invoices_select ON client_invoices;
CREATE POLICY client_invoices_select ON client_invoices FOR SELECT
  USING (client_id = auth_client_id() OR is_staff_user() OR NOT is_authenticated_user());

DROP POLICY IF EXISTS client_invoices_write ON client_invoices;
CREATE POLICY client_invoices_write ON client_invoices FOR ALL
  USING (is_staff_user() OR client_id = auth_client_id() OR NOT is_authenticated_user())
  WITH CHECK (is_staff_user() OR client_id = auth_client_id() OR NOT is_authenticated_user());

-- Onboarding progress: own rows only
DROP POLICY IF EXISTS onboarding_progress_all ON onboarding_tour_progress;
CREATE POLICY onboarding_progress_all ON onboarding_tour_progress FOR ALL
  USING (
    user_id IN (auth_guard_id(), auth_client_id(), auth_staff_id()) OR NOT is_authenticated_user()
  )
  WITH CHECK (
    user_id IN (auth_guard_id(), auth_client_id(), auth_staff_id()) OR NOT is_authenticated_user()
  );

-- Realtime for new tables
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'audit_log', 'guard_availability', 'recurring_shift_templates',
    'compliance_alerts', 'client_invoices'
  ]
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      EXCEPTION WHEN duplicate_object THEN NULL;
        WHEN OTHERS THEN
          IF SQLERRM NOT LIKE '%already member of publication%' THEN RAISE; END IF;
      END;
    END IF;
  END LOOP;
END $$;
