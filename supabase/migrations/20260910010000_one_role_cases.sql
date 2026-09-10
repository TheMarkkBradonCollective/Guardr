-- One person, one Guardr role. Signing into two roles (Guard + Customer,
-- Customer + Staff, or Staff + Guard) opens a hold on both accounts until a
-- manager, director, administrator, or owner ignores it or blocks both.
CREATE TABLE IF NOT EXISTS one_role_cases (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ignored', 'blocked')),
  reason TEXT NOT NULL,
  match_kind TEXT NOT NULL CHECK (match_kind IN ('email', 'phone', 'device')),
  accounts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_one_role_cases_status
  ON one_role_cases(status);

COMMENT ON TABLE one_role_cases IS
  'Holds when the same person signs into more than one Guardr role. Both accounts stay locked until higher staff reviews.';
