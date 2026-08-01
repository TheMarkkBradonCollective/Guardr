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
 * Terms acceptance row — visible custom checkbox + copy as siblings.
 * Legal links stay outside the label so mobile WebViews can open them without
 * fighting a wrapping <label>.
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
      <label htmlFor={id} className="legal-accept-checkbox-hit" aria-label="Accept terms and agreements">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="legal-accept-input-native"
        />
        <span className="legal-accept-checkbox-visual" aria-hidden="true">
          {checked ? <span className="legal-accept-checkmark" /> : null}
        </span>
      </label>
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
