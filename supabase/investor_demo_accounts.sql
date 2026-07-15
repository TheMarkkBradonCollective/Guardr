-- =============================================================================
-- Guardr — Investor demo accounts (run in Supabase SQL Editor)
-- Password for all three: #Qwerty12345
--
-- After running this script, link each account to Supabase Auth:
--   1. Sign in once on guardr.co (legacy password auth auto-migrates), OR
--   2. POST /api/auth/bridge with service role for each profile, OR
--   3. Create matching users in Supabase Auth → Users with the same emails.
--
-- Accounts:
--   testg@test.com — active guard with all five credentials verified
--   testc@test.com — approved active client
--   tests@test.com — active staff (Moderator)
-- =============================================================================

-- ── Guard: testg@test.com ─────────────────────────────────────────────────────
INSERT INTO guards (
  id, name, first_name, last_name, email, badge_number, phone, bio,
  is_armed, background_checked, verified, rating, jobs_completed,
  hourly_rate_requirement, user_status, armed_preference, guard_card_status,
  has_reliable_transportation, service_areas, specialties,
  id_verification_status, id_state, id_number, id_expiry_date,
  id_front_url, id_back_url, id_selfie_url,
  id_verification_submitted_at, id_verification_reviewed_at,
  password, must_change_password
) VALUES (
  'demo-guard-testg',
  'Test Guard',
  'Test',
  'Guard',
  'testg@test.com',
  'DEMO-G-001',
  '(555) 010-0001',
  'Investor demo guard account — fully activated for marketplace work.',
  FALSE,
  TRUE,
  TRUE,
  4.9,
  12,
  35,
  'active',
  'unarmed',
  'active',
  TRUE,
  '["Los Angeles"]'::jsonb,
  '["Event security", "Site patrol"]'::jsonb,
  'verified',
  'CA',
  'D1234567',
  (CURRENT_DATE + INTERVAL '2 years')::date,
  'https://www.guardr.co/logo-256.png',
  'https://www.guardr.co/logo-256.png',
  'https://www.guardr.co/logo-256.png',
  NOW(),
  NOW(),
  '#Qwerty12345',
  FALSE
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  user_status = 'active',
  verified = TRUE,
  background_checked = TRUE,
  id_verification_status = 'verified',
  id_state = EXCLUDED.id_state,
  id_number = EXCLUDED.id_number,
  id_expiry_date = EXCLUDED.id_expiry_date,
  id_front_url = EXCLUDED.id_front_url,
  id_back_url = EXCLUDED.id_back_url,
  id_selfie_url = EXCLUDED.id_selfie_url,
  password = EXCLUDED.password,
  must_change_password = FALSE;

-- Guard certifications (all five activation credentials verified)
INSERT INTO certifications (id, guard_id, name, issuer, number, status, issue_date, catalog_id, image_url)
VALUES
  ('demo-cert-guard-card', 'demo-guard-testg', 'BSIS Guard Card', 'BSIS', 'GC-DEMO-001', 'verified', CURRENT_DATE - 365, 'bsis-guard-card', 'https://www.guardr.co/logo-256.png'),
  ('demo-cert-pta-uof', 'demo-guard-testg', 'Power to Arrest & Appropriate Use of Force', 'BSIS', 'PTA-DEMO-001', 'verified', CURRENT_DATE - 300, 'bsis-pta-uof-8hr', 'https://www.guardr.co/logo-256.png'),
  ('demo-cert-32hr', 'demo-guard-testg', '32-Hour BSIS Training Block', 'BSIS', '32H-DEMO-001', 'verified', CURRENT_DATE - 280, 'bsis-32-hour-completed', 'https://www.guardr.co/logo-256.png')
ON CONFLICT (id) DO UPDATE SET
  status = 'verified',
  image_url = EXCLUDED.image_url;

INSERT INTO guard_insurance_policies (
  guard_id, carrier, policy_number, general_liability_limit,
  effective_date, expiry_date, document_url, status, submitted_at, reviewed_at
)
VALUES (
  'demo-guard-testg',
  'Demo Insurance Co.',
  'COI-DEMO-001',
  1000000,
  CURRENT_DATE - 30,
  CURRENT_DATE + INTERVAL '1 year',
  'https://www.guardr.co/logo-256.png',
  'verified',
  NOW(),
  NOW()
)
ON CONFLICT (guard_id) DO UPDATE SET
  status = 'verified',
  document_url = EXCLUDED.document_url,
  expiry_date = EXCLUDED.expiry_date;

-- ── Client: testc@test.com ────────────────────────────────────────────────────
INSERT INTO clients (
  id, name, first_name, last_name, email, company_name, phone,
  account_status, approved, password, must_change_password,
  service_city, service_state, service_types, property_types
) VALUES (
  'demo-client-testc',
  'Test Client',
  'Test',
  'Client',
  'testc@test.com',
  'Demo Properties LLC',
  '(555) 010-0002',
  'active',
  TRUE,
  '#Qwerty12345',
  FALSE,
  'Los Angeles',
  'CA',
  ARRAY['Event security', 'Site patrol'],
  ARRAY['Commercial / office']
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  account_status = 'active',
  approved = TRUE,
  password = EXCLUDED.password,
  must_change_password = FALSE;

-- ── Staff: tests@test.com ─────────────────────────────────────────────────────
INSERT INTO staff (
  id, name, first_name, last_name, email, badge_number, phone, bio,
  staff_role, user_status, password, must_change_password
) VALUES (
  'demo-staff-tests',
  'Test Staff',
  'Test',
  'Staff',
  'tests@test.com',
  'DEMO-S-001',
  '(555) 010-0003',
  'Investor demo staff account — Moderator access for platform review.',
  'Moderator',
  'active',
  '#Qwerty12345',
  FALSE
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  staff_role = 'Moderator',
  user_status = 'active',
  password = EXCLUDED.password,
  must_change_password = FALSE;

-- Ensure guard is not flagged as staff
UPDATE guards SET is_staff = FALSE WHERE email = 'testg@test.com';

DO $$
BEGIN
  RAISE NOTICE 'Investor demo accounts ready: testg@test.com (guard), testc@test.com (client), tests@test.com (staff)';
  RAISE NOTICE 'Password for all: #Qwerty12345';
  RAISE NOTICE 'Link Supabase Auth users if sign-in fails — see script header.';
END $$;
