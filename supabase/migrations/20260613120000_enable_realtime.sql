-- Broadcast row changes to connected clients (no manual refresh required).
-- Skips tables that are not deployed yet (e.g. support_tickets on older DBs).
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'guards',
    'clients',
    'certifications',
    'experience',
    'education',
    'security_requests',
    'payments',
    'support_tickets',
    'support_messages'
  ]
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN OTHERS THEN
          IF SQLERRM NOT LIKE '%already member of publication%' THEN
            RAISE;
          END IF;
      END;
    END IF;
  END LOOP;
END $$;
