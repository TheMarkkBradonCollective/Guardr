-- =============================================================================
-- Guardr — full SQL catch-up for Aug 18, 2026 session (v1.0.126 → v1.0.127)
-- Run once in Supabase SQL Editor if you are unsure which migrations shipped.
-- Safe to re-run: uses IF NOT EXISTS / idempotent UPDATEs only.
-- =============================================================================

BEGIN;

-- ── 1. Clients: Personal vs Business (who hires / pays) ─────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'account_kind'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'client_type'
  ) THEN
    ALTER TABLE clients RENAME COLUMN account_kind TO client_type;
  END IF;
END $$;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type TEXT;

UPDATE clients
SET client_type = 'business'
WHERE client_type IS NULL OR client_type NOT IN ('personal', 'business');

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_account_kind_check;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_client_type_check;
ALTER TABLE clients ADD CONSTRAINT clients_client_type_check
  CHECK (client_type IN ('personal', 'business'));

ALTER TABLE clients ALTER COLUMN client_type SET DEFAULT 'business';
ALTER TABLE clients ALTER COLUMN client_type SET NOT NULL;

-- ── 2. Clients: authorized contacts (business team / site contacts) ────────

ALTER TABLE clients ADD COLUMN IF NOT EXISTS authorized_contacts JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── 3. Clients: credential library uploads on client profile ─────────────────

ALTER TABLE clients ADD COLUMN IF NOT EXISTS credentials JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN clients.credentials IS
  'Client credential library uploads: type, document, expiration, and verification status.';

-- ── 4. Platform settings: client credential library rules (Permissions UI) ───

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS client_credential_rules JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN platform_settings.client_credential_rules IS
  'Admin overrides for the client credential library (applicable to / required for).';

-- ── 5. Staff: bounce verified-without-photos government IDs ────────────────
--    (status-only verified rows → pending upload; pending creds queue unchanged)

UPDATE staff
SET id_verification_status = 'not_submitted'
WHERE id_verification_status = 'verified'
  AND (
    COALESCE(btrim(id_front_url), '') = ''
    OR COALESCE(btrim(id_back_url), '') = ''
    OR COALESCE(btrim(id_selfie_url), '') = ''
  );

-- Same bounce on legacy guard rows that were migrated to staff (if any remain)
UPDATE guards
SET id_verification_status = 'not_submitted'
WHERE is_staff = true
  AND id_verification_status = 'verified'
  AND (
    COALESCE(btrim(id_front_url), '') = ''
    OR COALESCE(btrim(id_back_url), '') = ''
    OR COALESCE(btrim(id_selfie_url), '') = ''
  );

-- ── 6. Staff: demote active → approved when ID is not truly verified ─────────
--    Operations + management (Manager+): stay approved until Profile upload.
--    Founder / Owner stay active so someone can still review credentials.

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

COMMIT;

-- ── Verify (optional — run separately) ───────────────────────────────────────
-- SELECT COUNT(*) AS clients_missing_type FROM clients WHERE client_type IS NULL;
-- SELECT COUNT(*) AS staff_still_active_missing_id FROM staff
--   WHERE user_status = 'active'
--     AND COALESCE(staff_role, '') NOT IN ('Founder', 'Owner')
--     AND (id_verification_status IS DISTINCT FROM 'verified'
--       OR COALESCE(btrim(id_front_url), '') = ''
--       OR COALESCE(btrim(id_back_url), '') = ''
--       OR COALESCE(btrim(id_selfie_url), '') = '');
-- SELECT client_credential_rules IS NOT NULL AS rules_column_ok FROM platform_settings LIMIT 1;
