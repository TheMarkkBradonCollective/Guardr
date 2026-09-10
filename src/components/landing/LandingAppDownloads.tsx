import React from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { LogIn, UserPlus } from 'lucide-react';
import { GuardrButton } from '../baseui/GuardrButton';
import type { FormFactor } from '../../lib/platform/device';
import { FONT_DISPLAY } from '../../theme/typography';
import { Capacitor } from '@capacitor/core';
import type { AuthViewRole } from '../../lib/appNavigation';

const HEADING_FONT = FONT_DISPLAY;

interface LandingAppDownloadsProps {
  formFactor: FormFactor;
  variant?: 'hero' | 'cta';
  id?: string;
  onNavigateToAuth: (role?: AuthViewRole, mode?: 'sign-in' | 'sign-up') => void;
}

export function LandingAppDownloads({
  formFactor,
  variant = 'hero',
  id,
  onNavigateToAuth,
}: LandingAppDownloadsProps) {
  const [, theme] = useStyletron();

  if (Capacitor.isNativePlatform()) {
    return null;
  }

  const isMobile = formFactor === 'mobile';
  const centered = variant === 'cta';

  return (
    <Block
      id={id}
      width="100%"
      maxWidth="1120px"
      margin={centered ? '0 auto' : undefined}
      display="flex"
      flexDirection="column"
      gridGap="scale700"
      $style={{ textAlign: 'left' }}
    >
      <Block $style={{ textAlign: centered ? 'center' : 'left' }}>
        <Block
          as="h2"
          margin="0 0 8px"
          $style={{
            fontFamily: HEADING_FONT,
            fontWeight: 700,
            fontSize: isMobile ? '1.5rem' : '2rem',
            letterSpacing: '-0.025em',
            color: theme.colors.contentPrimary,
          }}
        >
          Sign up on this website
        </Block>
        <Block
          as="p"
          margin={0}
          maxWidth="52ch"
          $style={{
            fontSize: '15px',
            lineHeight: 1.5,
            color: theme.colors.contentSecondary,
            marginInline: centered ? 'auto' : undefined,
          }}
        >
          Android APKs are private until your account is active. Sign up and finish activation here.
          After that, Downloads is a tab on your desktop account. Customers and guards need the app
          to use the platform. Staff can run the full system in the browser.
        </Block>
      </Block>

      <Block
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent={centered ? 'center' : 'flex-start'}
        gridGap="scale400"
      >
        <GuardrButton
          kind="primary"
          onClick={() => onNavigateToAuth(undefined, 'sign-up')}
          startEnhancer={<UserPlus className="w-4 h-4" />}
          overrides={{ BaseButton: { style: { borderRadius: '10px' } } }}
        >
          Sign up
        </GuardrButton>
        <GuardrButton
          kind="secondary"
          onClick={() => onNavigateToAuth(undefined, 'sign-in')}
          startEnhancer={<LogIn className="w-4 h-4" />}
          overrides={{ BaseButton: { style: { borderRadius: '10px' } } }}
        >
          Log in
        </GuardrButton>
      </Block>
    </Block>
  );
}
