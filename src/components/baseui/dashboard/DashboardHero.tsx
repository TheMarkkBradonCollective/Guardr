import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall, ParagraphSmall } from 'baseui/typography';
import { useStyletron } from 'baseui';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

/** Icon tinted with current theme accent (black in light, white in dark) */
export function AccentIcon({
  icon: Icon,
  size = 16,
  strokeWidth = 2,
  className = '',
}: {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const [, theme] = useStyletron();
  return <Icon size={size} strokeWidth={strokeWidth} color={theme.colors.contentPrimary} className={className} />;
}

/** Icon tinted with secondary/muted color */
export function MutedIcon({
  icon: Icon,
  size = 16,
  strokeWidth = 2,
  className = '',
}: {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const [, theme] = useStyletron();
  return <Icon size={size} strokeWidth={strokeWidth} color={theme.colors.contentSecondary} className={className} />;
}

/** Dashboard screen header — real Base Web style: large bold title + optional status pill */
export function DashboardHero({
  kicker,
  title,
  subtitle,
  status,
  className = '',
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <Block
      as="header"
      className={`app-dashboard-hero ${className}`.trim()}
      display="flex"
      alignItems="flex-start"
      justifyContent="space-between"
      gridGap="scale400"
      paddingTop="scale800"
      paddingBottom="scale600"
      paddingLeft="scale800"
      paddingRight="scale800"
    >
      <Block minWidth={0} flex="1">
        {kicker ? (
          <LabelSmall
            marginTop={0}
            marginBottom="scale200"
            color="contentSecondary"
            className="app-dashboard-hero-kicker"
            $style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: '11px' }}
          >
            {kicker}
          </LabelSmall>
        ) : null}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeadingLarge marginTop={0} marginBottom={subtitle ? 'scale200' : 0} className="app-dashboard-hero-title">
            {title}
          </HeadingLarge>
          {subtitle ? (
            <ParagraphSmall margin={0} color="contentSecondary">
              {subtitle}
            </ParagraphSmall>
          ) : null}
        </motion.div>
      </Block>
      {status ? (
        <Block overrides={{ Block: { style: { flexShrink: 0 } } }}>{status}</Block>
      ) : null}
    </Block>
  );
}
