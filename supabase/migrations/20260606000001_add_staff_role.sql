-- Supabase Migration: 20260606000001_add_staff_role.sql
-- Description: Add staff_role column to guards table for the new Director, Administrator, and Moderator system.

-- 1. Safe creation of column and check constraint
DO $$
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='guards' AND column_name='staff_role'
    ) THEN
        ALTER TABLE guards ADD COLUMN staff_role TEXT DEFAULT NULL;
    END IF;

    -- Drop constraint if it exists to allow re-running, then recreate it cleanly
    ALTER TABLE guards DROP CONSTRAINT IF EXISTS guards_staff_role_check;
    ALTER TABLE guards ADD CONSTRAINT guards_staff_role_check CHECK (staff_role IN ('Director', 'Administrator', 'Moderator'));
END $$;

-- 2. Update existing staff guards
-- By default, set guard-1 (Alex Mercer) as Director, matching frontend default fallback
UPDATE guards 
SET staff_role = 'Director' 
WHERE id = 'guard-1' AND staff_role IS NULL;
