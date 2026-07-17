import { useCallback, useState } from 'react';
import { useStyletron, styled } from 'baseui';
import { Modal, ModalHeader, ModalBody } from 'baseui/modal';
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
      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        closeable
        animate
        autoFocus
      >
        <ModalHeader>Help &amp; navigation</ModalHeader>
        <ModalBody>
          <p>
            This preview mirrors the layout from{' '}
            <a href="https://github.com/uber/base-design-docs" target="_blank" rel="noopener noreferrer">
              uber/base-design-docs
            </a>
            : fixed header, accordion sidebar, and scrollable page mocks for every Guardr role.
          </p>
          <p>Shortcuts:</p>
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
          <p>
            Use role and device filters in the header to narrow the page list. Each mock uses Base Web{' '}
            <code>DarkThemeMove</code> inside an in-app shell — no production data.
          </p>
        </ModalBody>
      </Modal>

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
