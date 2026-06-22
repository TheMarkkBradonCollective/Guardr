-- Reset all field guards to unapproved / inactive for end-to-end verification testing.
-- Keeps uploaded ID photos and credential documents — staff re-reviews from scratch.
-- Staff accounts (is_staff = true) and the staff table are not changed.

-- 1) Account lifecycle — pending, not verified, no grace
UPDATE guards
SET
  user_status = 'pending',
  verified = false,
  background_checked = false,
  credential_grace_deadline = NULL,
  credential_grace_missing = NULL
WHERE is_staff = false;

-- 2) ID verification — re-queue when photos exist; clear staff review outcome
UPDATE guards
SET
  id_verification_status = CASE
    WHEN id_front_url IS NOT NULL
      AND id_back_url IS NOT NULL
      AND id_selfie_url IS NOT NULL
      THEN 'pending'
    ELSE 'not_submitted'
  END,
  id_verification_reviewed_at = NULL,
  id_verification_rejection_reason = NULL
WHERE is_staff = false;

-- 3) Credentials — unverify everything so staff must re-approve
UPDATE certifications c
SET
  status = 'pending',
  rejection_reason = NULL
FROM guards g
WHERE c.guard_id = g.id
  AND NOT g.is_staff
  AND c.status = 'verified';
