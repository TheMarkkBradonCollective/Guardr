import { Fragment, useContext } from 'react';
import { useStyletron } from 'baseui';
import { Button, KIND, SHAPE, SIZE } from 'baseui/button';
import { Book, Console, Help, Logo } from './PreviewIcons';
import { PreviewSearch } from './PreviewSearch';
import { PreviewContext } from './PreviewContext';
import type { PreviewRole } from './pages';
import type { FrameSize } from './AppShell';

const ROLE_OPTIONS: { id: PreviewRole | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'public', label: 'Public' },
  { id: 'client', label: 'Client' },
  { id: 'guard', label: 'Guard' },
  { id: 'staff', label: 'Staff' },
];

const FRAME_OPTIONS: { id: FrameSize; label: string }[] = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
];

function Home() {
  const [css, theme] = useStyletron();
  return (
    <div className={css({ display: 'flex', alignItems: 'center' })}>
      <Logo dark size="22px" />
      <div
        className={css({
          ...theme.typography.DisplayXSmall,
          fontSize: theme.typography.HeadingSmall.fontSize,
          color: theme.colors.white,
          marginLeft: theme.sizing.scale400,
        })}
      >
        Guardr
      </div>
    </div>
  );
}

function Links() {
  const [css, theme] = useStyletron();
  const { openHelpModal } = useContext(PreviewContext);

  return (
    <Fragment>
      <div className={css({ marginLeft: theme.sizing.scale400, marginRight: theme.sizing.scale400 })}>
        <Button
          $as="a"
          href="https://baseweb.design"
          target="_blank"
          rel="noopener noreferrer"
          kind={KIND.tertiary}
          shape={SHAPE.pill}
          size={SIZE.compact}
          title="Open Base Web documentation"
        >
          <Console size="16px" />
          <span
            className={css({
              display: 'none',
              [theme.mediaQuery.small]: {
                display: 'inline-block',
                marginLeft: theme.sizing.scale400,
                whiteSpace: 'nowrap',
              },
            })}
          >
            Base Web
          </span>
        </Button>
      </div>
      <div className={css({ marginRight: theme.sizing.scale400 })}>
        <Button
          $as="a"
          href="https://github.com/uber/base-design-docs"
          target="_blank"
          rel="noopener noreferrer"
          kind={KIND.tertiary}
          shape={SHAPE.pill}
          size={SIZE.compact}
          title="Open Uber base-design-docs"
        >
          <Book size="16px" />
          <span
            className={css({
              display: 'none',
              [theme.mediaQuery.small]: {
                display: 'inline-block',
                marginLeft: theme.sizing.scale400,
              },
            })}
          >
            Base Docs
          </span>
        </Button>
      </div>
      <Button shape={SHAPE.pill} kind={KIND.tertiary} size={SIZE.compact} onClick={openHelpModal}>
        <Help size="16px" />
        <span
          className={css({
            display: 'none',
            [theme.mediaQuery.small]: {
              display: 'inline-block',
              marginLeft: theme.sizing.scale400,
            },
          })}
        >
          Help
        </span>
      </Button>
    </Fragment>
  );
}

function FilterPills() {
  const [css, theme] = useStyletron();
  const { roleFilter, setRoleFilter, frameSize, setFrameSize } = useContext(PreviewContext);

  return (
    <div
      className={css({
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.sizing.scale300,
        width: '100%',
        order: 4,
        paddingTop: theme.sizing.scale300,
        [theme.mediaQuery.medium]: {
          display: 'none',
        },
      })}
    >
      {ROLE_OPTIONS.map((opt) => (
        <Button
          key={opt.id}
          size={SIZE.mini}
          kind={roleFilter === opt.id ? KIND.primary : KIND.secondary}
          shape={SHAPE.pill}
          onClick={() => setRoleFilter(opt.id)}
        >
          {opt.label}
        </Button>
      ))}
      {FRAME_OPTIONS.map((opt) => (
        <Button
          key={opt.id}
          size={SIZE.mini}
          kind={frameSize === opt.id ? KIND.primary : KIND.secondary}
          shape={SHAPE.pill}
          onClick={() => setFrameSize(opt.id)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

export function PreviewHeader() {
  const [css, theme] = useStyletron();
  const { roleFilter, setRoleFilter, frameSize, setFrameSize } = useContext(PreviewContext);

  return (
    <header
      className={css({
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        background: theme.colors.backgroundPrimary,
        height: 'auto',
        minHeight: '124px',
        paddingLeft: theme.sizing.scale800,
        paddingRight: theme.sizing.scale800,
        paddingBottom: theme.sizing.scale400,
        borderBottom: `1px solid ${theme.colors.borderOpaque}`,
        [theme.mediaQuery.medium]: {
          position: 'fixed',
          top: '0',
          zIndex: 2,
          height: '60px',
          minHeight: '60px',
          flexWrap: 'nowrap',
          paddingBottom: 0,
        },
      })}
    >
      <div
        className={css({
          order: 1,
          marginRight: 'auto',
          [theme.mediaQuery.medium]: { flex: '1', marginRight: 0 },
        })}
      >
        <Home />
      </div>
      <div
        className={css({
          order: 3,
          width: '100%',
          alignSelf: 'baseline',
          [theme.mediaQuery.medium]: {
            order: 2,
            flex: '1',
            width: 'auto',
            alignSelf: 'initial',
          },
        })}
      >
        <PreviewSearch />
      </div>
      <div
        className={css({
          order: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          [theme.mediaQuery.medium]: { order: 3, flex: '1' },
        })}
      >
        <div
          className={css({
            display: 'none',
            gap: theme.sizing.scale200,
            marginRight: theme.sizing.scale600,
            [theme.mediaQuery.large]: { display: 'flex' },
          })}
        >
          {ROLE_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              size={SIZE.compact}
              kind={roleFilter === opt.id ? KIND.primary : KIND.tertiary}
              shape={SHAPE.pill}
              onClick={() => setRoleFilter(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
          <div className={css({ width: '1px', height: '24px', background: theme.colors.borderOpaque, margin: `0 ${theme.sizing.scale200}` })} />
          {FRAME_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              size={SIZE.compact}
              kind={frameSize === opt.id ? KIND.primary : KIND.tertiary}
              shape={SHAPE.pill}
              onClick={() => setFrameSize(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Links />
      </div>
      <FilterPills />
    </header>
  );
}
