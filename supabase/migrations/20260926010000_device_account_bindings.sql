-- One physical device → one Guardr account + one role app (Guard / Customer / Staff).
-- Messenger is not tracked here. Client upserts on sign-in / native app open.
CREATE TABLE IF NOT EXISTS device_account_bindings (
  device_id TEXT PRIMARY KEY,
  account_kind TEXT CHECK (account_kind IN ('guard', 'client', 'staff')),
  account_id TEXT,
  role_app_claim TEXT CHECK (role_app_claim IN ('guard', 'client', 'staff')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT device_account_bindings_account_pair CHECK (
    (account_kind IS NULL AND account_id IS NULL)
    OR (account_kind IS NOT NULL AND account_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_device_account_bindings_account
  ON device_account_bindings(account_kind, account_id);

COMMENT ON TABLE device_account_bindings IS
  'Binds a Guardr account and role app to a device id (web UUID or native Capacitor Device id).';
