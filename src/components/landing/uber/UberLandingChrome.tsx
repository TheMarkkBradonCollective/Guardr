import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { LabelMedium, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { ChevronDown, Clock, MapPin, Menu, Navigation, Shield, X } from 'lucide-react';
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

  const navLinks = [
    { label: 'For clients', onClick: () => onNavigateToAuth('client', 'sign-up') },
    { label: 'For guards', onClick: () => onNavigateToAuth('guard', 'sign-up') },
    { label: 'Operations', onClick: () => onNavigateToAuth(undefined, 'sign-in') },
    { label: 'About', onClick: () => onNavigateToAuth(undefined, 'sign-in') },
  ] as const;

  return (
    <Block
      as="header"
      className="uber-landing-nav"
      role="banner"
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
        {/* Brand */}
        <Block display="flex" alignItems="center" gridGap="scale600">
          <Block
            as="a"
            href="/"
            aria-label="Guardr home"
            display="flex"
            alignItems="center"
            gridGap="scale300"
            overrides={{ Block: { style: { textDecoration: 'none' } } }}
          >
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
            <Block as="nav" display="flex" alignItems="center" gridGap="scale500" aria-label="Main">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="uber-landing-nav-link"
                  onClick={link.onClick}
                >
                  {link.label}
                </button>
              ))}
            </Block>
          ) : null}
        </Block>

        {/* Actions */}
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
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen
                ? <X size={22} color={theme.colors.contentInversePrimary} />
                : <Menu size={22} color={theme.colors.contentInversePrimary} />
              }
            </button>
          ) : null}
        </Block>
      </Block>

      {/* Mobile expanded menu */}
      {isMobile && menuOpen ? (
        <Block
          as="nav"
          aria-label="Mobile menu"
          className="uber-landing-mobile-menu"
          marginTop="scale400"
          padding="scale500"
          overrides={{ Block: { style: { borderTop: '1px solid rgba(255,255,255,0.15)' } } }}
        >
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              className="uber-landing-mobile-menu-item"
              onClick={() => { setMenuOpen(false); link.onClick(); }}
            >
              {link.label}
            </button>
          ))}
          {onOpenGuide ? (
            <button
              type="button"
              className="uber-landing-mobile-menu-item"
              onClick={() => { setMenuOpen(false); onOpenGuide(); }}
            >
              Help guide
            </button>
          ) : null}
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
  const startGuardFlow = () => onNavigateToAuth('guard', 'sign-up');

  const bookingPanel = (
    <Block maxWidth={isDesktop ? '480px' : '100%'} width="100%">
      <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale500">
        <MapPin size={14} color={theme.colors.accent} />
        <LabelMedium margin={0} color="contentSecondary">
          Independent security marketplace
        </LabelMedium>
      </Block>

      <Block
        as="h1"
        margin="0 0 scale600"
        $style={{
          fontWeight: 700,
          fontSize: isMobile ? 'clamp(2rem, 7vw, 2.5rem)' : 'clamp(2.25rem, 4vw, 3.25rem)',
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
        }}
      >
        Post coverage. Get qualified. Work securely.
      </Block>

      <ParagraphMedium
        margin="0 0 scale600"
        color="contentSecondary"
        $style={{ fontSize: isMobile ? '15px' : '16px', lineHeight: 1.5 }}
      >
        Clients post shifts. Guards browse and apply. Direct pay, map‑first, live shift tracking.
      </ParagraphMedium>

      {/* Quick-start selector */}
      <button type="button" className="uber-landing-time-pill" onClick={startClientFlow}>
        <Clock size={16} />
        <span>Post now</span>
        <ChevronDown size={16} />
      </button>

      {/* Fake search inputs — kick off the auth flow on interaction */}
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
            aria-label="Enter site or job location"
          />
          <button
            type="button"
            className="uber-landing-input-action"
            aria-label="Use current location"
            onClick={startClientFlow}
          >
            <Navigation size={18} />
          </button>
        </Block>
        <Block className="uber-landing-input-connector" aria-hidden />
        <Block className="uber-landing-input-row">
          <Shield
            size={14}
            aria-hidden
            style={{ flexShrink: 0, color: theme.colors.accent }}
          />
          <input
            type="text"
            readOnly
            placeholder="Coverage type, hours, or rate"
            className="uber-landing-input"
            onFocus={startClientFlow}
            onClick={startClientFlow}
            aria-label="Enter coverage type, hours, or rate"
          />
        </Block>
      </Block>

      {/* CTAs */}
      <Block
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        gridGap="scale500"
      >
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
                minWidth: isMobile ? undefined : '150px',
              },
            },
          }}
        >
          I need security
        </GuardrButton>
        <GuardrButton
          kind="secondary"
          onClick={startGuardFlow}
          overrides={{
            BaseButton: {
              style: {
                borderRadius: '999px',
                width: isMobile ? '100%' : 'auto',
              },
            },
          }}
        >
          I&apos;m a guard
        </GuardrButton>
      </Block>

      <Block marginTop="scale400">
        <button
          type="button"
          className="uber-landing-text-link uber-landing-text-link--block"
          onClick={() => onNavigateToAuth(undefined, 'sign-in')}
        >
          Log in to see your recent activity
        </button>
      </Block>
    </Block>
  );

  if (isDesktop || formFactor === 'tablet') {
    return (
      <Block
        as="section"
        aria-label="Hero"
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
          {heroVisual ? (
            <Block className="uber-landing-hero-visual" role="img" aria-label="Guardr operations preview">
              {heroVisual}
            </Block>
          ) : null}
        </Block>
      </Block>
    );
  }

  return (
    <Block
      as="section"
      aria-label="Hero"
      className="uber-landing-hero"
      padding="scale600"
      backgroundColor="backgroundPrimary"
    >
      {bookingPanel}
    </Block>
  );
}
