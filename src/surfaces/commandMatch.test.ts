import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterCommands,
  groupCommandMatches,
  matchCommand,
} from './desktop/kit/commandMatch.ts';
import type { SurfaceCommand } from './surfaceNavigation.ts';

const command = (
  id: string,
  label: string,
  group = 'Operations',
  keywords?: string[],
): SurfaceCommand => ({ id, label, group, kind: 'navigate', keywords });

const COMMANDS: SurfaceCommand[] = [
  command('jobs', 'Jobs'),
  command('job-approval', 'Job approval settings', 'Platform'),
  command('guards', 'Guards'),
  command('payments', 'Payments', 'Management', ['money', 'payout', 'invoice']),
  command('payment-settings', 'Payment settings', 'Management'),
  command('credentials', 'Credentials'),
  command('audit-log', 'Audit log', 'Management'),
];

describe('matchCommand', () => {
  it('matches a subsequence spread across words', () => {
    // "jas" -> J(ob) a(pproval) s(ettings)
    const match = matchCommand(command('job-approval', 'Job approval settings'), 'jas');
    assert.ok(match);
    assert.deepEqual(match.highlights, [0, 4, 13]);
  });

  it('returns every command for an empty query', () => {
    const match = matchCommand(COMMANDS[0], '   ');
    assert.ok(match);
    assert.equal(match.score, 0);
    assert.deepEqual(match.highlights, []);
  });

  it('rejects a query whose characters are not all present', () => {
    assert.equal(matchCommand(command('jobs', 'Jobs'), 'jobz'), null);
  });

  it('falls back to keywords so a synonym still finds the destination', () => {
    const match = matchCommand(COMMANDS[3], 'money');
    assert.ok(match, '"money" should reach Payments via its keywords');
    assert.equal(match.highlights.length, 0);
  });

  it('falls back to the group name', () => {
    const match = matchCommand(COMMANDS[6], 'management');
    assert.ok(match);
  });

  it('scores a word-start match above a mid-word match', () => {
    const start = matchCommand(command('a', 'Guards'), 'g');
    const middle = matchCommand(command('b', 'Legal'), 'g');
    assert.ok(start && middle);
    assert.ok(start.score > middle.score, 'a leading match should outrank a trailing one');
  });
});

describe('filterCommands', () => {
  it('ranks the exact prefix first', () => {
    const results = filterCommands(COMMANDS, 'jobs');
    assert.equal(results[0].command.id, 'jobs');
  });

  it('prefers the shorter label when both start with the query', () => {
    const results = filterCommands(COMMANDS, 'payment');
    assert.equal(results[0].command.id, 'payments');
    assert.equal(results[1].command.id, 'payment-settings');
  });

  it('drops non-matches', () => {
    const results = filterCommands(COMMANDS, 'zzz');
    assert.equal(results.length, 0);
  });

  it('keeps source order for an empty query so the sidebar and palette agree', () => {
    const results = filterCommands(COMMANDS, '');
    assert.deepEqual(
      results.map((match) => match.command.id),
      COMMANDS.map((entry) => entry.id),
    );
  });

  it('is case insensitive', () => {
    assert.equal(filterCommands(COMMANDS, 'GUARDS')[0].command.id, 'guards');
  });
});

describe('groupCommandMatches', () => {
  it('groups matches under their headings without reordering ranks', () => {
    const groups = groupCommandMatches(filterCommands(COMMANDS, ''));
    assert.deepEqual(
      groups.map((group) => group.group),
      ['Operations', 'Platform', 'Management'],
    );
    assert.deepEqual(
      groups[0].matches.map((match) => match.command.id),
      ['jobs', 'guards', 'credentials'],
    );
  });

  it('buckets commands with no group under Other', () => {
    const groups = groupCommandMatches(
      filterCommands([{ id: 'x', label: 'X', group: '', kind: 'action' }], ''),
    );
    assert.equal(groups[0].group, 'Other');
  });
});
