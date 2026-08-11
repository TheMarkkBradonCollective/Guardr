import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  USER_MANUALS,
  manualsForAudience,
  manualsForPlatformRole,
  resolveManualAudience,
  resolveManualPdfUrl,
} from './userManuals.ts';

describe('userManuals', () => {
  it('exposes site-root PDF hrefs under /manuals', () => {
    for (const manual of USER_MANUALS) {
      assert.match(manual.href, /^\/manuals\/.+\.pdf$/);
      assert.equal(manual.href.endsWith(manual.fileName), true);
    }
  });

  it('resolves PDF URLs for download (web-relative path)', () => {
    const url = resolveManualPdfUrl('/manuals/Guardr-Quick-Start.pdf');
    assert.match(url, /\/manuals\/Guardr-Quick-Start\.pdf$/);
  });

  it('filters manuals by audience', () => {
    const client = manualsForAudience('client').map((m) => m.id);
    assert.deepEqual(client, ['quick-start', 'client']);

    const guard = manualsForAudience('guard').map((m) => m.id);
    assert.deepEqual(guard, ['quick-start', 'guard']);

    const staff = manualsForAudience('staff').map((m) => m.id);
    assert.ok(staff.includes('staff'));
    assert.ok(staff.includes('combined'));
  });

  it('maps guide/staff roles to manual audiences', () => {
    assert.equal(resolveManualAudience('client'), 'client');
    assert.equal(resolveManualAudience('guard'), 'guard');
    assert.equal(resolveManualAudience('moderator'), 'staff');
    assert.equal(resolveManualAudience('owner'), 'staff');
    assert.equal(resolveManualAudience(undefined), 'all');
    assert.ok(manualsForPlatformRole('guard').some((m) => m.id === 'guard'));
  });
});
