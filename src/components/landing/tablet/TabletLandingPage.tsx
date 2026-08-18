import React from 'react';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { MobilityStyleLandingPage } from '../mobility/MobilityStyleLandingPage';

/** Touch-first tablet landing — split hero, persistent nav, 2/3-up explore. Not scaled mobile or desktop. */
export function TabletLandingPage(props: LandingSectionsProps) {
  return <MobilityStyleLandingPage {...props} formFactor="tablet" />;
}
