-- Demote active staff without a real verified government ID to approved (inactive).
-- Management included — they upload from Profile, not activation. Founder/Owner stay active.

UPDATE staff
SET user_status = 'approved'
WHERE user_status = 'active'
  AND COALESCE(staff_role, '') NOT IN ('Founder', 'Owner')
  AND (
    id_verification_status IS DISTINCT FROM 'verified'
    OR COALESCE(btrim(id_front_url), '') = ''
    OR COALESCE(btrim(id_back_url), '') = ''
    OR COALESCE(btrim(id_selfie_url), '') = ''
  );
