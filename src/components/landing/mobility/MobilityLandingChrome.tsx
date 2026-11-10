import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { ChevronDown, MapPin, Menu, Navigation, Shield, X } from 'lucide-react';
import type { ThemeMode } from '../../../lib/platform/theme';
import { resolveManualPdfUrl, USER_MANUALS_COMBINED_HREF } from '../../../lib/userManuals';
import { resolveStakeholderDownloadPageUrl } from '../../../lib/stakeholderDocuments';
import { Logo } from '../../Logo';
import { GuardrButton } from '../../baseui/GuardrButton';
import { FONT_DISPLAY } from '../../../theme/typography';

interface MobilityLandingNavProps {
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  onOpenGuide?: () => void;
  formFactor: 'mobile' | 'tablet' | 'desktop';
}

export function MobilityLandingNav({
  onNavigateToAuth,
  onOpenGuide,
  formFactor,
}: MobilityLandingNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = formFactor === 'mobile';
  const isTablet = formFactor === 'tablet';

  const navLinks = [
    { label: 'For clients',  onClick: () => onNavigateToAuth('client', 'sign-up') },
    { label: 'For guards',   onClick: () => onNavigateToAuth('guard',  'sign-up') },
    { label: 'Safety',       onClick: () => onNavigateToAuth(undefined, 'sign-in') },
    { label: 'Company',      onClick: () => onNavigateToAuth(undefined, 'sign-in') },
  ] as const;

  return (
    <Block
      as="header"
      className={`uber-landing-nav uber-landing-nav--${formFactor}`}
      role="banner"
      paddingTop={`max(12px, env(safe-area-inset-top))`}
      paddingBottom={isTablet ? '0' : 'scale400'}
      paddingLeft={isMobile ? 'scale500' : isTablet ? 'scale700' : 'scale800'}
      paddingRight={isMobile ? 'scale500' : isTablet ? 'scale700' : 'scale800'}
    >
      <Block
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        maxWidth="1280px"
        margin="0 auto"
        width="100%"
        className={isTablet ? 'uber-landing-nav-tablet-top' : undefined}
      >
        <Block
          as="a"
          href="/"
          aria-label="Guardr home"
          display="flex"
          alignItems="center"
          gridGap="scale300"
          overrides={{ Block: { style: { textDecoration: 'none', flexShrink: 0 } } }}
        >
          <Logo size={isMobile ? 22 : 24} className="shrink-0 uber-landing-logo" />
          <Block
            as="span"
            $style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: isMobile ? '18px' : '20px',
              letterSpacing: '-0.03em',
            }}
          >
            Guardr
          </Block>
        </Block>

        {!isMobile && !isTablet ? (
          <Block as="nav" display="flex" alignItems="center" gridGap="scale500" aria-label="Main">
            {navLinks.map((link) => (
              <button key={link.label} type="button" className="uber-landing-nav-link" onClick={link.onClick}>
                {link.label}
              </button>
            ))}
            {onOpenGuide ? (
              <button type="button" className="uber-landing-nav-link" onClick={onOpenGuide}>Help</button>
            ) : null}
            <a
              className="uber-landing-nav-link"
              href={resolveManualPdfUrl(USER_MANUALS_COMBINED_HREF)}
              download="Guardr-User-Manuals-Combined.pdf"
              type="application/pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Manuals
            </a>
            <a
              className="uber-landing-nav-link"
              href={resolveStakeholderDownloadPageUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Company package
            </a>
          </Block>
        ) : null}

        <Block display="flex" alignItems="center" gridGap={isMobile ? 'scale200' : 'scale400'}>
          {!isMobile ? (
            <button type="button" className="uber-landing-nav-link" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
              Log in
            </button>
          ) : null}
          {!isMobile ? (
            <button type="button" className="uber-landing-signup-pill" onClick={() => onNavigateToAuth(undefined, 'sign-up')}>
              Sign up
            </button>
          ) : (
            <button type="button" className="uber-landing-nav-link" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
              Log in
            </button>
          )}
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

      {isTablet ? (
        <Block
          as="nav"
          aria-label="Main"
          className="uber-landing-tablet-tabs"
          maxWidth="1280px"
          margin="0 auto"
          width="100%"
        >
          {navLinks.map((link) => (
            <button key={link.label} type="button" className="uber-landing-tablet-tab" onClick={link.onClick}>
              {link.label}
            </button>
          ))}
          {onOpenGuide ? (
            <button type="button" className="uber-landing-tablet-tab" onClick={onOpenGuide}>Help</button>
          ) : null}
        </Block>
      ) : null}

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
          <a
            className="uber-landing-mobile-menu-item"
            href={resolveManualPdfUrl(USER_MANUALS_COMBINED_HREF)}
            download="Guardr-User-Manuals-Combined.pdf"
            type="application/pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Manuals (PDF)
          </a>
          <a
            className="uber-landing-mobile-menu-item"
            href={resolveStakeholderDownloadPageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Company package
          </a>
        </Block>
      ) : null}
    </Block>
  );
}

interface MobilityLandingHeroProps {
  formFactor: 'mobile' | 'tablet' | 'desktop';
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  heroVisual?: React.ReactNode;
}

function BookingFields({
  layout,
  onClient,
}: {
  layout: 'stack' | 'bar';
  onClient: () => void;
}) {
  const [, theme] = useStyletron();
  return (
    <Block
      className={`uber-landing-input-stack${layout === 'bar' ? ' uber-landing-input-stack--bar' : ''}`}
    >
      <Block className="uber-landing-input-row">
        <Block className="uber-landing-input-icon uber-landing-input-icon--circle" aria-hidden />
        <input
          type="text"
          readOnly
          placeholder="Enter site or job location"
          className="uber-landing-input"
          onFocus={onClient}
          onClick={onClient}
          aria-label="Site or job location"
        />
        <button type="button" className="uber-landing-input-action" aria-label="Use current location" onClick={onClient}>
          <Navigation size={18} />
        </button>
      </Block>
      {layout === 'stack' ? <Block className="uber-landing-input-connector" aria-hidden /> : null}
      <Block className="uber-landing-input-row">
        <Shield size={14} color={theme.colors.contentSecondary} style={{ flexShrink: 0 }} aria-hidden />
        <input
          type="text"
          readOnly
          placeholder="Coverage type · hours · rate"
          className="uber-landing-input"
          onFocus={onClient}
          onClick={onClient}
          aria-label="Coverage type, hours, or rate"
        />
      </Block>
    </Block>
  );
}

function HeroActions({
  tall,
  onClient,
  onGuard,
}: {
  tall: boolean;
  onClient: () => void;
  onGuard: () => void;
}) {
  return (
    <Block display="flex" flexDirection="row" gridGap="scale400" className="uber-landing-hero-actions">
      <GuardrButton
        kind="primary"
        onClick={onClient}
        overrides={{
          BaseButton: {
            style: {
              borderRadius: tall ? '12px' : '8px',
              minHeight: tall ? '48px' : '40px',
              minWidth: tall ? '148px' : '132px',
            },
          },
        }}
      >
        Post a job
      </GuardrButton>
      <GuardrButton
        kind="secondary"
        onClick={onGuard}
        overrides={{
          BaseButton: {
            style: {
              borderRadius: tall ? '12px' : '8px',
              minHeight: tall ? '48px' : '40px',
            },
          },
        }}
      >
        Find work as a guard
      </GuardrButton>
    </Block>
  );
}

export function MobilityLandingHero({ formFactor, onNavigateToAuth, heroVisual }: MobilityLandingHeroProps) {
  const [, theme] = useStyletron();
  const goClient = () => onNavigateToAuth('client', 'sign-up');
  const goGuard = () => onNavigateToAuth('guard', 'sign-up');
  const loginLink = (
    <button type="button" className="uber-landing-text-link" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
      Already have an account? Log in
    </button>
  );

  if (formFactor === 'mobile') {
    return (
      <Block
        as="section"
        aria-label="Hero"
        className="uber-landing-hero uber-landing-hero--poster"
        padding="scale600"
        paddingTop="scale800"
        backgroundColor="backgroundPrimary"
      >
        <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale500">
          <MapPin size={14} color={theme.colors.contentSecondary} />
          <LabelSmall margin={0} color="contentSecondary" $style={{ fontSize: '13px' }}>
            Security marketplace · your area
          </LabelSmall>
        </Block>
        <Block
          as="h1"
          margin="0 0 12px"
          $style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 11vw, 3.25rem)',
            lineHeight: 0.98,
            letterSpacing: '-0.04em',
            color: theme.colors.contentPrimary,
          }}
        >
          Post coverage. Hire licensed guards.
        </Block>
        <ParagraphMedium margin="0 0 20px" color="contentSecondary" $style={{ fontSize: '17px', lineHeight: 1.4, maxWidth: '22rem' }}>
          Licensed guards, map-first jobs, and direct pay — built for a phone in the field.
        </ParagraphMedium>
        {loginLink}
      </Block>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <Block
        as="section"
        aria-label="Hero"
        className="uber-landing-hero uber-landing-hero--tablet"
        padding="scale800"
        paddingTop="scale800"
        backgroundColor="backgroundPrimary"
      >
        <Block maxWidth="1080px" margin="0 auto" width="100%">
          <Block
            display="grid"
            gridTemplateColumns="minmax(0, 1fr) minmax(16rem, 1fr)"
            gridGap="scale800"
            alignItems="center"
          >
            <Block minWidth={0}>
              <LabelSmall margin="0 0 12px" color="contentSecondary" $style={{ fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                On site, on a tablet
              </LabelSmall>
              <Block
                as="h1"
                margin="0 0 12px"
                $style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 800,
                  fontSize: 'clamp(2.4rem, 4.2vw, 3.15rem)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.035em',
                  color: theme.colors.contentPrimary,
                }}
              >
                Coverage you can run from the table.
              </Block>
              <ParagraphMedium margin="0" color="contentSecondary" $style={{ fontSize: '16px', lineHeight: 1.45, maxWidth: '28rem' }}>
                Post a site, see who is nearby, and keep the shift in one split view.
              </ParagraphMedium>
            </Block>
            {heroVisual ? (
              <Block className="uber-landing-hero-visual uber-landing-hero-visual--tablet" role="img" aria-label="Guardr operations preview">
                {heroVisual}
              </Block>
            ) : null}
          </Block>

          <Block className="uber-landing-startbar" marginTop="scale800">
            <BookingFields layout="bar" onClient={goClient} />
            <Block display="flex" flexDirection="column" gridGap="scale400" marginTop="scale500">
              <HeroActions tall onClient={goClient} onGuard={goGuard} />
              {loginLink}
            </Block>
          </Block>
        </Block>
      </Block>
    );
  }

  return (
    <Block
      as="section"
      aria-label="Hero"
      className="uber-landing-hero uber-landing-hero--desktop"
      padding="scale1000"
      paddingTop="scale1000"
      backgroundColor="backgroundPrimary"
    >
      <Block
        maxWidth="1280px"
        margin="0 auto"
        display="grid"
        gridTemplateColumns="minmax(0, 1.05fr) minmax(18rem, 0.85fr)"
        gridGap="scale1200"
        alignItems="center"
      >
        <Block minWidth={0} maxWidth="560px">
          <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale500">
            <MapPin size={14} color={theme.colors.contentSecondary} />
            <LabelSmall margin={0} color="contentSecondary" $style={{ fontSize: '13px' }}>
              Security marketplace · your area
            </LabelSmall>
          </Block>
          <Block
            as="h1"
            margin="0 0 16px"
            $style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: 'clamp(3rem, 4.2vw, 4.25rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.045em',
              color: theme.colors.contentPrimary,
            }}
          >
            Post coverage.<br />Hire licensed guards.
          </Block>
          <button type="button" className="uber-landing-time-pill" onClick={goClient}>
            <ChevronDown size={16} />
            <span>Now or later</span>
          </button>
          <Block marginTop="scale500" marginBottom="scale600">
            <BookingFields layout="stack" onClient={goClient} />
          </Block>
          <HeroActions tall={false} onClient={goClient} onGuard={goGuard} />
          <Block marginTop="scale500">{loginLink}</Block>
        </Block>
        {heroVisual ? (
          <Block className="uber-landing-hero-visual uber-landing-hero-visual--desktop" role="img" aria-label="Guardr operations preview">
            {heroVisual}
          </Block>
        ) : null}
      </Block>
    </Block>
  );
}
