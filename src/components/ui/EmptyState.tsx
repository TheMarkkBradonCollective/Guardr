import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-surface-elevated flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-brand-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-brand-text mb-2">{title}</h3>
      <p className="text-sm text-brand-text-muted max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="uber-btn uber-btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
