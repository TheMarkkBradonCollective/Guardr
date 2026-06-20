-- Add Owner as the top staff role above Director
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_staff_role_check;
ALTER TABLE guards ADD CONSTRAINT guards_staff_role_check
  CHECK (staff_role IS NULL OR staff_role IN ('Owner', 'Director', 'Administrator', 'Moderator'));
