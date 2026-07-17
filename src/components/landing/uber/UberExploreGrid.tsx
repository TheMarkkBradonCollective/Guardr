import React from 'react';
import { Block } from 'baseui/block';
import { ParagraphMedium } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { FormFactor } from '../../../lib/platform/device';
import { GuardrButton } from '../../baseui/GuardrButton';
import { EXPLORE_SERVICES } from './uberLandingData';

interface UberExploreGridProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}

export function UberExploreGrid({ formFactor, onNavigateToAuth }: UberExploreGridProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';

  const columns = isMobile ? '1fr' : formFactor === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';

  return (
    <Block as="section" className="uber-landing-explore" padding={isMobile ? 'scale800 scale600' : 'scale1200 scale800'} backgroundColor="backgroundPrimary">
      <Block maxWidth="1280px" margin="0 auto" width="100%">
        <Block
          as="h2"
          margin="0 0 scale800"
          $style={{
            fontWeight: 700,
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          Explore what you can do with Guardr
        </Block>

        <Block display="grid" gridTemplateColumns={columns} gridGap="scale500">
          {EXPLORE_SERVICES.map((service) => {
            const Icon = service.icon;
            const go = () => onNavigateToAuth(service.role ?? 'client', 'sign-up');

            return (
              <Block
                key={service.id}
                className="uber-landing-explore-card"
                backgroundColor="backgroundSecondary"
                padding="scale600"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                minHeight={isMobile ? '180px' : '200px'}
                overrides={{
                  Block: {
                    style: {
                      borderRadius: '12px',
                      cursor: 'pointer',
                    },
                  },
                }}
                onClick={go}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go();
                  }
                }}
              >
                <Block display="flex" justifyContent="space-between" alignItems="flex-start" gridGap="scale400">
                  <Block flex="1" minWidth={0}>
                    <Block as="h3" margin="0 0 scale300" $style={{ fontWeight: 700, fontSize: '18px' }}>
                      {service.title}
                    </Block>
                    <ParagraphMedium margin={0} color="contentSecondary" $style={{ fontSize: '14px', lineHeight: 1.45 }}>
                      {service.body}
                    </ParagraphMedium>
                  </Block>
                  <Block
                    className="uber-landing-explore-icon"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flex="0 0 72px"
                    width="72px"
                    height="72px"
                    overrides={{
                      Block: {
                        style: {
                          borderRadius: '12px',
                          backgroundColor: theme.colors.backgroundPrimary,
                        },
                      },
                    }}
                    aria-hidden
                  >
                    <Icon size={32} strokeWidth={1.5} />
                  </Block>
                </Block>

                <Block marginTop="scale500">
                  <button
                    type="button"
                    className="uber-landing-details-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      go();
                    }}
                  >
                    Details
                  </button>
                </Block>
              </Block>
            );
          })}
        </Block>
      </Block>
    </Block>
  );
}

interface UberLoginBandProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  visual?: React.ReactNode;
}

export function UberLoginBand({ formFactor, onNavigateToAuth, visual }: UberLoginBandProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';

  return (
    <Block
      as="section"
      className="uber-landing-login-band"
      padding={isMobile ? 'scale800 scale600' : 'scale1200 scale800'}
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
          <Block as="h2" margin="0 0 scale400" $style={{ fontWeight: 700, fontSize: isMobile ? '1.5rem' : '2rem', letterSpacing: '-0.02em' }}>
            Log in to see your account details
          </Block>
          <ParagraphMedium marginTop={0} marginBottom="scale600" color="contentSecondary">
            View past jobs, tailored suggestions, support resources, and more.
          </ParagraphMedium>
          <Block display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'stretch' : 'center'} gridGap="scale500">
            <GuardrButton
              kind="primary"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              overrides={{
                BaseButton: {
                  style: {
                    backgroundColor: theme.colors.contentPrimary,
                    color: theme.colors.contentInversePrimary,
                    borderRadius: '8px',
                  },
                },
              }}
            >
              Log in to your account
            </GuardrButton>
            <button type="button" className="uber-landing-text-link" onClick={() => onNavigateToAuth('client', 'sign-up')}>
              Create an account
            </button>
          </Block>
        </Block>

        {visual && !isMobile ? <Block className="uber-landing-login-visual">{visual}</Block> : null}
      </Block>
    </Block>
  );
}
