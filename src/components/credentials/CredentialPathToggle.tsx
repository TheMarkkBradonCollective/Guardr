import React from 'react';

export type CredentialUploadPath = 'combined' | 'individual';

interface CredentialPathToggleProps {
  value: CredentialUploadPath;
  onChange: (value: CredentialUploadPath) => void;
  combinedLabel: string;
  individualLabel: string;
}

export function CredentialPathToggle({
  value,
  onChange,
  combinedLabel,
  individualLabel,
}: CredentialPathToggleProps) {
  return (
    <div className="segmented-control segmented-control-full credential-path-toggle" role="group" aria-label="Upload path">
      <button
        type="button"
        onClick={() => onChange('combined')}
        aria-pressed={value === 'combined'}
        className={`segmented-control-btn flex-1 text-center ${
          value === 'combined' ? 'segmented-control-btn-active' : ''
        }`}
      >
        {combinedLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('individual')}
        aria-pressed={value === 'individual'}
        className={`segmented-control-btn flex-1 text-center ${
          value === 'individual' ? 'segmented-control-btn-active' : ''
        }`}
      >
        {individualLabel}
      </button>
    </div>
  );
}
