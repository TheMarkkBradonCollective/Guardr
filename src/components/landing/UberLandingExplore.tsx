import React from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium, LabelSmall, ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import {
  ArrowRight,
  Building2,
  Calendar,
  CreditCard,
  MapPin,
  MessageSquare,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { FormFactor } from '../../lib/platform/device';
import { GuardrCard } from '../baseui/GuardrCard';
import { AccentIcon } from '../baseui/dashboard';
import { LandingSectionHead } from './LandingUberPrimitives';

interface ExploreItem {
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  role?: 'client' | 'guard';
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    icon: Building2,
    title: 'Request coverage',
    body: 'Post security needs at your site. Licensed guards apply with verified credentials.',
    cta: 'Details',
    role: 'client',
  },
  {
    icon: MapPin,
    title: 'Browse jobs',
    body: 'Map-first job discovery. Filter by distance, rate, and coverage type near you.',
    cta: 'Details',
    role: 'guard',
  },
  {
    icon: Calendar,
    title: 'Schedule ahead',
    body: 'Reserve coverage in advance so your site is protected when you need it.',
    cta: 'Details',
    role: 'client',
  },
  {
    icon: Shield,
    title: 'Work independently',
    body: 'Choose assignments on your terms. Your credentials travel with your profile.',
    cta: 'Details',
    role: 'guard',
  },
  {
    icon: MessageSquare,
    title: 'In-platform messaging',
    body: 'Coordinate directly with clients or guards through secure job chat.',
    cta: 'Details',
  },
  {
    icon: CreditCard,
    title: 'Direct payments',
    body: 'Complete shifts and receive earnings through the platform. Track every payout.',
    cta: 'Details',
    role: 'guard',
  },
];

interface UberLandingExploreProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}

export function UberLandingExplore({ formFactor, onNavigateToAuth }: UberLandingExploreProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';
  const isTablet = formFactor === 'tablet';

  const gridCols = isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)';

  return (
    <section className="landing-section landing-explore-section border-t border-brand-border bg-brand-bg">
      <div className="landing-container">
        <LandingSectionHead
          badge="Explore Guardr"
          title="Explore what you can do with Guardr"
          lead="One platform for clients, guards, and operations — purpose-built for security work."
          center={!isMobile}
        />
        <Block
          display="grid"
          gridTemplateColumns={gridCols}
          gridGap="scale600"
        >
          {EXPLORE_ITEMS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <GuardrCard
                interactive
                onClick={() => {
                  if (item.role) onNavigateToAuth(item.role, 'sign-up');
                }}
                overrides={{
                  Root: {
                    style: {
                      cursor: item.role ? 'pointer' : 'default',
                      height: '100%',
                      transition: 'border-color 150ms ease, transform 150ms ease',
                      ':hover': item.role
                        ? { borderColor: theme.colors.accent, transform: 'translateY(-2px)' }
                        : {},
                    },
                  },
                }}
              >
                <Block
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="48px"
                  height="48px"
                  backgroundColor="accent50"
                  marginBottom="scale500"
                  $style={{ borderRadius: '12px' }}
                >
                  <AccentIcon icon={item.icon} size={24} strokeWidth={1.75} />
                </Block>
                <HeadingMedium
                  marginTop="0"
                  marginBottom="scale300"
                  overrides={{ Block: { style: { fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' } } }}
                >
                  {item.title}
                </HeadingMedium>
                <ParagraphMedium marginTop="0" marginBottom="scale500" color="contentSecondary">
                  {item.body}
                </ParagraphMedium>
                {item.role ? (
                  <Block
                    display="inline-flex"
                    alignItems="center"
                    gridGap="scale200"
                    color="accent"
                    $style={{ fontWeight: 700, fontSize: '14px' }}
                  >
                    {item.cta} <ArrowRight size={14} color={theme.colors.accent} />
                  </Block>
                ) : null}
              </GuardrCard>
            </motion.div>
          ))}
        </Block>
      </div>
    </section>
  );
}

interface UberLandingEarnProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}

export function UberLandingEarn({ formFactor, onNavigateToAuth }: UberLandingEarnProps) {
  const isMobile = formFactor === 'mobile';
  const isDesktop = formFactor === 'desktop';

  return (
    <section className="landing-section border-t border-brand-border bg-brand-bg-sec">
      <div className="landing-container">
        <Block
          display="grid"
          gridTemplateColumns={isMobile ? '1fr' : ['1fr', '1fr', '1fr 1fr', '1fr 1fr']}
          gridGap="scale1000"
          alignItems="center"
        >
          <Block>
            <LabelSmall
              overrides={{
                Block: {
                  style: {
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                    marginBottom: '0.75rem',
                  },
                },
              }}
              color="accent"
            >
              For guards
            </LabelSmall>
            <HeadingMedium
              marginTop="0"
              marginBottom="scale500"
              overrides={{
                Block: {
                  style: {
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                    fontSize: isDesktop ? 'clamp(1.75rem, 3vw, 2.5rem)' : undefined,
                  },
                },
              }}
            >
              Work when you want, earn what you need
            </HeadingMedium>
            <ParagraphMedium marginTop="0" marginBottom="scale800" color="contentSecondary">
              Make money on your schedule with security assignments. Browse jobs on the map,
              set your rate, and build your independent career — all through Guardr.
            </ParagraphMedium>
            <Block display="flex" flexWrap gridGap="scale400">
              <Block
                as="button"
                type="button"
                onClick={() => onNavigateToAuth('guard', 'sign-up')}
                backgroundColor="accent"
                color="contentOnColor"
                padding="scale500 scale700"
                $style={{
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                Get started
              </Block>
              <Block
                as="button"
                type="button"
                onClick={() => onNavigateToAuth('guard', 'sign-in')}
                padding="scale500 scale700"
                $style={{
                  border: '1px solid var(--uber-border)',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'inherit',
                  minHeight: '48px',
                }}
              >
                Already have an account? Sign in
              </Block>
            </Block>
          </Block>
          <Block
            display="flex"
            alignItems="center"
            justifyContent="center"
            padding="scale800"
            backgroundColor="accent50"
            $style={{ borderRadius: '16px', minHeight: isMobile ? '200px' : '280px' }}
          >
            <Block textAlign="center">
              <Block marginBottom="scale400">
                <Users size={48} strokeWidth={1.25} className="uber-text-accent mx-auto" />
              </Block>
              <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
                Map-first job discovery · Digital credentials · Direct pay
              </ParagraphMedium>
            </Block>
          </Block>
        </Block>
      </div>
    </section>
  );
}

interface UberLandingBusinessProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}

export function UberLandingBusiness({ formFactor, onNavigateToAuth }: UberLandingBusinessProps) {
  const isMobile = formFactor === 'mobile';

  return (
    <section className="landing-section border-t border-brand-border bg-brand-bg">
      <div className="landing-container">
        <Block
          display="grid"
          gridTemplateColumns={isMobile ? '1fr' : ['1fr', '1fr', '1fr 1fr', '1fr 1fr']}
          gridGap="scale1000"
          alignItems="center"
        >
          <Block
            order={isMobile ? 2 : 1}
            display="flex"
            alignItems="center"
            justifyContent="center"
            padding="scale800"
            backgroundColor="backgroundSecondary"
            $style={{ borderRadius: '16px', minHeight: isMobile ? '200px' : '280px' }}
          >
            <Block textAlign="center">
              <Block marginBottom="scale400">
                <Building2 size={48} strokeWidth={1.25} className="uber-text-accent mx-auto" />
              </Block>
              <ParagraphMedium marginTop="0" marginBottom="0" color="contentSecondary">
                Live coverage map · Credential verification · Shift tracking
              </ParagraphMedium>
            </Block>
          </Block>
          <Block order={isMobile ? 1 : 2}>
            <LabelSmall
              color="accent"
              overrides={{
                Block: {
                  style: {
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                    marginBottom: '0.75rem',
                  },
                },
              }}
            >
              For clients
            </LabelSmall>
            <HeadingMedium
              marginTop="0"
              marginBottom="scale500"
              overrides={{ Block: { style: { fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 } } }}
            >
              The security platform you need, reimagined for your sites
            </HeadingMedium>
            <ParagraphMedium marginTop="0" marginBottom="scale800" color="contentSecondary">
              Guardr is a platform for managing security coverage across locations —
              post jobs, review licensed guards, and monitor live operations from one dashboard.
            </ParagraphMedium>
            <Block display="flex" flexWrap gridGap="scale400">
              <Block
                as="button"
                type="button"
                onClick={() => onNavigateToAuth('client', 'sign-up')}
                backgroundColor="accent"
                color="contentOnColor"
                padding="scale500 scale700"
                $style={{
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                Get started
              </Block>
              <Block
                as="button"
                type="button"
                onClick={() => onNavigateToAuth('client', 'sign-in')}
                padding="scale500 scale700"
                $style={{
                  border: '1px solid var(--uber-border)',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: 'inherit',
                  minHeight: '48px',
                }}
              >
                Check out our solutions
              </Block>
            </Block>
          </Block>
        </Block>
      </div>
    </section>
  );
}
