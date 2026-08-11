-- Finance side role: optional payment-desk specialty.
-- Ladder staff_role may be NULL when side_role = 'Finance' (stagnant / finance-only seat).

ALTER TABLE staff ADD COLUMN IF NOT EXISTS side_role TEXT;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS side_role TEXT;

COMMENT ON COLUMN staff.side_role IS 'Optional specialty seat — Finance grants payment-only tools; may be used with a null/stagnant staff_role.';
COMMENT ON COLUMN guards.side_role IS 'Optional specialty seat mirrored from staff — Finance payment desk.';

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_side_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_side_role_check
  CHECK (side_role IS NULL OR side_role IN ('Finance'));

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_side_role_check;
ALTER TABLE guards ADD CONSTRAINT guards_side_role_check
  CHECK (side_role IS NULL OR side_role IN ('Finance'));

-- Allow null ladder role on staff (finance-only / stagnant seats).
ALTER TABLE staff ALTER COLUMN staff_role DROP NOT NULL;

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_staff_role_check
  CHECK (staff_role IS NULL OR staff_role IN ('Founder', 'Owner', 'Director', 'Manager', 'Administrator', 'Moderator', 'Support'));

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_or_side_role_present;
ALTER TABLE staff ADD CONSTRAINT staff_role_or_side_role_present
  CHECK (staff_role IS NOT NULL OR side_role IS NOT NULL);

ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_staff_role_check;
ALTER TABLE guards ADD CONSTRAINT guards_staff_role_check
  CHECK (staff_role IS NULL OR staff_role IN ('Founder', 'Owner', 'Director', 'Manager', 'Administrator', 'Moderator', 'Support'));
