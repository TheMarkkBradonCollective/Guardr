import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDevActivityGrid } from './devActivityGrid';

describe('parseDevActivityGrid', () => {
  it('maps commit times to day-of-week and hour buckets', () => {
    const markdown = `
## Saturday, June 6, 2026 — Day one

| Time | What shipped |
|------|----------------|
| 2:49 PM | Initial commit |
| 3:15 PM | Supabase auth |

## Sunday, June 7, 2026 — MVP day

| Time | What shipped |
|------|----------------|
| 11:04 AM | MVP to spec |
| 12:12 PM | Fixed phantom data |
`;

    const grid = parseDevActivityGrid(markdown);

    assert.equal(grid[6][14], 1, 'Saturday 2 PM has one commit');
    assert.equal(grid[6][15], 1, 'Saturday 3 PM has one commit');
    assert.equal(grid[0][11], 1, 'Sunday 11 AM has one commit');
    assert.equal(grid[0][12], 1, 'Sunday 12 PM has one commit');
    assert.equal(grid[1][9], 0, 'Monday 9 AM has no commits');
  });

  it('ignores rows before a dated day heading', () => {
    const markdown = `
| Time | What shipped |
|------|----------------|
| 9:00 AM | Orphan row |

## Monday, June 8, 2026

| Time | What shipped |
|------|----------------|
| 5:03 AM | Uber driver UI |
`;

    const grid = parseDevActivityGrid(markdown);
    assert.equal(grid.flat().reduce((sum, n) => sum + n, 0), 1);
    assert.equal(grid[1][5], 1, 'Monday 5 AM has one commit');
  });
});
