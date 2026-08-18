import type { LandingSectionsProps } from '../shared/LandingSections';
import { MobilityStyleLandingPage } from '../mobility/MobilityStyleLandingPage';

/** Desktop browser landing — mobility homepage pattern with desktop layout tuning. */
export function DesktopLandingPage(props: LandingSectionsProps) {
  return <MobilityStyleLandingPage {...props} formFactor="desktop" />;
}
