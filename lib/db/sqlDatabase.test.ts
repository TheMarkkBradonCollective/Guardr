import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqlDatabase } from './sqlDatabase.ts';

test('parameterized database query forwards SQL and parameters and returns rows', async () => {
  let receivedSql = '';
  let receivedParams: unknown[] = [];
  const db = createSqlDatabase(async (sql, params = []) => {
    receivedSql = sql;
    receivedParams = params;
    return { rows: [{ event_id: 'evt_test' }], rowCount: 1 };
  });

  const result = await db.query(
    'SELECT event_id FROM stripe_webhook_events WHERE event_id = $1',
    ['evt_test']
  );

  assert.equal(receivedSql, 'SELECT event_id FROM stripe_webhook_events WHERE event_id = $1');
  assert.deepEqual(receivedParams, ['evt_test']);
  assert.deepEqual(result.data, [{ event_id: 'evt_test' }]);
  assert.equal(result.error, null);
});

test('parameterized database query reports driver errors', async () => {
  const db = createSqlDatabase(async () => {
    throw new Error('database unavailable');
  });

  const result = await db.query('SELECT 1');
  assert.equal(result.data, null);
  assert.equal(result.error?.message, 'database unavailable');
});
