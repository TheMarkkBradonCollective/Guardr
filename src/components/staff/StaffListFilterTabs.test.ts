import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatStaffListFilterTabLabel } from './StaffListFilterTabs';

describe('StaffListFilterTabs', () => {
  it('shows counts on tabs when greater than zero', () => {
    assert.equal(formatStaffListFilterTabLabel({ id: 'pending_upload', label: 'Pending upload', count: 4 }), 'Pending upload (4)');
    assert.equal(formatStaffListFilterTabLabel({ id: 'pending_review', label: 'Pending review', count: 1 }), 'Pending review (1)');
    assert.equal(formatStaffListFilterTabLabel({ id: 'verified', label: 'Verified', count: 0 }), 'Verified');
    assert.equal(formatStaffListFilterTabLabel({ id: 'all', label: 'All' }), 'All');
  });
});
