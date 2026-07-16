import React from 'react';
import { Moon, Sun } from 'lucide-react';
import type { ThemeMode } from '../../lib/platform/theme';

const MODES: { id: ThemeMode; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
];

interface ThemeToggleProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ThemeToggle({ value, onChange, size = 'md', className = '' }: ThemeToggleProps) {
  const compact = size === 'sm';

  return (
    <div
      className={`theme-toggle inline-flex items-center gap-0.5 p-1 rounded-full bg-brand-surface border border-brand-border ${className}`}
      role="group"
      aria-label="Appearance"
    >
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={label}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full font-medium transition-all ${
              compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
            } ${
              active
                ? 'bg-brand-text text-brand-bg shadow-sm'
                : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={active ? 2.25 : 2} />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
