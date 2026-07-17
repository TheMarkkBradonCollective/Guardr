import React from 'react';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { UberStyleLandingPage } from '../uber/UberStyleLandingPage';

/** Thumb-first mobile browser landing — Uber homepage pattern. */
export function MobileLandingPage(props: LandingSectionsProps) {
  return <UberStyleLandingPage {...props} formFactor="mobile" />;
}
