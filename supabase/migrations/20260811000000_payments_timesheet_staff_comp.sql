-- Staff pay: Prop 22 adjustments, weekly period payout rows ($0 OK), smart time tracking.
-- Guards/client billing unchanged — run only staff compensation + time entry DDL here.
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- 1) Staff compensation config (revenue-share + hourly rates per role)
-- ---------------------------------------------------------------------------
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS staff_compensation_config JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "cadence": "weekly",
    "roleRules": {
      "Support": { "percentOfFees": 0.015, "floorPerPeriod": 0, "capPerPeriod": 400, "hourlyPayRate": 18 },
      "Moderator": { "percentOfFees": 0.02, "floorPerPeriod": 0, "capPerPeriod": 600, "hourlyPayRate": 20 },
      "Administrator": { "percentOfFees": 0.025, "floorPerPeriod": 0, "capPerPeriod": 800, "hourlyPayRate": 22 },
      "Manager": { "percentOfFees": 0.03, "floorPerPeriod": 0, "capPerPeriod": 1200, "hourlyPayRate": 28 },
      "Director": { "percentOfFees": 0.04, "floorPerPeriod": 0, "capPerPeriod": 2000, "hourlyPayRate": 35 },
      "Founder": { "percentOfFees": 0.05, "floorPerPeriod": 0, "capPerPeriod": 3000, "hourlyPayRate": 40 }
    }
  }'::jsonb;

COMMENT ON COLUMN platform_settings.staff_compensation_config IS
  'Staff revenue-share compensation — % of collected platform fees per role, caps/floors, cadence, hourlyPayRate for Prop 22 add-ons.';

-- ---------------------------------------------------------------------------
-- 2) Staff compensation payouts (weekly/monthly period rows — including $0)
--    One row per staff member per period (UNIQUE staff_id + period bounds).
--    payout_status: base_paid → awaiting Director adjustments → finalized
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_compensation_payouts (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT NOT NULL,
  staff_role TEXT NOT NULL CHECK (
    staff_role IN ('Founder', 'Owner', 'Director', 'Manager', 'Administrator', 'Moderator', 'Support')
  ),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  platform_fees_in_period NUMERIC(12, 2) NOT NULL DEFAULT 0,
  base_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  adjustment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  confirmed_by_id TEXT NOT NULL,
  confirmed_by_email TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  UNIQUE (staff_id, period_start, period_end)
);

-- Prop 22 add-only adjustment columns (hourly pay + manual bonus; no deductions)
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS hourly_hours NUMERIC(10, 2);
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS hourly_amount NUMERIC(12, 2);
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS manual_adjustment_amount NUMERIC(12, 2);
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS include_hourly_pay BOOLEAN;
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS payout_status TEXT
  CHECK (payout_status IS NULL OR payout_status IN ('base_paid', 'finalized'));
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS base_paid_at TIMESTAMPTZ;
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS adjustment_choice TEXT
  CHECK (adjustment_choice IS NULL OR adjustment_choice IN ('none', 'custom'));
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS adjustments_confirmed_at TIMESTAMPTZ;
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS adjustments_confirmed_by_id TEXT;
ALTER TABLE staff_compensation_payouts ADD COLUMN IF NOT EXISTS adjustments_confirmed_by_email TEXT;

CREATE INDEX IF NOT EXISTS idx_staff_comp_payouts_staff
  ON staff_compensation_payouts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_comp_payouts_period
  ON staff_compensation_payouts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_staff_comp_payouts_confirmed
  ON staff_compensation_payouts(confirmed_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_comp_payouts_status
  ON staff_compensation_payouts(payout_status)
  WHERE payout_status = 'base_paid';

COMMENT ON TABLE staff_compensation_payouts IS
  'Staff period payout ledger — instant revenue-share base (may be $0) plus Prop 22 add-only adjustments. Pack-pay can extend this table later.';

-- ---------------------------------------------------------------------------
-- 3) Staff time entries (automatic sessions + manager manual/adjusted rows)
--    Hours roll up into Payments adjustments via hourly_hours on payouts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_time_entries (
  id TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  clock_in_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ,
  clock_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'automatic' CHECK (source IN ('automatic', 'manual')),
  adjusted_by_id TEXT,
  adjusted_by_email TEXT,
  adjusted_at TIMESTAMPTZ,
  adjustment_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_staff_time_entries_staff
  ON staff_time_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_entries_clock_in
  ON staff_time_entries(clock_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_time_entries_open
  ON staff_time_entries(staff_id)
  WHERE clock_out_at IS NULL;

COMMENT ON TABLE staff_time_entries IS
  'Staff smart time tracking — automatic app sessions plus manager corrections (Profile → Timesheets).';

-- ---------------------------------------------------------------------------
-- 4) Row level security (staff-only; anon allowed for local/dev parity with app)
-- ---------------------------------------------------------------------------
ALTER TABLE staff_compensation_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_comp_payouts_all ON staff_compensation_payouts;
CREATE POLICY staff_comp_payouts_all ON staff_compensation_payouts FOR ALL
  USING (is_staff_user() OR NOT is_authenticated_user())
  WITH CHECK (is_staff_user() OR NOT is_authenticated_user());

DROP POLICY IF EXISTS staff_time_entries_all ON staff_time_entries;
CREATE POLICY staff_time_entries_all ON staff_time_entries FOR ALL
  USING (is_staff_user() OR NOT is_authenticated_user())
  WITH CHECK (is_staff_user() OR NOT is_authenticated_user());
