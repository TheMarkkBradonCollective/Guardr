-- Remove legacy owner@ account and promote m.white@ to Owner.

UPDATE staff
SET
  staff_role = 'Owner',
  badge_number = 'OWN-00001',
  bio = 'Owner — Platform governance.'
WHERE email = 'm.white@signaturesecurityspecialist.com';

DELETE FROM guard_payout_invoices
WHERE guard_id = 'staff-owner';

DELETE FROM guards
WHERE id = 'staff-owner'
   OR email = 'owner@signaturesecurityspecialist.com';

DELETE FROM push_subscriptions
WHERE user_id = 'staff-owner';

DELETE FROM notification_preferences
WHERE user_id = 'staff-owner';

DELETE FROM staff
WHERE id = 'staff-owner'
   OR email = 'owner@signaturesecurityspecialist.com';
