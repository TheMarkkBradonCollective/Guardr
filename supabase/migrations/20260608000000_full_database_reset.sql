-- Guardr full database reset
-- Drops all application tables and recreates an empty schema.
-- NO SEED DATA — all rows must come from user sign-up and platform activity.

----------------------------------------------------
-- 1. Drop existing objects (dependency order)
----------------------------------------------------
DROP TABLE IF EXISTS security_requests CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS experience CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS guards CASCADE;

----------------------------------------------------
-- 2. Guards (includes staff accounts)
----------------------------------------------------
CREATE TABLE guards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    badge_number TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    is_armed BOOLEAN NOT NULL DEFAULT FALSE,
    background_checked BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    rating NUMERIC(4, 2) NOT NULL DEFAULT 0,
    jobs_completed INTEGER NOT NULL DEFAULT 0,
    hourly_rate_requirement INTEGER,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    staff_role TEXT CHECK (staff_role IN ('Director', 'Administrator', 'Moderator')),
    user_status TEXT NOT NULL DEFAULT 'active' CHECK (user_status IN ('active', 'suspended', 'blocked')),
    failed_audits INTEGER NOT NULL DEFAULT 0,
    theme_preference TEXT CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE guards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guards_select" ON guards FOR SELECT USING (true);
CREATE POLICY "guards_insert" ON guards FOR INSERT WITH CHECK (true);
CREATE POLICY "guards_update" ON guards FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "guards_delete" ON guards FOR DELETE USING (true);

----------------------------------------------------
-- 3. Clients
----------------------------------------------------
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    total_requests INTEGER NOT NULL DEFAULT 0,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    rating NUMERIC(4, 2),
    theme_preference TEXT CHECK (theme_preference IS NULL OR theme_preference IN ('dark', 'light', 'grey')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select" ON clients FOR SELECT USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (true);

----------------------------------------------------
-- 4. Certifications
----------------------------------------------------
CREATE TABLE certifications (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('verified', 'pending', 'rejected')),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certifications_select" ON certifications FOR SELECT USING (true);
CREATE POLICY "certifications_insert" ON certifications FOR INSERT WITH CHECK (true);
CREATE POLICY "certifications_update" ON certifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "certifications_delete" ON certifications FOR DELETE USING (true);

----------------------------------------------------
-- 5. Experience
----------------------------------------------------
CREATE TABLE experience (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    period TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "experience_select" ON experience FOR SELECT USING (true);
CREATE POLICY "experience_insert" ON experience FOR INSERT WITH CHECK (true);
CREATE POLICY "experience_update" ON experience FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "experience_delete" ON experience FOR DELETE USING (true);

----------------------------------------------------
-- 6. Security requests (jobs)
----------------------------------------------------
CREATE TABLE security_requests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_logo TEXT NOT NULL DEFAULT '',
    client_rating NUMERIC(4, 2),
    site_name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    armed_required BOOLEAN NOT NULL DEFAULT FALSE,
    guards_needed INTEGER NOT NULL DEFAULT 1,
    uniform_requirements TEXT NOT NULL DEFAULT '',
    equipment_requirements TEXT NOT NULL DEFAULT '',
    site_instructions TEXT NOT NULL DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration_hours NUMERIC(10, 2) NOT NULL,
    hourly_rate INTEGER NOT NULL,
    guard_pay INTEGER,
    platform_fee_per_hour INTEGER NOT NULL DEFAULT 5,
    estimated_payout NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'draft',
        'pending-review',
        'open',
        'accepted',
        'in-progress',
        'completed',
        'closed'
    )),
    assigned_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
    required_certifications TEXT[] NOT NULL DEFAULT '{}',
    applicants TEXT[] NOT NULL DEFAULT '{}',
    rating_given INTEGER,
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE security_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_requests_select" ON security_requests FOR SELECT USING (true);
CREATE POLICY "security_requests_insert" ON security_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "security_requests_update" ON security_requests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "security_requests_delete" ON security_requests FOR DELETE USING (true);

----------------------------------------------------
-- 7. Indexes
----------------------------------------------------
CREATE INDEX idx_guards_email ON guards(email);
CREATE INDEX idx_guards_verified ON guards(verified);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_approved ON clients(approved);
CREATE INDEX idx_certifications_guard_id ON certifications(guard_id);
CREATE INDEX idx_experience_guard_id ON experience(guard_id);
CREATE INDEX idx_security_requests_client_id ON security_requests(client_id);
CREATE INDEX idx_security_requests_status ON security_requests(status);
CREATE INDEX idx_security_requests_assigned_guard ON security_requests(assigned_guard_id);
