import React from 'react';
import type { LandingSectionsProps } from '../shared/LandingSections';
import { UberStyleLandingPage } from '../uber/UberStyleLandingPage';

/** Touch-first tablet browser landing — mobility homepage pattern with 2-column hero. */
export function TabletLandingPage(props: LandingSectionsProps) {
  return <UberStyleLandingPage {...props} formFactor="tablet" />;
}
