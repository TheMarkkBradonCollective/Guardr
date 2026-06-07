-- Supabase Migration: 20260606000000_initial_schema.sql
-- Description: Initial schema for Signature Security Double-Sided Vetting Platform
-- Includes tables for Guards, Certifications, Experience, and Security Assignment Requests.

-- Enable Row Level Security (RLS) but allow public client-side access for easy sandbox sync.

----------------------------------------------------
-- 1. Create Guards Table
----------------------------------------------------
CREATE TABLE IF NOT EXISTS guards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    badge_number TEXT NOT NULL,
    avatar TEXT NOT NULL,
    phone TEXT NOT NULL,
    bio TEXT NOT NULL,
    is_armed BOOLEAN DEFAULT FALSE,
    background_checked BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    jobs_completed INTEGER DEFAULT 0,
    hourly_rate_requirement INTEGER,
    is_staff BOOLEAN DEFAULT FALSE,
    staff_role TEXT DEFAULT NULL CHECK (staff_role IN ('Director', 'Administrator', 'Moderator')),
    user_status TEXT DEFAULT 'active' CHECK (user_status IN ('active', 'suspended', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup policies for guards
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON guards;
CREATE POLICY "Enable read access for all users" ON guards
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON guards;
CREATE POLICY "Enable insert access for all users" ON guards
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON guards;
CREATE POLICY "Enable update access for all users" ON guards
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON guards;
CREATE POLICY "Enable delete access for all users" ON guards
    FOR DELETE USING (true);


----------------------------------------------------
-- 2. Create Certifications Table
----------------------------------------------------
CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('verified', 'pending', 'rejected')),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup policies for certifications
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON certifications;
CREATE POLICY "Enable read access for all users" ON certifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON certifications;
CREATE POLICY "Enable insert access for all users" ON certifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON certifications;
CREATE POLICY "Enable update access for all users" ON certifications
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON certifications;
CREATE POLICY "Enable delete access for all users" ON certifications
    FOR DELETE USING (true);


----------------------------------------------------
-- 3. Create Experience Table
----------------------------------------------------
CREATE TABLE IF NOT EXISTS experience (
    id TEXT PRIMARY KEY,
    guard_id TEXT NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    period TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup policies for experience
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON experience;
CREATE POLICY "Enable read access for all users" ON experience
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON experience;
CREATE POLICY "Enable insert access for all users" ON experience
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON experience;
CREATE POLICY "Enable update access for all users" ON experience
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON experience;
CREATE POLICY "Enable delete access for all users" ON experience
    FOR DELETE USING (true);


----------------------------------------------------
-- 4. Create Security Requests Table
----------------------------------------------------
CREATE TABLE IF NOT EXISTS security_requests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_logo TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    armed_required BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours INTEGER NOT NULL,
    hourly_rate INTEGER NOT NULL,
    estimated_payout INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'in-progress', 'completed', 'cancelled')),
    assigned_guard_id TEXT REFERENCES guards(id) ON DELETE SET NULL,
    required_certifications TEXT[] DEFAULT '{}',
    applicants TEXT[] DEFAULT '{}',
    rating_given INTEGER,
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup policies for security_requests
ALTER TABLE security_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON security_requests;
CREATE POLICY "Enable read access for all users" ON security_requests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON security_requests;
CREATE POLICY "Enable insert access for all users" ON security_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON security_requests;
CREATE POLICY "Enable update access for all users" ON security_requests
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON security_requests;
CREATE POLICY "Enable delete access for all users" ON security_requests
    FOR DELETE USING (true);

-- No seed data — see 20260608000000_full_database_reset.sql for the canonical empty schema.
