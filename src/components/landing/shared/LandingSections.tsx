import React from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { AppButton } from '../../ui/AppButton';
import { GuardrCard } from '../../baseui/GuardrCard';
import { GuardrTag } from '../../baseui/GuardrTag';
import { AccentIcon } from '../../baseui/dashboard';
import { LegalInfoCards } from '../../legal/LegalInfoCards';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { SignatureSecuritySpecialistLink } from '../../SignatureSecuritySpecialistLink';
import { Logo } from '../../Logo';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { LandingAppDownloads } from '../LandingAppDownloads';
import { LandingPathCards } from '../LandingPathCards';
import {
  LandingBadge,
  LandingCoverageTags,
  LandingHighlightCard,
  LandingHowCard,
  LandingSectionHead,
} from '../LandingPrimitives';
import type { ThemeMode } from '../../../lib/platform/theme';
import type { LegalPageId } from '../../../lib/legalContent';
import { LEGAL_DISCLAIMER_SHORT } from '../../../lib/legalContent';
import { LegalEntityName } from '../../SignatureSecurityBrand';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import type { FormFactor } from '../../../lib/platform/device';
import type { AuthViewRole } from '../../../lib/appNavigation';
import { resolveManualPdfUrl, USER_MANUALS_COMBINED_HREF } from '../../../lib/userManuals';
import {
  CLIENT_FEATURES,
  COVERAGE_TYPES,
  GUARD_FEATURES,
  HOW_IT_WORKS,
  PLATFORM_HIGHLIGHTS,
  TRUST_METRICS,
} from './landingData';

export interface LandingSectionsProps {
  formFactor: FormFactor;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onNavigateToAuth: (role?: AuthViewRole, mode?: 'sign-in' | 'sign-up') => void;
  onOpenLegal: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  ownerMessage?: string;
  directorMessage?: string;
  companyPlacardDocuments?: CompanyPublicDocument[];
}

function LeadershipMessages({ ownerMessage, directorMessage }: { ownerMessage?: string; directorMessage?: string }) {
  if (!ownerMessage?.trim() && !directorMessage?.trim()) return null;

  return (
    <Block marginBottom="scale600" maxWidth="480px">
      {ownerMessage?.trim() ? (
        <GuardrCard overrides={{ Root: { style: { marginBottom: '12px' } } }}>
          <LabelSmall color="accent" marginBottom="scale200" overrides={{ Block: { style: { fontWeight: 700 } } }}>
            Markeith White · Founder
          </LabelSmall>
          <ParagraphMedium margin={0} color="contentSecondary" $style={{ whiteSpace: 'pre-wrap' }}>
            {ownerMessage}
          </ParagraphMedium>
        </GuardrCard>
      ) : null}
      {directorMessage?.trim() ? (
        <GuardrCard>
          <LabelSmall color="accent" marginBottom="scale200" overrides={{ Block: { style: { fontWeight: 700 } } }}>
            Tyrone Johnson · Director
          </LabelSmall>
          <ParagraphMedium margin={0} color="contentSecondary" $style={{ whiteSpace: 'pre-wrap' }}>
            {directorMessage}
          </ParagraphMedium>
        </GuardrCard>
      ) : null}
    </Block>
  );
}

function FeatureColumn({
  badge,
  headline,
  lead,
  features,
  ctaLabel,
  ctaVariant,
  onCta,
  accentIcons = false,
}: {
  badge: string;
  headline: string;
  lead: string;
  features: readonly { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; body: string }[];
  ctaLabel: string;
  ctaVariant: 'primary' | 'outline';
  onCta: () => void;
  accentIcons?: boolean;
}) {
  return (
    <GuardrCard>
      <LandingBadge>{badge}</LandingBadge>
      <HeadingMedium marginTop="0" marginBottom="scale400" overrides={{ Block: { style: { fontWeight: 900 } } }}>
        {headline}
      </HeadingMedium>
      <ParagraphMedium marginTop="0" marginBottom="scale600" color="contentSecondary">
        {lead}
      </ParagraphMedium>
      <Block as="ul" marginTop={0} marginBottom="scale800" marginLeft={0} marginRight={0} padding={0} $style={{ listStyle: 'none' }}>
        {features.map(({ icon: Icon, title, body }) => (
          <Block
            as="li"
            key={title}
            display="flex"
            gridGap="scale400"
            marginBottom="scale500"
            alignItems="flex-start"
          >
            <Block
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="40px"
              height="40px"
              flex="0 0 40px"
              overrides={{
                Block: {
                  style: {
                    borderRadius: '10px',
                    backgroundColor: accentIcons ? 'accent50' : 'backgroundSecondary',
                  },
                },
              }}
            >
              {accentIcons ? <AccentIcon icon={Icon as never} size={20} strokeWidth={1.75} /> : <Icon className="w-5 h-5" strokeWidth={1.75} />}
            </Block>
            <Block minWidth={0}>
              <Block as="p" margin="0 0 4px" $style={{ fontWeight: 700 }}>
                {title}
              </Block>
              <ParagraphMedium margin={0} color="contentSecondary" $style={{ fontSize: '14px' }}>
                {body}
              </ParagraphMedium>
            </Block>
          </Block>
        ))}
      </Block>
      <AppButton variant={ctaVariant} onClick={onCta}>
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </AppButton>
    </GuardrCard>
  );
}

export function LandingTrustStrip({ formFactor }: { formFactor: FormFactor }) {
  if (formFactor === 'mobile') return null;

  return (
    <Block as="section" paddingTop="scale800" paddingBottom="scale800" backgroundColor="backgroundSecondary" aria-label="Platform highlights">
      <Block maxWidth="1200px" margin="0 auto" paddingLeft="scale800" paddingRight="scale800">
        <Block
          display="grid"
          gridTemplateColumns={formFactor === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'}
          gridGap="scale600"
        >
          {TRUST_METRICS.map(({ value, label }) => (
            <Block key={label} $style={{ textAlign: 'center' }}>
              <Block as="span" display="block" $style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.03em' }}>
                {value}
              </Block>
              <LabelSmall color="contentSecondary" marginTop="scale200" marginBottom={0}>
                {label}
              </LabelSmall>
            </Block>
          ))}
        </Block>
      </Block>
    </Block>
  );
}

export function LandingBodySections({
  formFactor,
  onNavigateToAuth,
  onOpenLegal,
  ownerMessage,
  directorMessage,
  companyPlacardDocuments = [],
}: Pick<
  LandingSectionsProps,
  'formFactor' | 'onNavigateToAuth' | 'onOpenLegal' | 'ownerMessage' | 'directorMessage' | 'companyPlacardDocuments'
>) {
  const isMobile = formFactor === 'mobile';
  const isTablet = formFactor === 'tablet';
  const sectionPad = isMobile ? 'scale600' : 'scale800';
  const containerMax = '1200px';

  return (
    <>
      {companyPlacardDocuments.length > 0 ? <CompanyPublicPlacard documents={companyPlacardDocuments} /> : null}

      <LandingTrustStrip formFactor={formFactor} />

      <Block as="section" paddingTop={sectionPad} paddingBottom={sectionPad}>
        <Block maxWidth={containerMax} margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad}>
          <LandingSectionHead
            badge="How it works"
            title="From post to paid shift"
            lead="A direct marketplace — clients and guards arrange each job, with Guardr handling the tools."
          />
          <Block
            display="grid"
            gridTemplateColumns={isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'}
            gridGap="scale500"
          >
            {HOW_IT_WORKS.map(({ step, icon, title, body }, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <LandingHowCard step={step} icon={icon} title={title} body={body} />
              </motion.div>
            ))}
          </Block>
        </Block>
      </Block>

      <Block as="section" paddingTop={sectionPad} paddingBottom={sectionPad} backgroundColor="backgroundPrimary" overrides={{ Block: { style: { borderTop: '1px solid', borderColor: 'borderOpaque' } } }}>
        <Block maxWidth={containerMax} margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad}>
          <Block
            display="grid"
            gridTemplateColumns={isMobile ? '1fr' : '1fr 1fr'}
            gridGap="scale600"
          >
            <FeatureColumn
              badge="Guard"
              headline="Work independently, get paid directly"
              lead="Map-first job discovery, earnings tracking, digital credentials, and full shift tools. You contract per assignment — not an employee of Guardr or the client."
              features={GUARD_FEATURES}
              ctaLabel="Create guard account"
              ctaVariant="outline"
              onCta={() => onNavigateToAuth('guard', 'sign-up')}
              accentIcons
            />
            <FeatureColumn
              badge="Customer"
              headline="Request coverage at your site"
              lead="Post jobs with full site details, review licensed guards, and monitor active coverage — with dedicated messaging and support when you need it."
              features={CLIENT_FEATURES}
              ctaLabel="Get started as a client"
              ctaVariant="primary"
              onCta={() => onNavigateToAuth('client', 'sign-up')}
            />
          </Block>
        </Block>
      </Block>

      <Block as="section" paddingTop={sectionPad} paddingBottom={sectionPad} backgroundColor="backgroundSecondary">
        <Block maxWidth={containerMax} margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad}>
          <LandingSectionHead
            badge="Everything included"
            title="Built for the job, not around it"
            lead="Every feature on Guardr is designed for how security work actually happens."
            center
          />
          <Block
            display="grid"
            gridTemplateColumns={isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'}
            gridGap="scale500"
          >
            {PLATFORM_HIGHLIGHTS.map(({ icon, title, body }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <LandingHighlightCard icon={icon} title={title} body={body} />
              </motion.div>
            ))}
          </Block>
        </Block>
      </Block>

      <Block as="section" paddingTop={sectionPad} paddingBottom={sectionPad} backgroundColor="backgroundPrimary">
        <Block maxWidth={containerMax} margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad} $style={{ textAlign: 'center' }}>
          <LandingSectionHead
            badge="Coverage types"
            title="Built for real-world coverage"
            lead="Any site, any shift length, any requirement. Post what you need — guards apply with the credentials to match."
            center
          />
          <LandingCoverageTags tags={[...COVERAGE_TYPES]} />
        </Block>
      </Block>

      <Block as="section" paddingTop={sectionPad} paddingBottom={sectionPad} backgroundColor="backgroundSecondary">
        <Block maxWidth="640px" margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad}>
          <GuardrCard>
            <Block $style={{ textAlign: 'center' }}>
              <LandingBadge center>Marketplace rules</LandingBadge>
              <HeadingMedium marginTop="0" marginBottom="scale400" overrides={{ Block: { style: { fontWeight: 900 } } }}>
                Transparent by design
              </HeadingMedium>
              <ParagraphMedium marginTop="0" marginBottom="scale600" color="contentSecondary">
                {LEGAL_DISCLAIMER_SHORT} Each job is a direct arrangement between the client and the
                independent guard they select. We do not guarantee placement, outcomes, or on-site performance.
              </ParagraphMedium>
              <Block display="flex" flexWrap justifyContent="center" gridGap="scale300">
                <GuardrTag kind="neutral">Clients contract per job</GuardrTag>
                <GuardrTag kind="neutral">Guards choose assignments</GuardrTag>
                <GuardrTag kind="neutral">Platform tools &amp; support</GuardrTag>
              </Block>
            </Block>
          </GuardrCard>
        </Block>
      </Block>

      <Block as="section" paddingTop={sectionPad} paddingBottom={sectionPad} backgroundColor="backgroundPrimary">
        <Block maxWidth={containerMax} margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad}>
          <Block $style={{ textAlign: 'center' }} marginBottom="scale800">
            <HeadingMedium marginTop="0" marginBottom="scale400" overrides={{ Block: { style: { fontWeight: 900 } } }}>
              Policies &amp; data
            </HeadingMedium>
            <ParagraphMedium margin={0} color="contentSecondary">
              Read how Guardr handles your data and the marketplace rules for clients and guards.
            </ParagraphMedium>
          </Block>
          <LegalInfoCards onOpenLegal={onOpenLegal} />
        </Block>
      </Block>

      <Block as="section" paddingTop={sectionPad} paddingBottom={sectionPad} backgroundColor="backgroundSecondary">
        <Block maxWidth="640px" margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad} $style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45 }}
          >
            <LandingBadge center>Get started</LandingBadge>
            <HeadingMedium
              marginTop="0"
              marginBottom="scale400"
              overrides={{ Block: { style: { fontWeight: 900, letterSpacing: '-0.04em' } } }}
            >
              Ready when you are
            </HeadingMedium>
            <ParagraphMedium marginTop="0" marginBottom="scale600" color="contentSecondary">
              Marketplace accounts for guards and clients — or apply to work at Guardr as platform staff.
            </ParagraphMedium>
            <Block
              display="flex"
              flexDirection={isMobile ? 'column' : 'row'}
              justifyContent="center"
              gridGap="scale400"
              marginBottom="scale600"
              overrides={{ Block: { style: { flexWrap: 'wrap' } } }}
            >
              <AppButton variant="primary" onClick={() => onNavigateToAuth('staff', 'sign-up')}>
                Apply at Guardr (staff)
              </AppButton>
              <AppButton variant="outline" onClick={() => onNavigateToAuth('client', 'sign-up')}>
                I need security
              </AppButton>
              <AppButton variant="outline" onClick={() => onNavigateToAuth('guard', 'sign-up')}>
                I&apos;m a guard
              </AppButton>
            </Block>
            <LandingAppDownloads formFactor={formFactor} variant="cta" onNavigateToAuth={onNavigateToAuth} />
            <Block marginTop="scale400">
              <AppButton variant="ghost" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
                Sign in to your account
              </AppButton>
            </Block>
          </motion.div>
        </Block>
      </Block>
    </>
  );
}

export function LandingHeroSection({
  formFactor,
  onNavigateToAuth,
  ownerMessage,
  directorMessage,
}: Pick<LandingSectionsProps, 'formFactor' | 'onNavigateToAuth' | 'ownerMessage' | 'directorMessage'>) {
  const isMobile = formFactor === 'mobile';
  const sectionPad = isMobile ? 'scale600' : 'scale800';

  return (
    <Block
      as="section"
      paddingTop={sectionPad}
      paddingBottom="scale1000"
      position="relative"
      overflow="hidden"
      data-landing-hero
    >
      <Block maxWidth="1200px" margin="0 auto" paddingLeft={sectionPad} paddingRight={sectionPad}>
        <Block
          display="grid"
          gridTemplateColumns={isMobile ? '1fr' : '1fr 1fr'}
          gridGap="scale800"
          alignItems="center"
        >
          <Block>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <LandingBadge>Independent security marketplace</LandingBadge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.04 }}
            >
              <Block
                as="h1"
                marginTop={0} marginBottom="scale500" marginLeft={0} marginRight={0}
                $style={{
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.05,
                  fontSize: isMobile ? 'clamp(2rem, 8vw, 2.75rem)' : 'clamp(2.25rem, 4vw, 3.25rem)',
                }}
              >
                Security,
                {!isMobile ? <br /> : ' '}
                <Block as="span" color="accent">
                  when you need it.
                </Block>
              </Block>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ParagraphMedium marginTop="0" marginBottom="scale600" color="contentSecondary" $style={{ fontWeight: 500, maxWidth: '32rem' }}>
                Clients post jobs. Licensed guards choose assignments.
                Maps, messaging, and payments — all in one place.
              </ParagraphMedium>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
            >
              <LeadershipMessages ownerMessage={ownerMessage} directorMessage={directorMessage} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <LandingPathCards onNavigateToAuth={onNavigateToAuth} layout={formFactor} />
              <Block marginTop="scale500">
                <LandingAppDownloads formFactor={formFactor} variant="hero" id="get-app" onNavigateToAuth={onNavigateToAuth} />
              </Block>
              <Block marginTop="scale400">
                <AppButton variant="ghost" size="sm" onClick={() => onNavigateToAuth(undefined, 'sign-in')}>
                  Already have an account? Sign in →
                </AppButton>
              </Block>
            </motion.div>
          </Block>

          {!isMobile ? (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              aria-hidden
            >
              <GuardrCard overrides={{ Root: { style: { overflow: 'hidden', padding: 0 } } }}>
                <Block padding="scale400" backgroundColor="backgroundSecondary" display="flex" alignItems="center" gridGap="scale300">
                  <Block width="8px" height="8px" overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: '#ff5f57' } } }} />
                  <Block width="8px" height="8px" overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: '#febc2e' } } }} />
                  <Block width="8px" height="8px" overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: '#28c840' } } }} />
                  <LabelSmall margin={0} color="contentSecondary">Guardr</LabelSmall>
                </Block>
                <Block height="180px" position="relative" backgroundColor="accent50" overrides={{ Block: { style: { backgroundImage: 'linear-gradient(135deg, accent50 0%, backgroundSecondary 100%)' } } }}>
                  <Block position="absolute" top="30%" left="25%" width="12px" height="12px" overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: 'accent', opacity: 0.6 } } }} />
                  <Block position="absolute" top="50%" left="60%" width="12px" height="12px" overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: 'accent', opacity: 0.4 } } }} />
                  <Block position="absolute" top="40%" left="45%" width="16px" height="16px" overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: 'accent', boxShadow: '0 0 0 4px rgba(39,110,241,0.2)' } } }} />
                </Block>
                <Block padding="scale500">
                  <Block display="flex" justifyContent="space-between" alignItems="center" marginBottom="scale400">
                    <Block>
                      <Block as="p" margin="0 0 2px" $style={{ fontWeight: 700, fontSize: '14px' }}>Retail patrol</Block>
                      <LabelSmall margin={0} color="contentSecondary">Tonight · 8 hrs · 2.4 mi</LabelSmall>
                    </Block>
                    <LabelSmall margin={0} color="accent" overrides={{ Block: { style: { fontWeight: 700 } } }}>$28/hr</LabelSmall>
                  </Block>
                  <Block display="flex" justifyContent="space-between" alignItems="center" $style={{ opacity: 0.6 }}>
                    <Block>
                      <Block as="p" margin="0 0 2px" $style={{ fontWeight: 700, fontSize: '14px' }}>Event security</Block>
                      <LabelSmall margin={0} color="contentSecondary">Sat · 6 hrs · 5.1 mi</LabelSmall>
                    </Block>
                    <LabelSmall margin={0} color="accent" overrides={{ Block: { style: { fontWeight: 700 } } }}>$32/hr</LabelSmall>
                  </Block>
                </Block>
              </GuardrCard>
            </motion.div>
          ) : null}
        </Block>
      </Block>
    </Block>
  );
}

export function LandingFooter({
  formFactor,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  onOpenGuide,
}: Pick<LandingSectionsProps, 'formFactor' | 'themeMode' | 'onChangeTheme' | 'onOpenLegal' | 'onOpenGuide'>) {
  const isMobile = formFactor === 'mobile';

  return (
    <Block
      as="footer"
      padding={isMobile ? 'scale600' : 'scale800'}
      backgroundColor="backgroundPrimary"
      overrides={{ Block: { style: { borderTop: '1px solid', borderColor: 'borderOpaque' } } }}
    >
      <Block
        maxWidth="1200px"
        margin="0 auto"
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'flex-start' : 'center'}
        justifyContent="space-between"
        gridGap="scale600"
      >
        <Block display="flex" alignItems="center" gridGap="scale400">
          <Logo size={22} className="shrink-0" />
          <Block>
            <Block as="span" display="block" $style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '-0.04em' }}>
              Guardr
            </Block>
            <LabelSmall margin={0} color="contentSecondary" overrides={{ Block: { style: { textTransform: 'uppercase', letterSpacing: '0.08em' } } }}>
              by <SignatureSecuritySpecialistLink />
            </LabelSmall>
          </Block>
        </Block>

        {!isMobile ? <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" /> : null}

        <Block display="flex" flexDirection="column" alignItems={isMobile ? 'flex-start' : 'flex-end'} gridGap="scale400">
          <Block display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gridGap="scale300">
            {onOpenGuide ? (
              <AppButton variant="ghost" size="sm" onClick={onOpenGuide}>
                Guide
              </AppButton>
            ) : null}
            <AppButton
              variant="ghost"
              size="sm"
              {...({
                $as: 'a',
                href: resolveManualPdfUrl(USER_MANUALS_COMBINED_HREF),
                download: 'Guardr-User-Manuals-Combined.pdf',
                type: 'application/pdf',
                target: '_blank',
                rel: 'noopener noreferrer',
              } as Record<string, unknown>)}
            >
              Manuals (PDF)
            </AppButton>
          </Block>
          <LegalFooterLinks onOpenLegal={onOpenLegal} />
          <ParagraphMedium margin={0} color="contentSecondary" $style={{ fontSize: '12px', maxWidth: '280px', textAlign: isMobile ? 'left' : 'right' }}>
            © {new Date().getFullYear()} <LegalEntityName />. Independent contractor marketplace. State licensing rules apply.
          </ParagraphMedium>
        </Block>
      </Block>

      {isMobile ? (
        <Block marginTop="scale500" display="flex" justifyContent="center">
          <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
        </Block>
      ) : null}
    </Block>
  );
}

export function LandingMobileCtaBar({
  onNavigateToAuth,
}: {
  onNavigateToAuth: (role?: AuthViewRole, mode?: 'sign-in' | 'sign-up') => void;
}) {
  return (
    <Block
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      padding="scale400"
      backgroundColor="backgroundPrimary"
      className="mobility-landing-cta-bar"
      overrides={{
        Block: {
          style: {
            borderTop: '1px solid',
            borderColor: 'borderOpaque',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            zIndex: 40,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          },
        },
      }}
      role="region"
      aria-label="Get started"
    >
      <Block display="grid" gridTemplateColumns="1fr 1fr" gridGap="scale300">
        <AppButton fullWidth variant="primary" onClick={() => onNavigateToAuth('client', 'sign-up')}>
          I need security
        </AppButton>
        <AppButton fullWidth variant="outline" onClick={() => onNavigateToAuth('guard', 'sign-up')}>
          I&apos;m a guard
        </AppButton>
      </Block>
    </Block>
  );
}
