-- Server-side deduplication for push notifications (e.g. missed check-ins per hour).
CREATE TABLE IF NOT EXISTS push_notification_dedup (
  id TEXT PRIMARY KEY,
  notification_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_push_notification_dedup_created
  ON push_notification_dedup (created_at);

COMMENT ON TABLE push_notification_dedup IS
  'Prevents duplicate operational push alerts; rows older than ~25h are pruned by cron.';
