import React from 'react';
import { Block } from 'baseui/block';
import { ParagraphMedium } from 'baseui/typography';
import type { FormFactor } from '../../../lib/platform/device';
import type { LegalPageId } from '../../../lib/legalContent';
import { LEGAL_ENTITY_NAME } from '../../../lib/siteConfig';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { LandingAppDownloads } from '../LandingAppDownloads';
import { UberLandingNav, UberLandingHero } from './UberLandingChrome';
import { UberExploreGrid, UberLoginBand } from './UberExploreGrid';
import { UberLandingHeroVisual, UberLandingLoginVisual } from './UberLandingVisuals';
import type { LandingSectionsProps } from '../shared/LandingSections';

type UberFormFactor = 'mobile' | 'tablet' | 'desktop';

function toUberFactor(formFactor: FormFactor): UberFormFactor {
  if (formFactor === 'tablet') return 'tablet';
  if (formFactor === 'desktop') return 'desktop';
  return 'mobile';
}

interface UberStyleLandingProps extends LandingSectionsProps {
  formFactor: FormFactor;
}

/** Uber homepage pattern — black nav, booking hero, explore grid, login band. */
export function UberStyleLandingPage({
  formFactor,
  themeMode,
  onChangeTheme,
  onNavigateToAuth,
  onOpenLegal,
  onOpenGuide,
  companyPlacardDocuments = [],
}: UberStyleLandingProps) {
  const factor = toUberFactor(formFactor);
  const isMobile = factor === 'mobile';
  const showHeroVisual = factor !== 'mobile';

  return (
    <Block
      minHeight="100vh"
      backgroundColor="backgroundPrimary"
      data-landing-factor={formFactor}
      className={`mobility-landing uber-style-landing uber-style-landing--${factor}`}
    >
      <UberLandingNav
        formFactor={factor}
        themeMode={themeMode}
        onChangeTheme={onChangeTheme}
        onNavigateToAuth={onNavigateToAuth}
        onOpenGuide={onOpenGuide}
      />

      <UberLandingHero
        formFactor={factor}
        onNavigateToAuth={onNavigateToAuth}
        heroVisual={showHeroVisual ? <UberLandingHeroVisual /> : undefined}
      />

      <UberExploreGrid formFactor={formFactor} onNavigateToAuth={onNavigateToAuth} />

      <UberLoginBand
        formFactor={formFactor}
        onNavigateToAuth={onNavigateToAuth}
        visual={<UberLandingLoginVisual />}
      />

      <Block padding={isMobile ? 'scale600' : 'scale800'} backgroundColor="backgroundSecondary">
        <Block maxWidth="1280px" margin="0 auto" $style={{ textAlign: 'center' }}>
          <LandingAppDownloads formFactor={formFactor} variant="cta" />
        </Block>
      </Block>

      {companyPlacardDocuments.length > 0 ? (
        <CompanyPublicPlacard documents={companyPlacardDocuments} />
      ) : null}

      <Block
        as="footer"
        className="uber-landing-footer"
        padding={isMobile ? 'scale600' : 'scale800'}
        backgroundColor="backgroundPrimary"
        overrides={{ Block: { style: { borderTop: '1px solid', borderColor: 'borderOpaque' } } }}
      >
        <Block maxWidth="1280px" margin="0 auto" display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" gridGap="scale500">
          <ParagraphMedium margin={0} color="contentSecondary" $style={{ fontSize: '13px' }}>
            © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}
          </ParagraphMedium>
          <LegalFooterLinks onOpenLegal={onOpenLegal} />
        </Block>
      </Block>
    </Block>
  );
}