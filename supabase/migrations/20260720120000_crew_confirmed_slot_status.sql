-- Allow crew_confirmed slot status (internal confirmation before client sees full team)

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
