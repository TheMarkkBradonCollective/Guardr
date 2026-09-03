-- Licensed security companies (PPOs) as a third client account type.
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_client_type_check;
ALTER TABLE clients ADD CONSTRAINT clients_client_type_check
  CHECK (client_type IN ('personal', 'business', 'security-company'));
