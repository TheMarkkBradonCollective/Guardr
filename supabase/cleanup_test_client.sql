-- ═══════════════════════════════════════════════════════════════════
-- GUARDR – Delete all data for a test client account
-- Usage: paste into Supabase SQL Editor and click Run
--
-- This script deletes, in dependency order:
--   payments, job chat messages (via cascade), job chat threads,
--   message reactions, chat read receipts, support messages (via cascade),
--   support tickets, push subscriptions, notification preferences,
--   security_requests (payments cascade from here), and the client row.
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_client_id  TEXT;
  v_job_ids    TEXT[];
BEGIN

  -- ── 1. Resolve client ID ──────────────────────────────────────────
  SELECT id INTO v_client_id
  FROM   clients
  WHERE  email = 'test@test.com';

  IF v_client_id IS NULL THEN
    RAISE NOTICE 'No client found with email test@test.com – nothing to delete.';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting all data for client id=% (test@test.com)', v_client_id;

  -- ── 2. Collect job IDs belonging to this client ───────────────────
  SELECT ARRAY(SELECT id FROM security_requests WHERE client_id = v_client_id)
  INTO   v_job_ids;

  RAISE NOTICE 'Found % job(s): %', array_length(v_job_ids, 1), v_job_ids;

  -- ── 3. Job chat threads (messages cascade automatically) ──────────
  DELETE FROM job_chat_threads
  WHERE  client_id = v_client_id
     OR  request_id = ANY(v_job_ids);

  -- ── 4. Payments (also cascade from security_requests delete below,
  --       but we delete explicitly first so the count is visible) ─────
  DELETE FROM payments
  WHERE  job_id = ANY(v_job_ids);

  -- ── 5. Security requests ───────────────────────────────────────────
  DELETE FROM security_requests
  WHERE  client_id = v_client_id;

  -- ── 6. Support tickets (messages cascade automatically) ───────────
  DELETE FROM support_tickets
  WHERE  user_id = v_client_id;

  -- ── 7. Message reactions made by this client ──────────────────────
  DELETE FROM message_reactions
  WHERE  user_id = v_client_id;

  -- ── 8. Chat read receipts for this client ─────────────────────────
  DELETE FROM chat_read_receipts
  WHERE  user_id = v_client_id;

  -- ── 9. Push subscriptions ─────────────────────────────────────────
  DELETE FROM push_subscriptions
  WHERE  user_id = v_client_id;

  -- ── 10. Push notification dedup log ──────────────────────────────
  DELETE FROM push_notification_dedup
  WHERE  user_id = v_client_id;

  -- ── 11. Notification preferences ─────────────────────────────────
  DELETE FROM notification_preferences
  WHERE  user_id = v_client_id;

  -- ── 12. Client row ────────────────────────────────────────────────
  DELETE FROM clients
  WHERE  id = v_client_id;

  RAISE NOTICE 'Done – client test@test.com and all associated data removed.';

END $$;
