-- Client-configured break allowance and guard break event log per shift
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS break_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shift_breaks JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN security_requests.break_minutes IS 'Total unpaid break minutes the client allows during the shift';
COMMENT ON COLUMN security_requests.shift_breaks IS 'Guard break sessions: [{ id, startedAt, endedAt? }]';
