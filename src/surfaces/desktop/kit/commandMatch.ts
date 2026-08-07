import type { SurfaceCommand } from '../../surfaceNavigation';

export interface CommandMatch {
  command: SurfaceCommand;
  score: number;
  /** Character indices in the label that matched, for highlighting. */
  highlights: number[];
}

/**
 * Subsequence match with position-aware scoring.
 *
 * A query matches when its characters appear in order anywhere in the label —
 * "sjb" finds "Staff jobs". Matches at word starts score higher than matches
 * mid-word, and consecutive runs score higher than scattered characters, so
 * "jobs" ranks "Jobs" above "Job approval settings".
 */
export function matchCommand(command: SurfaceCommand, query: string): CommandMatch | null {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return { command, score: 0, highlights: [] };

  const label = command.label.toLowerCase();
  const highlights: number[] = [];
  let score = 0;
  let cursor = 0;
  let previousIndex = -2;

  for (const char of trimmed) {
    const index = label.indexOf(char, cursor);
    if (index === -1) {
      // Fall back to keywords and group so "money" can find "Payments".
      const haystack = [command.group, ...(command.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(trimmed) ? { command, score: 1, highlights: [] } : null;
    }

    const atWordStart = index === 0 || label[index - 1] === ' ' || label[index - 1] === '-';
    if (atWordStart) score += 6;
    if (index === previousIndex + 1) score += 4;
    score += 1;

    highlights.push(index);
    previousIndex = index;
    cursor = index + 1;
  }

  // Shorter labels are more likely to be what a short query meant.
  score += Math.max(0, 12 - label.length / 3);
  if (label.startsWith(trimmed)) score += 10;

  return { command, score, highlights };
}

/** Ranked, filtered command list for the palette. */
export function filterCommands(commands: SurfaceCommand[], query: string): CommandMatch[] {
  const matches = commands
    .map((command) => matchCommand(command, query))
    .filter((match): match is CommandMatch => match != null);

  if (query.trim().length === 0) return matches;

  return matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.command.label.localeCompare(b.command.label);
  });
}

/** Groups ranked matches under their palette headings, preserving rank order. */
export function groupCommandMatches(matches: CommandMatch[]): { group: string; matches: CommandMatch[] }[] {
  const order: string[] = [];
  const buckets = new Map<string, CommandMatch[]>();

  for (const match of matches) {
    const group = match.command.group || 'Other';
    if (!buckets.has(group)) {
      buckets.set(group, []);
      order.push(group);
    }
    buckets.get(group)!.push(match);
  }

  return order.map((group) => ({ group, matches: buckets.get(group)! }));
}
