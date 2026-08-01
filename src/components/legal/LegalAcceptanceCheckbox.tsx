import React from 'react';

interface LegalAcceptanceCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Terms acceptance row — checkbox and copy are siblings (not a wrapping label)
 * so legal links remain tappable on mobile WebViews.
 */
export function LegalAcceptanceCheckbox({
  id,
  checked,
  onChange,
  disabled = false,
  className = '',
  children,
}: LegalAcceptanceCheckboxProps) {
  const toggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div className={`legal-accept-row${className ? ` ${className}` : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="app-checkbox legal-accept-checkbox"
        aria-describedby={`${id}-copy`}
      />
      <div
        id={`${id}-copy`}
        className="legal-accept-copy"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a, button')) return;
          toggle();
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggle();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={checked}
      >
        {children}
      </div>
    </div>
  );
}
