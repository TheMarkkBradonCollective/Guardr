import React from 'react';
import { Block } from 'baseui/block';
import { Shield, MapPin, Radio } from 'lucide-react';
import { useStyletron } from 'baseui';

/** Uber-style hero illustration — operations map preview. */
export function UberLandingHeroVisual() {
  const [, theme] = useStyletron();

  return (
    <Block
      className="uber-landing-hero-art"
      position="relative"
      height={['280px', '320px', '420px']}
      overrides={{
        Block: {
          style: {
            borderRadius: '16px',
            overflow: 'hidden',
            background: `linear-gradient(145deg, ${theme.colors.accent50} 0%, ${theme.colors.backgroundSecondary} 55%, ${theme.colors.backgroundTertiary} 100%)`,
          },
        },
      }}
      aria-hidden
    >
      <Block
        position="absolute"
        top="12%"
        left="8%"
        right="8%"
        bottom="28%"
        overrides={{
          Block: {
            style: {
              borderRadius: '12px',
              backgroundColor: theme.colors.backgroundPrimary,
              border: `1px solid ${theme.colors.borderOpaque}`,
              opacity: 0.92,
            },
          },
        }}
      >
        <Block padding="scale400" display="flex" alignItems="center" gridGap="scale300">
          <MapPin size={16} color={theme.colors.accent} />
          <Block as="span" $style={{ fontSize: '13px', fontWeight: 600 }}>Live operations map</Block>
        </Block>
        <Block position="relative" height="calc(100% - 48px)" padding="scale400">
          <Block
            position="absolute"
            top="25%"
            left="30%"
            width="14px"
            height="14px"
            overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: theme.colors.accent, boxShadow: `0 0 0 6px ${theme.colors.accent50}` } } }}
          />
          <Block
            position="absolute"
            top="55%"
            left="62%"
            width="10px"
            height="10px"
            overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: theme.colors.contentTertiary } } }}
          />
          <Block
            position="absolute"
            top="40%"
            left="48%"
            width="10px"
            height="10px"
            overrides={{ Block: { style: { borderRadius: '50%', backgroundColor: theme.colors.contentTertiary, opacity: 0.7 } } }}
          />
        </Block>
      </Block>

      <Block
        position="absolute"
        left="scale600"
        right="scale600"
        bottom="scale600"
        padding="scale500"
        overrides={{
          Block: {
            style: {
              borderRadius: '12px',
              backdropFilter: 'blur(16px) saturate(150%)',
              backgroundColor: 'rgba(255,255,255,0.82)',
              border: `1px solid ${theme.colors.borderOpaque}`,
            },
          },
        }}
      >
        <Block display="flex" alignItems="center" justifyContent="space-between" gridGap="scale400">
          <Block>
            <Block as="p" margin="0 0 4px" $style={{ fontWeight: 700, fontSize: '15px' }}>
              Ready to go live?
            </Block>
            <Block as="p" margin={0} $style={{ fontSize: '13px', color: theme.colors.contentSecondary }}>
              Post coverage and match with licensed guards.
            </Block>
          </Block>
          <Block
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="44px"
            height="44px"
            overrides={{
              Block: {
                style: {
                  borderRadius: '50%',
                  backgroundColor: theme.colors.backgroundPrimary,
                  border: `1px solid ${theme.colors.borderOpaque}`,
                },
              },
            }}
          >
            <Shield size={20} color={theme.colors.accent} />
          </Block>
        </Block>
      </Block>

      <Block
        position="absolute"
        top="scale500"
        right="scale500"
        display="flex"
        alignItems="center"
        gridGap="scale200"
        padding="scale300 scale400"
        overrides={{
          Block: {
            style: {
              borderRadius: '999px',
              backgroundColor: theme.colors.positive,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
            },
          },
        }}
      >
        <Radio size={12} />
        3 live
      </Block>
    </Block>
  );
}

/** Illustration for login band — simplified crew graphic. */
export function UberLandingLoginVisual() {
  const [, theme] = useStyletron();

  return (
    <Block
      className="uber-landing-login-art"
      height={['240px', '280px', '320px']}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overrides={{
        Block: {
          style: {
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.colors.accent} 0%, #1a1a1a 100%)`,
          },
        },
      }}
      aria-hidden
    >
      <Block display="flex" alignItems="flex-end" gridGap="scale400" padding="scale800">
        <Block
          width="80px"
          height="120px"
          overrides={{ Block: { style: { borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)' } } }}
        />
        <Block
          width="100px"
          height="160px"
          overrides={{ Block: { style: { borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.25)' } } }}
        />
        <Block
          width="72px"
          height="100px"
          overrides={{ Block: { style: { borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.12)' } } }}
        />
      </Block>
    </Block>
  );
}
