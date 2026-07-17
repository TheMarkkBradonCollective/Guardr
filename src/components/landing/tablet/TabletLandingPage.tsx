import React from 'react';
import { Block } from 'baseui/block';
import { PublicLandingHeader } from '../../baseui/layout/PublicLandingHeader';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { LandingBodySections, LandingFooter, LandingHeroSection } from '../shared/LandingSections';

/** Touch-first tablet browser landing — persistent header + 2-column sections, not scaled desktop. */
export function TabletLandingPage(props: LandingSectionsProps) {
  return (
    <Block
      minHeight="100vh"
      backgroundColor="backgroundPrimary"
      data-landing-factor="tablet"
      className="mobility-landing mobility-landing--tablet"
    >
      <PublicLandingHeader
        themeMode={props.themeMode}
        onChangeTheme={props.onChangeTheme}
        onNavigateToAuth={props.onNavigateToAuth}
        onOpenGuide={props.onOpenGuide}
      />

      <LandingHeroSection
        formFactor="tablet"
        onNavigateToAuth={props.onNavigateToAuth}
        ownerMessage={props.ownerMessage}
        directorMessage={props.directorMessage}
      />

      <LandingBodySections
        formFactor="tablet"
        onNavigateToAuth={props.onNavigateToAuth}
        onOpenLegal={props.onOpenLegal}
        ownerMessage={props.ownerMessage}
        directorMessage={props.directorMessage}
        companyPlacardDocuments={props.companyPlacardDocuments}
      />

      <LandingFooter
        formFactor="tablet"
        themeMode={props.themeMode}
        onChangeTheme={props.onChangeTheme}
        onOpenLegal={props.onOpenLegal}
        onOpenGuide={props.onOpenGuide}
      />
    </Block>
  );
}
