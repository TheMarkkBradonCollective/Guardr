import React from 'react';
import type { ThemeMode } from '../../../lib/platform/theme';
import type { LegalPageId } from '../../../lib/legalContent';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import { UberStyleLandingPage } from '../uber/UberStyleLandingPage';

interface DesktopLandingPageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  ownerMessage?: string;
  directorMessage?: string;
  companyPlacardDocuments?: CompanyPublicDocument[];
}

/** Desktop browser landing — Uber homepage pattern with split hero + illustration. */
export function DesktopLandingPage(props: DesktopLandingPageProps) {
  return <UberStyleLandingPage {...props} formFactor="desktop" />;
}
