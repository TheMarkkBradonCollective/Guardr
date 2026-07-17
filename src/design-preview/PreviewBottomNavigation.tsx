import { useContext } from 'react';
import { useStyletron } from 'baseui';
import { Grid, Cell } from 'baseui/layout-grid';
import { PreviewContext } from './PreviewContext';

export function PreviewBottomNavigation() {
  const [css, theme] = useStyletron();
  const { siteMap, activePageId, scrollToPage } = useContext(PreviewContext);

  return (
    <nav
      className={css({
        ...theme.typography.ParagraphMedium,
        paddingTop: theme.sizing.scale800,
        paddingBottom: theme.sizing.scale1200,
        paddingLeft: theme.sizing.scale800,
        paddingRight: theme.sizing.scale800,
        borderTop: `1px solid ${theme.colors.borderOpaque}`,
        [theme.mediaQuery.large]: {
          display: 'none',
        },
      })}
    >
      <Grid gridGaps={[24]}>
        {siteMap.map((section) => (
          <Cell key={section.name} span={[2, 2, 3]}>
            <div>
              <div
                className={css({
                  ...theme.typography.DisplayXSmall,
                  fontSize: theme.typography.LabelLarge.fontSize,
                  padding: theme.sizing.scale400,
                })}
              >
                {section.name}
              </div>
              <div>
                {section.children.map((page) => (
                  <div
                    key={page.id}
                    className={css({
                      padding: `${theme.sizing.scale200} ${theme.sizing.scale400}`,
                      borderRadius: '3px',
                      background: activePageId === page.id ? theme.colors.backgroundTertiary : undefined,
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
                        color:
                          activePageId === page.id
                            ? theme.colors.contentPrimary
                            : theme.colors.contentTertiary,
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
                ))}
              </div>
            </div>
          </Cell>
        ))}
      </Grid>
    </nav>
  );
}
