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
      <label
        htmlFor={id}
        className="legal-accept-checkbox-hit"
        aria-label="Accept terms and agreements"
        onMouseDown={(e) => {
          // Avoid focus-scroll on mobile when the label activates the checkbox.
          e.preventDefault();
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          tabIndex={0}
          onChange={(e) => onChange(e.target.checked)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (!disabled) onChange(!checked);
            }
          }}
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
      >
        {children}
      </div>
    </div>
  );
}
