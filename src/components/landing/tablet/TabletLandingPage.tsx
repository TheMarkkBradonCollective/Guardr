import React from 'react';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { MobilityStyleLandingPage } from '../mobility/MobilityStyleLandingPage';

/** Touch-first tablet browser landing — mobility homepage pattern with 2-column hero. */
export function TabletLandingPage(props: LandingSectionsProps) {
  return <MobilityStyleLandingPage {...props} formFactor="tablet" />;
}
