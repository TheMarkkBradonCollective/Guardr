-- Broadcast row changes to connected clients (no manual refresh required).
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
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN OTHERS THEN
        IF SQLERRM NOT LIKE '%already member of publication%' THEN
          RAISE;
        END IF;
    END;
  END LOOP;
END $$;
