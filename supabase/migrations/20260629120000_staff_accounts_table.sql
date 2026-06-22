-- Move platform staff out of guards into a dedicated staff table.
-- Preserves every staff row in guards (archived, not deleted) and copies live data to staff.

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  badge_number TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  staff_role TEXT NOT NULL
    CHECK (staff_role IN ('Owner', 'Director', 'Administrator', 'Moderator')),
  user_status TEXT NOT NULL DEFAULT 'active'
    CHECK (user_status IN ('active', 'suspended', 'blocked')),
  password TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  theme_preference TEXT CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  migrated_from_guards_at TIMESTAMPTZ
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select" ON staff;
DROP POLICY IF EXISTS "staff_insert" ON staff;
DROP POLICY IF EXISTS "staff_update" ON staff;
DROP POLICY IF EXISTS "staff_delete" ON staff;

CREATE POLICY "staff_select" ON staff FOR SELECT USING (true);
CREATE POLICY "staff_insert" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "staff_update" ON staff FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "staff_delete" ON staff FOR DELETE USING (true);

ALTER TABLE guards ADD COLUMN IF NOT EXISTS migrated_to_staff_at TIMESTAMPTZ;

-- Copy current staff accounts into staff (idempotent).
INSERT INTO staff (
  id,
  name,
  first_name,
  middle_name,
  last_name,
  email,
  badge_number,
  avatar,
  phone,
  bio,
  staff_role,
  user_status,
  password,
  must_change_password,
  theme_preference,
  created_at,
  migrated_from_guards_at
)
SELECT
  g.id,
  g.name,
  g.first_name,
  g.middle_name,
  g.last_name,
  g.email,
  g.badge_number,
  g.avatar,
  g.phone,
  g.bio,
  g.staff_role,
  CASE
    WHEN g.user_status IN ('active', 'suspended', 'blocked') THEN g.user_status
    ELSE 'active'
  END,
  g.password,
  COALESCE(g.must_change_password, false),
  g.theme_preference,
  g.created_at,
  timezone('utc'::text, now())
FROM guards g
WHERE g.is_staff = true
  AND g.staff_role IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  first_name = EXCLUDED.first_name,
  middle_name = EXCLUDED.middle_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  badge_number = EXCLUDED.badge_number,
  avatar = EXCLUDED.avatar,
  phone = EXCLUDED.phone,
  bio = EXCLUDED.bio,
  staff_role = EXCLUDED.staff_role,
  user_status = EXCLUDED.user_status,
  password = EXCLUDED.password,
  must_change_password = EXCLUDED.must_change_password,
  theme_preference = EXCLUDED.theme_preference,
  migrated_from_guards_at = COALESCE(staff.migrated_from_guards_at, EXCLUDED.migrated_from_guards_at);

-- Archive matching guards rows (keep row, free guards.email unique constraint).
UPDATE guards g
SET
  migrated_to_staff_at = COALESCE(g.migrated_to_staff_at, timezone('utc'::text, now())),
  is_staff = false,
  staff_role = NULL,
  email = CASE
    WHEN g.email LIKE 'migrated-%@guardr.internal' THEN g.email
    ELSE 'migrated-' || g.id || '@guardr.internal'
  END
WHERE g.is_staff = true
  AND EXISTS (SELECT 1 FROM staff s WHERE s.id = g.id);
