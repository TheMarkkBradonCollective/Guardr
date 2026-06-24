-- Crew team chat (guards on multi-guard jobs + staff oversight; not visible to clients)

CREATE TABLE IF NOT EXISTS team_chat_threads (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES security_requests(id) ON DELETE CASCADE,
  team_lead_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS team_chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES team_chat_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_chat_threads_request_id ON team_chat_threads(request_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_threads_status ON team_chat_threads(status);
CREATE INDEX IF NOT EXISTS idx_team_chat_messages_thread_id ON team_chat_messages(thread_id);

ALTER TABLE team_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_chat_threads_all" ON team_chat_threads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "team_chat_messages_all" ON team_chat_messages FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF to_regclass('public.team_chat_messages') IS NOT NULL THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE team_chat_messages';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
