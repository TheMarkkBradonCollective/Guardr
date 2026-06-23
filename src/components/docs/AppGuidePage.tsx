import React from 'react';
import { MarkdownDoc } from './MarkdownDoc';
import { getGuideMarkdown, type GuideAudience } from '../../lib/appGuide';
import { AppScreen, AppSection } from '../ui/app/AppPrimitives';

interface AppGuidePageProps {
  audience?: GuideAudience;
}

const AUDIENCE_SUBTITLE: Record<Exclude<GuideAudience, 'all'>, string> = {
  staff: 'Staff operations — start to finish',
  client: 'Your path from posting a job to confirming coverage',
  guard: 'Your path from applying to getting paid',
};

export function AppGuidePage({ audience = 'all' }: AppGuidePageProps) {
  const markdown = getGuideMarkdown(audience);
  const subtitle =
    audience === 'all' ? 'Start to finish for clients, guards, and staff' : AUDIENCE_SUBTITLE[audience];

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain">
      <p className="text-sm text-brand-text-muted px-5 pt-2 pb-4">{subtitle}</p>
      <AppSection title="How Guardr works">
        <MarkdownDoc source={markdown} />
      </AppSection>
    </AppScreen>
  );
}
