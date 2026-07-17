import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Building2 } from 'lucide-react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { ThemeMode } from '../../../lib/platform/theme';
import type { LegalPageId } from '../../../lib/legalContent';
import { LEGAL_ENTITY_NAME } from '../../../lib/siteConfig';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import { Logo } from '../../Logo';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { AppButton } from '../../ui/AppButton';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { DesktopLandingHeroPreview } from './DesktopLandingHeroPreview';
import { LandingBadge } from '../LandingUberPrimitives';
import { GuardrCard } from '../../baseui/GuardrCard';

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

const CAPABILITIES = [
  'Live operations map',
  'Credential verification',
  'Shift check-ins & audits',
  'In-platform messaging',
  'Direct payments',
  'Crew coordination',
];

export function DesktopLandingPage({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  onOpenGuide,
  ownerMessage,
  directorMessage,
  companyPlacardDocuments = [],
}: DesktopLandingPageProps) {
  const [, theme] = useStyletron();

  return (
    <Block minHeight="100vh" backgroundColor="backgroundPrimary" data-landing-factor="desktop">
      <Block
        display="grid"
        gridTemplateColumns="minmax(360px, 42%) 1fr"
        minHeight="100vh"
      >
        <Block
          as="aside"
          display="flex"
          flexDirection="column"
          padding="scale800"
          backgroundColor="backgroundPrimary"
          $style={{ borderRight: `1px solid ${theme.colors.borderOpaque}` }}
        >
          <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale1000">
            <Block display="flex" alignItems="center" gridGap="scale400">
              <Logo size={28} className="shrink-0" />
              <Block as="span" $style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.04em' }}>
                Guard<span style={{ color: theme.colors.accent }}>r</span>
              </Block>
            </Block>
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
          </Block>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <LandingBadge>Security operations platform</LandingBadge>
            <HeadingLarge
              marginTop="0"
              marginBottom="scale600"
              overrides={{
                Block: {
                  style: {
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.05,
                    fontSize: 'clamp(2rem, 3.5vw, 3.25rem)',
                  },
                },
              }}
            >
              Run coverage.
              <br />
              Run your business.
              <br />
              <Block as="span" color="contentSecondary">
                One admin console.
              </Block>
            </HeadingLarge>
            <ParagraphMedium marginTop="0" marginBottom="scale800" color="contentSecondary">
              Clients command sites. Guards run independent careers. Staff orchestrates the field.
              A desktop admin workspace with sidebar navigation, live dashboards, and operational cards — not a stretched phone app.
            </ParagraphMedium>

            {(ownerMessage?.trim() || directorMessage?.trim()) && (
              <Block marginBottom="scale800" display="grid" gridGap="scale400">
                {ownerMessage?.trim() ? (
                  <GuardrCard>
                    <LabelSmall color="accent" marginBottom="scale200">Markeith White · Founder</LabelSmall>
                    <ParagraphMedium marginTop="0" marginBottom="0">{ownerMessage}</ParagraphMedium>
                  </GuardrCard>
                ) : null}
                {directorMessage?.trim() ? (
                  <GuardrCard>
                    <LabelSmall color="accent" marginBottom="scale200">Tyrone Johnson · Director</LabelSmall>
                    <ParagraphMedium marginTop="0" marginBottom="0">{directorMessage}</ParagraphMedium>
                  </GuardrCard>
                ) : null}
              </Block>
            )}

            <Block display="flex" flexWrap gridGap="scale400" marginBottom="scale600">
              <AppButton variant="primary" onClick={() => onNavigateToAuth('client', 'sign-up')}>
                <Building2 className="w-4 h-4" />
                Client workspace
                <ArrowRight className="w-4 h-4" />
              </AppButton>
              <AppButton variant="outline" onClick={() => onNavigateToAuth('guard', 'sign-up')}>
                <Shield className="w-4 h-4" />
                Guard workspace
              </AppButton>
            </Block>

            <AppButton variant="ghost" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
              Sign in to existing account →
            </AppButton>

            <Block
              as="ul"
              marginTop="scale1000"
              paddingLeft="0"
              $style={{ listStyle: 'none', display: 'grid', gap: '10px' }}
            >
              {CAPABILITIES.map((item) => (
                <Block as="li" key={item} display="flex" alignItems="center" gridGap="scale300">
                  <Block width="6px" height="6px" backgroundColor="accent" flex="0 0 auto" $style={{ borderRadius: '50%' }} />
                  <ParagraphMedium marginTop="0" marginBottom="0">{item}</ParagraphMedium>
                </Block>
              ))}
            </Block>
          </motion.div>

          <Block as="footer" marginTop="scale800" paddingTop="scale600" $style={{ borderTop: `1px solid ${theme.colors.borderOpaque}` }}>
            {onOpenGuide ? (
              <AppButton variant="ghost" size="sm" onClick={onOpenGuide} className="mb-3">
                Guide
              </AppButton>
            ) : null}
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
            <ParagraphMedium marginTop="scale400" marginBottom="0" color="contentSecondary">
              © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}
            </ParagraphMedium>
          </Block>
        </Block>

        <Block
          as="section"
          aria-label="Product preview"
          backgroundColor="backgroundSecondary"
          padding="scale800"
          display="flex"
          flexDirection="column"
        >
          <Block
            display="flex"
            alignItems="center"
            gridGap="scale300"
            marginBottom="scale600"
            color="contentSecondary"
          >
            <Block width="10px" height="10px" backgroundColor="negative" $style={{ borderRadius: '50%' }} />
            <Block width="10px" height="10px" backgroundColor="warning" $style={{ borderRadius: '50%' }} />
            <Block width="10px" height="10px" backgroundColor="positive" $style={{ borderRadius: '50%' }} />
            <ParagraphMedium marginTop="0" marginBottom="0">Guardr desktop · admin dashboard</ParagraphMedium>
          </Block>
          <Block flex="1" minHeight="0">
            <DesktopLandingHeroPreview />
          </Block>
        </Block>
      </Block>

      {companyPlacardDocuments.length > 0 ? (
        <Block padding="scale800" backgroundColor="backgroundPrimary">
          <CompanyPublicPlacard documents={companyPlacardDocuments} />
        </Block>
      ) : null}
    </Block>
  );
}
