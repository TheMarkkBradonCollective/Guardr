-- ═══════════════════════════════════════════════════════════════════
-- GUARDR MESSENGER: Reactions + Read Receipts
-- Paste the whole file into the Supabase SQL Editor and click Run.
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. MESSAGE REACTIONS
--    Stores emoji reactions for every message channel.
--
--    message_type  'job_chat' | 'staff' | 'guard' | 'support'
--    message_id    references the id column of the matching table
--    user_id       the reacting user's id
--    emoji         single emoji character, e.g. '👍'
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_reactions (
    id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    message_type TEXT        NOT NULL
                             CHECK (message_type IN ('job_chat','staff','guard','support')),
    message_id   TEXT        NOT NULL,
    user_id      TEXT        NOT NULL,
    user_name    TEXT        NOT NULL DEFAULT '',
    emoji        TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    -- One reaction per (user × emoji × message)
    UNIQUE (message_type, message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_lookup_idx
    ON message_reactions (message_type, message_id);

CREATE INDEX IF NOT EXISTS message_reactions_user_idx
    ON message_reactions (user_id);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_reactions_all"
    ON message_reactions FOR ALL
    USING (true) WITH CHECK (true);

-- Supabase Realtime so every client sees new reactions immediately
DO $$
BEGIN
  IF to_regclass('public.message_reactions') IS NOT NULL THEN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE '%already member of publication%' THEN RAISE; END IF;
  END;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────
-- 2. CHAT READ RECEIPTS
--    Records the last time a user read each conversation.
--    Used to calculate unread counts and show the "✓✓ Read" state.
--
--    channel_type  'job_chat' | 'staff' | 'guard' | 'support'
--    channel_id
--      job_chat  → thread id (job_chat_threads.id)
--      staff     → 'staff-community'
--      guard     → 'guard-community'
--      support   → ticket id (support_tickets.id)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_read_receipts (
    user_id      TEXT        NOT NULL,
    channel_type TEXT        NOT NULL
                             CHECK (channel_type IN ('job_chat','staff','guard','support')),
    channel_id   TEXT        NOT NULL,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    PRIMARY KEY (user_id, channel_type, channel_id)
);

CREATE INDEX IF NOT EXISTS chat_read_receipts_channel_idx
    ON chat_read_receipts (channel_type, channel_id);

ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_read_receipts_all"
    ON chat_read_receipts FOR ALL
    USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────
-- 3. HELPER: mark_channel_read(user_id, channel_type, channel_id)
--    Call whenever a user opens a chat thread.  Upserts their
--    last_read_at timestamp so unread counts reset correctly.
--
--    Example:
--      SELECT mark_channel_read('user-abc', 'job_chat', 'thread-xyz');
--      SELECT mark_channel_read('user-abc', 'guard',    'guard-community');
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_channel_read(
    p_user_id      TEXT,
    p_channel_type TEXT,
    p_channel_id   TEXT
)
RETURNS VOID
LANGUAGE sql
AS $$
    INSERT INTO chat_read_receipts (user_id, channel_type, channel_id, last_read_at)
    VALUES (p_user_id, p_channel_type, p_channel_id, timezone('utc', now()))
    ON CONFLICT (user_id, channel_type, channel_id)
    DO UPDATE SET last_read_at = EXCLUDED.last_read_at;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 4. HELPER: unread_counts(user_id)
--    Returns per-channel unread message counts for a given user.
--    A message is "unread" when:
--      • it was sent after the user's last_read_at  AND
--      • it was not sent by the user themselves
--
--    Example:
--      SELECT * FROM unread_counts('user-abc')
--      WHERE unread_count > 0;
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION unread_counts(p_user_id TEXT)
RETURNS TABLE (
    channel_type TEXT,
    channel_id   TEXT,
    unread_count BIGINT
)
LANGUAGE sql STABLE
AS $$
    -- Job chat threads the user participates in
    SELECT
        'job_chat'::TEXT              AS channel_type,
        t.id                          AS channel_id,
        COUNT(m.id) FILTER (
            WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
              AND m.sender_id  <> p_user_id
        )                             AS unread_count
    FROM   job_chat_threads  t
    JOIN   job_chat_messages m  ON m.thread_id = t.id
    LEFT JOIN chat_read_receipts r
           ON r.user_id       = p_user_id
          AND r.channel_type  = 'job_chat'
          AND r.channel_id    = t.id
    WHERE  t.client_id = p_user_id
        OR t.guard_id  = p_user_id
    GROUP  BY t.id, r.last_read_at

    UNION ALL

    -- Guard community channel
    SELECT
        'guard'::TEXT             AS channel_type,
        'guard-community'::TEXT   AS channel_id,
        COUNT(m.id) FILTER (
            WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
              AND m.sender_id  <> p_user_id
        )                         AS unread_count
    FROM   guard_messages m
    LEFT JOIN chat_read_receipts r
           ON r.user_id      = p_user_id
          AND r.channel_type = 'guard'
          AND r.channel_id   = 'guard-community'

    UNION ALL

    -- Staff internal channel
    SELECT
        'staff'::TEXT             AS channel_type,
        'staff-community'::TEXT   AS channel_id,
        COUNT(m.id) FILTER (
            WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
              AND m.sender_id  <> p_user_id
        )                         AS unread_count
    FROM   staff_messages m
    LEFT JOIN chat_read_receipts r
           ON r.user_id      = p_user_id
          AND r.channel_type = 'staff'
          AND r.channel_id   = 'staff-community'

    UNION ALL

    -- Support / report tickets the user owns
    SELECT
        'support'::TEXT AS channel_type,
        t.id            AS channel_id,
        COUNT(m.id) FILTER (
            WHERE m.created_at > COALESCE(r.last_read_at, '-infinity'::TIMESTAMPTZ)
              AND m.sender_id  <> p_user_id
        )               AS unread_count
    FROM   support_tickets  t
    JOIN   support_messages m  ON m.ticket_id = t.id
    LEFT JOIN chat_read_receipts r
           ON r.user_id      = p_user_id
          AND r.channel_type = 'support'
          AND r.channel_id   = t.id
    WHERE  t.user_id = p_user_id
    GROUP  BY t.id, r.last_read_at
$$;


-- ─────────────────────────────────────────────────────────────────
-- 5. NOTIFICATION PREFERENCE: reactions
--    Adds an opt-in column so users can turn off reaction alerts.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE notification_preferences
    ADD COLUMN IF NOT EXISTS reaction_notification BOOLEAN NOT NULL DEFAULT true;
