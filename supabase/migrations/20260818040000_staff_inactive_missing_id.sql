-- Demote active staff without a real verified government ID to approved (inactive).
-- Founder stays active so someone can review IDs.

UPDATE staff
SET user_status = 'approved'
WHERE user_status = 'active'
  AND COALESCE(staff_role, '') IS DISTINCT FROM 'Founder'
  AND (
    id_verification_status IS DISTINCT FROM 'verified'
    OR COALESCE(btrim(id_front_url), '') = ''
    OR COALESCE(btrim(id_back_url), '') = ''
    OR COALESCE(btrim(id_selfie_url), '') = ''
  );
