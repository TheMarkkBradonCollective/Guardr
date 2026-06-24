-- Staff-initiated schedule changes + billing gate before public update
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS schedule_change_requested_by TEXT,
  ADD COLUMN IF NOT EXISTS schedule_change_extra_amount NUMERIC;

COMMENT ON COLUMN security_requests.schedule_change_status IS 'none | pending_staff | pending_client | awaiting_payment | pending_staff_billing';
COMMENT ON COLUMN security_requests.schedule_change_requested_by IS 'client | staff — who proposed the pending schedule change';
