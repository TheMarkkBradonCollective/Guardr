import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { Download, Smartphone, ArrowRight, QrCode } from 'lucide-react';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';
import { PwaInstallGuide } from './PwaInstallGuide';
import { GuardrButton } from '../baseui/GuardrButton';
import type { FormFactor } from '../../lib/platform/device';

const APK_DOWNLOAD_URL = '/download/guardr.apk';
const APK_QR_URL = '/download/apk-qr.png';
const DOWNLOAD_PAGE_URL = '/download';

const HEADING_FONT = '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif';

interface LandingAppDownloadsProps {
  formFactor: FormFactor;
  variant?: 'hero' | 'cta';
  id?: string;
}

/**
 * "It's easier in the app" — mirrors the Uber.com app section:
 * heading + two panels (native app + home screen) each with a store action
 * and a scan-to-download visual.
 */
export function LandingAppDownloads({
  formFactor,
  variant = 'hero',
  id,
}: LandingAppDownloadsProps) {
  const [, theme] = useStyletron();
  const { hideAppDownloads, isIOS, showGuide, setShowGuide, promptInstall, hasDeferredPrompt } =
    usePwaInstallPrompt();

  if (hideAppDownloads) {
    return null;
  }

  const pwaLabel = hasDeferredPrompt
    ? 'Install web app'
    : isIOS
      ? 'Add to Home Screen'
      : 'Install web app';

  const isMobile = formFactor === 'mobile';
  const centered = variant === 'cta';
  const showScan = !isMobile;

  const panelStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    gap: '20px',
    padding: isMobile ? '20px' : '24px',
    borderRadius: '16px',
    border: `1px solid ${theme.colors.borderOpaque}`,
    background: theme.colors.backgroundPrimary,
    textAlign: 'left' as const,
    minHeight: showScan ? '196px' : undefined,
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
          Get the native Android app for field work, or save the web app to your home screen — same
          account, same features either way.
        </Block>
      </Block>

      <Block
        display="grid"
        width="100%"
        gridGap="scale500"
        $style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}
      >
        {/* Native Android app panel */}
        <Block $style={panelStyle}>
          <Block display="flex" justifyContent="space-between" alignItems="flex-start" gridGap="scale500">
            <Block flex="1" minWidth={0}>
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
                Download the Guardr app
              </Block>
              <Block as="p" margin={0} $style={{ fontSize: '13px', lineHeight: 1.45, color: theme.colors.contentSecondary }}>
                Native Android APK — reliable notifications, GPS, and camera for on-site guards.
              </Block>
            </Block>
            {showScan && (
              <Block
                display="flex"
                flexDirection="column"
                alignItems="center"
                gridGap="scale100"
                $style={{ flexShrink: 0 }}
              >
                <Block
                  width="92px"
                  height="92px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  overrides={{
                    Block: {
                      style: {
                        borderRadius: '12px',
                        background: '#ffffff',
                        border: `1px solid ${theme.colors.borderOpaque}`,
                        padding: '6px',
                      },
                    },
                  }}
                >
                  <img
                    src={APK_QR_URL}
                    width={80}
                    height={80}
                    alt="Scan to download the Guardr Android app"
                    style={{ display: 'block', width: '80px', height: '80px' }}
                  />
                </Block>
                <Block
                  as="span"
                  display="flex"
                  alignItems="center"
                  gridGap="scale0"
                  $style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.contentSecondary }}
                >
                  <QrCode className="w-3 h-3" /> Scan to download
                </Block>
              </Block>
            )}
          </Block>
          <GuardrButton
            kind="primary"
            {...({ $as: 'a', href: APK_DOWNLOAD_URL, download: 'guardr.apk' } as Record<string, unknown>)}
            startEnhancer={<Download className="w-4 h-4" />}
            overrides={{ BaseButton: { style: { width: '100%', borderRadius: '10px', textDecoration: 'none' } } }}
          >
            Download Android APK
          </GuardrButton>
        </Block>

        {/* Home screen / PWA panel */}
        <Block $style={panelStyle}>
          <Block display="flex" justifyContent="space-between" alignItems="flex-start" gridGap="scale500">
            <Block flex="1" minWidth={0}>
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
                Add to your home screen
              </Block>
              <Block as="p" margin={0} $style={{ fontSize: '13px', lineHeight: 1.45, color: theme.colors.contentSecondary }}>
                Install the web app on any device — auto-updates, works offline, no reinstall.
              </Block>
            </Block>
            {showScan && (
              <Block
                width="92px"
                height="92px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                $style={{ flexShrink: 0 }}
                overrides={{
                  Block: {
                    style: {
                      borderRadius: '12px',
                      background: theme.colors.backgroundSecondary,
                      border: `1px solid ${theme.colors.borderOpaque}`,
                    },
                  },
                }}
              >
                <Smartphone size={40} strokeWidth={1.5} color={theme.colors.contentPrimary} aria-hidden />
              </Block>
            )}
          </Block>
          <GuardrButton
            kind="secondary"
            onClick={() => void promptInstall()}
            startEnhancer={<Smartphone className="w-4 h-4" />}
            overrides={{ BaseButton: { style: { width: '100%', borderRadius: '10px' } } }}
          >
            {pwaLabel}
          </GuardrButton>
        </Block>
      </Block>

      <Block $style={{ textAlign: centered ? 'center' : 'left' }}>
        <Block
          as="a"
          href={DOWNLOAD_PAGE_URL}
          className="uber-landing-text-link"
          display="inline-flex"
          alignItems="center"
          gridGap="scale100"
          $style={{ fontWeight: 600, fontSize: '14px' }}
        >
          Compare APK vs home screen
          <ArrowRight className="w-3.5 h-3.5" />
        </Block>
      </Block>

      <AnimatePresence>
        {showGuide && (
          <PwaInstallGuide
            isIOS={isIOS}
            onClose={() => setShowGuide(false)}
            className="landing-app-downloads-guide"
          />
        )}
      </AnimatePresence>
    </Block>
  );
}
