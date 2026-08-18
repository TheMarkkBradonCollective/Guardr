-- Personal vs business client accounts (signup split).
ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_kind TEXT;

UPDATE clients
SET account_kind = 'business'
WHERE account_kind IS NULL OR account_kind NOT IN ('personal', 'business');

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_account_kind_check;
ALTER TABLE clients ADD CONSTRAINT clients_account_kind_check
  CHECK (account_kind IN ('personal', 'business'));

ALTER TABLE clients ALTER COLUMN account_kind SET DEFAULT 'business';
ALTER TABLE clients ALTER COLUMN account_kind SET NOT NULL;
