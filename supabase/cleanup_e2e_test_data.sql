-- ═══════════════════════════════════════════════════════════════════
-- GUARDR – Delete all E2E / demo test accounts and associated data
-- Usage: paste into Supabase SQL Editor and click Run
--
-- Targets:
--   *@guardr.test
--   test@test.com, testg@test.com, testc@test.com, tests@test.com
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_guard_ids  TEXT[];
  v_client_ids TEXT[];
  v_staff_ids  TEXT[];
  v_job_ids    TEXT[];
BEGIN
  SELECT ARRAY_AGG(id) INTO v_guard_ids
  FROM guards
  WHERE email LIKE '%@guardr.test'
     OR email IN ('testg@test.com', 'test@test.com');

  SELECT ARRAY_AGG(id) INTO v_client_ids
  FROM clients
  WHERE email LIKE '%@guardr.test'
     OR email IN ('testc@test.com', 'test@test.com');

  SELECT ARRAY_AGG(id) INTO v_staff_ids
  FROM staff
  WHERE email LIKE '%@guardr.test'
     OR email IN ('tests@test.com');

  v_guard_ids  := COALESCE(v_guard_ids, ARRAY[]::TEXT[]);
  v_client_ids := COALESCE(v_client_ids, ARRAY[]::TEXT[]);
  v_staff_ids  := COALESCE(v_staff_ids, ARRAY[]::TEXT[]);

  SELECT ARRAY_AGG(id) INTO v_job_ids
  FROM security_requests
  WHERE client_id = ANY(v_client_ids);

  v_job_ids := COALESCE(v_job_ids, ARRAY[]::TEXT[]);

  RAISE NOTICE 'guards=% clients=% staff=% jobs=%',
    v_guard_ids, v_client_ids, v_staff_ids, v_job_ids;

  DELETE FROM staff_compensation_payouts WHERE staff_id = ANY(v_staff_ids);
  DELETE FROM staff_time_entries WHERE staff_id = ANY(v_staff_ids);
  DELETE FROM payments WHERE job_id = ANY(v_job_ids);
  DELETE FROM job_guard_slots WHERE job_id = ANY(v_job_ids);
  DELETE FROM job_chat_threads
  WHERE client_id = ANY(v_client_ids) OR request_id = ANY(v_job_ids);
  DELETE FROM security_requests WHERE id = ANY(v_job_ids);
  DELETE FROM support_tickets WHERE user_id = ANY(v_client_ids);
  DELETE FROM client_locations WHERE client_id = ANY(v_client_ids);
  DELETE FROM certifications WHERE guard_id = ANY(v_guard_ids);
  DELETE FROM experience WHERE guard_id = ANY(v_guard_ids);
  DELETE FROM education WHERE guard_id = ANY(v_guard_ids);
  DELETE FROM guard_payout_invoices WHERE guard_id = ANY(v_guard_ids);
  DELETE FROM guard_availability WHERE guard_id = ANY(v_guard_ids);
  DELETE FROM guard_insurance_policies WHERE guard_id = ANY(v_guard_ids);
  DELETE FROM push_subscriptions WHERE user_id = ANY(v_guard_ids || v_client_ids || v_staff_ids);
  DELETE FROM message_reactions WHERE user_id = ANY(v_guard_ids || v_client_ids);
  DELETE FROM chat_read_receipts WHERE user_id = ANY(v_guard_ids || v_client_ids);
  DELETE FROM notification_preferences WHERE user_id = ANY(v_guard_ids || v_client_ids || v_staff_ids);
  DELETE FROM guards WHERE id = ANY(v_guard_ids);
  DELETE FROM clients WHERE id = ANY(v_client_ids);
  DELETE FROM staff WHERE id = ANY(v_staff_ids);

  RAISE NOTICE 'Done – all E2E / demo test accounts removed.';
END $$;
