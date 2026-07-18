import React from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import {
  CalendarClock,
  MapPinned,
  Building2,
  Radio,
  Shield,
  Star,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { FormFactor } from '../../../lib/platform/device';
import { GuardrButton } from '../../baseui/GuardrButton';

const HEADING_FONT = '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif';

type Cta = { label: string; onClick: () => void };

interface UberPromoBandProps {
  formFactor: FormFactor;
  eyebrow?: string;
  title: string;
  body: string;
  primary?: Cta;
  secondary?: Cta;
  visual: React.ReactNode;
  reverse?: boolean;
  tone?: 'primary' | 'secondary';
}

/** Uber-style image + text promo band (mirrors "Drive when you want", "Business", etc.). */
export function UberPromoBand({
  formFactor,
  eyebrow,
  title,
  body,
  primary,
  secondary,
  visual,
  reverse = false,
  tone = 'primary',
}: UberPromoBandProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';

  const textCol = (
    <Block>
      {eyebrow && (
        <Block
          as="p"
          margin="0 0 10px"
          $style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: theme.colors.contentSecondary,
          }}
        >
          {eyebrow}
        </Block>
      )}
      <Block
        as="h2"
        margin="0 0 scale400"
        $style={{
          fontFamily: HEADING_FONT,
          fontWeight: 700,
          fontSize: isMobile ? '1.5rem' : '2rem',
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          color: theme.colors.contentPrimary,
        }}
      >
        {title}
      </Block>
      <Block
        as="p"
        margin="0 0 scale600"
        maxWidth="46ch"
        $style={{ fontSize: '15px', lineHeight: 1.55, color: theme.colors.contentSecondary }}
      >
        {body}
      </Block>
      {(primary || secondary) && (
        <Block display="flex" flexDirection={isMobile ? 'column' : 'row'} gridGap="scale400" alignItems={isMobile ? 'stretch' : 'center'}>
          {primary && (
            <GuardrButton
              kind={tone === 'primary' ? 'primary' : 'secondary'}
              onClick={primary.onClick}
              overrides={{ BaseButton: { style: { borderRadius: '10px', width: isMobile ? '100%' : undefined } } }}
            >
              {primary.label}
            </GuardrButton>
          )}
          {secondary && (
            <button type="button" className="uber-landing-text-link" style={{ fontWeight: 600 }} onClick={secondary.onClick}>
              {secondary.label}
            </button>
          )}
        </Block>
      )}
    </Block>
  );

  return (
    <Block
      as="section"
      aria-label={title}
      padding={isMobile ? 'scale800 scale600' : 'scale1200 scale800'}
      backgroundColor="backgroundPrimary"
      overrides={{ Block: { style: { borderTop: `1px solid ${theme.colors.borderOpaque}` } } }}
    >
      <Block
        maxWidth="1120px"
        margin="0 auto"
        display="grid"
        gridGap={isMobile ? 'scale700' : 'scale1000'}
        $style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', alignItems: 'center' }}
      >
        {isMobile ? (
          <>
            {textCol}
            <Block>{visual}</Block>
          </>
        ) : reverse ? (
          <>
            <Block>{visual}</Block>
            {textCol}
          </>
        ) : (
          <>
            {textCol}
            <Block>{visual}</Block>
          </>
        )}
      </Block>
    </Block>
  );
}

/* ─── Reusable visuals (stylized "pictures") ─────────────────────────────── */

function VisualShell({ children, ratio = '4/3' }: { children: React.ReactNode; ratio?: string }) {
  const [, theme] = useStyletron();
  const isDark = theme.colors.backgroundPrimary !== '#FFFFFF' && theme.colors.backgroundPrimary !== 'white';
  return (
    <Block
      aria-hidden
      $style={{
        borderRadius: '16px',
        background: isDark ? '#141414' : '#f6f6f6',
        border: `1px solid ${theme.colors.borderOpaque}`,
        aspectRatio: ratio,
        display: 'flex',
        flexDirection: 'column',
        padding: '22px',
        gap: '14px',
        overflow: 'hidden',
      }}
    >
      {children}
    </Block>
  );
}

function MiniCard({
  icon,
  title,
  sub,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  trailing?: string;
}) {
  const [, theme] = useStyletron();
  return (
    <Block
      display="flex"
      alignItems="center"
      gridGap="scale400"
      padding="scale500"
      backgroundColor="backgroundPrimary"
      $style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <Block
        width="40px"
        height="40px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        $style={{ flexShrink: 0, borderRadius: '10px', background: theme.colors.backgroundSecondary }}
      >
        {icon}
      </Block>
      <Block flex="1" minWidth={0}>
        <Block as="p" margin={0} $style={{ fontWeight: 700, fontSize: '14px', color: theme.colors.contentPrimary }}>
          {title}
        </Block>
        <Block as="p" margin={0} $style={{ fontSize: '12px', color: theme.colors.contentSecondary }}>
          {sub}
        </Block>
      </Block>
      {trailing && (
        <Block as="span" $style={{ fontWeight: 700, fontSize: '14px', color: theme.colors.contentPrimary, flexShrink: 0 }}>
          {trailing}
        </Block>
      )}
    </Block>
  );
}

export function PlanAheadVisual() {
  const [, theme] = useStyletron();
  return (
    <VisualShell>
      <Block as="p" margin={0} $style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.contentSecondary }}>
        Scheduled coverage
      </Block>
      <MiniCard icon={<CalendarClock size={20} color={theme.colors.contentPrimary} />} title="Fri · Overnight patrol" sub="20:00 – 06:00 · 2 guards" trailing="Booked" />
      <MiniCard icon={<Clock size={20} color={theme.colors.contentPrimary} />} title="Sat · Event security" sub="10:00 – 22:00 · 6 guards" trailing="Booked" />
      <MiniCard icon={<Radio size={20} color={theme.colors.contentPrimary} />} title="Recurring · Weekdays" sub="Front desk · 1 guard" trailing="Active" />
    </VisualShell>
  );
}

export function CoverageAreaVisual() {
  const [, theme] = useStyletron();
  return (
    <VisualShell>
      <MiniCard icon={<MapPinned size={20} color={theme.colors.contentPrimary} />} title="Downtown & metro" sub="42 guards available now" />
      <MiniCard icon={<Shield size={20} color={theme.colors.contentPrimary} />} title="Construction corridor" sub="Site patrol · armed & unarmed" />
      <MiniCard icon={<Star size={20} color={theme.colors.contentPrimary} />} title="Event districts" sub="Crowd-trained crews" />
    </VisualShell>
  );
}

export function BusinessVisual() {
  const [, theme] = useStyletron();
  return (
    <VisualShell>
      <Block as="p" margin={0} $style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.contentSecondary }}>
        Operations overview
      </Block>
      <Block display="grid" gridGap="scale400" $style={{ gridTemplateColumns: '1fr 1fr' }}>
        {[
          { label: 'Active shifts', value: '12' },
          { label: 'Sites covered', value: '8' },
          { label: 'On-time rate', value: '99%' },
          { label: 'This month', value: '$18.4k' },
        ].map((cell) => (
          <Block key={cell.label} padding="scale500" backgroundColor="backgroundPrimary" $style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Block as="p" margin="0 0 4px" $style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.contentSecondary }}>
              {cell.label}
            </Block>
            <Block as="p" margin={0} $style={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.02em', color: theme.colors.contentPrimary }}>
              {cell.value}
            </Block>
          </Block>
        ))}
      </Block>
    </VisualShell>
  );
}

/** Convenience wrapper rendering the full set of Uber-style promo bands. */
export function UberHomePromoSections({
  formFactor,
  onNavigateToAuth,
}: {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}) {
  return (
    <>
      <UberPromoBand
        formFactor={formFactor}
        eyebrow="Plan ahead"
        title="Schedule coverage for later"
        body="Book one-time or recurring coverage in advance so your sites are staffed the moment shifts start. Adjust, extend, or cancel from your dashboard."
        primary={{ label: 'Schedule a job', onClick: () => onNavigateToAuth('client', 'sign-up') }}
        secondary={{ label: 'See how it works', onClick: () => onNavigateToAuth(undefined, 'sign-in') }}
        visual={<PlanAheadVisual />}
      />

      <UberPromoBand
        formFactor={formFactor}
        eyebrow="Coverage near you"
        title="Licensed guards across your area"
        body="Post to the map and reach independent, credential-verified guards nearby — from single-site posts to large coordinated crews for events."
        primary={{ label: 'Post coverage', onClick: () => onNavigateToAuth('client', 'sign-up') }}
        visual={<CoverageAreaVisual />}
        reverse
      />

      <UberPromoBand
        formFactor={formFactor}
        eyebrow="Work as a guard"
        title="Pick up shifts on your schedule"
        body="Browse open jobs on the map, apply with your verified credentials, and get paid through the platform. You choose what fits."
        primary={{ label: 'Find work as a guard', onClick: () => onNavigateToAuth('guard', 'sign-up') }}
        secondary={{ label: 'Already have an account? Sign in', onClick: () => onNavigateToAuth('guard', 'sign-in') }}
        visual={<BusinessVisual />}
        tone="secondary"
      />
    </>
  );
}
