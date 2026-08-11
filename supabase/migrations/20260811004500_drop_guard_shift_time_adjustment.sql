-- Remove guard shift time adjustment (contractors use clock audit only; no staff overrides).
UPDATE security_requests
SET shift_time_adjustment = NULL
WHERE shift_time_adjustment IS NOT NULL;

ALTER TABLE security_requests
DROP COLUMN IF EXISTS shift_time_adjustment;
