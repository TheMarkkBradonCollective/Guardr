-- Job chat (client ↔ guard during active jobs, staff oversight)
CREATE TABLE IF NOT EXISTS job_chat_threads (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    guard_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS job_chat_messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES job_chat_threads(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS job_chat_threads_request_id_idx ON job_chat_threads(request_id);
CREATE INDEX IF NOT EXISTS job_chat_threads_status_idx ON job_chat_threads(status);
CREATE INDEX IF NOT EXISTS job_chat_messages_thread_id_idx ON job_chat_messages(thread_id);

-- Staff-to-staff team channel
CREATE TABLE IF NOT EXISTS staff_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS staff_messages_created_at_idx ON staff_messages(created_at);

-- Per-user notification preference controls
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id TEXT PRIMARY KEY,
    assignment BOOLEAN NOT NULL DEFAULT true,
    guard_checkin BOOLEAN NOT NULL DEFAULT true,
    missed_checkin BOOLEAN NOT NULL DEFAULT true,
    emergency_alert BOOLEAN NOT NULL DEFAULT true,
    support_message BOOLEAN NOT NULL DEFAULT true,
    job_chat_message BOOLEAN NOT NULL DEFAULT true,
    staff_message BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE job_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_chat_threads_all" ON job_chat_threads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "job_chat_messages_all" ON job_chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "staff_messages_all" ON staff_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notification_preferences_all" ON notification_preferences FOR ALL USING (true) WITH CHECK (true);

-- Realtime sync for messaging tables
DO $$
BEGIN
  IF to_regclass('public.job_chat_threads') IS NOT NULL THEN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE job_chat_threads';
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%already member of publication%' THEN RAISE; END IF;
  END;
  END IF;

  IF to_regclass('public.job_chat_messages') IS NOT NULL THEN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE job_chat_messages';
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%already member of publication%' THEN RAISE; END IF;
  END;
  END IF;

  IF to_regclass('public.staff_messages') IS NOT NULL THEN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE staff_messages';
  EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%already member of publication%' THEN RAISE; END IF;
  END;
  END IF;
END $$;
