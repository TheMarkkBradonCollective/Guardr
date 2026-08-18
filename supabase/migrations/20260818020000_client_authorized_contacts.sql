-- Account-level people Guardr or assigned guards can contact.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS authorized_contacts JSONB NOT NULL DEFAULT '[]'::jsonb;
