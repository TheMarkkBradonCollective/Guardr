import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge, LabelSmall } from 'baseui/typography';
import type { LucideIcon } from 'lucide-react';
import { useStyletron } from 'baseui';

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
  return <Icon size={size} strokeWidth={strokeWidth} color={theme.colors.accent} className={className} />;
}

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

export function DashboardHero({
  kicker,
  title,
  status,
  className = '',
}: {
  kicker?: string;
  title: string;
  status?: React.ReactNode;
  className?: string;
}) {
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
      <Block minWidth={0}>
        {kicker ? (
          <LabelSmall marginTop={0} marginBottom="scale200" color="contentSecondary">
            {kicker}
          </LabelSmall>
        ) : null}
        <HeadingLarge marginTop={0} marginBottom={0} className="app-dashboard-hero-title">
          {title}
        </HeadingLarge>
      </Block>
      {status ? (
        <Block overrides={{ Block: { style: { flexShrink: 0 } } }}>{status}</Block>
      ) : null}
    </Block>
  );
}
