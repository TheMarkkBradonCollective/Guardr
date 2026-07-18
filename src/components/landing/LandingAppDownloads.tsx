import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { Download, Smartphone, ArrowRight } from 'lucide-react';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';
import { PwaInstallGuide } from './PwaInstallGuide';
import { GuardrButton } from '../baseui/GuardrButton';
import type { FormFactor } from '../../lib/platform/device';

const APK_DOWNLOAD_URL = '/download/guardr.apk';
const DOWNLOAD_PAGE_URL = '/download';

const HEADING_FONT = '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif';

interface LandingAppDownloadsProps {
  formFactor: FormFactor;
  variant?: 'hero' | 'cta';
  id?: string;
}

function DownloadButton({
  as,
  href,
  download,
  onClick,
  kind,
  icon,
  title,
  sub,
}: {
  as?: 'a';
  href?: string;
  download?: string;
  onClick?: () => void;
  kind: 'primary' | 'secondary';
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <GuardrButton
      kind={kind}
      onClick={onClick}
      {...(as ? ({ $as: 'a', href, download } as Record<string, unknown>) : {})}
      overrides={{
        BaseButton: {
          style: {
            width: '100%',
            justifyContent: 'flex-start',
            gap: '12px',
            paddingTop: '14px',
            paddingBottom: '14px',
            paddingLeft: '16px',
            paddingRight: '16px',
            borderRadius: '12px',
            textDecoration: 'none',
          },
        },
      }}
    >
      <span aria-hidden style={{ display: 'flex', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25 }}>
        <span style={{ fontWeight: 700, fontSize: '15px' }}>{title}</span>
        <span style={{ fontWeight: 500, fontSize: '12px', opacity: 0.7 }}>{sub}</span>
      </span>
    </GuardrButton>
  );
}

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

  return (
    <Block
      id={id}
      display="flex"
      flexDirection="column"
      alignItems={centered ? 'center' : 'flex-start'}
      gridGap="scale600"
      width="100%"
      maxWidth={centered ? '560px' : undefined}
      margin={centered ? '0 auto' : undefined}
      $style={{ textAlign: centered ? 'center' : 'left' }}
    >
      <Block>
        <Block
          as="p"
          margin="0 0 8px"
          $style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: theme.colors.contentSecondary,
          }}
        >
          Get the app
        </Block>
        <Block
          as="h2"
          margin="0 0 10px"
          $style={{
            fontFamily: HEADING_FONT,
            fontWeight: 700,
            fontSize: isMobile ? '1.375rem' : '1.75rem',
            letterSpacing: '-0.025em',
            color: theme.colors.contentPrimary,
          }}
        >
          Guardr on your phone
        </Block>
        <Block
          as="p"
          margin={0}
          maxWidth="42ch"
          $style={{
            fontSize: '15px',
            lineHeight: 1.5,
            color: theme.colors.contentSecondary,
            marginInline: centered ? 'auto' : undefined,
          }}
        >
          Android APK for field work, or save the web app to your home screen — same account either way.
        </Block>
      </Block>

      <Block
        display="grid"
        width="100%"
        maxWidth={centered ? '440px' : '520px'}
        gridGap="scale400"
        $style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}
      >
        <DownloadButton
          as="a"
          href={APK_DOWNLOAD_URL}
          download="guardr.apk"
          kind="primary"
          icon={<Download className="w-4 h-4" />}
          title="Download Android APK"
          sub="Native app · best notifications"
        />
        <DownloadButton
          onClick={() => void promptInstall()}
          kind="secondary"
          icon={<Smartphone className="w-4 h-4" />}
          title={pwaLabel}
          sub="Auto-updates · no reinstall"
        />
      </Block>

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
