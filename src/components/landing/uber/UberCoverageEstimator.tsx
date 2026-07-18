import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { Minus, Plus, Shield, ShieldAlert, Crown, Check, ArrowRight } from 'lucide-react';
import type { FormFactor } from '../../../lib/platform/device';
import { GuardrButton } from '../../baseui/GuardrButton';
import {
  COVERAGE_TIERS,
  ESTIMATE_LIMITS,
  clampGuards,
  clampHours,
  estimateCoverage,
  formatEstimateUsd,
  formatRateRange,
  type CoverageTierId,
} from '../../../lib/coverageEstimate';

const HEADING_FONT = '"Uber Move", "Helvetica Neue", Helvetica, Arial, sans-serif';

const TIER_ICON: Record<CoverageTierId, typeof Shield> = {
  standard: Shield,
  armed: ShieldAlert,
  executive: Crown,
};

interface UberCoverageEstimatorProps {
  formFactor: FormFactor;
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}

function Stepper({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (next: number) => void;
}) {
  const [, theme] = useStyletron();
  const btnStyle = {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: `1px solid ${theme.colors.borderOpaque}`,
    background: theme.colors.backgroundPrimary,
    color: theme.colors.contentPrimary,
    cursor: 'pointer',
    padding: 0,
  } as const;

  return (
    <Block flex="1">
      <Block
        as="label"
        display="block"
        marginBottom="scale300"
        $style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: theme.colors.contentSecondary,
        }}
      >
        {label}
      </Block>
      <Block display="flex" alignItems="center" gridGap="scale300">
        <Block
          as="button"
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          $style={{ ...btnStyle, opacity: value <= min ? 0.4 : 1 }}
        >
          <Minus size={16} />
        </Block>
        <Block
          flex="1"
          display="flex"
          alignItems="baseline"
          justifyContent="center"
          gridGap="scale100"
          $style={{ minWidth: '84px' }}
        >
          <Block as="span" $style={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '22px', color: theme.colors.contentPrimary }}>
            {value}
          </Block>
          <Block as="span" $style={{ fontSize: '13px', color: theme.colors.contentSecondary }}>
            {suffix}
          </Block>
        </Block>
        <Block
          as="button"
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          $style={{ ...btnStyle, opacity: value >= max ? 0.4 : 1 }}
        >
          <Plus size={16} />
        </Block>
      </Block>
    </Block>
  );
}

/**
 * "Compare your coverage options" — the client-facing rough estimate tool,
 * modeled on Uber.com's ride-option price comparison.
 */
export function UberCoverageEstimator({ formFactor, onNavigateToAuth }: UberCoverageEstimatorProps) {
  const [, theme] = useStyletron();
  const isMobile = formFactor === 'mobile';

  const [hours, setHours] = useState(8);
  const [guards, setGuards] = useState(1);
  const [selected, setSelected] = useState<CoverageTierId>('standard');

  const selectedEstimate = estimateCoverage({ tierId: selected, hours, guards });

  return (
    <Block
      as="section"
      aria-label="Compare coverage options and get a rough estimate"
      padding={isMobile ? 'scale800 scale600' : 'scale1200 scale800'}
      backgroundColor="backgroundSecondary"
    >
      <Block maxWidth="1120px" margin="0 auto" width="100%">
        <Block $style={{ textAlign: isMobile ? 'left' : 'center' }} marginBottom="scale800">
          <Block
            as="h2"
            margin="0 0 scale300"
            $style={{
              fontFamily: HEADING_FONT,
              fontWeight: 700,
              fontSize: isMobile ? '1.5rem' : '2rem',
              letterSpacing: '-0.025em',
              color: theme.colors.contentPrimary,
            }}
          >
            Compare your coverage options
          </Block>
          <Block
            as="p"
            margin={0}
            maxWidth="60ch"
            $style={{
              fontSize: '15px',
              lineHeight: 1.5,
              color: theme.colors.contentSecondary,
              marginInline: isMobile ? undefined : 'auto',
            }}
          >
            Set your hours and team size, then compare a rough estimate across guard types — no
            account needed. Final pricing is set when you post and guards apply.
          </Block>
        </Block>

        <Block
          display="grid"
          gridGap="scale700"
          $style={{ gridTemplateColumns: isMobile ? '1fr' : '360px 1fr', alignItems: 'start' }}
        >
          {/* Controls + running total */}
          <Block
            padding="scale700"
            backgroundColor="backgroundPrimary"
            $style={{ borderRadius: '16px', border: `1px solid ${theme.colors.borderOpaque}` }}
          >
            <Block display="flex" gridGap="scale500" marginBottom="scale600">
              <Stepper
                label="Hours"
                value={hours}
                min={ESTIMATE_LIMITS.minHours}
                max={ESTIMATE_LIMITS.maxHours}
                suffix={hours === 1 ? 'hr' : 'hrs'}
                onChange={(next) => setHours(clampHours(next))}
              />
              <Stepper
                label="Guards"
                value={guards}
                min={ESTIMATE_LIMITS.minGuards}
                max={ESTIMATE_LIMITS.maxGuards}
                suffix={guards === 1 ? 'guard' : 'guards'}
                onChange={(next) => setGuards(clampGuards(next))}
              />
            </Block>

            <Block
              padding="scale600"
              backgroundColor="backgroundSecondary"
              marginBottom="scale600"
              $style={{ borderRadius: '12px' }}
            >
              <Block as="p" margin="0 0 scale200" $style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme.colors.contentSecondary }}>
                Estimated total
              </Block>
              <Block as="p" margin="0 0 scale100" $style={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '30px', letterSpacing: '-0.03em', color: theme.colors.contentPrimary }}>
                {formatEstimateUsd(selectedEstimate.totalLow)} – {formatEstimateUsd(selectedEstimate.totalHigh)}
              </Block>
              <Block as="p" margin={0} $style={{ fontSize: '13px', color: theme.colors.contentSecondary }}>
                {guards} {guards === 1 ? 'guard' : 'guards'} · {hours} {hours === 1 ? 'hour' : 'hours'} · {formatRateRange(COVERAGE_TIERS.find((t) => t.id === selected)!)}
              </Block>
            </Block>

            <GuardrButton
              kind="primary"
              onClick={() => onNavigateToAuth('client', 'sign-up')}
              endEnhancer={<ArrowRight className="w-4 h-4" />}
              overrides={{ BaseButton: { style: { width: '100%', borderRadius: '10px' } } }}
            >
              Post this job
            </GuardrButton>
            <Block as="p" margin="scale400 0 0" $style={{ fontSize: '12px', lineHeight: 1.45, color: theme.colors.contentSecondary, textAlign: 'center' }}>
              Rough estimate only — not a quote. Excludes platform fees and taxes.
            </Block>
          </Block>

          {/* Option cards */}
          <Block display="flex" flexDirection="column" gridGap="scale400">
            {COVERAGE_TIERS.map((tier) => {
              const Icon = TIER_ICON[tier.id];
              const est = estimateCoverage({ tierId: tier.id, hours, guards });
              const active = selected === tier.id;
              return (
                <Block
                  key={tier.id}
                  as="button"
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(tier.id)}
                  $style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    width: '100%',
                    textAlign: 'left',
                    padding: isMobile ? '16px' : '20px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    background: active ? theme.colors.backgroundPrimary : theme.colors.backgroundPrimary,
                    border: `2px solid ${active ? theme.colors.contentPrimary : theme.colors.borderOpaque}`,
                    transition: 'border-color 120ms ease, transform 120ms ease',
                    fontFamily: 'inherit',
                  }}
                >
                  <Block
                    width="48px"
                    height="48px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    $style={{ flexShrink: 0, borderRadius: '12px', background: theme.colors.backgroundSecondary }}
                  >
                    <Icon size={24} color={theme.colors.contentPrimary} strokeWidth={1.75} />
                  </Block>

                  <Block flex="1" minWidth={0}>
                    <Block display="flex" alignItems="center" gridGap="scale300" marginBottom="scale100">
                      <Block as="span" $style={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '17px', letterSpacing: '-0.01em', color: theme.colors.contentPrimary }}>
                        {tier.name}
                      </Block>
                      {active && (
                        <Block
                          as="span"
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          width="18px"
                          height="18px"
                          $style={{ borderRadius: '50%', background: theme.colors.contentPrimary }}
                        >
                          <Check size={12} color={theme.colors.backgroundPrimary} strokeWidth={3} />
                        </Block>
                      )}
                    </Block>
                    <Block as="p" margin="0 0 scale300" $style={{ fontSize: '13px', color: theme.colors.contentSecondary, lineHeight: 1.4 }}>
                      {tier.tagline} · {tier.bestFor}
                    </Block>
                    <Block display="flex" gridGap="scale300" $style={{ flexWrap: 'wrap' }}>
                      {tier.features.map((f) => (
                        <Block
                          key={f}
                          as="span"
                          display="inline-flex"
                          alignItems="center"
                          gridGap="scale0"
                          $style={{ fontSize: '12px', color: theme.colors.contentSecondary }}
                        >
                          <Check size={12} color={theme.colors.contentPrimary} /> {f}
                        </Block>
                      ))}
                    </Block>
                  </Block>

                  <Block $style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Block as="p" margin="0 0 2px" $style={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em', color: theme.colors.contentPrimary }}>
                      {formatEstimateUsd(est.totalMid)}
                    </Block>
                    <Block as="p" margin={0} $style={{ fontSize: '12px', color: theme.colors.contentSecondary }}>
                      est. total
                    </Block>
                  </Block>
                </Block>
              );
            })}
          </Block>
        </Block>
      </Block>
    </Block>
  );
}
