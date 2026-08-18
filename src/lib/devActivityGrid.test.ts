import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseDevActivityGrid } from './devActivityGrid';

const DEV_UPDATES_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../docs/DEV-UPDATES.md');

function latestDatedSection(markdown: string): string {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) =>
    /^##\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),/i.test(line)
  );
  assert.ok(start >= 0, 'DEV-UPDATES.md needs a dated ## Weekday, Month D, YYYY heading');
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

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

  it('requires the latest dated DEV-UPDATES day to have Time rows for the activity cloud', () => {
    const markdown = readFileSync(DEV_UPDATES_PATH, 'utf8');
    assert.match(
      markdown,
      /\*\*Last updated:\*\*\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),/,
      'DEV-UPDATES.md must keep Last updated as a weekday date'
    );
    const section = latestDatedSection(markdown);
    assert.match(
      section,
      /\|\s*\*{0,2}\d{1,2}:\d{2}\s*(AM|PM)/i,
      'Latest dated day heading needs a | Time | What shipped | table so /update clouds the heatmap'
    );
    const grid = parseDevActivityGrid(markdown);
    assert.ok(
      grid.flat().reduce((sum, n) => sum + n, 0) > 0,
      'Parsed activity grid should not be empty'
    );
    assert.ok(grid[2][8] >= 4, 'Tuesday 8 AM should include Aug 18 personal/business commits');
    assert.ok(grid[2][9] >= 3, 'Tuesday 9 AM should include fee tables, frozen prices, and credential work');
    assert.ok(grid[5][2] >= 1, 'Friday 2 AM should include the v1.0.123 /update commits');
  });
});
