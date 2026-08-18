-- Who is hiring/paying: personal (individual) vs business (organization).
-- Rename a draft account_kind column if an earlier revision of this branch applied it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'account_kind'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'client_type'
  ) THEN
    ALTER TABLE clients RENAME COLUMN account_kind TO client_type;
  END IF;
END $$;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type TEXT;

UPDATE clients
SET client_type = 'business'
WHERE client_type IS NULL OR client_type NOT IN ('personal', 'business');

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_account_kind_check;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_client_type_check;
ALTER TABLE clients ADD CONSTRAINT clients_client_type_check
  CHECK (client_type IN ('personal', 'business'));

ALTER TABLE clients ALTER COLUMN client_type SET DEFAULT 'business';
ALTER TABLE clients ALTER COLUMN client_type SET NOT NULL;
