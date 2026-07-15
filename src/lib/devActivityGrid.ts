const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

function parseTimeToHour(h: number, _m: number, ampm: string): number {
  let hour = h % 12;
  const mer = ampm.toUpperCase();
  if (mer === 'PM') hour += 12;
  if (mer === 'AM' && h === 12) hour = 0;
  return hour;
}

function parseDayOfWeek(heading: string): number | null {
  const match = heading.match(
    /^##\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),/i
  );
  if (!match) return null;
  return DAY_NAMES.findIndex((day) => day.toLowerCase() === match[1].toLowerCase());
}

function emptyActivityGrid(): number[][] {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
}

/** Day-of-week × hour-of-day commit activity (7×24) parsed from dev notes tables. */
export function parseDevActivityGrid(markdown: string): number[][] {
  const grid = emptyActivityGrid();
  let currentDay: number | null = null;
  let sectionHour: number | null = null;

  const add = (day: number, h: number, m: number, ampm: string, count = 1) => {
    grid[day][parseTimeToHour(h, m, ampm)] += count;
  };

  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      const day = parseDayOfWeek(line);
      if (day !== null) currentDay = day;
    }

    const activity = line.match(/\*\*Activity:\*\*\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (activity) {
      sectionHour = parseTimeToHour(Number(activity[1]), Number(activity[2]), activity[3]);
    }

    const section = line.match(/^###\s+.+\((\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (section) {
      sectionHour = parseTimeToHour(Number(section[1]), Number(section[2]), section[3]);
    }

    if (currentDay === null) continue;
    if (line.match(/^\|\s*Time\s*\|/i) || line.match(/^\|\s*[-:| ]+\|/)) continue;

    const boldTime = line.match(/^\|\s*\*{0,2}(\d{1,2}):(\d{2})\s*(AM|PM)\*{0,2}\s*\|/i);
    if (boldTime) {
      add(currentDay, Number(boldTime[1]), Number(boldTime[2]), boldTime[3]);
      continue;
    }

    const plainTime = line.match(/^\|\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*\|/i);
    if (plainTime) {
      add(currentDay, Number(plainTime[1]), Number(plainTime[2]), plainTime[3]);
      continue;
    }

    const range = line.match(/^\|\s*(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})\s*(AM|PM)\s*\|/i);
    if (range) {
      add(currentDay, Number(range[1]), Number(range[2]), range[5]);
      add(currentDay, Number(range[3]), Number(range[4]), range[5]);
      continue;
    }

    if (line.startsWith('- ') && sectionHour !== null) {
      grid[currentDay][sectionHour] += 1;
    }
  }

  return grid;
}
