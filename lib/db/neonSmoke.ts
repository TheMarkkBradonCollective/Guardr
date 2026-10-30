/**
 * Rolled-back writes used to prove the Neon schema accepts marketplace rows.
 * Uses synthetic ids only. Never commit, and never use a real identity document.
 */
export const NEON_SMOKE_SQL = `
BEGIN;
INSERT INTO guards (id, name, email, badge_number)
VALUES ('neon-smoke-guard', 'Smoke Test Guard', 'neon-smoke-guard@example.com', 'SMK-00001');

INSERT INTO clients (id, name, email, company_name)
VALUES ('neon-smoke-client', 'Smoke Test Client', 'neon-smoke-client@example.com', 'Smoke Client LLC');

INSERT INTO certifications (
  id, guard_id, name, issuer, number, status, issue_date, image_url
) VALUES (
  'neon-smoke-cert',
  'neon-smoke-guard',
  'Guard Card',
  'BSIS',
  'SMOKE-00001',
  'pending',
  CURRENT_DATE,
  'data:text/plain,synthetic-test-document'
);

INSERT INTO security_requests (
  id, title, client_id, client_name, start_date, end_date, assigned_guard_id
) VALUES (
  'neon-smoke-job',
  'Smoke coverage',
  'neon-smoke-client',
  'Smoke Test Client',
  NOW(),
  NOW() + INTERVAL '8 hours',
  'neon-smoke-guard'
);

INSERT INTO guard_availability (id, guard_id, day_of_week, start_time, end_time)
VALUES ('neon-smoke-avail', 'neon-smoke-guard', 1, '08:00', '16:00');

INSERT INTO job_chat_threads (id, request_id, client_id, guard_id)
VALUES ('neon-smoke-thread', 'neon-smoke-job', 'neon-smoke-client', 'neon-smoke-guard');

INSERT INTO job_chat_messages (id, thread_id, sender_id, sender_name, sender_role, body)
VALUES (
  'neon-smoke-msg',
  'neon-smoke-thread',
  'neon-smoke-client',
  'Smoke Test Client',
  'client',
  'Synthetic message'
);

INSERT INTO user_notifications (id, user_id, type, title, body)
VALUES ('neon-smoke-note', 'neon-smoke-guard', 'test', 'Smoke', 'Synthetic notification');

INSERT INTO audit_log (id, actor_id, actor_email, actor_role, action, entity_type, entity_id)
VALUES (
  'neon-smoke-audit',
  'neon-smoke-guard',
  'neon-smoke-guard@example.com',
  'guard',
  'smoke_test',
  'guard',
  'neon-smoke-guard'
);

SELECT
  (SELECT count(*) FROM guards WHERE id = 'neon-smoke-guard') AS guards,
  (SELECT count(*) FROM clients WHERE id = 'neon-smoke-client') AS clients,
  (SELECT count(*) FROM certifications WHERE id = 'neon-smoke-cert') AS certifications,
  (SELECT status FROM certifications WHERE id = 'neon-smoke-cert') AS cert_status,
  (SELECT count(*) FROM security_requests WHERE id = 'neon-smoke-job') AS jobs,
  (SELECT count(*) FROM guard_availability WHERE id = 'neon-smoke-avail') AS availability,
  (SELECT count(*) FROM job_chat_messages WHERE id = 'neon-smoke-msg') AS messages,
  (SELECT count(*) FROM user_notifications WHERE id = 'neon-smoke-note') AS notifications,
  (SELECT count(*) FROM audit_log WHERE id = 'neon-smoke-audit') AS audits;
ROLLBACK;
`.trim();
