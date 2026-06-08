-- Rich guard resume fields
ALTER TABLE guards ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
ALTER TABLE guards ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE guards ADD COLUMN IF NOT EXISTS availability_notes TEXT DEFAULT '';

-- Education entries for guard resumes
CREATE TABLE IF NOT EXISTS education (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
    school TEXT NOT NULL,
    degree TEXT NOT NULL DEFAULT '',
    field TEXT NOT NULL DEFAULT '',
    period TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "education_select" ON education FOR SELECT USING (true);
CREATE POLICY "education_insert" ON education FOR INSERT WITH CHECK (true);
CREATE POLICY "education_update" ON education FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "education_delete" ON education FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_education_guard_id ON education(guard_id);

-- Separate marketplace posts from profile-based direct requests
ALTER TABLE security_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'marketplace'
    CHECK (request_type IN ('marketplace', 'direct'));

-- Rename preferred_guard_id → target_guard_id if prior migration ran
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'security_requests' AND column_name = 'preferred_guard_id'
  ) THEN
    ALTER TABLE security_requests RENAME COLUMN preferred_guard_id TO target_guard_id;
  ELSE
    ALTER TABLE security_requests
      ADD COLUMN IF NOT EXISTS target_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_security_requests_request_type ON security_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_security_requests_target_guard ON security_requests(target_guard_id);
