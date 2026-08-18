import React from 'react';
import type { ThemeMode } from '../lib/platform/theme';
import { useLayoutFormFactor } from '../surfaces';
import type { LegalPageId } from '../lib/legalContent';
import type { CompanyPublicDocument } from '../lib/companyPlacard';
import { DesktopLandingPage } from './landing/desktop/DesktopLandingPage';
import { MobileLandingPage } from './landing/mobile/MobileLandingPage';
import { TabletLandingPage } from './landing/tablet/TabletLandingPage';

import type { AuthViewRole } from '../lib/appNavigation';

interface HomePageProps {
  onNavigateToAuth: (role?: AuthViewRole, mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  ownerMessage?: string;
  directorMessage?: string;
  companyPlacardDocuments?: CompanyPublicDocument[];
}

export function HomePage(props: HomePageProps) {
  const formFactor = useLayoutFormFactor();

  if (formFactor === 'desktop') {
    return <DesktopLandingPage {...props} />;
  }

  if (formFactor === 'tablet') {
    return <TabletLandingPage {...props} formFactor="tablet" />;
  }

  return <MobileLandingPage {...props} formFactor="mobile" />;
}
