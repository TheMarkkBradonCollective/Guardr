import workflowMarkdown from '../../docs/guardr-full-app-workflow.md?raw';

export type WorkflowAudience = 'staff' | 'guard' | 'client' | 'all';

export const WORKFLOW_TITLE = 'Guardr — Full App Workflow';
export const WORKFLOW_SOURCE_PATH = 'docs/guardr-full-app-workflow.md';

export function getWorkflowMarkdown(audience: WorkflowAudience = 'all'): string {
  if (audience === 'all') return workflowMarkdown;

  const heading =
    audience === 'client'
      ? '## Client workflow'
      : audience === 'guard'
        ? '## Guard workflow'
        : '## Staff workflow';

  const start = workflowMarkdown.indexOf(heading);
  if (start < 0) return workflowMarkdown;

  const rest = workflowMarkdown.slice(start + heading.length);
  const nextH2 = rest.search(/\n## /);
  const sectionBody = nextH2 >= 0 ? rest.slice(0, nextH2) : rest;

  const preambleEnd = workflowMarkdown.indexOf('---\n\n## Job status lifecycle');
  const preamble =
    preambleEnd >= 0
      ? workflowMarkdown.slice(0, workflowMarkdown.indexOf('---', preambleEnd + 4) + 4)
      : `# ${WORKFLOW_TITLE}\n\n`;

  const lifecycleStart = workflowMarkdown.indexOf('## Job status lifecycle');
  const lifecycleEnd = workflowMarkdown.indexOf('---', lifecycleStart + 1);
  const lifecycle =
    lifecycleStart >= 0 && lifecycleEnd > lifecycleStart
      ? `${workflowMarkdown.slice(lifecycleStart, lifecycleEnd + 4)}\n\n`
      : '';

  const sequenceStart = workflowMarkdown.indexOf('## End-to-end sequence');
  const quickStart = workflowMarkdown.indexOf('## Quick reference by role');
  const helpStart = workflowMarkdown.indexOf('## Need help?');
  const tail =
    sequenceStart >= 0
      ? workflowMarkdown.slice(sequenceStart)
      : helpStart >= 0
        ? workflowMarkdown.slice(quickStart >= 0 ? quickStart : helpStart)
        : '';

  return `${preamble}${lifecycle}${heading}${sectionBody}\n\n${tail}`.trim() + '\n';
}
