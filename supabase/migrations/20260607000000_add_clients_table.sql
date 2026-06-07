-- Supabase Migration: 20260607000000_add_clients_table.sql
-- Description: Create a dedicated clients table, separate from guards.
--              Clients are businesses/individuals who post security shift requests.
--              Guards are licensed security professionals who accept those shifts.

----------------------------------------------------
-- 1. Create Clients Table
----------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    total_requests INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and open policies for sandbox access
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
CREATE POLICY "Enable read access for all users" ON clients
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON clients;
CREATE POLICY "Enable insert access for all users" ON clients
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON clients;
CREATE POLICY "Enable update access for all users" ON clients
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON clients;
CREATE POLICY "Enable delete access for all users" ON clients
    FOR DELETE USING (true);


----------------------------------------------------
-- 2. Seed Initial Client Accounts
----------------------------------------------------
INSERT INTO clients (id, name, email, company_name, phone, avatar, total_requests)
VALUES
(
    'client-1',
    'James Harrington',
    'james@apexholdings.com',
    'Apex Holdings LLC',
    '+1 (212) 555-0101',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    2
),
(
    'client-2',
    'Priya Sharma',
    'priya@prismevents.co',
    'Prism Events Co.',
    '+1 (310) 555-0202',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    1
),
(
    'client-3',
    'Derek Boucher',
    'derek@pinnacle-re.com',
    'PinnacleRE Group',
    '+1 (305) 555-0303',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    1
)
ON CONFLICT (id) DO NOTHING;


----------------------------------------------------
-- 3. Seed Sample Security Requests (linked to clients)
----------------------------------------------------
INSERT INTO security_requests (id, title, description, client_id, client_name, client_logo, location, type, armed_required, start_date, end_date, duration_hours, hourly_rate, estimated_payout, status, assigned_guard_id, required_certifications, applicants)
VALUES
(
    'req-demo-1',
    'Corporate Gala — Armed Escort & Perimeter',
    'High-profile private gala for 200+ executives. Requires armed personnel for perimeter control, VIP escort, and access point management. Black tie venue, professional appearance mandatory.',
    'client-1',
    'Apex Holdings LLC',
    'AH',
    'The Ritz-Carlton, Downtown Chicago',
    'event',
    true,
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days' + INTERVAL '6 hours',
    6,
    55,
    330,
    'open',
    NULL,
    ARRAY['State Armed Security Officer Guard Card', 'Executive Close Protection Certified (ECP)'],
    ARRAY[]::text[]
),
(
    'req-demo-2',
    'Music Festival — Event Security Crew',
    'Two-day outdoor music festival. Need unarmed security staff for crowd management, backstage access control, and artist protection corridors.',
    'client-2',
    'Prism Events Co.',
    'PE',
    'Riverside Amphitheater, Austin TX',
    'event',
    false,
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days' + INTERVAL '10 hours',
    10,
    38,
    380,
    'open',
    NULL,
    ARRAY['State Unarmed Guard Card License', 'Vessel / Event Security Officer (VSO)'],
    ARRAY[]::text[]
),
(
    'req-demo-3',
    'Commercial Office — Overnight Patrol',
    'Long-term overnight patrol contract for a Class-A office tower. Requires professional conduct, incident logging, and daily activity report submission.',
    'client-3',
    'PinnacleRE Group',
    'PR',
    '400 Brickell Ave, Miami FL',
    'patrol',
    false,
    NOW() + INTERVAL '1 day' + INTERVAL '22 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '6 hours',
    8,
    35,
    280,
    'open',
    NULL,
    ARRAY['State Unarmed Guard Card License', 'First Aid & CPR / AED'],
    ARRAY[]::text[]
),
(
    'req-demo-4',
    'Celebrity VIP Bodyguard Detail',
    'Personal protection detail for visiting performer. Must hold ECP certification and armed permit.',
    'client-1',
    'Apex Holdings LLC',
    'AH',
    'Madison Square Garden, New York NY',
    'bodyguard',
    true,
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '10 days' + INTERVAL '12 hours',
    12,
    75,
    900,
    'open',
    NULL,
    ARRAY['State Armed Security Officer Guard Card', 'Executive Close Protection Certified (ECP)', 'First Aid & CPR / AED'],
    ARRAY[]::text[]
)
ON CONFLICT (id) DO NOTHING;


----------------------------------------------------
-- 4. Remove any clients accidentally stored in guards table
----------------------------------------------------
-- Delete certifications and experience for client-prefixed IDs in guards
DELETE FROM certifications WHERE guard_id LIKE 'client-%';
DELETE FROM experience WHERE guard_id LIKE 'client-%';
-- Remove client entries from guards table
DELETE FROM guards WHERE id LIKE 'client-%';
-- Remove auditor entries from guards table (auditors don't need a guards row)
DELETE FROM guards WHERE id LIKE 'auditor-%';
