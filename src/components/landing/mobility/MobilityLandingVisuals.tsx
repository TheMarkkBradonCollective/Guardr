import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { MapPin, Shield, Star, Radio, ChevronRight, Phone } from 'lucide-react';
import { FONT_DISPLAY } from '../../../theme/typography';

/**
 * Hero illustration — mimics Base Web mobile app screenshot:
 * map background with white bottom sheet showing a guard profile card.
 */
export function MobilityLandingHeroVisual() {
  const [, theme] = useStyletron();
  const isDark = theme.colors.backgroundPrimary !== '#FFFFFF' && theme.colors.backgroundPrimary !== 'white';

  return (
    <Block
      className="uber-landing-hero-art"
      position="relative"
      overrides={{
        Block: {
          style: {
            borderRadius: '16px',
            overflow: 'hidden',
            background: isDark
              ? 'linear-gradient(160deg, #1a1a1a 0%, #000000 100%)'
              : 'linear-gradient(160deg, #f5f5f5 0%, #e8e8e8 40%, #d4d4d4 100%)',
            aspectRatio: '9/16',
            maxHeight: '520px',
          },
        },
      }}
      aria-hidden
    >
      {/* Fake map tiles */}
      <Block
        position="absolute"
        overrides={{ Block: { style: { inset: 0, opacity: 0.4 } } }}
      >
        {/* Horizontal road lines */}
        {[20, 38, 56, 72].map((top) => (
          <Block
            key={top}
            position="absolute"
            overrides={{
              Block: {
                style: {
                  top: `${top}%`,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
                },
              },
            }}
          />
        ))}
        {/* Vertical road lines */}
        {[25, 50, 75].map((left) => (
          <Block
            key={left}
            position="absolute"
            overrides={{
              Block: {
                style: {
                  left: `${left}%`,
                  top: 0,
                  bottom: '40%',
                  width: '1px',
                  background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                },
              },
            }}
          />
        ))}
      </Block>

      {/* Map pin — guard location */}
      <Block
        position="absolute"
        overrides={{
          Block: {
            style: {
              top: '28%',
              left: '42%',
              transform: 'translate(-50%, -50%)',
            },
          },
        }}
      >
        <Block
          width="36px"
          height="36px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overrides={{
            Block: {
              style: {
                borderRadius: '50%',
                background: '#000',
                boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
              },
            },
          }}
        >
          <Shield size={18} color="#fff" />
        </Block>
      </Block>

      {/* Live badge */}
      <Block
        position="absolute"
        top="scale400"
        right="scale400"
        display="flex"
        alignItems="center"
        gridGap="scale200"
        paddingTop="scale300" paddingBottom="scale300" paddingLeft="scale400" paddingRight="scale400"
        overrides={{
          Block: {
            style: {
              borderRadius: '999px',
              background: '#048848',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
            },
          },
        }}
      >
        <Radio size={10} />
        2 live
      </Block>

      {/* White bottom sheet panel */}
      <Block
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        overrides={{
          Block: {
            style: {
              background: isDark ? '#000' : '#fff',
              borderRadius: '16px 16px 0 0',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
              padding: '0 0 16px',
            },
          },
        }}
      >
        {/* Drag handle */}
        <Block
          overrides={{
            Block: {
              style: {
                width: '36px',
                height: '4px',
                background: isDark ? '#2b2b2b' : '#eeeeee',
                borderRadius: '999px',
                margin: '12px auto 16px',
              },
            },
          }}
        />

        {/* Section title */}
        <Block
          paddingLeft="scale600"
          paddingRight="scale600"
          paddingBottom="scale400"
          overrides={{ Block: { style: { borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#eeeeee'}` } } }}
        >
          <Block as="p" margin={0} $style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em', color: isDark ? '#fff' : '#000' }}>
            Available guards
          </Block>
        </Block>

        {/* Guard row 1 */}
        <Block
          display="flex"
          alignItems="center"
          gridGap="scale400"
          paddingTop="scale500" paddingBottom="scale500" paddingLeft="scale600" paddingRight="scale600"
          overrides={{ Block: { style: { borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#eeeeee'}` } } }}
        >
          <Block
            width="44px"
            height="44px"
            overrides={{
              Block: {
                style: {
                  borderRadius: '50%',
                  background: isDark ? '#2b2b2b' : '#f6f6f6',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              },
            }}
          >
            <Shield size={20} color={isDark ? '#fff' : '#000'} />
          </Block>
          <Block flex="1" minWidth={0}>
            <Block as="p" margin={0} $style={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#fff' : '#000' }}>
              Marcus T.
            </Block>
            <Block display="flex" alignItems="center" gridGap="scale100" marginTop="scale100">
              <Star size={11} color="#000" fill={isDark ? '#fff' : '#000'} />
              <Block as="span" $style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#9e9e9e' : '#767676' }}>
                4.9 · Armed · 0.8 mi
              </Block>
            </Block>
          </Block>
          <Block as="p" margin={0} $style={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#fff' : '#000', flexShrink: 0 }}>
            $28/hr
          </Block>
        </Block>

        {/* Guard row 2 */}
        <Block
          display="flex"
          alignItems="center"
          gridGap="scale400"
          paddingTop="scale500" paddingBottom="scale500" paddingLeft="scale600" paddingRight="scale600"
        >
          <Block
            width="44px"
            height="44px"
            overrides={{
              Block: {
                style: {
                  borderRadius: '50%',
                  background: isDark ? '#2b2b2b' : '#f6f6f6',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              },
            }}
          >
            <Shield size={20} color={isDark ? '#fff' : '#000'} />
          </Block>
          <Block flex="1" minWidth={0}>
            <Block as="p" margin={0} $style={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#fff' : '#000' }}>
              Janelle R.
            </Block>
            <Block display="flex" alignItems="center" gridGap="scale100" marginTop="scale100">
              <Star size={11} color="#000" fill={isDark ? '#fff' : '#000'} />
              <Block as="span" $style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#9e9e9e' : '#767676' }}>
                5.0 · Unarmed · 1.2 mi
              </Block>
            </Block>
          </Block>
          <Block as="p" margin={0} $style={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#fff' : '#000', flexShrink: 0 }}>
            $24/hr
          </Block>
        </Block>
      </Block>
    </Block>
  );
}

/** Login band visual — Guardr-style guard profile card */
export function MobilityLandingLoginVisual() {
  const [, theme] = useStyletron();
  const isDark = theme.colors.backgroundPrimary !== '#FFFFFF' && theme.colors.backgroundPrimary !== 'white';

  return (
    <Block
      className="uber-landing-login-art"
      overrides={{
        Block: {
          style: {
            borderRadius: '16px',
            background: isDark ? '#1a1a1a' : '#f6f6f6',
            aspectRatio: '4/3',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            gap: '16px',
          },
        },
      }}
      aria-hidden
    >
      {/* Active shift card */}
      <Block
        overrides={{
          Block: {
            style: {
              background: isDark ? '#000' : '#fff',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        <Block display="flex" alignItems="flex-start" justifyContent="space-between" gridGap="scale400">
          <Block>
            <Block as="p" margin="0 0 4px" $style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#048848' }}>
              Live now
            </Block>
            <Block as="p" margin="0 0 8px" $style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#fff' : '#000', letterSpacing: '-0.01em' }}>
              Event Security
            </Block>
            <Block as="p" margin={0} $style={{ fontSize: '13px', color: '#767676' }}>
              Moscone Center · 12:00 – 20:00
            </Block>
          </Block>
          <Block
            width="44px"
            height="44px"
            overrides={{
              Block: {
                style: {
                  borderRadius: '50%',
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                },
              },
            }}
          >
            <Shield size={20} color="#fff" />
          </Block>
        </Block>
      </Block>

      {/* Earnings */}
      <Block
        overrides={{
          Block: {
            style: {
              background: isDark ? '#000' : '#fff',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        <Block as="p" margin="0 0 4px" $style={{ fontSize: '12px', color: '#767676', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          This week
        </Block>
        <Block as="p" margin={0} $style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: isDark ? '#fff' : '#000' }}>
          $642.00
        </Block>
      </Block>
    </Block>
  );
}
