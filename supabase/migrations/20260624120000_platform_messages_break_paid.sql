-- Owner/director homepage messages and paid/unpaid break billing
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS owner_message TEXT,
  ADD COLUMN IF NOT EXISTS owner_message_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS director_message TEXT,
  ADD COLUMN IF NOT EXISTS director_message_updated_at TIMESTAMPTZ;

ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS break_paid BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE platform_settings
SET
  owner_message = COALESCE(
    owner_message,
    'Welcome to Guardr — independent licensed security, on your schedule. Post a job or browse the map to get started.'
  ),
  director_message = COALESCE(
    director_message,
    'Our team is here to support every shift from booking through payout. Reach us anytime through Messages if you need help.'
  )
WHERE id = 'default';
