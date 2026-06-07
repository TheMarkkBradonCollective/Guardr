-- Supabase Migration: 20260606000002_cleanup_non_directors.sql
-- Description: Clean up all initial non-director users/guards from the live database.

-- Delete all security requests / jobs so they started blank
DELETE FROM security_requests;

-- Delete related certifications of other guards
DELETE FROM certifications WHERE guard_id != 'guard-1';

-- Delete related experiences of other guards
DELETE FROM experience WHERE guard_id != 'guard-1';

-- Delete other guards
DELETE FROM guards WHERE id != 'guard-1';

-- Update guard-1 to have staff_role = 'Director' and is_staff = true explicitly to be absolutely sure
UPDATE guards 
SET staff_role = 'Director', is_staff = true 
WHERE id = 'guard-1';
