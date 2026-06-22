-- Account approval: pending sign-ups, staff approval, and guard pending user_status.

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_user_status_check;
ALTER TABLE guards
  ADD CONSTRAINT guards_user_status_check
  CHECK (user_status IN ('pending', 'active', 'suspended', 'blocked'));

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_account_status_check;
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS account_status TEXT;

UPDATE clients
SET account_status = CASE
  WHEN approved = FALSE THEN 'suspended'
  ELSE 'active'
END
WHERE account_status IS NULL;

ALTER TABLE clients
  ALTER COLUMN account_status SET DEFAULT 'pending';

UPDATE clients SET account_status = 'active' WHERE account_status IS NULL;

ALTER TABLE clients
  ALTER COLUMN account_status SET NOT NULL;

ALTER TABLE clients
  ADD CONSTRAINT clients_account_status_check
  CHECK (account_status IN ('pending', 'active', 'suspended'));
