import React from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { X } from 'lucide-react';
import { GuardrButton } from '../../baseui/GuardrButton';
import { AppOverlaySheet } from '../motion/AppMotion';

interface AppFormSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

/** Bottom sheet for forms — Base Web chrome, overlay stack integrated. */
export function AppFormSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  ariaLabel,
}: AppFormSheetProps) {
  return (
    <AppOverlaySheet open={open} onClose={onClose} ariaLabel={ariaLabel ?? title}>
      <Block display="flex" flexDirection="column" maxHeight="90dvh">
        <Block display="flex" justifyContent="center" paddingTop="scale400" paddingBottom="scale200" aria-hidden>
          <Block
            width="40px"
            height="3px"
            backgroundColor="borderOpaque"
            overrides={{ Block: { style: { borderRadius: '999px', margin: '0 auto' } } }}
          />
        </Block>

        <Block
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          gridGap="scale400"
          paddingTop="scale400"
          paddingBottom="scale600"
          paddingLeft="scale800"
          paddingRight="scale800"
          overrides={{
            Block: {
              style: {
                flexShrink: 0,
                borderBottom: '1px solid',
                borderColor: 'borderOpaque',
              },
            },
          }}
        >
          <Block flex="1" minWidth={0}>
            <HeadingSmall id="app-form-sheet-title" marginTop={0} marginBottom={0}>
              {title}
            </HeadingSmall>
            {subtitle ? (
              <ParagraphSmall marginTop="scale200" marginBottom={0} color="contentSecondary">
                {subtitle}
              </ParagraphSmall>
            ) : null}
          </Block>
          <GuardrButton
            kind="tertiary"
            size="compact"
            onClick={onClose}
            aria-label="Close"
            overrides={{ BaseButton: { style: { minWidth: '40px', minHeight: '40px', padding: '8px' } } }}
          >
            <X className="w-4 h-4" />
          </GuardrButton>
        </Block>

        <Block flex="1" minHeight={0} overflow="auto" padding="scale800">
          {children}
        </Block>
      </Block>
    </AppOverlaySheet>
  );
}
