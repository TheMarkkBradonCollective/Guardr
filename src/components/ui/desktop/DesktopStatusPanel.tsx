import React from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall, LabelSmall, ParagraphMedium, ParagraphSmall } from 'baseui/typography';
import { useStyletron } from 'baseui';
import { OverviewSegment } from '../../../lib/overviewVisuals';
import { OverviewPieChart, OverviewSegmentBar } from '../../staff/overview/OverviewCharts';
import { GuardrCard } from '../../baseui/GuardrCard';
import { GuardrButton } from '../../baseui/GuardrButton';
import { MetricCell } from '../../baseui/dashboard/MetricCell';

export type DesktopStatusVariant = 'ok' | 'warn' | 'muted';

export interface DesktopStatusMetric {
  id: string;
  label: string;
  value: string | number;
  tone?: 'default' | 'ok' | 'warn' | 'accent';
  onClick?: () => void;
}

export interface DesktopStatusMeter {
  id: string;
  label: string;
  value: string;
  pct: number;
  sub?: string;
  tone?: 'primary' | 'success' | 'warning' | 'muted';
  onClick?: () => void;
}

export interface DesktopStatusAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'sand' | 'outline' | 'soft';
}

export interface DesktopStatusBreakdownRow {
  id: string;
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'default' | 'warn' | 'ok';
  onClick?: () => void;
}

interface DesktopStatusPanelProps {
  eyebrow: string;
  title: string;
  summary: string;
  variant: DesktopStatusVariant;
  alert?: string;
  metrics?: DesktopStatusMetric[];
  meters?: DesktopStatusMeter[];
  breakdown?: DesktopStatusBreakdownRow[];
  breakdownTitle?: string;
  pipelineSegments?: OverviewSegment[];
  queuePieSegments?: OverviewSegment[];
  actions?: DesktopStatusAction[];
  className?: string;
}

const VARIANT_ACCENT: Record<DesktopStatusVariant, string> = {
  ok: 'positive400',
  warn: 'warning400',
  muted: 'contentTertiary',
};

const METER_FILL: Record<NonNullable<DesktopStatusMeter['tone']>, string> = {
  primary: 'accent',
  success: 'positive400',
  warning: 'warning400',
  muted: 'contentTertiary',
};

const METRIC_ACCENT: Record<NonNullable<DesktopStatusMetric['tone']>, boolean> = {
  default: false,
  ok: true,
  warn: true,
  accent: true,
};

const ACTION_KIND: Record<NonNullable<DesktopStatusAction['variant']>, 'primary' | 'secondary' | 'tertiary'> = {
  sand: 'primary',
  outline: 'secondary',
  soft: 'tertiary',
};

export function DesktopStatusPanel({
  eyebrow,
  title,
  summary,
  variant,
  alert,
  metrics = [],
  meters = [],
  breakdown = [],
  breakdownTitle = 'Queue breakdown',
  pipelineSegments,
  queuePieSegments,
  actions = [],
  className = '',
}: DesktopStatusPanelProps) {
  const [, theme] = useStyletron();

  return (
    <GuardrCard className={`mobility-status-panel mobility-status-panel--${variant} ${className}`.trim()}>
      <Block display="flex" alignItems="flex-start" justifyContent="space-between" gridGap="scale400" marginBottom="scale500">
        <Block display="flex" alignItems="flex-start" gridGap="scale400" minWidth={0}>
          <Block
            width="10px"
            height="10px"
            flex="0 0 10px"
            marginTop="6px"
            overrides={{
              Block: {
                style: {
                  borderRadius: '50%',
                  backgroundColor: theme.colors[VARIANT_ACCENT[variant] as keyof typeof theme.colors] ?? theme.colors.accent,
                },
              },
            }}
            aria-hidden
          />
          <Block minWidth={0}>
            <LabelSmall
              marginTop={0}
              marginBottom="scale200"
              color="contentSecondary"
              overrides={{ Block: { style: { textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 } } }}
            >
              {eyebrow}
            </LabelSmall>
            <HeadingSmall marginTop={0} marginBottom={0}>
              {title}
            </HeadingSmall>
          </Block>
        </Block>

        {actions.length > 0 ? (
          <Block display="flex" flexWrap gridGap="scale300" flex="0 0 auto">
            {actions.map((action) => (
              <GuardrButton
                key={action.id}
                kind={ACTION_KIND[action.variant ?? 'outline']}
                size="compact"
                onClick={action.onClick}
              >
                {action.label}
              </GuardrButton>
            ))}
          </Block>
        ) : null}
      </Block>

      <ParagraphMedium marginTop={0} marginBottom={alert ? 'scale300' : 'scale500'} color="contentSecondary">
        {summary}
      </ParagraphMedium>

      {alert ? (
        <ParagraphSmall
          marginTop={0}
          marginBottom="scale500"
          overrides={{ Block: { style: { color: theme.colors.warning400, fontWeight: 600 } } }}
        >
          {alert}
        </ParagraphSmall>
      ) : null}

      {metrics.length > 0 ? (
        <Block
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(100px, 1fr))"
          gridGap="scale400"
          marginBottom="scale600"
        >
          {metrics.map((metric) => (
            <MetricCell
              key={metric.id}
              label={metric.label}
              value={metric.value}
              onClick={metric.onClick}
              accent={METRIC_ACCENT[metric.tone ?? 'default']}
            />
          ))}
        </Block>
      ) : null}

      {meters.length > 0 ? (
        <Block display="grid" gridTemplateColumns={['1fr', '1fr', '1fr 1fr']} gridGap="scale500" marginBottom="scale600">
          {meters.map((meter) => {
            const fillColor = theme.colors[METER_FILL[meter.tone ?? 'primary'] as keyof typeof theme.colors] ?? theme.colors.accent;
            const body = (
              <Block width="100%">
                <Block display="flex" justifyContent="space-between" alignItems="center" marginBottom="scale200">
                  <LabelSmall margin={0} color="contentSecondary">
                    {meter.label}
                  </LabelSmall>
                  <LabelSmall margin={0} overrides={{ Block: { style: { fontWeight: 700 } } }}>
                    {meter.value}
                  </LabelSmall>
                </Block>
                <Block
                  height="6px"
                  overrides={{
                    Block: {
                      style: {
                        borderRadius: '999px',
                        backgroundColor: theme.colors.backgroundSecondary,
                        overflow: 'hidden',
                      },
                    },
                  }}
                >
                  <Block
                    height="100%"
                    width={`${Math.max(0, Math.min(100, meter.pct))}%`}
                    overrides={{ Block: { style: { borderRadius: '999px', backgroundColor: fillColor } } }}
                  />
                </Block>
                {meter.sub ? (
                  <ParagraphSmall marginTop="scale200" marginBottom={0} color="contentSecondary">
                    {meter.sub}
                  </ParagraphSmall>
                ) : null}
              </Block>
            );

            if (meter.onClick) {
              return (
                <button
                  key={meter.id}
                  type="button"
                  onClick={meter.onClick}
                  className="mobility-status-meter mobility-status-meter--click w-full text-left"
                >
                  {body}
                </button>
              );
            }

            return <Block key={meter.id}>{body}</Block>;
          })}
        </Block>
      ) : null}

      {breakdown.length > 0 ? (
        <Block marginBottom="scale600">
          <LabelSmall
            marginTop={0}
            marginBottom="scale400"
            overrides={{ Block: { style: { fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' } } }}
          >
            {breakdownTitle}
          </LabelSmall>
          <Block as="ul" margin={0} padding={0} $style={{ listStyle: 'none' }}>
            {breakdown.map((row) => {
              const content = (
                <>
                  <ParagraphMedium margin={0} $style={{ fontWeight: 600 }}>
                    {row.label}
                  </ParagraphMedium>
                  <LabelSmall
                    margin={0}
                    color={row.tone === 'warn' ? 'warning' : row.tone === 'ok' ? 'positive' : 'contentPrimary'}
                    overrides={{ Block: { style: { fontWeight: 700 } } }}
                  >
                    {row.value}
                  </LabelSmall>
                  {row.detail ? (
                    <ParagraphSmall margin={0} color="contentSecondary">
                      {row.detail}
                    </ParagraphSmall>
                  ) : null}
                </>
              );

              if (row.onClick) {
                return (
                  <Block
                    as="li"
                    key={row.id}
                    marginBottom="scale300"
                    overrides={{
                      Block: {
                        style: {
                          border: `1px solid ${theme.colors.borderOpaque}`,
                          borderRadius: '10px',
                          padding: '12px',
                        },
                      },
                    }}
                  >
                    <button type="button" onClick={row.onClick} className="w-full text-left mobility-status-breakdown-row">
                      <Block display="grid" gridGap="scale100">{content}</Block>
                    </button>
                  </Block>
                );
              }

              return (
                <Block
                  as="li"
                  key={row.id}
                  marginBottom="scale300"
                  padding="scale400"
                  overrides={{
                    Block: {
                      style: {
                        border: `1px solid ${theme.colors.borderOpaque}`,
                        borderRadius: '10px',
                      },
                    },
                  }}
                >
                  <Block display="grid" gridGap="scale100">{content}</Block>
                </Block>
              );
            })}
          </Block>
        </Block>
      ) : null}

      {pipelineSegments && pipelineSegments.length > 0 ? (
        <Block marginBottom="scale500">
          <LabelSmall marginTop={0} marginBottom="scale400" overrides={{ Block: { style: { fontWeight: 700 } } }}>
            Pipeline pie
          </LabelSmall>
          <OverviewPieChart
            segments={pipelineSegments}
            centerLabel={String(pipelineSegments.reduce((sum, segment) => sum + segment.value, 0))}
            centerSub="jobs"
            size="sm"
          />
        </Block>
      ) : null}

      {queuePieSegments && queuePieSegments.length > 0 ? (
        <Block marginBottom="scale500">
          <LabelSmall marginTop={0} marginBottom="scale400" overrides={{ Block: { style: { fontWeight: 700 } } }}>
            Queue pie
          </LabelSmall>
          <OverviewPieChart
            segments={queuePieSegments}
            centerLabel={String(queuePieSegments.reduce((sum, segment) => sum + segment.value, 0))}
            centerSub="items"
            size="sm"
          />
        </Block>
      ) : null}

      {pipelineSegments && pipelineSegments.length > 0 ? (
        <Block>
          <LabelSmall marginTop={0} marginBottom="scale400" overrides={{ Block: { style: { fontWeight: 700 } } }}>
            Pipeline bars
          </LabelSmall>
          <OverviewSegmentBar segments={pipelineSegments} />
        </Block>
      ) : null}
    </GuardrCard>
  );
}

function clampPct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export { clampPct };
