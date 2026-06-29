-- Rename top staff role from Owner to Founder (legacy Owner rows remain valid).
ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_staff_role_check;
ALTER TABLE guards ADD CONSTRAINT guards_staff_role_check
  CHECK (staff_role IS NULL OR staff_role IN ('Founder', 'Owner', 'Director', 'Administrator', 'Moderator'));

ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_staff_role_check
  CHECK (staff_role IN ('Founder', 'Owner', 'Director', 'Administrator', 'Moderator'));

UPDATE guards
SET staff_role = 'Founder',
    bio = 'Founder — Platform governance.'
WHERE staff_role = 'Owner';

UPDATE staff
SET staff_role = 'Founder',
    bio = 'Founder — Platform governance.'
WHERE staff_role = 'Owner';
