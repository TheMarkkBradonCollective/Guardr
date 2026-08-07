-- ═══════════════════════════════════════════════════════════════════
-- GUARDR – Remove guard account marknickwhite@gmail.com and set it
-- as personal_email on Markeith White's staff profile (OWN-00001).
--
-- Usage: paste into Supabase SQL Editor and click Run
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_guard_id       TEXT;
  v_auth_user_id   UUID;
  v_staff_updated  INTEGER;
BEGIN
  ALTER TABLE staff ADD COLUMN IF NOT EXISTS personal_email TEXT;

  SELECT id, auth_user_id
  INTO v_guard_id, v_auth_user_id
  FROM guards
  WHERE lower(trim(email)) = 'marknickwhite@gmail.com'
  LIMIT 1;

  IF v_guard_id IS NULL THEN
    RAISE NOTICE 'No guard found with email marknickwhite@gmail.com — skipping guard delete.';
  ELSE
    RAISE NOTICE 'Deleting guard id=% (marknickwhite@gmail.com)', v_guard_id;

    -- Tables without ON DELETE CASCADE to guards
    DELETE FROM guard_payout_invoices WHERE guard_id = v_guard_id;
    DELETE FROM job_chat_threads WHERE guard_id = v_guard_id;
    DELETE FROM support_tickets WHERE user_id = v_guard_id;
    DELETE FROM push_subscriptions WHERE user_id = v_guard_id;
    DELETE FROM notification_preferences WHERE user_id = v_guard_id;
    DELETE FROM user_notifications WHERE user_id = v_guard_id OR guard_id = v_guard_id;
    DELETE FROM user_legal_acceptances WHERE user_id = v_guard_id;
    DELETE FROM message_reactions WHERE user_id = v_guard_id;
    DELETE FROM chat_read_receipts WHERE user_id = v_guard_id;
    DELETE FROM guard_messages WHERE sender_id = v_guard_id;

    UPDATE security_requests
    SET applicants = array_remove(applicants, v_guard_id)
    WHERE v_guard_id = ANY(applicants);

    UPDATE clients
    SET favorite_guard_ids = COALESCE(
      (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements_text(favorite_guard_ids) AS elem
        WHERE elem <> v_guard_id
      ),
      '[]'::jsonb
    )
    WHERE favorite_guard_ids ? v_guard_id;

    DELETE FROM guards WHERE id = v_guard_id;

    IF v_auth_user_id IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = v_auth_user_id;
      RAISE NOTICE 'Deleted linked auth.users row %', v_auth_user_id;
    END IF;

    RAISE NOTICE 'Guard account removed.';
  END IF;

  UPDATE staff
  SET personal_email = 'marknickwhite@gmail.com'
  WHERE badge_number = 'OWN-00001'
     OR email = 'm.white@signaturesecurityspecialist.com'
     OR id = 'staff-director';

  GET DIAGNOSTICS v_staff_updated = ROW_COUNT;

  IF v_staff_updated = 0 THEN
    RAISE EXCEPTION 'Staff profile not found for m.white@signaturesecurityspecialist.com / OWN-00001';
  END IF;

  RAISE NOTICE 'Set personal_email on % staff row(s).', v_staff_updated;
END $$;

-- Verify
SELECT name, email AS work_email, personal_email, badge_number, staff_role
FROM staff
WHERE badge_number = 'OWN-00001'
   OR email = 'm.white@signaturesecurityspecialist.com';

SELECT id, email FROM guards WHERE lower(trim(email)) = 'marknickwhite@gmail.com';
