import React from 'react';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { MobilityStyleLandingPage } from '../mobility/MobilityStyleLandingPage';

/** Thumb-first mobile browser landing — mobility homepage pattern. */
export function MobileLandingPage(props: LandingSectionsProps) {
  return <MobilityStyleLandingPage {...props} formFactor="mobile" />;
}
