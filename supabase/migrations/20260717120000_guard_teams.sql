-- Multi-guard team slots, invite workflow, team-lead bonus settings, job opened_at

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS team_lead_id TEXT REFERENCES guards(id) ON DELETE SET NULL;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

UPDATE security_requests
SET opened_at = COALESCE(opened_at, created_at)
WHERE status = 'open' AND opened_at IS NULL;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS team_lead_bonus_per_guard_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 1.00;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS team_lead_bonus_client_share_percent INTEGER NOT NULL DEFAULT 50;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS team_lead_bonus_platform_share_percent INTEGER NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS job_guard_slots (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES security_requests(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 1),
  guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
  is_lead BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN (
      'open',
      'invited',
      'pending_staff',
      'pending_client',
      'approved',
      'declined',
      'expired',
      'withdrawn'
    )
  ),
  invited_by_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  invite_expires_at TIMESTAMPTZ,
  staff_approved_at TIMESTAMPTZ,
  client_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_job_guard_slots_job_id ON job_guard_slots(job_id);
CREATE INDEX IF NOT EXISTS idx_job_guard_slots_guard_id ON job_guard_slots(guard_id);
CREATE INDEX IF NOT EXISTS idx_job_guard_slots_status ON job_guard_slots(status);
