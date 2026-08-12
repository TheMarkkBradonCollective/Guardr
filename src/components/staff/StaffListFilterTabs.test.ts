import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatStaffListFilterTabLabel } from './StaffListFilterTabs';

describe('StaffListFilterTabs', () => {
  it('shows tab labels without numeric counts', () => {
    assert.equal(formatStaffListFilterTabLabel({ id: 'pending_upload', label: 'Pending upload', count: 4 }), 'Pending upload');
    assert.equal(formatStaffListFilterTabLabel({ id: 'open', label: 'Open', count: 12 }), 'Open');
    assert.equal(formatStaffListFilterTabLabel({ id: 'all', label: 'All' }), 'All');
  });
});
