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
-- 2. Remove any clients accidentally stored in guards table
----------------------------------------------------
-- Delete certifications and experience for client-prefixed IDs in guards
DELETE FROM certifications WHERE guard_id LIKE 'client-%';
DELETE FROM experience WHERE guard_id LIKE 'client-%';
-- Remove client entries from guards table
DELETE FROM guards WHERE id LIKE 'client-%';
-- Remove auditor entries from guards table (auditors don't need a guards row)
DELETE FROM guards WHERE id LIKE 'auditor-%';
