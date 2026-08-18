-- Bounce staff government IDs that were marked verified without uploaded photos,
-- and add the client credential library storage.

UPDATE staff
SET id_verification_status = 'not_submitted'
WHERE id_verification_status = 'verified'
  AND (
    COALESCE(btrim(id_front_url), '') = ''
    OR COALESCE(btrim(id_back_url), '') = ''
    OR COALESCE(btrim(id_selfie_url), '') = ''
  );

ALTER TABLE clients ADD COLUMN IF NOT EXISTS credentials JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN clients.credentials IS
  'Client credential library uploads: type, document, expiration, and verification status.';

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS client_credential_rules JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN platform_settings.client_credential_rules IS
  'Admin overrides for the client credential library (applicable to / required for).';
