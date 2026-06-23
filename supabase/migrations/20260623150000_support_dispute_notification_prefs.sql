-- Support and dispute notification preferences
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS support_ticket BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS support_ticket_status BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dispute_update BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN notification_preferences.support_ticket IS 'Staff alert for new support chats and formal reports';
COMMENT ON COLUMN notification_preferences.support_ticket_status IS 'User alert when staff updates ticket status';
COMMENT ON COLUMN notification_preferences.dispute_update IS 'Alerts for dispute filings and resolutions';
