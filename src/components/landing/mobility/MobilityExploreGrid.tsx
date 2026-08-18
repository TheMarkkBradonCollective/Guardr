import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
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
  const columns  = isMobile ? 'repeat(2, 1fr)' : formFactor === 'tablet' ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)';

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
          marginTop={0} marginBottom="scale800" marginLeft={0} marginRight={0}
          $style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: isMobile ? '1.375rem' : '1.75rem',
            letterSpacing: '-0.025em',
            color: theme.colors.contentPrimary,
          }}
        >
          Explore Guardr
        </Block>

        <Block display="grid" className="uber-landing-explore-grid" gridTemplateColumns={columns} gridGap="scale500" minWidth={0} width="100%">
          {EXPLORE_SERVICES.map((service) => {
            const Icon = service.icon;
            const go = () => onNavigateToAuth(service.role ?? 'client', 'sign-up');

            return (
              <Block
                key={service.id}
                as="button"
                className="uber-landing-explore-card"
                onClick={go}
                role="button"
                tabIndex={0}
                overrides={{
                  Block: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: isMobile ? '160px' : '180px',
                      padding: '20px',
                      cursor: 'pointer',
                      border: 'none',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    },
                  },
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
                }}
              >
                {/* Top row: icon */}
                <Block
                  width="52px"
                  height="52px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  overrides={{
                    Block: {
                      style: {
                        borderRadius: '12px',
                        background: theme.colors.backgroundPrimary,
                        marginBottom: '16px',
                      },
                    },
                  }}
                >
                  <Icon size={26} strokeWidth={1.75} color={theme.colors.contentPrimary} aria-hidden />
                </Block>

                {/* Text */}
                <Block>
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
      className="uber-landing-login-band"
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
