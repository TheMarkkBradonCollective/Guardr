import React from 'react';

interface PersonNameFieldsProps {
  firstName: string;
  middleName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onMiddleNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  editing: boolean;
  className?: string;
}

export function PersonNameFields({
  firstName,
  middleName,
  lastName,
  onFirstNameChange,
  onMiddleNameChange,
  onLastNameChange,
  editing,
  className = '',
}: PersonNameFieldsProps) {
  if (!editing) {
    const display = [firstName, middleName, lastName].filter(Boolean).join(' ') || '—';
    return (
      <div className={className}>
        <label className="uber-label">Name</label>
        <p className="text-sm font-medium mt-1">{display}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="uber-label">First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className="uber-input w-full mt-1"
            placeholder="First name"
            required
          />
        </div>
        <div>
          <label className="uber-label">Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className="uber-input w-full mt-1"
            placeholder="Last name"
            required
          />
        </div>
      </div>
      <div>
        <label className="uber-label">Middle name</label>
        <input
          type="text"
          value={middleName}
          onChange={(e) => onMiddleNameChange(e.target.value)}
          className="uber-input w-full mt-1"
          placeholder="Middle name (optional)"
        />
      </div>
    </div>
  );
}
