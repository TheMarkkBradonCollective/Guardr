-- Coordinator-editable crew display name and description (client-visible on roster / directory)
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS crew_name TEXT,
  ADD COLUMN IF NOT EXISTS crew_description TEXT;
