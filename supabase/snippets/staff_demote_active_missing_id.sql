-- Run in Supabase SQL Editor after staff activation rules ship.
-- Demotes active staff without a verified government ID (front, back, selfie) to approved (inactive).
-- Management (Manager+) is included — they skip the activation screen but stay approved until Profile upload.
-- Founder and legacy Owner stay active so someone can still review IDs.

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
