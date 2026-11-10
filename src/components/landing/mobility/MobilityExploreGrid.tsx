import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { ChevronRight } from 'lucide-react';
import type { FormFactor } from '../../../lib/platform/device';
import { GuardrButton } from '../../baseui/GuardrButton';
import { EXPLORE_SERVICES } from './mobilityLandingData';
import { FONT_DISPLAY } from '../../../theme/typography';

interface MobilityExploreGridProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}

/** Guardr-style "Explore" section — gray tile grid like Guardr home (Food, Reserve, etc.) */
export function MobilityExploreGrid({ formFactor, onNavigateToAuth }: MobilityExploreGridProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';
  const isTablet = formFactor === 'tablet';
  const layout = isMobile ? 'list' : isTablet ? 'mosaic' : 'bento';

  return (
    <Block
      as="section"
      aria-label="Explore Guardr services"
      paddingTop={isMobile ? 'scale800' : 'scale1200'}
      paddingBottom={isMobile ? 'scale800' : 'scale1200'}
      paddingLeft={isMobile ? 'scale600' : 'scale800'}
      paddingRight={isMobile ? 'scale600' : 'scale800'}
      backgroundColor="backgroundPrimary"
    >
      <Block maxWidth="1280px" margin="0 auto" width="100%">
        {/* Section heading */}
        <Block
          as="h2"
          marginTop={0} marginBottom={isMobile ? 'scale500' : 'scale800'} marginLeft={0} marginRight={0}
          $style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: isMobile ? '1.75rem' : isTablet ? '2rem' : '2.25rem',
            letterSpacing: '-0.035em',
            color: theme.colors.contentPrimary,
          }}
        >
          {isMobile ? 'What you can do' : isTablet ? 'Pick a lane' : 'Explore Guardr'}
        </Block>

        <Block
          display="grid"
          className={`uber-landing-explore-grid uber-landing-explore-grid--${layout}`}
          gridGap={isMobile ? 'scale300' : 'scale500'}
          minWidth={0}
          width="100%"
        >
          {EXPLORE_SERVICES.map((service, index) => {
            const Icon = service.icon;
            const featured = !isMobile && index === 0;
            const go = () => onNavigateToAuth(service.role ?? 'client', 'sign-up');

            return (
              <Block
                key={service.id}
                as="button"
                className={`uber-landing-explore-card${featured ? ' uber-landing-explore-card--feature' : ''}`}
                onClick={go}
                role="button"
                tabIndex={0}
                overrides={{
                  Block: {
                    style: {
                      display: 'flex',
                      flexDirection: isMobile || (isTablet && featured) ? 'row' : 'column',
                      alignItems: isMobile || (isTablet && featured) ? 'center' : 'stretch',
                      justifyContent: 'space-between',
                      gap: isMobile ? '14px' : '12px',
                      minHeight: isMobile ? '0' : featured ? '220px' : '168px',
                      padding: isMobile ? '14px 16px' : '20px',
                      cursor: 'pointer',
                      border: 'none',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      width: '100%',
                      minWidth: 0,
                    },
                  },
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
                }}
              >
                {/* Top row: icon */}
                <Block
                  width={isMobile ? '44px' : '52px'}
                  height={isMobile ? '44px' : '52px'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  overrides={{
                    Block: {
                      style: {
                        borderRadius: isMobile ? '14px' : '12px',
                        background: theme.colors.backgroundPrimary,
                        marginBottom: isMobile ? 0 : '16px',
                        flexShrink: 0,
                      },
                    },
                  }}
                >
                  <Icon size={isMobile ? 22 : 26} strokeWidth={1.75} color={theme.colors.contentPrimary} aria-hidden />
                </Block>

                <Block flex="1" minWidth={0}>
                  <Block
                    as="h3"
                    margin="0 0 6px"
                    $style={{
                      fontFamily: FONT_DISPLAY,
                      fontWeight: 700,
                      fontSize: '16px',
                      color: theme.colors.contentPrimary,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {service.title}
                  </Block>
                  <Block
                    as="p"
                    margin={0}
                    $style={{
                      fontSize: '13px',
                      color: theme.colors.contentSecondary,
                      lineHeight: 1.4,
                    }}
                  >
                    {service.body}
                  </Block>
                </Block>
                {isMobile ? <ChevronRight size={18} color={theme.colors.contentSecondary} aria-hidden /> : null}
              </Block>
            );
          })}
        </Block>
      </Block>
    </Block>
  );
}

interface MobilityLoginBandProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  visual?: React.ReactNode;
}

/** Login / account band — matches Base Web "Log in to see your account" section */
export function MobilityLoginBand({ formFactor, onNavigateToAuth, visual }: MobilityLoginBandProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';

  return (
    <Block
      as="section"
      aria-label="Sign in to your account"
      className={`uber-landing-login-band uber-landing-login-band--${formFactor}`}
      paddingTop={isMobile ? 'scale800' : 'scale1200'}
      paddingBottom={isMobile ? 'scale800' : 'scale1200'}
      paddingLeft={isMobile ? 'scale600' : 'scale800'}
      paddingRight={isMobile ? 'scale600' : 'scale800'}
      backgroundColor="backgroundPrimary"
      overrides={{ Block: { style: { borderTop: `1px solid ${theme.colors.borderOpaque}` } } }}
    >
      <Block
        maxWidth="1280px"
        margin="0 auto"
        display="grid"
        gridTemplateColumns={isMobile ? '1fr' : ['1fr', '1fr', '1fr 1fr']}
        gridGap="scale1000"
        alignItems="center"
      >
        <Block>
          <Block
            as="h2"
            marginTop={0} marginBottom="scale400" marginLeft={0} marginRight={0}
            $style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: isMobile ? '1.5rem' : '2rem',
              letterSpacing: '-0.025em',
              color: theme.colors.contentPrimary,
            }}
          >
            Log in to see your account details
          </Block>
          <Block
            as="p"
            marginTop={0} marginBottom="scale600" marginLeft={0} marginRight={0}
            $style={{ fontSize: '15px', color: theme.colors.contentSecondary, lineHeight: 1.5 }}
          >
            View active shifts, past jobs, earnings, and messages — all in one place.
          </Block>
          <Block display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'stretch' : 'center'} gridGap="scale400">
            <GuardrButton
              kind="primary"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              overrides={{ BaseButton: { style: { borderRadius: '8px', width: isMobile ? '100%' : undefined } } }}
            >
              Log in to your account
            </GuardrButton>
            <button
              type="button"
              className="uber-landing-text-link"
              style={{ fontWeight: 600 }}
              onClick={() => onNavigateToAuth(undefined, 'sign-up')}
            >
              Create an account
            </button>
          </Block>
        </Block>

        {visual && !isMobile ? (
          <Block className="uber-landing-login-visual">{visual}</Block>
        ) : null}
      </Block>
    </Block>
  );
}
