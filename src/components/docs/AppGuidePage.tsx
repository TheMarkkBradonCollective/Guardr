import React, { useEffect, useState } from 'react';
import { MarkdownDoc } from './MarkdownDoc';
import { getGuideMarkdown, type GuideAudience } from '../../lib/appGuide';
import { AppScreen, AppSection, AppSegmentedControl } from '../ui/app/AppPrimitives';

interface AppGuidePageProps {
  audience?: GuideAudience;
}

const AUDIENCE_SUBTITLE: Record<Exclude<GuideAudience, 'all'>, string> = {
  staff: 'Staff operations — start to finish',
  client: 'Your path from posting a job to confirming coverage',
  guard: 'Your path from applying to getting paid',
};

const GUIDE_TABS: { id: GuideAudience; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'client', label: 'Clients' },
  { id: 'guard', label: 'Guards' },
  { id: 'staff', label: 'Staff' },
];

export function AppGuidePage({ audience = 'all' }: AppGuidePageProps) {
  const [selectedAudience, setSelectedAudience] = useState<GuideAudience>(audience);

  useEffect(() => {
    setSelectedAudience(audience);
  }, [audience]);

  const markdown = getGuideMarkdown(selectedAudience);
  const subtitle =
    selectedAudience === 'all'
      ? 'Start to finish for clients, guards, and staff'
      : AUDIENCE_SUBTITLE[selectedAudience];

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain">
      <div className="px-5 pt-2 pb-4 space-y-3">
        <AppSegmentedControl options={GUIDE_TABS} value={selectedAudience} onChange={setSelectedAudience} />
        <p className="text-sm text-brand-text-muted">{subtitle}</p>
      </div>
      <AppSection title="How Guardr works">
        <MarkdownDoc source={markdown} />
      </AppSection>
    </AppScreen>
  );
}
