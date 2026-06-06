-- Supabase Migration: 20260606000001_add_staff_role.sql
-- Description: Add staff_role column to guards table for the new Director, Administrator, and Moderator system.

-- 1. Add staff_role column to guards table with a CHECK constraint
ALTER TABLE guards 
ADD COLUMN IF NOT EXISTS staff_role TEXT DEFAULT NULL CHECK (staff_role IN ('Director', 'Administrator', 'Moderator'));

-- 2. Update existing staff guards
-- By default, set guard-1 (Alex Mercer) as Director, matching frontend default fallback
UPDATE guards 
SET staff_role = 'Director' 
WHERE id = 'guard-1' AND staff_role IS NULL;
