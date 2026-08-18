-- Field-test staff operator (setup only — not part of /fieldtest execution)
-- Password: #FieldTestStaff2026 (override with FIELD_TEST_STAFF_PASSWORD)
INSERT INTO staff (
  id, name, first_name, last_name, email, badge_number, avatar, phone, bio, summary,
  staff_role, user_status, password, must_change_password, id_verification_status
) VALUES (
  'staff-field-test-guardr',
  'Guardr',
  'Guardr',
  '',
  'staff@guardr.co',
  'STF-FIELD01',
  '',
  '(555) 010-2026',
  'Automated field-test operator — Director-level ops access for QA.',
  'Field test automation account (branded Guardr in Staff chat).',
  'Director',
  'active',
  '#FieldTestStaff2026',
  false,
  'not_submitted'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  staff_role = EXCLUDED.staff_role,
  user_status = EXCLUDED.user_status,
  password = EXCLUDED.password,
  must_change_password = false,
  id_verification_status = 'not_submitted',
  summary = EXCLUDED.summary;
