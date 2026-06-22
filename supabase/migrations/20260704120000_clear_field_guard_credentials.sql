-- Wipe all field-guard credentials and reset approval/activation for a clean start.
-- Staff accounts (is_staff = true) are not changed.

-- 1) Delete every certification / license row for field guards
DELETE FROM certifications c
USING guards g
WHERE c.guard_id = g.id
  AND NOT g.is_staff;

-- 2) Reset account lifecycle — nobody approved or active; clear verification flags
UPDATE guards
SET
  user_status = CASE
    WHEN user_status IN ('approved', 'active') THEN 'pending'
    ELSE user_status
  END,
  verified = false,
  background_checked = false,
  credential_grace_deadline = NULL,
  credential_grace_missing = NULL
WHERE is_staff = false;

-- 3) Clear government ID so profile approval starts from zero
UPDATE guards
SET
  id_verification_status = 'not_submitted',
  id_state = NULL,
  id_number = NULL,
  id_expiry_date = NULL,
  id_front_url = NULL,
  id_back_url = NULL,
  id_selfie_url = NULL,
  id_verification_submitted_at = NULL,
  id_verification_reviewed_at = NULL,
  id_verification_rejection_reason = NULL,
  id_submitted_by = NULL
WHERE is_staff = false;
