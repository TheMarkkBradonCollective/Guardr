-- Trusted guard standing crew roster + persistent in-app notification inbox

CREATE TABLE IF NOT EXISTS guard_standing_crew_members (
  id TEXT PRIMARY KEY,
  lead_guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  member_guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'declined', 'removed')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_guard_id, member_guard_id)
);

CREATE INDEX IF NOT EXISTS idx_standing_crew_lead
  ON guard_standing_crew_members (lead_guard_id, status);

CREATE INDEX IF NOT EXISTS idx_standing_crew_member
  ON guard_standing_crew_members (member_guard_id, status);

CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  request_id TEXT,
  guard_id TEXT,
  ticket_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON user_notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE guard_standing_crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
