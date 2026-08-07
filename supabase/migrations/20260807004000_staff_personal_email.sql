ALTER TABLE staff ADD COLUMN IF NOT EXISTS personal_email TEXT;

COMMENT ON COLUMN staff.personal_email IS 'Optional personal contact email; staff.email remains work/login email';
