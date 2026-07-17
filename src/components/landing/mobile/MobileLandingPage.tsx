import React from 'react';
import { Block } from 'baseui/block';
import { PublicLandingHeader } from '../../baseui/layout/PublicLandingHeader';
import type { LandingSectionsProps } from '../shared/LandingSections';
import {
  LandingBodySections,
  LandingFooter,
  LandingHeroSection,
  LandingMobileCtaBar,
} from '../shared/LandingSections';

/** Thumb-first mobile browser landing — independent layout, not scaled desktop. */
export function MobileLandingPage(props: LandingSectionsProps) {
  return (
    <Block
      minHeight="100vh"
      backgroundColor="backgroundPrimary"
      data-landing-factor="mobile"
      className="mobility-landing mobility-landing--mobile"
    >
      <PublicLandingHeader
        themeMode={props.themeMode}
        onChangeTheme={props.onChangeTheme}
        onNavigateToAuth={props.onNavigateToAuth}
        onOpenGuide={props.onOpenGuide}
        showRoleLinks={false}
      />

      <LandingHeroSection
        formFactor="mobile"
        onNavigateToAuth={props.onNavigateToAuth}
        ownerMessage={props.ownerMessage}
        directorMessage={props.directorMessage}
      />

      <LandingBodySections
        formFactor="mobile"
        onNavigateToAuth={props.onNavigateToAuth}
        onOpenLegal={props.onOpenLegal}
        ownerMessage={props.ownerMessage}
        directorMessage={props.directorMessage}
        companyPlacardDocuments={props.companyPlacardDocuments}
      />

      <LandingFooter
        formFactor="mobile"
        themeMode={props.themeMode}
        onChangeTheme={props.onChangeTheme}
        onOpenLegal={props.onOpenLegal}
        onOpenGuide={props.onOpenGuide}
      />

      <LandingMobileCtaBar onNavigateToAuth={props.onNavigateToAuth} />

      {/* Reserve space for fixed CTA bar */}
      <Block height="88px" aria-hidden />
    </Block>
  );
}
