import React from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, ParagraphMedium } from 'baseui/typography';
import { ComponentShowcase } from '../baseui/showcase';

/** Staff-only live QA surface for Uber Base Web adapters (Phase 6). */
export function StaffDesignQAPanel() {
  return (
    <Block>
      <Block marginBottom="scale600">
        <HeadingMedium marginTop={0} marginBottom="scale300">
          Design QA
        </HeadingMedium>
        <ParagraphMedium color="contentSecondary" marginTop={0}>
          Interactive showcase of production Base Web components. Use alongside{' '}
          <a href="/design-preview.html" target="_blank" rel="noopener noreferrer" className="uber-text-accent">
            design-preview.html
          </a>{' '}
          for full screen mocks.
        </ParagraphMedium>
      </Block>
      <ComponentShowcase compact />
    </Block>
  );
}
