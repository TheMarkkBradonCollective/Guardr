import React from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { Download, QrCode } from 'lucide-react';
import { GuardrButton } from '../baseui/GuardrButton';
import type { FormFactor } from '../../lib/platform/device';
import { FONT_DISPLAY } from '../../theme/typography';
import { GITHUB_ALL_APKS_ZIP, GITHUB_ROLE_APKS } from '../../lib/githubApkRelease';
import { Capacitor } from '@capacitor/core';

const APK_QR_URL = '/download/apk-qr.png';
const DOWNLOAD_PAGE_URL = '/download';
const HEADING_FONT = FONT_DISPLAY;

interface LandingAppDownloadsProps {
  formFactor: FormFactor;
  variant?: 'hero' | 'cta';
  id?: string;
}

export function LandingAppDownloads({
  formFactor,
  variant = 'hero',
  id,
}: LandingAppDownloadsProps) {
  const [, theme] = useStyletron();

  if (Capacitor.isNativePlatform()) {
    return null;
  }

  const isMobile = formFactor === 'mobile';
  const centered = variant === 'cta';
  const showScan = !isMobile;

  const panelStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    gap: '16px',
    padding: isMobile ? '20px' : '24px',
    borderRadius: '16px',
    border: `1px solid ${theme.colors.borderOpaque}`,
    background: theme.colors.backgroundPrimary,
    textAlign: 'left' as const,
  };

  return (
    <Block
      id={id}
      width="100%"
      maxWidth="1120px"
      margin={centered ? '0 auto' : undefined}
      display="flex"
      flexDirection="column"
      gridGap="scale700"
      $style={{ textAlign: 'left' }}
    >
      <Block $style={{ textAlign: centered ? 'center' : 'left' }}>
        <Block
          as="h2"
          margin="0 0 8px"
          $style={{
            fontFamily: HEADING_FONT,
            fontWeight: 700,
            fontSize: isMobile ? '1.5rem' : '2rem',
            letterSpacing: '-0.025em',
            color: theme.colors.contentPrimary,
          }}
        >
          It&apos;s easier in the app
        </Block>
        <Block
          as="p"
          margin={0}
          maxWidth="52ch"
          $style={{
            fontSize: '15px',
            lineHeight: 1.5,
            color: theme.colors.contentSecondary,
            marginInline: centered ? 'auto' : undefined,
          }}
        >
          Download Hire, Work, or Staff for Android. After you sign in, this website stays for
          billing and account settings.
        </Block>
      </Block>

      <Block
        display="grid"
        width="100%"
        gridGap="scale500"
        $style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }}
      >
        {GITHUB_ROLE_APKS.map((app) => (
          <Block key={app.id} $style={panelStyle}>
            <Block>
              <img
                src={`/icons/${app.id}-192.png`}
                width={48}
                height={48}
                alt=""
                style={{
                  display: 'block',
                  borderRadius: 12,
                  marginBottom: 12,
                  background: app.id === 'staff' ? '#ffffff' : '#000000',
                }}
              />
              <Block
                as="h3"
                margin="0 0 6px"
                $style={{
                  fontFamily: HEADING_FONT,
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '-0.015em',
                  color: theme.colors.contentPrimary,
                }}
              >
                {app.label}
              </Block>
              <Block as="p" margin={0} $style={{ fontSize: '13px', lineHeight: 1.45, color: theme.colors.contentSecondary }}>
                {app.tagline}
              </Block>
            </Block>
            <GuardrButton
              kind="primary"
              {...({ $as: 'a', href: app.url } as Record<string, unknown>)}
              startEnhancer={<Download className="w-4 h-4" />}
              overrides={{ BaseButton: { style: { width: '100%', borderRadius: '10px', textDecoration: 'none' } } }}
            >
              Download {app.label}
            </GuardrButton>
          </Block>
        ))}
      </Block>

      <Block
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent="space-between"
        gridGap="scale500"
      >
        <Block
          as="a"
          href={GITHUB_ALL_APKS_ZIP}
          $style={{
            fontSize: '13px',
            fontWeight: 600,
            color: theme.colors.contentSecondary,
            textDecoration: 'underline',
          }}
        >
          Download all APKs from GitHub
        </Block>
        {showScan ? (
          <Block display="flex" alignItems="center" gridGap="scale300">
            <img
              src={APK_QR_URL}
              width={72}
              height={72}
              alt="Scan to open the Guardr download page"
              style={{
                display: 'block',
                width: 72,
                height: 72,
                borderRadius: 8,
                background: '#ffffff',
                padding: 4,
              }}
            />
            <Block as="span" $style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.contentSecondary }}>
              <QrCode className="w-3 h-3" style={{ display: 'inline', marginRight: 4 }} />
              <a href={DOWNLOAD_PAGE_URL} style={{ color: 'inherit' }}>
                Downloads page
              </a>
            </Block>
          </Block>
        ) : (
          <GuardrButton
            kind="secondary"
            {...({ $as: 'a', href: DOWNLOAD_PAGE_URL } as Record<string, unknown>)}
            overrides={{ BaseButton: { style: { width: '100%', borderRadius: '10px', textDecoration: 'none' } } }}
          >
            Open downloads page
          </GuardrButton>
        )}
      </Block>
    </Block>
  );
}
