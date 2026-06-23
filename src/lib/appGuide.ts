import guideMarkdown from '../../docs/guardr-general-guide.md?raw';

export type GuideAudience = 'staff' | 'guard' | 'client' | 'all';

export const GUIDE_TITLE = 'Guardr — General Guide';

export function getGuideMarkdown(audience: GuideAudience = 'all'): string {
  if (audience === 'all') return guideMarkdown;

  const heading =
    audience === 'client'
      ? '## Client guide'
      : audience === 'guard'
        ? '## Guard guide'
        : '## Staff guide';

  const start = guideMarkdown.indexOf(heading);
  if (start < 0) return guideMarkdown;

  const rest = guideMarkdown.slice(start + heading.length);
  const nextH2 = rest.search(/\n## /);
  const sectionBody = nextH2 >= 0 ? rest.slice(0, nextH2) : rest;

  const preambleEnd = guideMarkdown.indexOf('---\n\n## Job status lifecycle');
  const preamble =
    preambleEnd >= 0
      ? guideMarkdown.slice(0, guideMarkdown.indexOf('---', preambleEnd + 4) + 4)
      : `# ${GUIDE_TITLE}\n\n`;

  const lifecycleStart = guideMarkdown.indexOf('## Job status lifecycle');
  const lifecycleEnd = guideMarkdown.indexOf('---', lifecycleStart + 1);
  const lifecycle =
    lifecycleStart >= 0 && lifecycleEnd > lifecycleStart
      ? `${guideMarkdown.slice(lifecycleStart, lifecycleEnd + 4)}\n\n`
      : '';

  const sequenceStart = guideMarkdown.indexOf('## End-to-end sequence');
  const quickStart = guideMarkdown.indexOf('## Quick reference by role');
  const helpStart = guideMarkdown.indexOf('## Need help?');
  const tail =
    sequenceStart >= 0
      ? guideMarkdown.slice(sequenceStart)
      : helpStart >= 0
        ? guideMarkdown.slice(quickStart >= 0 ? quickStart : helpStart)
        : '';

  return `${preamble}${lifecycle}${heading}${sectionBody}\n\n${tail}`.trim() + '\n';
}
