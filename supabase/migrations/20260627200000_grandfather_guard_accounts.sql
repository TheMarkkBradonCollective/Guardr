-- Grandfather existing field guards: activate accounts and verify ID/guard card where needed.
-- New sign-ups after this migration still follow the ID + guard card approval workflow in the app.

UPDATE guards
SET
  user_status = 'active',
  id_verification_status = CASE
    WHEN COALESCE(id_verification_status, 'not_submitted') IN ('not_submitted', 'rejected')
      THEN 'verified'
    ELSE id_verification_status
  END,
  id_verification_reviewed_at = COALESCE(
    id_verification_reviewed_at,
    timezone('utc', now())
  )
WHERE is_staff = false
  AND COALESCE(user_status, 'active') IN ('pending', 'active');

UPDATE certifications c
SET status = 'verified'
FROM guards g
WHERE c.guard_id = g.id
  AND NOT g.is_staff
  AND c.status = 'pending'
  AND (
    c.catalog_id = 'bsis-guard-card'
    OR c.name ILIKE '%guard card%'
    OR c.name ILIKE '%bsis guard%'
  );
