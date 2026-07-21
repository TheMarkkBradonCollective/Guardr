import guideMarkdown from '../../docs/guardr-general-guide.md?raw';

export type GuideAudience =
  | 'staff'
  | 'guard'
  | 'client'
  | 'support'
  | 'moderator'
  | 'administrator'
  | 'director'
  | 'founder'
  | 'all';

export const GUIDE_TITLE = 'Guardr — Guide';

const ROLE_HEADINGS: Record<Exclude<GuideAudience, 'staff' | 'all'>, string> = {
  client: '## Client guide',
  guard: '## Guard guide',
  support: '## Support guide',
  moderator: '## Moderator guide',
  administrator: '## Administrator guide',
  director: '## Director guide',
  founder: '## Founder guide',
};

export function getGuideMarkdown(audience: GuideAudience = 'all'): string {
  if (audience === 'all' || audience === 'staff') return guideMarkdown;

  const heading = ROLE_HEADINGS[audience];
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

  const wholeAppStart = guideMarkdown.indexOf('## Whole app — start to finish');
  const wholeAppEnd = guideMarkdown.indexOf('---', wholeAppStart + 1);
  const wholeApp =
    wholeAppStart >= 0 && wholeAppEnd > wholeAppStart
      ? `${guideMarkdown.slice(wholeAppStart, wholeAppEnd + 4)}\n\n`
      : '';

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

  return `${preamble}${wholeApp}${lifecycle}${heading}${sectionBody}\n\n${tail}`.trim() + '\n';
}
