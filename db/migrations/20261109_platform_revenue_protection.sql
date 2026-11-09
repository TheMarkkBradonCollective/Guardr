-- Guardr: additive platform billing and revenue-protection schema
-- Date: 2026-11-09
-- Target: Neon PostgreSQL (direct/unpooled connection)
--
-- SAFETY:
--   * Additive only: no existing rows are deleted or repriced.
--   * Existing platform_settings.fee_config and job-level rates remain authoritative.
--   * New fee configurations are disabled by default and are not activated here.
--   * No cancellation, no-show, processor surcharge, circumvention, or penalty fees
--     are created or enabled by this migration.
--   * Historical jobs are NOT backfilled with newly invented billing snapshots.
--   * Financial ledger rows are append-only; corrections must be posted as reversals.
--
-- Apply through the Guardr Neon migration process using a DIRECT (unpooled)
-- Neon connection. Take a Neon branch/backup first. Do not run against Supabase.

BEGIN;

-- 1) Freeze a job's billing terms without rewriting legacy job fields.
ALTER TABLE public.security_requests
  ADD COLUMN IF NOT EXISTS billing_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS billing_snapshot_version INTEGER,
  ADD COLUMN IF NOT EXISTS billing_snapshot_captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS booking_origin TEXT NOT NULL DEFAULT 'marketplace',
  ADD COLUMN IF NOT EXISTS origin_job_id TEXT,
  ADD COLUMN IF NOT EXISTS origin_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'security_requests_booking_origin_check'
      AND conrelid = 'public.security_requests'::regclass
  ) THEN
    ALTER TABLE public.security_requests
      ADD CONSTRAINT security_requests_booking_origin_check
      CHECK (booking_origin IN ('marketplace', 'repeat_booking', 'external', 'manual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'security_requests_origin_job_id_fkey'
      AND conrelid = 'public.security_requests'::regclass
  ) THEN
    ALTER TABLE public.security_requests
      ADD CONSTRAINT security_requests_origin_job_id_fkey
      FOREIGN KEY (origin_job_id)
      REFERENCES public.security_requests(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_security_requests_origin_job_id
  ON public.security_requests(origin_job_id)
  WHERE origin_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_requests_booking_origin
  ON public.security_requests(booking_origin, created_at DESC);

COMMENT ON COLUMN public.security_requests.billing_snapshot IS
  'Immutable accepted billing snapshot for this booking. Existing jobs remain NULL until a valid snapshot is captured; never backfill from live fee settings.';
COMMENT ON COLUMN public.security_requests.booking_origin IS
  'Origin label for booking lineage. Repeat-booking matches are review signals only, never proof of circumvention.';
COMMENT ON COLUMN public.security_requests.origin_job_id IS
  'Optional source job for a user-initiated continuation/rebooking; does not itself create a fee or remedy.';

-- 2) Versioned fee configurations. All new fee types remain disabled until
-- separately approved and accepted; this table does not change current pricing.
CREATE TABLE IF NOT EXISTS public.platform_fee_configs (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('default', 'personal', 'business', 'guard_type', 'agreement')),
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'active', 'retired', 'rejected')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  fee_config JSONB NOT NULL,
  effective_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_reason TEXT,
  UNIQUE (scope, version)
);

CREATE INDEX IF NOT EXISTS idx_platform_fee_configs_status_effective
  ON public.platform_fee_configs(status, effective_at);

COMMENT ON TABLE public.platform_fee_configs IS
  'Versioned future fee configurations. Rows are disabled/draft by default; this table does not override platform_settings or accepted job snapshots.';

-- 3) Exact fee disclosure/acceptance record, linked to the job and client.
CREATE TABLE IF NOT EXISTS public.platform_fee_acceptances (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES public.security_requests(id) ON DELETE RESTRICT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  fee_config_id TEXT NOT NULL REFERENCES public.platform_fee_configs(id) ON DELETE RESTRICT,
  fee_config_version TEXT NOT NULL,
  disclosed_fee_snapshot JSONB NOT NULL,
  disclosure_version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  accepted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_fee_acceptance_requires_timestamp
    CHECK ((accepted = FALSE AND accepted_at IS NULL) OR (accepted = TRUE AND accepted_at IS NOT NULL)),
  UNIQUE (job_id, fee_config_id, fee_config_version)
);

CREATE INDEX IF NOT EXISTS idx_platform_fee_acceptances_client
  ON public.platform_fee_acceptances(client_id, accepted_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_fee_acceptances_job
  ON public.platform_fee_acceptances(job_id);

COMMENT ON TABLE public.platform_fee_acceptances IS
  'Evidence of exact fee-version disclosure and acceptance. A fee is not chargeable merely because a config row exists.';

-- 4) Append-only versioned billing snapshots and amendments.
CREATE TABLE IF NOT EXISTS public.billing_snapshots (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES public.security_requests(id) ON DELETE RESTRICT,
  snapshot_version INTEGER NOT NULL CHECK (snapshot_version > 0),
  snapshot JSONB NOT NULL,
  captured_by TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supersedes_snapshot_id TEXT REFERENCES public.billing_snapshots(id) ON DELETE RESTRICT,
  UNIQUE (job_id, snapshot_version)
);

CREATE INDEX IF NOT EXISTS idx_billing_snapshots_job
  ON public.billing_snapshots(job_id, snapshot_version DESC);

CREATE TABLE IF NOT EXISTS public.billing_adjustments (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES public.security_requests(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('extension', 'overtime', 'guard_count_change', 'refund', 'correction', 'reversal')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount <> 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'pending_acceptance', 'accepted', 'disputed', 'posted', 'voided')),
  before_snapshot JSONB,
  after_snapshot JSONB,
  client_accepted_by TEXT,
  client_accepted_at TIMESTAMPTZ,
  guard_accepted_by TEXT,
  guard_accepted_at TIMESTAMPTZ,
  reverses_adjustment_id TEXT REFERENCES public.billing_adjustments(id) ON DELETE RESTRICT,
  idempotency_key TEXT UNIQUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_adjustments_job
  ON public.billing_adjustments(job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_adjustments_status
  ON public.billing_adjustments(status, created_at DESC);

COMMENT ON TABLE public.billing_adjustments IS
  'Append-only proposed/accepted/posted amendments. Unaccepted or disputed amounts must not be collected or paid out.';

-- 5) Persistent Stripe webhook idempotency and processing state.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL DEFAULT FALSE,
  event_created_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  payload JSONB,
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status_received
  ON public.stripe_webhook_events(processing_status, received_at);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type_received
  ON public.stripe_webhook_events(event_type, received_at DESC);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Persistent Stripe event inbox. Insert event_id with ON CONFLICT DO NOTHING before side effects; only the winning insert may process the event.';

-- 6) Double-entry-style financial activity ledger. Amounts are integer minor units.
CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES public.security_requests(id) ON DELETE RESTRICT,
  payment_id TEXT REFERENCES public.payments(id) ON DELETE RESTRICT,
  guard_id TEXT REFERENCES public.guards(id) ON DELETE RESTRICT,
  client_id TEXT REFERENCES public.clients(id) ON DELETE RESTRICT,
  stripe_event_id TEXT REFERENCES public.stripe_webhook_events(event_id) ON DELETE RESTRICT,
  stripe_object_id TEXT,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'client_charge', 'platform_fee', 'guard_allocation', 'processor_cost',
    'staff_share', 'adjustment', 'refund', 'reversal', 'payout', 'tax', 'pass_through'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  idempotency_key TEXT NOT NULL UNIQUE,
  related_entry_id TEXT REFERENCES public.financial_ledger_entries(id) ON DELETE RESTRICT,
  fee_snapshot_id TEXT REFERENCES public.billing_snapshots(id) ON DELETE RESTRICT,
  adjustment_id TEXT REFERENCES public.billing_adjustments(id) ON DELETE RESTRICT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_job_created
  ON public.financial_ledger_entries(job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_type_created
  ON public.financial_ledger_entries(entry_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_stripe_object
  ON public.financial_ledger_entries(stripe_object_id)
  WHERE stripe_object_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_ledger_client_created
  ON public.financial_ledger_entries(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_guard_created
  ON public.financial_ledger_entries(guard_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.guardr_reject_ledger_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'financial_ledger_entries is append-only; post a reversal or correcting entry instead';
END;
$$;

DROP TRIGGER IF EXISTS financial_ledger_entries_append_only ON public.financial_ledger_entries;
CREATE TRIGGER financial_ledger_entries_append_only
  BEFORE UPDATE OR DELETE ON public.financial_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.guardr_reject_ledger_mutation();

COMMENT ON TABLE public.financial_ledger_entries IS
  'Append-only financial ledger. Never update/delete settled entries; add a linked reversal/correction entry. Processor costs, taxes and pass-throughs are distinct from platform revenue.';

-- 7) Repeat-booking review queue. Matching is not proof and never triggers a charge.
CREATE TABLE IF NOT EXISTS public.billing_repeat_booking_reviews (
  id TEXT PRIMARY KEY,
  original_job_id TEXT NOT NULL REFERENCES public.security_requests(id) ON DELETE RESTRICT,
  candidate_job_id TEXT NOT NULL REFERENCES public.security_requests(id) ON DELETE RESTRICT,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('user_linked_origin', 'shared_reference', 'manual_referral', 'other')),
  status TEXT NOT NULL DEFAULT 'needs_review'
    CHECK (status IN ('needs_review', 'under_review', 'cleared', 'confirmed_origin', 'appealed', 'closed')),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewer_id TEXT,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  appeal_notes TEXT,
  appealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_repeat_booking_distinct_jobs CHECK (original_job_id <> candidate_job_id),
  UNIQUE (original_job_id, candidate_job_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_repeat_reviews_status
  ON public.billing_repeat_booking_reviews(status, created_at DESC);

-- 8) Founder/finance audit trail for sensitive billing configuration actions.
CREATE TABLE IF NOT EXISTS public.billing_admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  old_values JSONB,
  new_values JSONB,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_admin_audit_created
  ON public.billing_admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_admin_audit_actor
  ON public.billing_admin_audit_log(actor_id, created_at DESC);

-- 9) New billing tables are server-side only by default. No permissive browser
-- policies are added. Existing service/server database access remains responsible
-- for authenticated authorization until the application integration is deployed.
ALTER TABLE public.platform_fee_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fee_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_repeat_booking_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_admin_audit_log ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Post-apply verification (run separately in Neon SQL Editor):
-- SELECT to_regclass('public.stripe_webhook_events') AS stripe_webhook_events,
--        to_regclass('public.financial_ledger_entries') AS financial_ledger_entries,
--        to_regclass('public.billing_snapshots') AS billing_snapshots,
--        to_regclass('public.platform_fee_configs') AS platform_fee_configs;
-- SELECT COUNT(*) FROM public.security_requests;
-- Confirm no existing booking was repriced and platform_fee_configs has no enabled rows.
