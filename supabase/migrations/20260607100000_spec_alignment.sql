-- Guardr spec alignment: job status flow, request fields, client approval

----------------------------------------------------
-- 1. Client approval status
----------------------------------------------------
ALTER TABLE clients ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

UPDATE clients SET approved = TRUE WHERE approved IS NULL OR approved = FALSE;

----------------------------------------------------
-- 2. Expand security_requests with spec fields
----------------------------------------------------
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guards_needed INTEGER DEFAULT 1;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS uniform_requirements TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS equipment_requirements TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS site_instructions TEXT DEFAULT '';
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS guard_pay INTEGER;
ALTER TABLE security_requests ADD COLUMN IF NOT EXISTS platform_fee_per_hour INTEGER DEFAULT 5;

-- Migrate legacy statuses to spec-aligned values
UPDATE security_requests SET status = 'accepted' WHERE status = 'assigned';
UPDATE security_requests SET status = 'closed' WHERE status = 'cancelled';

-- Replace status check constraint
ALTER TABLE security_requests DROP CONSTRAINT IF EXISTS security_requests_status_check;
ALTER TABLE security_requests ADD CONSTRAINT security_requests_status_check
  CHECK (status IN (
    'draft',
    'pending-review',
    'open',
    'accepted',
    'in-progress',
    'completed',
    'closed'
  ));
