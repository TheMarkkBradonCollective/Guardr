-- Reverses 20260627200000_grandfather_guard_accounts.sql if it was applied.
-- Field guards must go through ID + Guard Card verification and staff activation again.
-- Staff accounts (is_staff = true) are not changed.

-- 1) Pending accounts — undo bulk activation
UPDATE guards
SET user_status = 'pending'
WHERE is_staff = false
  AND user_status = 'active';

-- 2) Undo bulk ID verification (keep uploaded photos; staff re-reviews)
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
WHERE is_staff = false
  AND id_verification_status = 'verified';

-- 3) Undo auto-verified BSIS Guard Cards from grandfather migration
UPDATE certifications c
SET status = 'pending'
FROM guards g
WHERE c.guard_id = g.id
  AND NOT g.is_staff
  AND c.status = 'verified'
  AND (
    c.catalog_id = 'bsis-guard-card'
    OR c.name ILIKE '%guard card%'
    OR c.name ILIKE '%bsis guard%'
  );
