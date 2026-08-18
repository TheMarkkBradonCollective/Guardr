import React from 'react';
import type { ThemeMode } from '../lib/platform/theme';
import type { LegalPageId } from '../lib/legalContent';
import type { CompanyPublicDocument } from '../lib/companyPlacard';
import { MobilityStyleLandingPage } from './landing/mobility/MobilityStyleLandingPage';
import { useSurfaceKind } from '../surfaces';

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

/** Public homepage — one mobility landing with per-surface layout tuning. */
export function HomePage(props: HomePageProps) {
  const surface = useSurfaceKind();
  return <MobilityStyleLandingPage {...props} formFactor={surface} />;
}
