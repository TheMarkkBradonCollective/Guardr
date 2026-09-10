import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { BadgeCheck, Lock, MapPin, Zap } from 'lucide-react';
import type { FormFactor } from '../../../lib/platform/device';
import type { LegalPageId } from '../../../lib/legalContent';
import { LegalEntityName } from '../../../components/SignatureSecurityBrand';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { EqualOpportunityNotice } from '../../legal/EqualOpportunityNotice';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { LandingAppDownloads } from '../LandingAppDownloads';
import { MobilityLandingNav, MobilityLandingHero } from './MobilityLandingChrome';
import { MobilityExploreGrid, MobilityLoginBand } from './MobilityExploreGrid';
import { MobilityLandingHeroVisual, MobilityLandingLoginVisual } from './MobilityLandingVisuals';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { resolveManualPdfUrl, USER_MANUALS_COMBINED_HREF } from '../../../lib/userManuals';

type MobilityFormFactor = 'mobile' | 'tablet' | 'desktop';

function toMobilityFactor(formFactor: FormFactor): MobilityFormFactor {
  if (formFactor === 'tablet') return 'tablet';
  if (formFactor === 'desktop') return 'desktop';
  return 'mobile';
}

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: 'Licensed guards only' },
  { icon: MapPin,     label: 'Map-first browsing' },
  { icon: Zap,        label: 'Direct pay' },
  { icon: Lock,       label: 'Shift tracking' },
] as const;

function TrustStrip({ isMobile }: { isMobile: boolean }) {
  const [, theme] = useStyletron();
  return (
    <Block
      as="section"
      aria-label="Platform features"
      className="uber-landing-trust-strip"
      paddingTop={isMobile ? 'scale500' : 'scale600'}
      paddingBottom={isMobile ? 'scale500' : 'scale600'}
      paddingLeft={isMobile ? 'scale600' : 'scale800'}
      paddingRight={isMobile ? 'scale600' : 'scale800'}
      backgroundColor="backgroundSecondary"
    >
        <Block
        maxWidth="1280px"
        margin="0 auto"
        width="100%"
        display="flex"
        gridGap={isMobile ? 'scale600' : 'scale800'}
        alignItems="center"
        justifyContent={isMobile ? 'flex-start' : 'center'}
        overrides={{ Block: { style: { flexWrap: 'wrap' } } }}
      >
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <Block
            key={label}
            display="flex"
            alignItems="center"
            gridGap="scale300"
            className="uber-landing-trust-item"
          >
            <Icon size={16} aria-hidden color={theme.colors.accent} />
            <LabelSmall margin={0} $style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {label}
            </LabelSmall>
          </Block>
        ))}
      </Block>
    </Block>
  );
}

interface MobilityStyleLandingProps extends LandingSectionsProps {
  formFactor: FormFactor;
}

/**
 * Guardr landing — mobility homepage pattern.
 * Black nav · booking hero · trust strip · explore grid · login band · footer.
 * Platform-specific layout: mobile | tablet | desktop.
 */
export function MobilityStyleLandingPage({
  formFactor,
  themeMode,
  onChangeTheme,
  onNavigateToAuth,
  onOpenLegal,
  onOpenGuide,
  companyPlacardDocuments = [],
}: MobilityStyleLandingProps) {
  const factor = toMobilityFactor(formFactor);
  const isMobile = factor === 'mobile';
  const showHeroVisual = factor !== 'mobile';

  return (
    <Block
      minHeight="100vh"
      backgroundColor="backgroundPrimary"
      data-landing-factor={formFactor}
      className={`mobility-landing uber-style-landing uber-style-landing--${factor}`}
    >
      <MobilityLandingNav
        formFactor={factor}
        themeMode={themeMode}
        onChangeTheme={onChangeTheme}
        onNavigateToAuth={onNavigateToAuth}
        onOpenGuide={onOpenGuide}
      />

      <MobilityLandingHero
        formFactor={factor}
        onNavigateToAuth={onNavigateToAuth}
        heroVisual={showHeroVisual ? <MobilityLandingHeroVisual /> : undefined}
      />

      <TrustStrip isMobile={isMobile} />

      <MobilityExploreGrid formFactor={formFactor} onNavigateToAuth={onNavigateToAuth} />

      <MobilityLoginBand
        formFactor={formFactor}
        onNavigateToAuth={onNavigateToAuth}
        visual={<MobilityLandingLoginVisual />}
      />

      {/* App download CTA */}
      <Block
        as="section"
        aria-label="Sign up for the apps"
        padding={isMobile ? 'scale600' : 'scale800'}
        backgroundColor="backgroundSecondary"
      >
        <Block maxWidth="1280px" margin="0 auto" $style={{ textAlign: 'center' }}>
          <LandingAppDownloads formFactor={formFactor} variant="cta" onNavigateToAuth={onNavigateToAuth} />
        </Block>
      </Block>

      {companyPlacardDocuments.length > 0 ? (
        <CompanyPublicPlacard documents={companyPlacardDocuments} />
      ) : null}

      <Block
        as="footer"
        role="contentinfo"
        className="uber-landing-footer"
        padding={isMobile ? 'scale600' : 'scale800'}
        backgroundColor="backgroundPrimary"
        overrides={{ Block: { style: { borderTop: '1px solid', borderColor: 'borderOpaque' } } }}
      >
        <Block
          maxWidth="1280px"
          margin="0 auto"
          display="flex"
          flexDirection={isMobile ? 'column' : 'row'}
          justifyContent="space-between"
          alignItems={isMobile ? 'flex-start' : 'center'}
          gridGap="scale500"
        >
          <ParagraphMedium margin={0} color="contentSecondary" $style={{ fontSize: '13px' }}>
            © {new Date().getFullYear()} <LegalEntityName />
          </ParagraphMedium>
          <Block display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gridGap="scale400">
            <a
              className="uber-landing-nav-link"
              href={resolveManualPdfUrl(USER_MANUALS_COMBINED_HREF)}
              download="Guardr-User-Manuals-Combined.pdf"
              type="application/pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              Manuals
            </a>
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
          </Block>
        </Block>
        <Block marginTop="scale500" maxWidth="1280px" marginLeft="auto" marginRight="auto">
          <EqualOpportunityNotice onOpenLegal={onOpenLegal} compact />
        </Block>
      </Block>

      {isMobile ? (
        <nav className="uber-landing-dock" aria-label="Get started">
          <button
            type="button"
            className="uber-landing-dock-btn uber-landing-dock-btn--primary"
            onClick={() => onNavigateToAuth('client', 'sign-up')}
          >
            Post a job
          </button>
          <button
            type="button"
            className="uber-landing-dock-btn uber-landing-dock-btn--secondary"
            onClick={() => onNavigateToAuth('guard', 'sign-up')}
          >
            Find work
          </button>
        </nav>
      ) : null}
    </Block>
  );
}
