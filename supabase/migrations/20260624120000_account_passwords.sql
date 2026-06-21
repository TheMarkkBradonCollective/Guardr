-- Account passwords for guard/client/staff sign-in (staff-provisioned default password)

ALTER TABLE guards
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
