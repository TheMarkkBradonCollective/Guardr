-- Legacy guards were marked active on profile approval before the approved → active split.
-- Reclassify as approved when ID is verified but no verified guard card is on file yet.

UPDATE guards g
SET user_status = 'approved'
WHERE NOT g.is_staff
  AND g.user_status = 'active'
  AND g.verified = true
  AND g.id_verification_status = 'verified'
  AND NOT EXISTS (
    SELECT 1
    FROM certifications c
    WHERE c.guard_id = g.id
      AND c.status = 'verified'
      AND (
        c.catalog_id = 'bsis-guard-card'
        OR c.name ILIKE '%guard card%'
        OR c.name ILIKE '%bsis guard%'
      )
  );
