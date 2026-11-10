import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const barrel = readFileSync(join(here, 'index.css'), 'utf8');
const main = readFileSync(join(here, '../../main.tsx'), 'utf8');

const sheets = [
  'ws-pub.css',
  'ws-acc.css',
  'ws-grd.css',
  'ws-clt.css',
  'ws-stf-ops.css',
  'ws-stf-comms.css',
  'ws-stf-fin.css',
  'ws-app.css',
];

describe('redesign CSS ownership', () => {
  it('imports each workstream sheet once from the barrel', () => {
    for (const sheet of sheets) {
      const marker = `@import './${sheet}';`;
      assert.equal(barrel.split(marker).length - 1, 1, marker);
      assert.ok(readFileSync(join(here, sheet), 'utf8').length > 0);
    }
  });

  it('lets the app load the barrel and not the individual sheets', () => {
    assert.match(main, /import '\.\/styles\/redesign\/index\.css';/);
    for (const sheet of sheets) {
      assert.equal(main.includes(`styles/redesign/${sheet}`), false);
    }
  });
});
