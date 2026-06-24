import React from 'react';
import devUpdatesMarkdown from '../../../docs/DEV-UPDATES.md?raw';
import { MarkdownDoc } from './MarkdownDoc';
import { AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';

export function DevUpdatesPage() {
  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain max-w-3xl">
      <AppScreenTitle>Dev updates</AppScreenTitle>
      <div className="px-4 pb-8">
        <p className="text-xs text-brand-text-muted mb-6 leading-relaxed">
          Release notes from the development team. This page is visible to Director and Owner roles only.
        </p>
        <MarkdownDoc source={devUpdatesMarkdown} />
      </div>
    </AppScreen>
  );
}
