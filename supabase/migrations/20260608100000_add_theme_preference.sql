-- Per-user theme preference synced across devices (dark | light | grey)

ALTER TABLE guards ADD COLUMN IF NOT EXISTS theme_preference TEXT
  CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey'));

ALTER TABLE clients ADD COLUMN IF NOT EXISTS theme_preference TEXT
  CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey'));
