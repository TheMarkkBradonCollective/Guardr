import React from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall } from 'baseui/typography';
import { AppButton } from '../../ui/AppButton';

export function DashboardZone({
  title,
  actionLabel,
  onAction,
  children,
  className = '',
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Block as="section" className={`app-dashboard-zone ${className}`.trim()} marginBottom="scale800">
      <Block
        className="app-dashboard-zone-head"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gridGap="scale400"
        paddingLeft="scale800"
        paddingRight="scale800"
        marginBottom="scale400"
      >
        <HeadingSmall margin={0} className="app-dashboard-zone-title">
          {title}
        </HeadingSmall>
        {actionLabel && onAction ? (
          <AppButton type="button" variant="ghost" size="inline" onClick={onAction} className="app-section-link">
            {actionLabel}
          </AppButton>
        ) : null}
      </Block>
      <Block className="app-dashboard-zone-body">{children}</Block>
    </Block>
  );
}
