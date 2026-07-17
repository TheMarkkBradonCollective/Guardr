import { useCallback, useState } from 'react';
import { useStyletron, styled } from 'baseui';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphMedium } from 'baseui/typography';
import { GuardrButton, GuardrModal } from '../components/baseui';
import { PreviewHeader } from './PreviewHeader';
import { PreviewSideNavigation } from './PreviewSideNavigation';
import { PreviewBottomNavigation } from './PreviewBottomNavigation';
import { PreviewContext } from './PreviewContext';
import type { PreviewContextValue } from './PreviewContext';

const HotKey = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Menlo, Consolas, sans-serif',
  fontSize: '14px',
  color: 'black',
  border: 'solid 1px #ddd',
  borderRadius: '3px',
  width: '24px',
  height: '24px',
  background: '#f6f6f6',
});

interface PreviewLayoutProps {
  contextValue: PreviewContextValue;
  children: React.ReactNode;
}

export function PreviewLayout({ contextValue, children }: PreviewLayoutProps) {
  const [css, theme] = useStyletron();
  const [helpOpen, setHelpOpen] = useState(false);

  const openHelpModal = useCallback(() => setHelpOpen(true), []);

  return (
    <PreviewContext.Provider value={{ ...contextValue, openHelpModal }}>
      <GuardrModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        align="center"
        ariaLabelledBy="preview-help-title"
      >
        <Block padding="scale800">
          <HeadingSmall id="preview-help-title" marginTop={0}>
            Help &amp; navigation
          </HeadingSmall>
          <ParagraphMedium color="contentSecondary">
            This preview mirrors layout patterns from{' '}
            <a href="https://github.com/uber/base-design-docs" target="_blank" rel="noopener noreferrer">
              uber/base-design-docs
            </a>
            : fixed header, accordion sidebar, and scrollable page mocks for every Guardr role.
          </ParagraphMedium>
          <ParagraphMedium>Shortcuts:</ParagraphMedium>
          <ul className={css({ listStyle: 'circle', paddingLeft: theme.sizing.scale800 })}>
            {[
              ['/', 'Focus the search input'],
              ['Click sidebar', 'Jump to a page mock'],
              ['Scroll', 'Browse all screens in sequence'],
            ].map(([key, description]) => (
              <li key={key} className={css({ marginBottom: '4px' })}>
                <HotKey $style={{ marginRight: '8px' }}>{key}</HotKey> {description}
              </li>
            ))}
          </ul>
          <ParagraphMedium color="contentSecondary">
            Use role and device filters in the header to narrow the page list. Mocks use the same{' '}
            <code>BaseUIProvider</code> stack as production — stock Uber <code>LightTheme</code> /{' '}
            <code>DarkTheme</code> with no live data.
          </ParagraphMedium>
          <Block marginTop="scale600">
            <GuardrButton onClick={() => setHelpOpen(false)}>Got it</GuardrButton>
          </Block>
        </Block>
      </GuardrModal>

      <PreviewHeader />
      <PreviewSideNavigation />
      <main
        className={css({
          marginTop: theme.sizing.scale800,
          [theme.mediaQuery.medium]: {
            marginTop: '84px',
          },
          [theme.mediaQuery.large]: {
            marginLeft: '300px',
          },
          padding: theme.sizing.scale800,
          paddingTop: 0,
        })}
      >
        {children}
      </main>
      <PreviewBottomNavigation />
    </PreviewContext.Provider>
  );
}
