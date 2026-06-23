import React from 'react';
import { MarkdownDoc } from './MarkdownDoc';
import { getWorkflowMarkdown, WORKFLOW_SOURCE_PATH, type WorkflowAudience } from '../../lib/appWorkflow';
import { AppScreen, AppSection } from '../ui/app/AppPrimitives';

interface AppWorkflowPageProps {
  audience?: WorkflowAudience;
}

const AUDIENCE_SUBTITLE: Record<Exclude<WorkflowAudience, 'all'>, string> = {
  staff: 'Staff operations — start to finish',
  client: 'Your path from posting a job to confirming coverage',
  guard: 'Your path from applying to getting paid',
};

export function AppWorkflowPage({ audience = 'all' }: AppWorkflowPageProps) {
  const markdown = getWorkflowMarkdown(audience);
  const subtitle =
    audience === 'all' ? 'Start to finish for clients, guards, and staff' : AUDIENCE_SUBTITLE[audience];

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain">
      <p className="text-sm text-brand-text-muted px-5 pt-2 pb-4">{subtitle}</p>
      <AppSection title="How Guardr works">
        <MarkdownDoc source={markdown} />
        <p className="mt-10 pt-6 border-t border-brand-border text-xs text-brand-text-muted leading-relaxed">
          Source: <code className="text-brand-text">{WORKFLOW_SOURCE_PATH}</code>. Update that file to keep this
          guide in sync across the app.
        </p>
      </AppSection>
    </AppScreen>
  );
}
