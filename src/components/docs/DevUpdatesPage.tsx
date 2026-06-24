import React from 'react';
import devUpdatesMarkdown from '../../../docs/DEV-UPDATES.md?raw';
import { MarkdownDoc } from './MarkdownDoc';
import { AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';

export function DevUpdatesPage() {
  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain max-w-3xl">
      <AppScreenTitle>Dev notes</AppScreenTitle>
      <div className="px-4 pb-8">
        <MarkdownDoc source={devUpdatesMarkdown} />
      </div>
    </AppScreen>
  );
}
