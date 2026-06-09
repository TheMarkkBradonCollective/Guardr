-- Web Push subscriptions for Guardr PWA

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  push_role TEXT NOT NULL CHECK (push_role IN ('guard', 'dispatch', 'admin', 'client')),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  site_id TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_push_role ON push_subscriptions(push_role);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_site_id ON push_subscriptions(site_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to push_subscriptions" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
