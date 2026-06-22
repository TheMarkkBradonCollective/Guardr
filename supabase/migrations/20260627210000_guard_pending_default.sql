-- Field guards start pending until staff verifies ID + Guard Card and activates the account.
-- Staff accounts are inserted with user_status = 'active' explicitly in the app.

ALTER TABLE guards ALTER COLUMN user_status SET DEFAULT 'pending';
