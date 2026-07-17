import { useContext, useEffect, useRef } from 'react';
import { useStyletron } from 'baseui';
import { Accordion, Panel } from '../components/baseui/baseuiShims';
import { PreviewContext } from './PreviewContext';

export function PreviewSideNavigation() {
  const [css, theme] = useStyletron();
  const activeLink = useRef<HTMLDivElement>(null);
  const { siteMap, activePageId, scrollToPage } = useContext(PreviewContext);

  useEffect(() => {
    activeLink.current?.scrollIntoView({ block: 'center', inline: 'center' });
  }, [activePageId]);

  return (
    <nav
      className={css({
        display: 'none',
        [theme.mediaQuery.large]: {
          position: 'fixed',
          top: '60px',
          width: '300px',
          height: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: theme.sizing.scale800,
          overflowY: 'scroll',
          borderRight: `1px solid ${theme.colors.borderOpaque}`,
          background: theme.colors.backgroundPrimary,
          '::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        },
      })}
    >
      <Accordion>
        {siteMap.map((section) => (
          <Panel title={section.name} key={section.name}>
            {section.children.map((page) => {
              const isActive = page.id === activePageId;
              return (
                <div
                  ref={isActive ? activeLink : null}
                  key={page.id}
                  className={css({
                    padding: `${theme.sizing.scale200} ${theme.sizing.scale400}`,
                    marginLeft: theme.sizing.scale600,
                    marginRight: theme.sizing.scale600,
                    borderRadius: '3px',
                    background: isActive ? theme.colors.backgroundTertiary : 'none',
                  })}
                >
                  <button
                    type="button"
                    onClick={() => scrollToPage(page.id)}
                    className={css({
                      ...theme.typography.ParagraphMedium,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      color: isActive ? theme.colors.contentPrimary : theme.colors.contentTertiary,
                      ':focus-visible': {
                        outline: `solid 2px ${theme.colors.accent}`,
                        outlineOffset: '2px',
                      },
                      ':hover': {
                        color: theme.colors.contentPrimary,
                      },
                    })}
                  >
                    {page.title}
                  </button>
                </div>
              );
            })}
          </Panel>
        ))}
      </Accordion>
    </nav>
  );
}
