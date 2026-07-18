import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { LabelMedium, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { ChevronDown, MapPin, Menu, Navigation, Shield, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = formFactor === 'mobile';

  const navLinks = [
    { label: 'For clients',  onClick: () => onNavigateToAuth('client', 'sign-up') },
    { label: 'For guards',   onClick: () => onNavigateToAuth('guard',  'sign-up') },
    { label: 'Safety',       onClick: () => onNavigateToAuth(undefined, 'sign-in') },
    { label: 'Company',      onClick: () => onNavigateToAuth(undefined, 'sign-in') },
  ] as const;

  return (
    <Block
      as="header"
      className="uber-landing-nav"
      role="banner"
      paddingTop={`max(12px, env(safe-area-inset-top))`}
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
        {/* Wordmark */}
        <Block display="flex" alignItems="center" gridGap={isMobile ? '0' : 'scale700'}>
          <Block
            as="a"
            href="/"
            aria-label="Guardr home"
            display="flex"
            alignItems="center"
            gridGap="scale300"
            overrides={{ Block: { style: { textDecoration: 'none' } } }}
          >
            <Logo size={22} className="shrink-0 uber-landing-logo" />
            <Block
              as="span"
              color="contentInversePrimary"
              $style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.03em' }}
            >
              Guardr
            </Block>
          </Block>

          {!isMobile ? (
            <Block as="nav" display="flex" alignItems="center" gridGap="scale500" aria-label="Main">
              {navLinks.map((link) => (
                <button key={link.label} type="button" className="uber-landing-nav-link" onClick={link.onClick}>
                  {link.label}
                </button>
              ))}
              {onOpenGuide ? (
                <button type="button" className="uber-landing-nav-link" onClick={onOpenGuide}>Help</button>
              ) : null}
            </Block>
          ) : null}
        </Block>

        {/* Auth CTAs */}
        <Block display="flex" alignItems="center" gridGap={isMobile ? 'scale300' : 'scale400'}>
          <button type="button" className="uber-landing-nav-link" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
            Log in
          </button>
          <button type="button" className="uber-landing-signup-pill" onClick={() => onNavigateToAuth(undefined, 'sign-up')}>
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
                ? <X size={20} color="#fff" />
                : <Menu size={20} color="#fff" />
              }
            </button>
          ) : null}
        </Block>
      </Block>

      {/* Mobile menu */}
      {isMobile && menuOpen ? (
        <Block
          as="nav"
          aria-label="Mobile menu"
          className="uber-landing-mobile-menu"
          marginTop="scale400"
          padding="scale500"
          overrides={{ Block: { style: { borderTop: '1px solid rgba(255,255,255,0.10)' } } }}
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
              Help
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
  const isMobile  = formFactor === 'mobile';
  const isDesktop = formFactor === 'desktop';

  const goClient = () => onNavigateToAuth('client', 'sign-up');
  const goGuard  = () => onNavigateToAuth('guard',  'sign-up');

  const heroPanel = (
    <Block maxWidth={isDesktop ? '460px' : '100%'} width="100%">
      {/* Location context */}
      <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale500">
        <MapPin size={14} color={theme.colors.contentSecondary} />
        <LabelSmall margin={0} color="contentSecondary" $style={{ fontSize: '13px' }}>
          Security marketplace · your area
        </LabelSmall>
      </Block>

      {/* Hero heading — matches Uber's bold style */}
      <Block
        as="h1"
        margin={`0 0 ${theme.sizing.scale600}`}
        $style={{
          fontFamily: '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontWeight: 700,
          fontSize: isMobile
            ? 'clamp(2.25rem, 8vw, 2.75rem)'
            : isDesktop
            ? 'clamp(2.75rem, 4vw, 3.5rem)'
            : 'clamp(2.25rem, 5vw, 3rem)',
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: theme.colors.contentPrimary,
        }}
      >
        Post coverage.<br />Hire licensed guards.
      </Block>

      {/* Time/type selector */}
      <button type="button" className="uber-landing-time-pill" onClick={goClient}>
        <ChevronDown size={16} />
        <span>Now or later</span>
      </button>

      {/* Booking input stack */}
      <Block className="uber-landing-input-stack" marginTop="scale500" marginBottom="scale600">
        <Block className="uber-landing-input-row">
          <Block className="uber-landing-input-icon uber-landing-input-icon--circle" aria-hidden />
          <input
            type="text"
            readOnly
            placeholder="Enter site or job location"
            className="uber-landing-input"
            onFocus={goClient}
            onClick={goClient}
            aria-label="Site or job location"
          />
          <button type="button" className="uber-landing-input-action" aria-label="Use current location" onClick={goClient}>
            <Navigation size={18} />
          </button>
        </Block>
        <Block className="uber-landing-input-connector" aria-hidden />
        <Block className="uber-landing-input-row">
          <Shield size={14} color={theme.colors.contentSecondary} style={{ flexShrink: 0 }} aria-hidden />
          <input
            type="text"
            readOnly
            placeholder="Coverage type · hours · rate"
            className="uber-landing-input"
            onFocus={goClient}
            onClick={goClient}
            aria-label="Coverage type, hours, or rate"
          />
        </Block>
      </Block>

      {/* Primary CTAs */}
      <Block display="flex" flexDirection={isMobile ? 'column' : 'row'} gridGap="scale400">
        <GuardrButton
          kind="primary"
          onClick={goClient}
          overrides={{
            BaseButton: {
              style: {
                borderRadius: '8px',
                minWidth: isMobile ? undefined : '160px',
                width: isMobile ? '100%' : undefined,
              },
            },
          }}
        >
          Post a job
        </GuardrButton>
        <GuardrButton
          kind="secondary"
          onClick={goGuard}
          overrides={{
            BaseButton: {
              style: {
                borderRadius: '8px',
                width: isMobile ? '100%' : undefined,
              },
            },
          }}
        >
          Find work as a guard
        </GuardrButton>
      </Block>

      <Block marginTop="scale400">
        <button type="button" className="uber-landing-text-link" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
          Already have an account? Log in
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
        paddingTop={isMobile ? 'scale800' : 'scale1200'}
        backgroundColor="backgroundPrimary"
      >
        <Block
          maxWidth="1280px"
          margin="0 auto"
          display="grid"
          gridTemplateColumns={['1fr', '1fr', '1fr 1fr']}
          gridGap="scale1000"
          alignItems="center"
        >
          {heroPanel}
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
      paddingTop="scale800"
      backgroundColor="backgroundPrimary"
    >
      {heroPanel}
    </Block>
  );
}
