import React from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall, LabelSmall } from 'baseui/typography';
import { GuardrButton } from '../../baseui/GuardrButton';
import { GuardrTag } from '../../baseui/GuardrTag';

interface WfSectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  count?: number;
  className?: string;
}

export function WfSectionHeader({ title, actionLabel, onAction, count, className = '' }: WfSectionHeaderProps) {
  return (
    <Block className={`app-section-head ${className}`.trim()} display="flex" alignItems="center" justifyContent="space-between" gridGap="scale400">
      <Block display="flex" alignItems="center" gridGap="scale300" minWidth="0">
        <HeadingSmall margin="0" className="truncate">
          {title}
        </HeadingSmall>
        {count != null ? (
          <GuardrTag kind="neutral" closeable={false}>
            {count}
          </GuardrTag>
        ) : null}
      </Block>
      {actionLabel && onAction ? (
        <GuardrButton kind="tertiary" size="compact" onClick={onAction} className="app-section-link shrink-0">
          {actionLabel}
        </GuardrButton>
      ) : null}
    </Block>
  );
}
