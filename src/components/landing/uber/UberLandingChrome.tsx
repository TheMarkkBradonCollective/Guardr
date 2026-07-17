import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { ChevronDown, Clock, MapPin, Menu, Navigation, Square } from 'lucide-react';
import type { ThemeMode } from '../../../lib/platform/theme';
import { Logo } from '../../Logo';
import { GuardrButton } from '../../baseui/GuardrButton';

interface UberLandingNavProps {
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  onOpenGuide?: () => void;
  formFactor: 'mobile' | 'tablet' | 'desktop';
}

export function UberLandingNav({
  onNavigateToAuth,
  onOpenGuide,
  formFactor,
}: UberLandingNavProps) {
  const [, theme] = useStyletron();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = formFactor === 'mobile';

  return (
    <Block
      as="header"
      className="uber-landing-nav"
      backgroundColor="backgroundInversePrimary"
      paddingTop="max(12px, env(safe-area-inset-top))"
      paddingBottom="scale400"
      paddingLeft={isMobile ? 'scale500' : 'scale800'}
      paddingRight={isMobile ? 'scale500' : 'scale800'}
    >
      <Block
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        maxWidth="1280px"
        margin="0 auto"
        width="100%"
      >
        <Block display="flex" alignItems="center" gridGap="scale600">
          <Block display="flex" alignItems="center" gridGap="scale300">
            <Logo size={24} className="shrink-0 uber-landing-logo" />
            <Block
              as="span"
              color="contentInversePrimary"
              $style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em' }}
            >
              Guardr
            </Block>
          </Block>

          {!isMobile ? (
            <Block as="nav" display="flex" alignItems="center" gridGap="scale600" aria-label="Primary">
              {['Clients', 'Guards', 'Operations', 'About'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="uber-landing-nav-link"
                  onClick={() => {
                    if (item === 'Guards') onNavigateToAuth('guard', 'sign-up');
                    else if (item === 'Clients') onNavigateToAuth('client', 'sign-up');
                    else onNavigateToAuth(undefined, 'sign-in');
                  }}
                >
                  {item}
                </button>
              ))}
            </Block>
          ) : null}
        </Block>

        <Block display="flex" alignItems="center" gridGap={isMobile ? 'scale300' : 'scale500'}>
          {!isMobile && onOpenGuide ? (
            <button type="button" className="uber-landing-nav-link" onClick={onOpenGuide}>
              Help
            </button>
          ) : null}
          <button
            type="button"
            className="uber-landing-nav-link"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
          >
            Log in
          </button>
          <button
            type="button"
            className="uber-landing-signup-pill"
            onClick={() => onNavigateToAuth('client', 'sign-up')}
          >
            Sign up
          </button>
          {isMobile ? (
            <button
              type="button"
              className="uber-landing-menu-btn"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu size={22} color={theme.colors.contentInversePrimary} />
            </button>
          ) : null}
        </Block>
      </Block>

      {isMobile && menuOpen ? (
        <Block
          className="uber-landing-mobile-menu"
          marginTop="scale400"
          padding="scale500"
          backgroundColor="backgroundInversePrimary"
          overrides={{ Block: { style: { borderTop: `1px solid ${theme.colors.borderOpaque}` } } }}
        >
          {onOpenGuide ? (
            <button type="button" className="uber-landing-mobile-menu-item" onClick={onOpenGuide}>
              Guide
            </button>
          ) : null}
          <button type="button" className="uber-landing-mobile-menu-item" onClick={() => onNavigateToAuth('client', 'sign-up')}>
            I need security
          </button>
          <button type="button" className="uber-landing-mobile-menu-item" onClick={() => onNavigateToAuth('guard', 'sign-up')}>
            I&apos;m a guard
          </button>
        </Block>
      ) : null}
    </Block>
  );
}

interface UberLandingHeroProps {
  formFactor: 'mobile' | 'tablet' | 'desktop';
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  heroVisual?: React.ReactNode;
}

export function UberLandingHero({ formFactor, onNavigateToAuth, heroVisual }: UberLandingHeroProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';
  const isDesktop = formFactor === 'desktop';

  const startClientFlow = () => onNavigateToAuth('client', 'sign-up');

  const bookingPanel = (
    <Block maxWidth={isDesktop ? '480px' : '100%'} width="100%">
      <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale500">
        <MapPin size={14} />
        <ParagraphMedium margin={0} $style={{ fontSize: '14px' }}>
          Your area
        </ParagraphMedium>
        <button type="button" className="uber-landing-text-link" onClick={startClientFlow}>
          Set location
        </button>
      </Block>

      <Block
        as="h1"
        margin="0 0 scale600"
        $style={{
          fontWeight: 700,
          fontSize: isMobile ? 'clamp(2rem, 7vw, 2.5rem)' : 'clamp(2.25rem, 4vw, 3rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}
      >
        Go anywhere with Guardr
      </Block>

      <button type="button" className="uber-landing-time-pill" onClick={startClientFlow}>
        <Clock size={16} />
        <span>Post now</span>
        <ChevronDown size={16} />
      </button>

      <Block className="uber-landing-input-stack" marginTop="scale500" marginBottom="scale600">
        <Block className="uber-landing-input-row">
          <Block className="uber-landing-input-icon uber-landing-input-icon--circle" aria-hidden />
          <input
            type="text"
            readOnly
            placeholder="Site or job location"
            className="uber-landing-input"
            onFocus={startClientFlow}
            onClick={startClientFlow}
          />
          <button type="button" className="uber-landing-input-action" aria-label="Use current location" onClick={startClientFlow}>
            <Navigation size={18} />
          </button>
        </Block>
        <Block className="uber-landing-input-connector" aria-hidden />
        <Block className="uber-landing-input-row">
          <Block className="uber-landing-input-icon uber-landing-input-icon--square" aria-hidden>
            <Square size={10} fill="currentColor" strokeWidth={0} />
          </Block>
          <input
            type="text"
            readOnly
            placeholder="Coverage type or hours"
            className="uber-landing-input"
            onFocus={startClientFlow}
            onClick={startClientFlow}
          />
        </Block>
      </Block>

      <Block display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'stretch' : 'center'} gridGap="scale500">
        <GuardrButton
          kind="primary"
          onClick={startClientFlow}
          overrides={{
            BaseButton: {
              style: {
                backgroundColor: theme.colors.contentPrimary,
                color: theme.colors.contentInversePrimary,
                borderRadius: '8px',
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? undefined : '140px',
              },
            },
          }}
        >
          Get started
        </GuardrButton>
        <button type="button" className="uber-landing-text-link uber-landing-text-link--block" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
          Log in to see your recent activity
        </button>
      </Block>
    </Block>
  );

  if (isDesktop || formFactor === 'tablet') {
    return (
      <Block
        as="section"
        className="uber-landing-hero"
        padding={isMobile ? 'scale600' : 'scale1000'}
        paddingTop={isMobile ? 'scale600' : 'scale1200'}
        backgroundColor="backgroundPrimary"
      >
        <Block
          maxWidth="1280px"
          margin="0 auto"
          display="grid"
          gridTemplateColumns={isMobile ? '1fr' : ['1fr', '1fr', '1fr 1fr']}
          gridGap="scale1000"
          alignItems="center"
        >
          {bookingPanel}
          {heroVisual ? <Block className="uber-landing-hero-visual">{heroVisual}</Block> : null}
        </Block>
      </Block>
    );
  }

  return (
    <Block as="section" className="uber-landing-hero" padding="scale600" backgroundColor="backgroundPrimary">
      {bookingPanel}
    </Block>
  );
}
