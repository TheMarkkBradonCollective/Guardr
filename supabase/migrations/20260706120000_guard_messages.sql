-- Guard-to-guard community channel (all field guards)
CREATE TABLE IF NOT EXISTS guard_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS guard_messages_created_at_idx ON guard_messages(created_at);

ALTER TABLE guard_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guard_messages_all" ON guard_messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS guard_message BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF to_regclass('public.guard_messages') IS NOT NULL THEN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE guard_messages';
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%already member of publication%' THEN RAISE; END IF;
  END;
  END IF;
END $$;
