-- Profile approved vs account active — guards: pending → approved → active

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_user_status_check;
ALTER TABLE guards
  ADD CONSTRAINT guards_user_status_check
  CHECK (user_status IN ('pending', 'approved', 'active', 'suspended', 'blocked'));
