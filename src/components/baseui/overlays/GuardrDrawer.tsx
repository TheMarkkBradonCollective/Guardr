import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphMedium } from 'baseui/typography';
import { Drawer } from '../baseuiShims';
import { GuardrButton } from '../GuardrButton';
import { X } from 'lucide-react';
import { drawerOverrides } from './overlayStyles';
import { useOverlayCloseGate, useReturnFocusOnClose } from './overlayStack';

export interface GuardrDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Left sidebar drawer with slide-in */
export function GuardrDrawer({ open, onClose, title, subtitle, children, footer }: GuardrDrawerProps) {
  const gatedClose = useOverlayCloseGate(open, onClose);
  useReturnFocusOnClose(open);

  return (
    <Drawer
      isOpen={open}
      anchor="left"
      size="auto"
      animate
      autoFocus
      closeable={false}
      showBackdrop
      onClose={() => gatedClose()}
      onBackdropClick={() => gatedClose()}
      onEscapeKeyDown={(e) => {
        e.preventDefault();
        gatedClose();
      }}
      overrides={drawerOverrides({ zIndex: 2100 })}
    >
      <Block
        display="flex"
        flexDirection="column"
        height="100%"
        className="sidebar-drawer-panel"
        role="dialog"
        aria-label={title}
      >
        <Block
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gridGap="scale400"
          paddingTop="scale800"
          paddingBottom="scale600"
          paddingLeft="scale800"
          paddingRight="scale800"
          backgroundColor="backgroundPrimary"
          overrides={{
            Block: {
              style: {
                flexShrink: 0,
                borderBottom: '1px solid',
                borderColor: 'borderOpaque',
                paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
              },
            },
          }}
        >
          <Block minWidth={0}>
            {subtitle ? (
              <LabelSmall
                $style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'contentSecondary',
                  marginBottom: '4px',
                  fontWeight: 700,
                }}
              >
                {subtitle}
              </LabelSmall>
            ) : null}
            <ParagraphMedium margin={0} $style={{ fontWeight: 900, fontSize: '20px', lineHeight: '24px' }}>
              {title}
            </ParagraphMedium>
          </Block>
          <GuardrButton
            kind="tertiary"
            size="compact"
            onClick={gatedClose}
            aria-label="Close sidebar"
            overrides={{ BaseButton: { style: { minWidth: '40px', minHeight: '40px', padding: '8px' } } }}
          >
            <X className="w-4 h-4" />
          </GuardrButton>
        </Block>
        <Block flex="1" minHeight={0} overflow="auto" padding="scale200" paddingBottom="scale800">
          {children}
        </Block>
        {footer ? (
          <Block
            padding="scale600"
            backgroundColor="backgroundPrimary"
            overrides={{
              Block: {
                style: {
                  flexShrink: 0,
                  borderTop: '1px solid',
                  borderColor: 'borderOpaque',
                },
              },
            }}
          >
            {footer}
          </Block>
        ) : null}
      </Block>
    </Drawer>
  );
}
