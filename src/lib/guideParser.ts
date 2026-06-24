import guideMarkdown from '../../docs/guardr-general-guide.md?raw';

export interface GuideBlock {
  type: 'paragraph' | 'list' | 'ordered-list' | 'table' | 'code' | 'hr' | 'italic' | 'h4';
  raw: string;
}

export interface GuideSubsection {
  id: string;
  title: string;
  rawContent: string;
}

export interface GuideSection {
  id: string;
  title: string;
  /** Content that appears before the first ### heading */
  topRaw: string;
  subsections: GuideSubsection[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitAtH3(raw: string): { topRaw: string; subsections: GuideSubsection[] } {
  const lines = raw.split('\n');
  const topLines: string[] = [];
  const subsections: GuideSubsection[] = [];

  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (current) {
        subsections.push({
          id: slugify(current.title),
          title: current.title,
          rawContent: current.lines.join('\n').trim(),
        });
      }
      current = { title: line.slice(4).trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      topLines.push(line);
    }
  }

  if (current) {
    subsections.push({
      id: slugify(current.title),
      title: current.title,
      rawContent: current.lines.join('\n').trim(),
    });
  }

  return { topRaw: topLines.join('\n').trim(), subsections };
}

export function parseGuide(): GuideSection[] {
  const lines = guideMarkdown.split('\n');
  const sections: GuideSection[] = [];

  let currentTitle = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle) {
        const { topRaw, subsections } = splitAtH3(currentLines.join('\n'));
        sections.push({ id: slugify(currentTitle), title: currentTitle, topRaw, subsections });
      }
      currentTitle = line.slice(3).trim();
      currentLines = [];
    } else if (currentTitle) {
      currentLines.push(line);
    }
    // lines before the first ## (preamble) are skipped
  }

  if (currentTitle) {
    const { topRaw, subsections } = splitAtH3(currentLines.join('\n'));
    sections.push({ id: slugify(currentTitle), title: currentTitle, topRaw, subsections });
  }

  return sections;
}
