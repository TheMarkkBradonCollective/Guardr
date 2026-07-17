import React from 'react';
import { Block } from 'baseui/block';
import { ChevronRight } from 'lucide-react';
import { GuardrCard } from '../../baseui/GuardrCard';
import { GuardrButton } from '../../baseui/GuardrButton';

interface WfListCardProps {
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  actionLabel?: string;
  onClick?: () => void;
  className?: string;
}

function ListCardBody({
  avatar,
  title,
  subtitle,
  meta,
  action,
  actionLabel,
  onClick,
}: Omit<WfListCardProps, 'className'>) {
  return (
    <Block display="flex" alignItems="flex-start" gridGap="scale500" width="100%">
      {avatar ? <Block $style={{ flexShrink: 0 }}>{avatar}</Block> : null}
      <Block flex="1" minWidth="0">
        {typeof title === 'string' ? (
          <Block overrides={{ Block: { style: { fontSize: '14px', fontWeight: 600, lineHeight: '20px' } } }} className="truncate">
            {title}
          </Block>
        ) : (
          title
        )}
        {subtitle ? (
          <Block
            marginTop="scale200"
            overrides={{ Block: { style: { fontSize: '12px', color: 'contentSecondary', lineHeight: '18px' } } }}
            className="truncate"
          >
            {subtitle}
          </Block>
        ) : null}
        {meta ? <Block marginTop="scale300">{meta}</Block> : null}
      </Block>
      {action ??
        (actionLabel ? (
          <GuardrButton kind="secondary" size="compact">
            {actionLabel}
          </GuardrButton>
        ) : onClick ? (
          <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
        ) : null)}
    </Block>
  );
}

/** Clickable entity row — Base Web card with Guardr list styling. */
export function WfListCard({
  avatar,
  title,
  subtitle,
  meta,
  action,
  actionLabel,
  onClick,
  className = '',
}: WfListCardProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`app-item-card app-item-card-align-top w-full text-left ${className}`.trim()}
      >
        <GuardrCard interactive noBorder overrides={{ Root: { style: { width: '100%' } } }}>
          <ListCardBody
            avatar={avatar}
            title={title}
            subtitle={subtitle}
            meta={meta}
            action={action}
            actionLabel={actionLabel}
            onClick={onClick}
          />
        </GuardrCard>
      </button>
    );
  }

  return (
    <GuardrCard className={className}>
      <ListCardBody avatar={avatar} title={title} subtitle={subtitle} meta={meta} action={action} />
    </GuardrCard>
  );
}
