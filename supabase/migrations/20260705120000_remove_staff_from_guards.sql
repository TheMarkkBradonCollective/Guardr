-- Staff live only in the staff table. Remove every staff row from guards (not archived shells).

-- 1) Copy any remaining staff accounts from guards into staff (idempotent).
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
  CASE
    WHEN g.email LIKE 'migrated-%@guardr.internal' THEN COALESCE(s_live.email, g.email)
    ELSE g.email
  END,
  g.badge_number,
  g.avatar,
  g.phone,
  g.bio,
  COALESCE(g.staff_role, s_live.staff_role, 'Moderator'),
  CASE
    WHEN g.user_status IN ('active', 'suspended', 'blocked') THEN g.user_status
    WHEN s_live.user_status IN ('active', 'suspended', 'blocked') THEN s_live.user_status
    ELSE 'active'
  END,
  COALESCE(g.password, s_live.password),
  COALESCE(g.must_change_password, s_live.must_change_password, false),
  COALESCE(g.theme_preference, s_live.theme_preference),
  g.created_at,
  COALESCE(g.migrated_to_staff_at, s_live.migrated_from_guards_at, timezone('utc'::text, now()))
FROM guards g
LEFT JOIN staff s_live ON s_live.id = g.id
WHERE g.is_staff = true OR g.migrated_to_staff_at IS NOT NULL
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
  password = COALESCE(EXCLUDED.password, staff.password),
  must_change_password = EXCLUDED.must_change_password,
  theme_preference = COALESCE(EXCLUDED.theme_preference, staff.theme_preference),
  migrated_from_guards_at = COALESCE(staff.migrated_from_guards_at, EXCLUDED.migrated_from_guards_at);

-- 2) Drop guard-only child rows for staff ids (payout invoices have no FK cascade).
DELETE FROM guard_payout_invoices
WHERE guard_id IN (SELECT id FROM staff);

-- 3) Remove staff rows from guards. Cascades certifications / experience / education.
DELETE FROM guards g
WHERE g.is_staff = true
   OR g.migrated_to_staff_at IS NOT NULL
   OR EXISTS (SELECT 1 FROM staff s WHERE s.id = g.id);
