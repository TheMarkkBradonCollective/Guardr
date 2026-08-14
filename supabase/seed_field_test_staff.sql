-- Field-test staff operator (setup only — not part of /fieldtest execution)
-- Password: #FieldTestStaff2026 (override with FIELD_TEST_STAFF_PASSWORD)
INSERT INTO staff (
  id, name, first_name, last_name, email, badge_number, avatar, phone, bio, summary,
  staff_role, user_status, password, must_change_password, id_verification_status
) VALUES (
  'staff-field-test-guardr',
  'Staff (Field Test)',
  'Staff',
  'Field Test',
  'staff@guardr.co',
  'STF-FIELD01',
  '',
  '(555) 010-2026',
  'Automated field-test operator — full ops access for QA only.',
  'Field test automation account with Founder-level platform access.',
  'Founder',
  'active',
  '#FieldTestStaff2026',
  false,
  'verified'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  staff_role = EXCLUDED.staff_role,
  user_status = EXCLUDED.user_status,
  password = EXCLUDED.password,
  must_change_password = false,
  id_verification_status = 'verified',
  summary = EXCLUDED.summary;
