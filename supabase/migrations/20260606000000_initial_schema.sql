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


----------------------------------------------------
-- 5. Seed Initial Data
----------------------------------------------------

-- Seed Guards
INSERT INTO guards (id, name, email, badge_number, avatar, phone, bio, is_armed, background_checked, verified, rating, jobs_completed, hourly_rate_requirement, is_staff, user_status)
VALUES 
('guard-1', 'Alex Mercer', 'alex.mercer@sigsec.com', 'S-77291', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '+1 (555) 432-8819', 'Ex-Military Police Sergeant with 8+ years in private diplomatic escort services and close personal protection. Specialized in high-risk threat assessment and perimeter setup.', true, true, true, 4.9, 34, 45, true, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO guards (id, name, email, badge_number, avatar, phone, bio, is_armed, background_checked, verified, rating, jobs_completed, hourly_rate_requirement, is_staff, user_status)
VALUES 
('guard-2', 'Sarah Jenkins', 's.jenkins@safety.io', 'S-88102', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', '+1 (555) 198-4422', 'Paramedic certified first responder and executive protection specialist. Focuses on tech-conference security and luxury retail safety logistics.', false, true, true, 4.8, 19, 38, false, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO guards (id, name, email, badge_number, avatar, phone, bio, is_armed, background_checked, verified, rating, jobs_completed, hourly_rate_requirement, is_staff, user_status)
VALUES 
('guard-3', 'Liam Vance', 'liam.vance@gmail.com', 'S-22109', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '+1 (555) 887-2104', 'Freshly licensed security personnel with physical training in crowd control. Highly energetic and seeking patrols.', false, true, false, 0.0, 0, 25, false, 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Certifications
INSERT INTO certifications (id, guard_id, name, issuer, number, status, issue_date, expiry_date)
VALUES
('cert-1-1', 'guard-1', 'State Armed Security Officer Guard Card', 'Bureau of Security and Investigative Services', 'G-228192-A', 'verified', '2024-01-15', '2027-01-15'),
('cert-1-2', 'guard-1', 'Tactical Combat Casualty Care (TCCC)', 'NAEMT Association', 'T-881-MS', 'verified', '2025-05-10', '2028-05-10')
ON CONFLICT (id) DO NOTHING;

INSERT INTO certifications (id, guard_id, name, issuer, number, status, issue_date, expiry_date)
VALUES
('cert-2-1', 'guard-2', 'Vessel / Event Security Officer (VSO)', 'U.S. Maritime Guard Academy', 'V-990-21', 'verified', '2023-08-12', '2026-08-12'),
('cert-2-2', 'guard-2', 'Advanced Cardiac Life Support (ACLS)', 'American Heart Association', 'AHA-9938210', 'verified', '2025-02-01', '2027-02-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO certifications (id, guard_id, name, issuer, number, status, issue_date, expiry_date)
VALUES
('cert-3-1', 'guard-3', 'State Unarmed Guard Card License', 'Dept of Public Safety', 'U-77312-X', 'pending', '2026-04-10', '2028-04-10')
ON CONFLICT (id) DO NOTHING;

-- Seed Experience
INSERT INTO experience (id, guard_id, title, company, period, description)
VALUES
('exp-1-1', 'guard-1', 'Tactical Team Lead', 'Vanguard Security Services', '2023 - Present', 'Lead armed vehicle transport team and VIP close protection details for visiting trade ministers.'),
('exp-1-2', 'guard-1', 'Security Operator', 'Blackwood Close Protection', '2020 - 2023', 'Monitored private safehouse perimeters and acted as responsive rapid driver for high-net-worth clients.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO experience (id, guard_id, title, company, period, description)
VALUES
('exp-2-1', 'guard-2', 'High-Value Patrol Agent', 'Securitas International', '2022 - 2024', 'Managed asset sweeps and executive escorts inside high-luxury department stores and museums.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO experience (id, guard_id, title, company, period, description)
VALUES
('exp-3-1', 'guard-3', 'Loss Prevention Specialist', 'Target Retail Group', '2025 - 2026', 'Identified shoplifting coordinates, filed incident reports, and conducted crowd guidance during seasonal sales.')
ON CONFLICT (id) DO NOTHING;

-- Seed Security Requests (Positions)
INSERT INTO security_requests (id, title, description, client_id, client_name, client_logo, location, type, armed_required, start_date, end_date, duration_hours, hourly_rate, estimated_payout, status, assigned_guard_id, required_certifications, applicants)
VALUES
('req-1', 'High-Profile Luxury Fashion Gala Security Detail', 'Provide unarmed security specialists for access control, VIP arrivals, and red-carpet crowd logistics. Business professional suits required. Excellent posture and service communication are mandatory.', 'client-1', 'Sartorial Vanguard Group', 'SV', 'Metropolitan Art Pavilion, New York', 'event', false, '2026-06-15T18:00:00Z', '2026-06-16T01:00:00Z', 7, 50, 350, 'open', NULL, ARRAY['Vessel / Event Security Officer (VSO)', 'First Aid & CPR'], ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

INSERT INTO security_requests (id, title, description, client_id, client_name, client_logo, location, type, armed_required, start_date, end_date, duration_hours, hourly_rate, estimated_payout, status, assigned_guard_id, required_certifications, applicants)
VALUES
('req-2', 'Executive Armed Escort & Asset Protection', 'Armed escort needed to transport high-value jewelry artifacts from local vaults to auction house. Active concealed weapons permit, armed field certification, and military or high-risk private security background are strictly mandatory.', 'client-2', 'Aurelia Fine Gems', 'AG', 'Sotheby Vaults to Midtown Center', 'armed-escort', true, '2026-06-18T10:00:00Z', '2026-06-18T14:00:00Z', 4, 75, 300, 'open', NULL, ARRAY['State Armed Security Officer Guard Card', 'Tactical Combat Casualty Care (TCCC)'], ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

INSERT INTO security_requests (id, title, description, client_id, client_name, client_logo, location, type, armed_required, start_date, end_date, duration_hours, hourly_rate, estimated_payout, status, assigned_guard_id, required_certifications, applicants)
VALUES
('req-3', 'Tech Campus Overnight Asset Protection', 'Conduct vehicle and foot patrols for an offline data depot campus. Safeguard server assets, scan check-ins, and file digital incident sheets.', 'client-3', 'Lumina Systems Inc', 'LS', 'Industrial Park, Building B', 'patrol', false, '2026-06-20T22:00:00Z', '2026-06-21T06:00:00Z', 8, 35, 280, 'assigned', 'guard-1', ARRAY['State Unarmed Guard Card License'], ARRAY['guard-1'])
ON CONFLICT (id) DO NOTHING;
